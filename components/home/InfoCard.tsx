import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

export function InfoCard({ icon, label, value, valueColor }: {
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
});
