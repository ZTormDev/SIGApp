import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { Alert } from "react-native";

const REPO_OWNER = "ZTormDev";
const REPO_NAME = "SIGApp";
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

export function UpdateChecker() {
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch(GITHUB_API_URL);
        if (!response.ok) return;

        const data = await response.json();
        const latestVersionTag = data.tag_name; //"v1.0.1" or "1.0.1"

        if (!latestVersionTag) return;

        const latestVersion = latestVersionTag.replace(/^v/, "");

        const currentVersion = Constants.expoConfig?.version || "1.0.0";

        const apkAsset = data.assets?.find((asset: any) =>
          asset.name.endsWith(".apk"),
        );
        const downloadUrl = apkAsset
          ? apkAsset.browser_download_url
          : data.html_url;

        if (isNewerVersion(currentVersion, latestVersion)) {
          Alert.alert(
            "Actualización Disponible",
            `Una nueva versión de MiUSM (${latestVersion}) está disponible. ¿Deseas descargarla ahora?`,
            [
              { text: "Más tarde", style: "cancel" },
              {
                text: "Actualizar",
                onPress: () => Linking.openURL(downloadUrl),
              },
            ],
          );
        }
      } catch (error) {
        console.log("Error checking for updates:", error);
      }
    };

    checkForUpdates();
  }, []);

  return null;
}

// (returns true if v2 > v1)
function isNewerVersion(v1: string, v2: string): boolean {
  const v1Parts = v1.split(".").map(Number);
  const v2Parts = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const p1 = v1Parts[i] || 0;
    const p2 = v2Parts[i] || 0;
    if (p2 > p1) return true;
    if (p2 < p1) return false;
  }
  return false;
}
