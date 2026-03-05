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
import Constants from "expo-constants";
import { AppState, AppStateStatus, Platform } from "react-native";
import {
    ANALYTICS_EVENTS,
    ANALYTICS_PARAMS,
    USER_PROPERTIES,
} from "../constants/analytics";

const DEVICE_ID_KEY = "FIREBASE_DEVICE_ID";
const LOGIN_COUNT_KEY = "ANALYTICS_LOGIN_COUNT";
let sessionStartTime: number | null = null;

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

// ─── Tracking de Sesión ────────────────────────────────────

/**
 * Inicia el tracking de sesión. Llama a esto cuando la app se abre o vuelve a primer plano.
 * Registra el inicio de sesión y la versión de la app como user property.
 */
export async function startSessionTracking(): Promise<void> {
  try {
    sessionStartTime = Date.now();
    const appVersion = Constants.expoConfig?.version || "unknown";

    await setUserProperties({
      [USER_PROPERTIES.APP_VERSION]: appVersion,
    });

    const analytics = getAnalytics();
    await fbLogEvent(analytics, ANALYTICS_EVENTS.SESSION_START, {
      [ANALYTICS_PARAMS.SOURCE]: "app_foreground",
    });
  } catch (error) {
    console.warn("[Firebase] Error starting session tracking:", error);
  }
}

/**
 * Finaliza el tracking de sesión. Registra la duración total de la sesión.
 */
export async function endSessionTracking(): Promise<void> {
  try {
    if (sessionStartTime) {
      const duration = Date.now() - sessionStartTime;
      const analytics = getAnalytics();
      await fbLogEvent(analytics, ANALYTICS_EVENTS.SESSION_END, {
        [ANALYTICS_PARAMS.DURATION_MS]: duration,
      });
      sessionStartTime = null;
    }
  } catch (error) {
    console.warn("[Firebase] Error ending session tracking:", error);
  }
}

/**
 * Incrementa y persiste el contador de logins del usuario.
 * Útil para segmentar usuarios nuevos vs recurrentes en Firebase Console.
 */
export async function incrementLoginCount(): Promise<void> {
  try {
    const current = await AsyncStorage.getItem(LOGIN_COUNT_KEY);
    const count = (parseInt(current || "0", 10) + 1).toString();
    await AsyncStorage.setItem(LOGIN_COUNT_KEY, count);
    await setUserProperties({
      [USER_PROPERTIES.LOGIN_COUNT]: count,
    });
  } catch (error) {
    console.warn("[Firebase] Error incrementing login count:", error);
  }
}

/**
 * Registra un error de la app para diagnóstico en Firebase.
 */
export async function logAppError(
  errorMessage: string,
  source: string,
): Promise<void> {
  try {
    const analytics = getAnalytics();
    await fbLogEvent(analytics, ANALYTICS_EVENTS.APP_ERROR, {
      [ANALYTICS_PARAMS.ERROR_MESSAGE]: errorMessage.substring(0, 100),
      [ANALYTICS_PARAMS.SOURCE]: source,
    });
  } catch (error) {
    console.warn("[Firebase] Error logging app error:", error);
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
