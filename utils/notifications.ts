import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Exam } from './storage';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermissions() {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return true;
}

export async function scheduleExamNotifications(exam: Exam) {
    if (Platform.OS === 'web') return;

    try {
        // 1. First, cancel any existing notifications for this exam
        await cancelExamNotifications(exam.id);

        if (!exam.notificationsEnabled) return;

        // Verify/Request permissions
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) return;

        const [year, month, day] = exam.date.split('-').map(Number);
        const [hour, minute] = exam.time.split(':').map(Number);

        // Date object for local time
        const examDate = new Date(year, month - 1, day, hour, minute);
        const now = new Date();

        // If the exam is in the past, don't schedule anything
        if (examDate <= now) return;

        // Define reminders: 7 days, 3 days, 1 day, 1 hour, at the time
        const reminders = [
            { label: 'en 7 días', ms: 7 * 24 * 60 * 60 * 1000 },
            { label: 'en 3 días', ms: 3 * 24 * 60 * 60 * 1000 },
            { label: 'mañana', ms: 24 * 60 * 60 * 1000 },
            { label: 'en 1 hora', ms: 60 * 60 * 1000 },
            { label: 'AHORA', ms: 0 },
        ];

        const schedulingPromises = reminders.map(async (reminder) => {
            const triggerDate = new Date(examDate.getTime() - reminder.ms);

            // Only schedule if the trigger time is in the future
            if (triggerDate > now) {
                return Notifications.scheduleNotificationAsync({
                    content: {
                        title: `📝 ${exam.type}: ${exam.subject}`,
                        body: reminder.ms === 0
                            ? `¡Es el momento! Tu ${exam.type} comienza ahora en ${exam.room}.`
                            : `Tu ${exam.type} es ${reminder.label} en la sala ${exam.room}.`,
                        data: { examId: exam.id },
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.MAX,
                    },
                    trigger: {
                        date: triggerDate,
                    } as Notifications.DateTriggerInput,
                });
            }
            return null;
        });

        await Promise.all(schedulingPromises);
    } catch (error) {
        console.error("Error scheduling exam notifications:", error);
    }
}

export async function cancelExamNotifications(examId: string) {
    if (Platform.OS === 'web') return;

    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const cancelPromises = scheduled
            .filter(notif => notif.content.data?.examId === examId)
            .map(notif => Notifications.cancelScheduledNotificationAsync(notif.identifier));

        if (cancelPromises.length > 0) {
            await Promise.all(cancelPromises);
        }
    } catch (e) {
        console.error("Error cancelling notifications:", e);
    }
}
