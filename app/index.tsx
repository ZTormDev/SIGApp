import SigaWebView from "@/components/SigaWebView";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { parseHtmlSchedule } from "../utils/sigaApi";
import { parseProfileHtml } from "../utils/sigaParser";
import {
  getCredentials,
  getProfile,
  getSchedule,
  hasAcceptedDisclaimer,
  saveProfile,
  saveSchedule,
} from "../utils/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function IndexScreen() {
  const router = useRouter();

  const [authData, setAuthData] = useState<{
    rut: string | null;
    pass: string | null;
    server: string;
  }>({ rut: null, pass: null, server: "usm.cl" });
  const [needsSync, setNeedsSync] = useState(false);
  const [syncFallbackPath, setSyncFallbackPath] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Iniciando...");

  // Animated progress bar
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as any,
  }));

  useEffect(() => {
    async function checkAuthState() {
      await new Promise((resolve) => setTimeout(resolve, 600));

      setStatusText("Verificando sesión...");
      const { rut, pass, server } = await getCredentials();
      const schedule = await getSchedule();
      const profile = await getProfile();
      const acceptedDisclaimer = await hasAcceptedDisclaimer();

      if (!acceptedDisclaimer) {
        router.replace("/disclaimer");
        return;
      }

      if (rut && pass) {
        setStatusText("Conectando con SIGA...");
        setAuthData({ rut, pass, server });
        setSyncFallbackPath(schedule || profile ? "/(tabs)/home" : "/login");
        setNeedsSync(true);
      } else if (schedule || profile) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/login");
      }
    }

    checkAuthState();
  }, []);

  const handleSyncSuccess = async (data: {
    scheduleHtml: string;
    profileHtml: string;
  }) => {
    try {
      setStatusText("Sincronizando datos...");
      const scheduleData = parseHtmlSchedule(data.scheduleHtml);
      const profileData = parseProfileHtml(data.profileHtml);

      await saveSchedule(scheduleData);
      await saveProfile(profileData);

      setStatusText("¡Listo!");
      await new Promise((resolve) => setTimeout(resolve, 300));
      setNeedsSync(false);
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("[Splash] Sync Parsing Error:", error);
      handleSyncError();
    }
  };

  const handleSyncError = () => {
    setNeedsSync(false);
    if (syncFallbackPath) {
      router.replace(syncFallbackPath as any);
    } else {
      router.replace("/login");
    }
  };

  return (
    <View style={styles.screen}>
      {/* Dark gradient background */}
      <View style={styles.bgGradient} />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          entering={FadeIn.duration(800)}
          style={styles.logoContainer}
        >
          <View style={styles.logoGlow} />
          <ExpoImage
            source={require("../assets/images/usm/logo-usm.svg")}
            style={styles.logo}
            contentFit="contain"
            tintColor="#ffffff"
          />
        </Animated.View>

        {/* App Name */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.titleContainer}
        >
          <Text style={styles.appName}>MiUSM</Text>
          <Text style={styles.appTagline}>Tu compañero universitario</Text>
        </Animated.View>

        {/* Loading section */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          style={styles.loadingSection}
        >
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>

          <Text style={styles.statusText}>{statusText}</Text>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View
        entering={FadeIn.delay(1000).duration(600)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          Universidad Técnica Federico Santa María
        </Text>
      </Animated.View>

      {/* Hidden WebView for background syncing */}
      {needsSync && authData.rut && authData.pass && (
        <View style={{ height: 0, width: 0, opacity: 0 }}>
          <SigaWebView
            rut={authData.rut}
            pass={authData.pass}
            server={authData.server}
            onCompleted={handleSyncSuccess}
            onError={handleSyncError}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0a1628",
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a1628",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: "rgba(0, 56, 118, 0.3)",
    top: -80,
    right: -60,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: "rgba(0, 90, 180, 0.15)",
    bottom: 120,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: "rgba(30, 120, 220, 0.1)",
    top: "40%",
    right: -30,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  logoGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(0, 90, 180, 0.15)",
  },
  logo: {
    width: SCREEN_WIDTH * 0.55,
    height: 100,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  appName: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 2,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  loadingSection: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  progressTrack: {
    width: "70%",
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.35)",
    letterSpacing: 0.3,
  },
  footer: {
    paddingBottom: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.15)",
    letterSpacing: 0.5,
  },
});
