import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProfile, getSchedule, UserProfile } from '../../utils/storage';
import { useTheme } from '../../utils/ThemeContext';
import { DEMO_DATA, TIME_BLOCKS } from './schedule';

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

    const getSituationColor = (sit: string) => {
        if (sit.toLowerCase().includes('regular')) return '#00C853';
        if (sit.toLowerCase().includes('condicional')) return '#FF9100';
        return '#F44336';
    };

    const getTodayClass = () => {
        if (!schedule) return null;

        const now = new Date();
        const dayIndex = now.getDay() - 1;
        if (dayIndex < 0 || dayIndex > 5) return { type: 'no-classes', message: '¡Hoy es domingo! Disfruta tu descanso.' };

        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const todaySchedule = schedule.map(row => row[dayIndex]);
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

                    <View style={[styles.careerCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                        <View style={styles.careerCardInner}>
                            <Ionicons name="school" size={28} color="#fff" style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.careerLabel}>Carrera</Text>
                                <Text style={styles.careerName}>{profile.career}</Text>
                                <Text style={styles.careerDetail}>{profile.campus} · {profile.jornada}</Text>
                            </View>
                        </View>
                        <View style={styles.situationBadge}>
                            <View style={[styles.situationDot, { backgroundColor: getSituationColor(profile.situation) }]} />
                            <Text style={styles.situationText}>{profile.situation}</Text>
                        </View>
                    </View>

                    <View style={[styles.todayCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow, borderColor: colors.border, borderWidth: theme === 'dark' ? 1 : 0 }]}>
                        <View style={styles.todayCardHeader}>
                            <Ionicons
                                name={todayClassInfo?.type === 'no-classes' ? "calendar-clear" : "time"}
                                size={20}
                                color={colors.primary}
                            />
                            <Text style={[styles.todayCardTitle, { color: colors.primary }]}>
                                {todayClassInfo?.type === 'class' ? 'Clase Actual' :
                                    todayClassInfo?.type === 'next' ? 'Próxima Clase' : 'Hoy'}
                            </Text>
                        </View>

                        {todayClassInfo?.type === 'no-classes' ? (
                            <View style={styles.noClassContent}>
                                <Text style={[styles.noClassText, { color: colors.textSecondary }]}>{todayClassInfo.message}</Text>
                            </View>
                        ) : (
                            <View style={styles.classContent}>
                                <View style={styles.classMainInfo}>
                                    <Text style={[styles.className, { color: colors.text }]} numberOfLines={1}>
                                        {(() => {
                                            const t = todayClassInfo?.data.title || '';
                                            const parts = t.split(' - ');
                                            if (parts.length >= 2) {
                                                return parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').trim();
                                            }
                                            return t.split(' ')[0] || 'Clase';
                                        })()}
                                    </Text>
                                    <Text style={[styles.classCode, { color: colors.textSecondary }]}>{todayClassInfo?.data.subject}</Text>
                                </View>

                                <View style={styles.classDetailRow}>
                                    <View style={styles.classDetailItem}>
                                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                                        <Text style={[styles.classDetailText, { color: colors.textSecondary }]}>{todayClassInfo?.data.room || 'Sin sala'}</Text>
                                    </View>
                                    <View style={styles.classDetailItem}>
                                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                        <Text style={[styles.classDetailText, { color: colors.textSecondary }]}>{todayClassInfo?.data.timeRange}</Text>
                                    </View>
                                    <View style={[styles.blockBadge, { backgroundColor: theme === 'dark' ? 'rgba(157, 122, 255, 0.2)' : 'rgba(124, 77, 255, 0.1)' }]}>
                                        <Text style={[styles.blockBadgeText, { color: colors.primary }]}>B{todayClassInfo?.data.blockLabel}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

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
                            valueColor={getSituationColor(profile.situation)}
                        />
                    </View>

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

function InfoCard({ icon, label, value, valueColor }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    valueColor?: string;
}) {
    const { colors, theme } = useTheme();
    return (
        <View style={[styles.infoCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow, borderColor: colors.border, borderWidth: theme === 'dark' ? 1 : 0 }]}>
            <Ionicons name={icon} size={20} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }, valueColor ? { color: valueColor } : null]} numberOfLines={2}>
                    {value || '—'}
                </Text>
            </View>
        </View>
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
        elevation: 6,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    careerCard: {
        backgroundColor: '#7C4DFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#7C4DFF',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    todayCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    todayCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    todayCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#7C4DFF',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    noClassContent: {
        paddingVertical: 4,
    },
    noClassText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    classContent: {
        paddingVertical: 2,
    },
    classMainInfo: {
        marginBottom: 8,
    },
    className: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a2e',
    },
    classCode: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        marginTop: 2,
    },
    classDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    classDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    classDetailText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        marginLeft: 4,
    },
    blockBadge: {
        backgroundColor: 'rgba(124, 77, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    blockBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#7C4DFF',
    },
    careerCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    careerLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    careerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginTop: 4,
    },
    careerDetail: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    situationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
        alignSelf: 'flex-start',
    },
    situationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    situationText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
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
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    infoLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
        marginTop: 2,
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
});
