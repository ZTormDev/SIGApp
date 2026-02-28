import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserProfile } from '../../utils/storage';
import { useTheme } from '../../utils/ThemeContext';

export function ProfileCard({ profile }: { profile: UserProfile }) {
    const { colors, theme } = useTheme();

    const getSituationColor = (sit: string) => {
        if (sit.toLowerCase().includes('regular')) return '#00C853';
        if (sit.toLowerCase().includes('condicional')) return '#FF9100';
        return '#F44336';
    };

    return (
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
    );
}

const styles = StyleSheet.create({
    careerCard: {
        backgroundColor: '#7C4DFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
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
});
