import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearCredentials, clearProfile, clearSchedule } from '../../utils/storage';
import { useTheme } from '../../utils/ThemeContext';

export default function SettingsScreen() {
    const router = useRouter();
    const { theme, toggleTheme, colors } = useTheme();

    const handleLogout = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        await clearCredentials();
                        await clearSchedule();
                        await clearProfile();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Animated.Text entering={FadeInDown.duration(400).delay(100).springify()} style={[styles.title, { color: colors.text }]}>Ajustes</Animated.Text>

                <Animated.View entering={FadeInDown.duration(400).delay(200).springify()} style={styles.section}>
                    <Text style={styles.sectionTitle}>Apariencia</Text>
                    <View style={[styles.settingsItem, { backgroundColor: colors.surface, shadowColor: colors.cardShadow, borderColor: colors.border, borderWidth: theme === 'dark' ? 1 : 0 }]}>
                        <Ionicons name={theme === 'dark' ? "moon" : "sunny"} size={22} color={colors.primary} style={{ marginRight: 12 }} />
                        <Text style={[styles.settingsLabel, { color: colors.text }]}>Modo Oscuro</Text>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#D1D1D1', true: colors.primary }}
                            thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(400).delay(300).springify()} style={styles.section}>
                    <Text style={styles.sectionTitle}>Aplicación</Text>
                    <SettingsItem
                        icon="information-circle-outline"
                        label="Versión"
                        value="1.0.0"
                    />
                    <SettingsItem
                        icon="school-outline"
                        label="Universidad"
                        value="USM"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.duration(400).delay(400).springify()} style={styles.section}>
                    <Text style={styles.sectionTitle}>Cuenta</Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#F44336" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.Text entering={FadeInDown.duration(400).delay(500).springify()} style={styles.footer}>SIGApp · Hecho con ❤️ para la USM</Animated.Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function SettingsItem({ icon, label, value }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}) {
    const { colors, theme } = useTheme();
    return (
        <View style={[styles.settingsItem, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme === 'dark' ? 1 : 0 }]}>
            <Ionicons name={icon} size={22} color={colors.primary} style={{ marginRight: 12 }} />
            <Text style={[styles.settingsLabel, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.settingsValue, { color: colors.textSecondary }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9ff',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a1a2e',
        marginBottom: 24,
        letterSpacing: -0.5,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    settingsLabel: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
    },
    settingsValue: {
        fontSize: 14,
        color: '#888',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        padding: 14,
    },
    logoutText: {
        fontSize: 15,
        color: '#F44336',
        fontWeight: '700',
        marginLeft: 12,
    },
    footer: {
        textAlign: 'center',
        color: '#ccc',
        fontSize: 12,
        marginTop: 40,
    },
});
