import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FULL_DAYS, SelectedBlock, TIME_BLOCKS } from '../../utils/scheduleConstants';
import { useTheme } from '../../utils/ThemeContext';
import { DetailRow } from './DetailRow';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScheduleModalProps {
    selectedBlock: SelectedBlock | null;
    onClose: () => void;
}

export function ScheduleModal({ selectedBlock, onClose }: ScheduleModalProps) {
    const { colors, theme } = useTheme();

    const [modalVisible, setModalVisible] = useState(false);
    const [renderBlock, setRenderBlock] = useState<SelectedBlock | null>(null);
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (selectedBlock) {
            setRenderBlock(selectedBlock);
            setModalVisible(true);
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    speed: 12,
                    bounciness: 0,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: SCREEN_HEIGHT,
                    useNativeDriver: true,
                    speed: 12,
                    bounciness: 0,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start((result) => {
                // Solo limpiamos el estado si la animación terminó por completo
                // Si fue interrumpida (result.finished === false), significa que otro bloque se abrió
                if (result.finished) {
                    setModalVisible(false);
                    setRenderBlock(null);
                }
            });
        }
    }, [selectedBlock, translateY, opacity]);

    if (!modalVisible && !selectedBlock) return null;

    return (
        <View
            style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
            pointerEvents={selectedBlock ? 'auto' : 'none'}
        >
            <View style={styles.modalOverlay}>
                <AnimatedPressable
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: 'rgba(0,0,0,0.4)', opacity }
                    ]}
                    onPress={onClose}
                />
                <AnimatedPressable
                    style={[
                        styles.modalSheet,
                        { backgroundColor: colors.surface, transform: [{ translateY }] }
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {renderBlock && (
                        <>
                            <View style={styles.modalHandle} />

                            <View style={[styles.modalHeader, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : renderBlock.color.bg }]}>
                                <View style={[styles.modalAccent, { backgroundColor: renderBlock.color.border }]} />
                                <View style={styles.modalHeaderContent}>
                                    <Text style={[styles.modalSubjectCode, { color: theme === 'dark' ? colors.text : renderBlock.color.text }]}>
                                        {(() => {
                                            if (renderBlock.cell.type === 'Tope') {
                                                return 'TOPE DE HORARIO';
                                            }
                                            const t = renderBlock.cell.title || '';
                                            const parts = t.split(' - ');
                                            if (parts.length >= 2) {
                                                return parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').toUpperCase();
                                            }
                                            return t.split(' ')[0];
                                        })()}
                                    </Text>
                                    <Text style={[styles.modalSubjectTitle, { color: colors.textSecondary }]}>
                                        {(() => {
                                            if (renderBlock.cell.type === 'Tope' && renderBlock.cell.topeSubjects) {
                                                return `Colisión: ${renderBlock.cell.topeSubjects.join(' / ')}`;
                                            }
                                            const t = renderBlock.cell.title || '';
                                            const parts = t.split(' - ');
                                            if (parts.length >= 2) {
                                                const code = parts[0].trim();
                                                const name = parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').toUpperCase();
                                                return `${code} - ${name}`;
                                            }
                                            return t;
                                        })()}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.modalCloseBtn, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
                                    onPress={onClose}
                                >
                                    <Ionicons name="close" size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 16 }}>
                                <DetailRow
                                    icon="calendar-outline"
                                    label="Día"
                                    value={FULL_DAYS[renderBlock.colIndex] || '—'}
                                />
                                <DetailRow
                                    icon="time-outline"
                                    label="Bloque"
                                    value={`${TIME_BLOCKS[renderBlock.rowIndex]?.label} (${TIME_BLOCKS[renderBlock.rowIndex]?.start} - ${TIME_BLOCKS[renderBlock.rowIndex]?.end})`}
                                />
                                {renderBlock.cell.type !== 'Tope' && (
                                    <DetailRow
                                        icon="location-outline"
                                        label="Sala"
                                        value={renderBlock.cell.room || 'Sin asignar'}
                                    />
                                )}
                                {renderBlock.cell.type !== 'Tope' && (
                                    <DetailRow
                                        icon="person-outline"
                                        label="Profesor"
                                        value={renderBlock.cell.professor || 'Sin asignar'}
                                    />
                                )}
                                <DetailRow
                                    icon="book-outline"
                                    label="Tipo"
                                    value={renderBlock.cell.type || '—'}
                                />
                                {renderBlock.cell.type === 'Tope' && (
                                    <View style={[styles.topeWarning, { backgroundColor: theme === 'dark' ? 'rgba(244, 67, 54, 0.15)' : '#FFEBEE' }]}>
                                        <Ionicons name="warning" size={18} color="#F44336" />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={[styles.topeWarningText, { color: theme === 'dark' ? '#FF8A80' : '#B71C1C' }]}>
                                                Este bloque tiene un tope de horario
                                            </Text>
                                            {renderBlock.cell.topeSubjects && (
                                                <Text style={[styles.topeWarningText, { fontWeight: '400', marginTop: 4, color: theme === 'dark' ? '#FF8A80' : '#B71C1C' }]}>
                                                    Asignaturas: {renderBlock.cell.topeSubjects.join(', ')}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </ScrollView>
                        </>
                    )}
                </AnimatedPressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 400,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 24,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 24,
        position: 'relative',
    },
    modalAccent: {
        position: 'absolute',
        left: 0,
        top: 20,
        bottom: 20,
        width: 4,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    modalHeaderContent: {
        flex: 1,
        paddingLeft: 4,
        paddingRight: 40,
    },
    modalSubjectCode: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    modalSubjectTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        paddingTop: 8,
    },
    topeWarning: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    topeWarningText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
