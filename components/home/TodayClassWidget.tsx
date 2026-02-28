import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

export function TodayClassWidget({ todayClassInfo }: { todayClassInfo: any }) {
    const { colors, theme } = useTheme();

    return (
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
    );
}

const styles = StyleSheet.create({
    todayCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
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
});
