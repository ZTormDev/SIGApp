import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    logEvent as fbLogEvent,
    getAnalytics,
    setUserProperty,
} from "@react-native-firebase/analytics";
import {
    getDatabase,
    onDisconnect,
    onValue,
    ref,
    remove,
    serverTimestamp,
    set,
} from "@react-native-firebase/database";
import { AppState, AppStateStatus, Platform } from "react-native";

const DEVICE_ID_KEY = "FIREBASE_DEVICE_ID";

// ─── Helpers ───────────────────────────────────────────────

function generateDeviceId(): string {
  return (
    "device_" +
    Math.random().toString(36).substring(2) +
    Date.now().toString(36)
  );
}

async function getOrCreateDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return generateDeviceId();
  }
}

// ─── Analytics ─────────────────────────────────────────────

export async function logScreenView(screenName: string): Promise<void> {
  try {
    const analytics = getAnalytics();
    await fbLogEvent(analytics, "screen_view", {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.warn("[Firebase] Error logging screen view:", error);
  }
}

export async function logAppOpen(): Promise<void> {
  try {
    const analytics = getAnalytics();
    await fbLogEvent(analytics, "app_open");
  } catch (error) {
    console.warn("[Firebase] Error logging app open:", error);
  }
}

export async function logEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    const analytics = getAnalytics();
    await fbLogEvent(analytics, eventName, params);
  } catch (error) {
    console.warn("[Firebase] Error logging event:", error);
  }
}

export async function setUserProperties(
  properties: Record<string, string | null>,
): Promise<void> {
  try {
    const analytics = getAnalytics();
    for (const [key, value] of Object.entries(properties)) {
      await setUserProperty(analytics, key, value);
    }
  } catch (error) {
    console.warn("[Firebase] Error setting user properties:", error);
  }
}

// ─── Presencia en Tiempo Real ──────────────────────────────

let presenceCleanup: (() => void) | null = null;

export async function setupPresence(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const deviceId = await getOrCreateDeviceId();
    const db = getDatabase();
    const userStatusRef = ref(db, `/presence/${deviceId}`);
    const connectedRef = ref(db, ".info/connected");

    // Listener de conexión
    const unsubConnect = onValue(connectedRef, async (snapshot) => {
      if (snapshot.val() === true) {
        await onDisconnect(userStatusRef).remove();
        await set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      }
    });

    // Listener de AppState
    const handleAppState = async (nextState: AppStateStatus) => {
      if (nextState === "active") {
        await onDisconnect(userStatusRef).remove();
        await set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      } else if (nextState === "background" || nextState === "inactive") {
        await remove(userStatusRef);
      }
    };

    const appStateSub = AppState.addEventListener("change", handleAppState);

    presenceCleanup = () => {
      unsubConnect();
      appStateSub.remove();
      remove(userStatusRef).catch(() => {});
    };
  } catch (error) {
    console.warn("[Firebase] Error setting up presence:", error);
  }
}

export async function removePresence(): Promise<void> {
  if (presenceCleanup) {
    presenceCleanup();
    presenceCleanup = null;
  }
}

export function subscribeToOnlineCount(
  callback: (count: number) => void,
): () => void {
  const db = getDatabase();
  const presenceRef = ref(db, "/presence");

  const unsubscribe = onValue(presenceRef, (snapshot) => {
    let count = 0;
    snapshot.forEach(() => {
      count++;
      return undefined;
    });
    callback(count);
  });

  return unsubscribe;
}
