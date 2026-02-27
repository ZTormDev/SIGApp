import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { setAcceptedDisclaimer } from '../utils/storage';

const DISCLAIMER_KEY = 'HAS_ACCEPTED_DISCLAIMER';

export default function DisclaimerScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme();

    const handleAccept = async () => {
        try {
            await setAcceptedDisclaimer();
            router.replace('/login');
        } catch (error) {
            console.error('Error saving disclaimer state:', error);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconBg, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="shield-checkmark" size={64} color={colors.primary} />
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Aviso Importante</Text>

                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.message, { color: colors.text }]}>
                        Esta es una aplicación <Text style={styles.boldText}>no oficial</Text> creada por un <Text style={styles.boldText}>estudiante</Text> para facilitar el acceso a la informacion del estudiante de la USM.
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.featureRow}>
                        <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                            Tus credenciales se guardan <Text style={styles.boldText}>exclusivamente en tu teléfono</Text>.
                        </Text>
                    </View>

                    <View style={styles.featureRow}>
                        <Ionicons name="cloud-offline-outline" size={24} color={colors.primary} />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                            Los datos <Text style={styles.boldText}>jamás</Text> se envían a servidores externos.
                        </Text>
                    </View>

                    <View style={styles.featureRow}>
                        <Ionicons name="school-outline" size={24} color={colors.primary} />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                            Esta app no tiene relación formal con la <Text style={styles.boldText}>USM</Text>.
                        </Text>
                    </View>
                </View>

                <View style={styles.warningBox}>
                    <Ionicons name="alert-circle" size={20} color="#FF9800" />
                    <Text style={styles.warningText}>
                        Al continuar, declaras conocer y aceptar la naturaleza no oficial de esta herramienta.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleAccept}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Entiendo y Acepto</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        marginTop: 40,
        marginBottom: 24,
    },
    iconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 32,
        letterSpacing: -1,
    },
    card: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    message: {
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'center',
        marginBottom: 20,
    },
    boldText: {
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureText: {
        fontSize: 15,
        lineHeight: 22,
        marginLeft: 16,
        flex: 1,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF3E0',
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        alignItems: 'center',
    },
    warningText: {
        fontSize: 13,
        color: '#E65100',
        marginLeft: 12,
        flex: 1,
        fontWeight: '500',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    button: {
        height: 64,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginRight: 10,
    },
});
