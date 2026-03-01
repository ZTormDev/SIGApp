import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InfoCard } from '../../components/home/InfoCard';
import { ProfileCard } from '../../components/home/ProfileCard';
import { TodayClassWidget } from '../../components/home/TodayClassWidget';
import { DEMO_DATA, FULL_DAYS, TIME_BLOCKS } from '../../utils/scheduleConstants';
import { getProfile, getSchedule, UserProfile } from '../../utils/storage';
import { useTheme } from '../../utils/ThemeContext';

const DEMO_PROFILE: UserProfile = {
    fullName: '',
    firstName: '',
    rut: '',
    career: '',
    campus: '',
    jornada: '',
    rol: '',
    emailUsm: '',
    emailPersonal: '',
    situation: '',
    lastEnrollment: '',
    plan: '',
};

export default function HomeScreen() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [schedule, setSchedule] = useState<any[][] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { colors, theme } = useTheme();

    useEffect(() => {
        async function loadData() {
            const [profileData, scheduleData] = await Promise.all([
                getProfile(),
                getSchedule()
            ]);

            if (profileData && (profileData.fullName || profileData.rut || profileData.career)) {
                setProfile(profileData);
            } else {
                setProfile(DEMO_PROFILE);
            }

            setSchedule(scheduleData || DEMO_DATA);

            setIsLoading(false);
        }
        loadData();
    }, []);

    const [isAtBottom, setIsAtBottom] = useState(false);

    const handleScroll = useCallback((event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        setIsAtBottom(isBottom);
    }, []);

    if (isLoading || !profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.loadingText}>Cargando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };



    const getTodayClass = () => {
        if (!schedule) return null;

        const now = new Date();
        let dayIndex = now.getDay() - 1; // 0 = Monday, ..., 5 = Saturday, -1 = Sunday

        if (dayIndex === -1) {
            return { type: 'no-classes', message: '¡Hoy es domingo! Disfruta tu descanso.' };
        }

        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const todaySchedule = schedule.map(row => row[dayIndex]);

        // Check if today has ANY classes
        const hasClassesToday = todaySchedule.some(cell => cell && cell.isFilled && cell.title !== '' && cell.type !== 'Tope');

        if (!hasClassesToday) {
            const dayName = FULL_DAYS[dayIndex] || 'hoy';
            const message = dayIndex === 5 ? '¡No tienes clases los sábados! 🎉' : `¡No tienes clases los ${dayName.toLowerCase()}s! 🎉`;
            return { type: 'no-classes', message };
        }

        let currentClass = null;
        let nextClass = null;

        for (let i = 0; i < TIME_BLOCKS.length; i++) {
            const block = TIME_BLOCKS[i];
            const classInfo = todaySchedule[i];

            if (classInfo && classInfo.isFilled && classInfo.title !== '' && classInfo.type !== 'Tope') {
                if (currentTimeStr >= block.start && currentTimeStr <= block.end) {
                    currentClass = { ...classInfo, blockLabel: block.label, timeRange: `${block.start} - ${block.end}`, isCurrent: true };
                    break;
                } else if (currentTimeStr < block.start && !nextClass) {
                    nextClass = { ...classInfo, blockLabel: block.label, timeRange: `${block.start} - ${block.end}`, isCurrent: false };
                }
            }
        }

        if (currentClass) return { type: 'class', data: currentClass };
        if (nextClass) return { type: 'next', data: nextClass };

        return { type: 'no-classes', message: 'No tienes más clases por hoy.' };
    };

    const todayClassInfo = getTodayClass();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={{ flex: 1 }}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    <Animated.View entering={FadeInDown.duration(500).delay(100).springify()}>
                        <View style={styles.header}>
                            <View>
                                <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()},</Text>
                                <Text style={[styles.name, { color: colors.text }]}>{profile.firstName} 👋</Text>
                            </View>
                            <View style={[styles.avatarCircle, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                                <Text style={styles.avatarText}>
                                    {profile.firstName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(500).delay(200).springify()} style={styles.shadowWrapperWrapper}>
                        <ProfileCard profile={profile} />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(500).delay(300).springify()} style={styles.shadowWrapperWrapper}>
                        <TodayClassWidget todayClassInfo={todayClassInfo} />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(500).delay(400).springify()} style={styles.shadowWrapperWrapper}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Información Personal</Text>
                        <View style={styles.infoGrid}>
                            <InfoCard
                                icon="person-outline"
                                label="Nombre Completo"
                                value={profile.fullName}
                            />
                            <InfoCard
                                icon="card-outline"
                                label="R.U.T."
                                value={profile.rut}
                            />
                            <InfoCard
                                icon="id-card-outline"
                                label="Rol USM"
                                value={profile.rol}
                            />
                            <InfoCard
                                icon="document-text-outline"
                                label="Plan"
                                value={profile.plan}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(500).delay(500).springify()} style={styles.shadowWrapperWrapper}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contacto</Text>
                        <View style={styles.infoGrid}>
                            <InfoCard
                                icon="mail-outline"
                                label="Email USM"
                                value={profile.emailUsm}
                            />
                            <InfoCard
                                icon="mail-outline"
                                label="Email Personal"
                                value={profile.emailPersonal}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(500).delay(600).springify()} style={styles.shadowWrapperWrapper}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Académico</Text>
                        <View style={styles.infoGrid}>
                            <InfoCard
                                icon="calendar-outline"
                                label="Última Matrícula"
                                value={profile.lastEnrollment}
                            />
                            <InfoCard
                                icon="checkmark-circle-outline"
                                label="Situación Académica"
                                value={profile.situation}
                                valueColor={profile.situation.toLowerCase().includes('regular') ? '#00C853' : profile.situation.toLowerCase().includes('condicional') ? '#FF9100' : '#F44336'}
                            />
                        </View>
                    </Animated.View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                {!isAtBottom && (
                    <View style={styles.scrollHint} pointerEvents="none">
                        <LinearGradient
                            colors={theme === 'dark' ? ['rgba(18, 18, 18, 0)', 'rgba(18, 18, 18, 1)'] : ['rgba(248, 249, 255, 0)', 'rgba(248, 249, 255, 1)']}
                            style={styles.scrollHintGradient}
                        />
                        <View style={[styles.scrollHintIcon, { backgroundColor: theme === 'dark' ? 'rgba(157, 122, 255, 0.15)' : 'rgba(124, 77, 255, 0.1)' }]}>
                            <Ionicons name="chevron-down" size={20} color={colors.primary} />
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9ff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#999',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
    name: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a2e',
        letterSpacing: -0.5,
    },
    avatarCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#7C4DFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7C4DFF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },

    },
    avatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },



    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        marginTop: 4,
    },
    infoGrid: {
        marginBottom: 16,
    },

    scrollHint: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    scrollHintGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    scrollHintIcon: {
        backgroundColor: 'rgba(124, 77, 255, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 4,
        marginBottom: 8,
    },
    shadowWrapperWrapper: {
        backgroundColor: 'transparent',
    },
});
