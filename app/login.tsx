import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  ZoomIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import SigaWebView from "../components/SigaWebView";
import { parseCurriculumHtml } from "../utils/curriculumParser";
import { parseHtmlSchedule } from "../utils/sigaApi";
import { parseProfileHtml } from "../utils/sigaParser";
import { saveCredentials, saveCurriculum, saveCurriculumSyncTime, saveProfile, saveSchedule, saveSyncTime } from "../utils/storage";

export default function LoginScreen() {
  const router = useRouter();

  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("usm.cl");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [progressText, setProgressText] = useState("");

  const [isWebViewActive, setIsWebViewActive] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleLoginPress = () => {
    if (!password) {
      setErrorMsg("Por favor, ingresa tu contraseña.");
      return;
    }
    setErrorMsg("");
    setProgressText("Conectando con SIGA...");
    setIsLoading(true);
    setIsWebViewActive(true);
  };

  const handleWebViewSuccess = async (data: {
    scheduleHtml: string;
    profileHtml: string;
    curriculumHtml: string;
  }) => {
    try {
      setProgressText("Guardando datos...");
      const scheduleData = parseHtmlSchedule(data.scheduleHtml);
      const profileData = parseProfileHtml(data.profileHtml);
      const curriculumData = parseCurriculumHtml(data.curriculumHtml);

      if (rememberMe) {
        await saveCredentials(rut, password, server);
      }
      await saveSchedule(scheduleData);
      await saveProfile(profileData);
      await saveCurriculum(curriculumData);
      await saveSyncTime();
      await saveCurriculumSyncTime();

      setProgressText("¡Listo!");
      setIsWebViewActive(false);
      setIsLoading(false);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("[Login] Error in handleWebViewSuccess:", error);
      handleWebViewError(error.message || "Error analizando datos");
    }
  };

  const handleWebViewError = (msg: string) => {
    setIsWebViewActive(false);
    setIsLoading(false);
    setErrorMsg(msg);
  };

  const toggleServer = () => {
    const servers = [
      "usm.cl",
      "alumnos.usm.cl",
      "sansano.usm.cl",
      "titulados.usm.cl",
      "postgrado.usm.cl",
    ];
    const currentIndex = servers.indexOf(server);
    const nextIndex = (currentIndex + 1) % servers.length;
    setServer(servers[nextIndex]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a1628" }}>
      <View style={styles.background}>
        <View style={styles.bgGradient} />
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            style={styles.logoContainer}
            entering={ZoomIn.duration(800).delay(200).springify()}
          >
            <View style={styles.logoGlow} />
            <ExpoImage
              source={require("../assets/images/usm/logo-usm.svg")}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          <Animated.View
            style={styles.card}
            entering={FadeInDown.duration(600).springify()}
          >
            <Text style={styles.title}>MiUSM</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para ver tu horario y mas
            </Text>

            {step === 1 ? (
              <Animated.View
                entering={SlideInLeft.duration(300)}
                exiting={SlideOutLeft.duration(300)}
                layout={LinearTransition}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Usuario</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.rutInput]}
                      value={rut}
                      onChangeText={(t) => setRut(t.replace(/\s/g, ""))}
                      placeholder="correo institucional"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.serverSelector}
                      onPress={toggleServer}
                      disabled={isLoading}
                    >
                      <Text style={styles.serverText}>@{server}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {errorMsg ? (
                  <Text style={styles.errorText}>{errorMsg}</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    if (!rut) {
                      setErrorMsg("Por favor, ingresa tu usuario.");
                      return;
                    }
                    setErrorMsg("");
                    setStep(2);
                  }}
                >
                  <Text style={styles.primaryButtonText}>Siguiente</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View
                entering={SlideInRight.duration(300)}
                exiting={SlideOutRight.duration(300)}
                layout={LinearTransition}
              >
                <TouchableOpacity
                  style={styles.userBadge}
                  onPress={() => {
                    setStep(1);
                    setErrorMsg("");
                  }}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color="rgba(255, 255, 255, 0.7)"
                  />
                  <Text style={styles.userBadgeText}>
                    {rut}@{server}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.7)" />
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contraseña / Clave USM</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      textContentType="password"
                      value={password}
                      secureTextEntry={!showPassword}
                      onChangeText={(t) => {
                        const text = t.replace(/\s/g, "");
                        setPassword(text);
                      }}
                      placeholder="Contraseña"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="off"
                      contextMenuHidden={true}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  disabled={isLoading}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Recordar sesión</Text>
                </TouchableOpacity>

                {errorMsg ? (
                  <Text style={styles.errorText}>{errorMsg}</Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isLoading && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleLoginPress}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.primaryButtonText}>{progressText}</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

            {isWebViewActive && (
              <Animated.View
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(300)}
              >
                <SigaWebView
                  rut={rut}
                  pass={password}
                  server={server}
                  onCompleted={handleWebViewSuccess}
                  onError={handleWebViewError}
                  onProgress={(prog, txt) => setProgressText(txt)}
                />
              </Animated.View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    width: "100%",
    zIndex: 10,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    backgroundColor: "rgba(27, 123, 219, 0.75)",
    borderRadius: 100,
    paddingHorizontal: 25,
    paddingVertical: 5,
  },
  logoGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(0, 90, 180, 0.15)",
  },
  logo: {
    width: Dimensions.get("window").width * 0.6,
    height: 80,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginBottom: 32,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  userBadgeText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
    marginHorizontal: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    height: 52,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#ffffff",
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  rutInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  serverSelector: {
    height: 52,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  serverText: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  checkboxChecked: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: "rgba(59, 130, 246, 0.5)",
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "500",
  },
});
