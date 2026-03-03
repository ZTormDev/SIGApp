import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Exam } from "./storage";

// ─── Foreground handler ─────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Channel (Android) ─────────────────────────────────────────────
async function setupChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("exams", {
    name: "Evaluaciones",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });
}

// ─── Permissions ────────────────────────────────────────────────────
async function ensurePermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Init (call once at app start) ──────────────────────────────────
export async function initNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await setupChannel();
  await ensurePermissions();
}

// ─── Test (immediate) ───────────────────────────────────────────────
export async function sendTestNotification(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    if (!(await ensurePermissions())) return false;
    await setupChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Notificación de prueba",
        body: "¡Las notificaciones funcionan correctamente!",
        sound: "default",
      },
      trigger: null,
    });
    return true;
  } catch (e) {
    console.error("sendTestNotification:", e);
    return false;
  }
}

// ─── Schedule exam reminders ────────────────────────────────────────
// Uses TIME_INTERVAL (seconds from now) — the standard trigger type
// recommended by expo-notifications. The channelId is placed inside
// the trigger object (not content) per the official API.
export async function scheduleExamNotifications(exam: Exam): Promise<void> {
  if (Platform.OS === "web") return;

  await cancelExamNotifications(exam.id);
  if (!exam.notificationsEnabled) return;
  if (!(await ensurePermissions())) return;
  await setupChannel();

  const [y, m, d] = exam.date.split("-").map(Number);
  const [h, min] = exam.time.split(":").map(Number);
  const examMs = new Date(y, m - 1, d, h, min).getTime();
  const nowMs = Date.now();
  if (examMs <= nowMs) return;

  const reminders = [
    { label: "en 7 días", offset: 7 * 86400000 },
    { label: "en 3 días", offset: 3 * 86400000 },
    { label: "mañana", offset: 86400000 },
    { label: "en 1 hora", offset: 3600000 },
    { label: "AHORA", offset: 0 },
  ];

  for (const r of reminders) {
    const secs = Math.floor((examMs - r.offset - nowMs) / 1000);
    if (secs < 5) continue; // must be ≥5 s in the future

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📝 ${exam.type}: ${exam.subject}`,
          body:
            r.offset === 0
              ? `¡Es el momento! Tu ${exam.type} comienza ahora en ${exam.room}.`
              : `Tu ${exam.type} es ${r.label} en la sala ${exam.room}.`,
          sound: "default",
          data: { examId: exam.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secs,
          channelId: Platform.OS === "android" ? "exams" : undefined,
        },
      });
    } catch (e) {
      console.error(`Notification "${r.label}":`, e);
    }
  }
}

// ─── Cancel exam notifications ──────────────────────────────────────
export async function cancelExamNotifications(examId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.content.data?.examId === examId) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.error("cancelExamNotifications:", e);
  }
}

// ─── Debug ──────────────────────────────────────────────────────────
export async function getScheduledNotificationCount(): Promise<number> {
  if (Platform.OS === "web") return 0;
  try {
    return (await Notifications.getAllScheduledNotificationsAsync()).length;
  } catch {
    return 0;
  }
}
