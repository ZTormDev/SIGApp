import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-gesture-handler";
import "react-native-reanimated";

import { UpdateChecker } from "../components/UpdateChecker";
import { useScreenTracking } from "../hooks/useScreenTracking";
import { logAppOpen, removePresence, setupPresence } from "../utils/firebase";
import { initNotifications } from "../utils/notifications";
import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from "../utils/ThemeContext";

// Safe import of expo-navigation-bar (not available in Expo Go)
let NavigationBar: typeof import("expo-navigation-bar") | null = null;
try {
  NavigationBar = require("expo-navigation-bar");
} catch {
  // Native module not available (e.g. running in Expo Go)
}

export const unstable_settings = {
  initialRouteName: "index",
};

function RootNavigator() {
  const { theme } = useTheme();

  // Track de pantallas automático con Firebase Analytics
  useScreenTracking();

  useEffect(() => {
    if (Platform.OS === "android" && NavigationBar) {
      try {
        NavigationBar.setBackgroundColorAsync(
          theme === "dark" ? "#0e0e0e" : "#ffffff",
        );
        NavigationBar.setButtonStyleAsync(theme === "dark" ? "light" : "dark");
      } catch (e) {
        // Silently ignore if NavigationBar APIs fail
      }
    }
  }, [theme]);

  return (
    <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="disclaimer" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

function FirebaseInit() {
  useEffect(() => {
    // Registrar apertura de app (first_open es automático en Firebase)
    logAppOpen();

    // Configurar presencia en tiempo real
    setupPresence();

    return () => {
      removePresence();
    };
  }, []);

  return null;
}

function NotificationInit() {
  useEffect(() => {
    initNotifications();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <NotificationInit />
      <FirebaseInit />
      <UpdateChecker />
      <RootNavigator />
    </CustomThemeProvider>
  );
}
