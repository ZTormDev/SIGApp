import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ImageBackground,
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
import { parseHtmlSchedule } from "../utils/sigaApi";
import { parseProfileHtml } from "../utils/sigaParser";
import { saveCredentials, saveProfile, saveSchedule } from "../utils/storage";

export default function LoginScreen() {
  const router = useRouter();

  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("usm.cl");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [isWebViewActive, setIsWebViewActive] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleLoginPress = () => {
    if (!password) {
      setErrorMsg("Por favor, ingresa tu contraseña.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    setIsWebViewActive(true);
  };

  const handleWebViewSuccess = async (data: {
    scheduleHtml: string;
    profileHtml: string;
  }) => {
    try {
      const scheduleData = parseHtmlSchedule(data.scheduleHtml);
      const profileData = parseProfileHtml(data.profileHtml);

      if (rememberMe) {
        await saveCredentials(rut, password, server);
      }
      await saveSchedule(scheduleData);
      await saveProfile(profileData);

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
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require("../assets/images/usm/bg_usm.jpg")}
        style={styles.background}
        imageStyle={{ opacity: 0.25 }}
        blurRadius={3}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            style={styles.logoContainer}
            entering={ZoomIn.duration(800).delay(200).springify()}
          >
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
                    color="#666"
                  />
                  <Text style={styles.userBadgeText}>
                    {rut}@{server}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#666" />
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
                        color="#666"
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
                    <ActivityIndicator color="#fff" />
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
                />
              </Animated.View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#f4f4f9",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    position: "absolute",
    top: -100,
  },
  logo: {
    width: Dimensions.get("window").width * 0.7,
    height: 100,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  userBadgeText: {
    fontSize: 14,
    color: "#333",
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
    color: "#333",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    height: 50,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#333",
  },
  eyeButton: {
    paddingHorizontal: 12,
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
    height: 50,
    backgroundColor: "#E3EFF9",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#B3D4F0",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  serverText: {
    color: "#003876",
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
    borderWidth: 2,
    borderColor: "#003876",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#003876",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#444",
  },
  primaryButton: {
    height: 50,
    backgroundColor: "#003876",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#7BAED4",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#c0392b",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingTextOverlay: {
    marginTop: 16,
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
});
