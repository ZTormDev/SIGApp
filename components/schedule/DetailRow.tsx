import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

export function DetailRow({ icon, label, value }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}) {
    const { colors, theme } = useTheme();
    return (
        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.detailIconContainer, { backgroundColor: theme === 'dark' ? 'rgba(157, 122, 255, 0.15)' : '#f0ecff' }]}>
                <Ionicons name={icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    detailIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
    },
});
