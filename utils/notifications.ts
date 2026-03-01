import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Exam } from './storage';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
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

    // 1. First, cancel any existing notifications for this exam
    await cancelExamNotifications(exam.id);

    if (!exam.notificationsEnabled) return;

    // Verify/Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const [year, month, day] = exam.date.split('-').map(Number);
    const [hour, minute] = exam.time.split(':').map(Number);

    const examDate = new Date(year, month - 1, day, hour, minute);
    const now = new Date();

    // Define reminders: 7 days, 3 days, 1 day, 1 hour, at the time
    const reminders = [
        { label: 'en 7 días', ms: 7 * 24 * 60 * 60 * 1000 },
        { label: 'en 3 días', ms: 3 * 24 * 60 * 60 * 1000 },
        { label: 'mañana', ms: 24 * 60 * 60 * 1000 },
        { label: 'en 1 hora', ms: 60 * 60 * 1000 },
        { label: 'AHORA', ms: 0 },
    ];

    for (const reminder of reminders) {
        const triggerDate = new Date(examDate.getTime() - reminder.ms);

        // Only schedule if the trigger time is in the future
        if (triggerDate > now) {
            const secondsFromNow = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);

            // Use time interval trigger (seconds) as it's very reliable
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `📝 ${exam.type}: ${exam.subject}`,
                    body: reminder.ms === 0
                        ? `¡Es el momento! Tu ${exam.type} comienza ahora en ${exam.room}.`
                        : `Tu ${exam.type} es ${reminder.label} en la sala ${exam.room}.`,
                    data: { examId: exam.id },
                    sound: true,
                },
                trigger: {
                    seconds: secondsFromNow > 0 ? secondsFromNow : 1,
                    repeats: false
                },
            });
        }
    }
}

export async function cancelExamNotifications(examId: string) {
    if (Platform.OS === 'web') return;

    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.examId === examId) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
    } catch (e) {
        console.error("Error cancelling notifications:", e);
    }
}
