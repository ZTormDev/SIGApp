import SigaWebView from "@/components/SigaWebView";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

export default function IndexScreen() {
  const router = useRouter();

  const [authData, setAuthData] = useState<{
    rut: string | null;
    pass: string | null;
    server: string;
  }>({ rut: null, pass: null, server: "usm.cl" });
  const [needsSync, setNeedsSync] = useState(false);
  const [syncFallbackPath, setSyncFallbackPath] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthState() {
      // Keep splash screen visible for at least a beat
      await new Promise((resolve) => setTimeout(resolve, 800));

      const { rut, pass, server } = await getCredentials();
      const schedule = await getSchedule();
      const profile = await getProfile();
      const acceptedDisclaimer = await hasAcceptedDisclaimer();

      if (!acceptedDisclaimer) {
        router.replace("/disclaimer");
        return;
      }

      // If we have saved credentials, we attempt a silent background sync.
      if (rut && pass) {
        setAuthData({ rut, pass, server });
        // We also determine where to go if the sync fails or succeeds without new data
        setSyncFallbackPath(schedule || profile ? "/(tabs)/home" : "/login");
        setNeedsSync(true);
      } else if (schedule || profile) {
        // Edge case: data exists but no saved credentials (remember me unchecked).
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
      const scheduleData = parseHtmlSchedule(data.scheduleHtml);
      const profileData = parseProfileHtml(data.profileHtml);

      await saveSchedule(scheduleData);
      await saveProfile(profileData);

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
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("../assets/images/usm/bg_usm.jpg")}
        style={styles.background}
        imageStyle={{ opacity: 0.3 }}
        blurRadius={2}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <ExpoImage
            source={require("../assets/images/usm/logo-usm.svg")}
            style={styles.logo}
            contentFit="contain"
          />
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#003876" />
            <Text style={styles.loadingText}>
              {needsSync ? "Iniciando sesión en SIGA..." : "Iniciando MiUSM..."}
            </Text>
          </View>
        </View>

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
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f4f4f9ea",
    marginTop: -50,
    borderRadius: 20,
  },
  logo: {
    width: Dimensions.get("window").width * 0.7,
    height: 120,
    marginTop: -30,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#878787ff",
  },
});
