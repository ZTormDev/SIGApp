import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SigaWebView from '../components/SigaWebView';
import { parseHtmlSchedule } from '../utils/sigaApi';
import { parseProfileHtml } from '../utils/sigaParser';
import { saveCredentials, saveProfile, saveSchedule } from '../utils/storage';

export default function LoginScreen() {
    const router = useRouter();

    const [rut, setRut] = useState('');
    const [password, setPassword] = useState('');
    const [maskedPassword, setMaskedPassword] = useState('');
    const realPasswordRef = useRef('');
    const [server, setServer] = useState('usm.cl');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [isWebViewActive, setIsWebViewActive] = useState(false);

    const handleLoginPress = () => {
        if (!rut || !password) {
            setErrorMsg('Por favor, ingresa tu usuario y contraseña.');
            return;
        }
        setErrorMsg('');
        setIsLoading(true);
        setIsWebViewActive(true);
    };

    const handleWebViewSuccess = async (data: { scheduleHtml: string; profileHtml: string }) => {
        try {
            // Parse schedule
            const scheduleData = parseHtmlSchedule(data.scheduleHtml);
            // Parse profile
            const profileData = parseProfileHtml(data.profileHtml);

            // Debug: log TOPE cells
            for (let r = 0; r < scheduleData.length; r++) {
                for (let c = 0; c < scheduleData[r].length; c++) {
                    const cell = scheduleData[r][c] as any;
                    if (cell && cell.isFilled) {
                        if (cell.type === 'Tope' || cell.subject === 'TOPE') {
                            console.log(`[TOPE FOUND] Row ${r}, Col ${c}:`, JSON.stringify(cell));
                        }
                    }
                }
            }

            if (rememberMe) {
                await saveCredentials(rut, password);
            }
            await saveSchedule(scheduleData);
            await saveProfile(profileData);

            setIsWebViewActive(false);
            setIsLoading(false);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            console.error('[Login] Error in handleWebViewSuccess:', error);
            handleWebViewError(error.message || 'Error analizando datos');
        }
    };

    const handleWebViewError = (msg: string) => {
        setIsWebViewActive(false);
        setIsLoading(false);
        setErrorMsg(msg);
    };

    const toggleServer = () => {
        const servers = ['usm.cl', 'alumnos.usm.cl', 'sansano.usm.cl', 'titulados.usm.cl', 'postgrado.usm.cl'];
        const currentIndex = servers.indexOf(server);
        const nextIndex = (currentIndex + 1) % servers.length;
        setServer(servers[nextIndex]);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ImageBackground
                source={require('../assets/images/usm/bg_usm.jpg')}
                style={styles.background}
                imageStyle={{ opacity: 0.25 }}
                blurRadius={3}
                resizeMode="cover"
            >
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.logoContainer}>
                        <ExpoImage
                            source={require('../assets/images/usm/logo-usm.svg')}
                            style={styles.logo}
                            contentFit="contain"
                        />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.title}>SIGApp</Text>
                        <Text style={styles.subtitle}>Inicia sesión para ver tu horario y mas</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Usuario</Text>
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.input, styles.rutInput]}
                                    value={rut}
                                    onChangeText={setRut}
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Contraseña / Clave USM</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    value={showPassword ? password : maskedPassword}
                                    onChangeText={(text) => {
                                        if (showPassword) {
                                            // Plain text mode — just store directly
                                            setPassword(text);
                                            realPasswordRef.current = text;
                                            setMaskedPassword('•'.repeat(text.length));
                                        } else {
                                            // Masked mode — reconstruct real password from diff
                                            const prev = realPasswordRef.current;
                                            const newLen = text.length;
                                            const prevLen = prev.length;

                                            if (newLen > prevLen) {
                                                // Characters were added — extract the new chars (non-dot chars)
                                                const added = text.replace(/•/g, '');
                                                const real = prev + added;
                                                realPasswordRef.current = real;
                                                setPassword(real);
                                                setMaskedPassword('•'.repeat(real.length));
                                            } else {
                                                // Characters were deleted — trim from the end
                                                const real = prev.substring(0, newLen);
                                                realPasswordRef.current = real;
                                                setPassword(real);
                                                setMaskedPassword('•'.repeat(real.length));
                                            }
                                        }
                                    }}
                                    placeholder="••••••••"
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
                                        name={showPassword ? 'eye-off' : 'eye'}
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
                            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>
                            <Text style={styles.checkboxLabel}>Recordar sesión</Text>
                        </TouchableOpacity>

                        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                        <TouchableOpacity
                            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                            onPress={handleLoginPress}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Sincronizar Rápido</Text>
                            )}
                        </TouchableOpacity>

                        {isWebViewActive && (
                            <SigaWebView
                                rut={rut}
                                pass={password}
                                server={server}
                                onCompleted={handleWebViewSuccess}
                                onError={handleWebViewError}
                            />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </ImageBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#f4f4f9',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: Dimensions.get('window').width * 0.7,
        height: 100,
    },
    card: {
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        height: 50,
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333',
    },
    eyeButton: {
        paddingHorizontal: 12,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rutInput: {
        flex: 1,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRightWidth: 0,
    },
    serverSelector: {
        height: 50,
        backgroundColor: '#e6f0fa',
        justifyContent: 'center',
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#b3d4ff',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    serverText: {
        color: '#0056b3',
        fontWeight: '600',
        fontSize: 14,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#0056b3',
        borderRadius: 4,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#0056b3',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#444',
    },
    primaryButton: {
        height: 50,
        backgroundColor: '#0056b3',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonDisabled: {
        backgroundColor: '#80abda',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#d9534f',
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
});
