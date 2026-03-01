import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScheduleModal } from '../../components/schedule/ScheduleModal';
import { DAYS, DEMO_DATA, SelectedBlock, SUBJECT_COLORS, TIME_BLOCKS, TOPE_COLOR } from '../../utils/scheduleConstants';
import { getSchedule } from '../../utils/storage';
import { useTheme } from '../../utils/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export default function ScheduleScreen() {
    const [scheduleData, setScheduleData] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(null);
    const { colors, theme } = useTheme();

    useEffect(() => {
        async function loadData() {
            const data = await getSchedule();
            setScheduleData(data || DEMO_DATA);
            setIsLoading(false);
        }
        loadData();
    }, []);

    const subjectColorMap = useMemo(() => {
        if (!scheduleData) return {};
        const map: Record<string, typeof SUBJECT_COLORS[0] & { name: string }> = {};
        let colorIdx = 0;
        for (const row of scheduleData) {
            for (const cell of row) {
                if (cell && cell.isFilled && cell.title) {
                    const key = cell.subject || cell.title.split(' ')[0].replace(/[^A-Z0-9]/gi, '');
                    if (key && !map[key] && cell.type !== 'Tope') {
                        let name = key;
                        const parts = cell.title.split(' - ');
                        if (parts.length >= 2) {
                            const extracted = parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').trim();
                            if (extracted && !/^\d+$/.test(extracted)) {
                                name = extracted;
                            }
                        }
                        map[key] = { ...SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length], name };
                        colorIdx++;
                    }
                }
            }
        }
        return map;
    }, [scheduleData]);

    const codeToNameMap = useMemo(() => {
        if (!scheduleData) return {};
        const map: Record<string, string> = {};
        for (const row of scheduleData) {
            for (const cell of row) {
                if (cell && cell.isFilled && cell.title && cell.type !== 'Tope') {
                    const t = cell.title || '';
                    const codeMatch = t.match(/^([A-Z]{2,}\d+)/);
                    if (codeMatch) {
                        const code = codeMatch[1];
                        if (!map[code]) {
                            const parts = t.split(' - ');
                            if (parts.length >= 2) {
                                const extracted = parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').trim();
                                if (extracted && !/^\d+$/.test(extracted)) {
                                    map[code] = extracted;
                                }
                            }
                            if (!map[code] && cell.subject && cell.subject !== code && !/^\d+$/.test(cell.subject)) {
                                map[code] = cell.subject;
                            }
                        }
                    }
                }
            }
        }
        return map;
    }, [scheduleData]);

    const getColorForCell = (cell: any) => {
        if (!cell || !cell.isFilled) return null;
        if (cell.type === 'Tope' || cell.title?.includes('TOPE')) return TOPE_COLOR;
        const key = cell.subject || cell.title?.split(' ')[0]?.replace(/[^A-Z0-9]/gi, '') || '';
        return subjectColorMap[key] || SUBJECT_COLORS[0];
    };

    const lastFilledRow = useMemo(() => {
        if (!scheduleData) return 0;
        let last = 0;
        for (let r = 0; r < scheduleData.length; r++) {
            for (let c = 0; c < scheduleData[r].length; c++) {
                if (scheduleData[r][c]?.isFilled) last = r;
            }
        }
        return last;
    }, [scheduleData]);

    const mergeMap = useMemo(() => {
        if (!scheduleData) return {};
        const map: Record<string, { span: number; hidden: boolean }> = {};
        const numRows = scheduleData.length;
        const numCols = scheduleData[0]?.length || 0;

        for (let col = 0; col < numCols; col++) {
            let row = 0;
            while (row < numRows) {
                const cell = scheduleData[row]?.[col];
                const key = `${row}-${col}`;
                if (cell && cell.isFilled && cell.subject && cell.type !== 'Tope') {
                    let span = 1;
                    while (row + span < numRows) {
                        const nextCell = scheduleData[row + span]?.[col];
                        if (nextCell && nextCell.isFilled && nextCell.subject === cell.subject && nextCell.type !== 'Tope') {
                            span++;
                        } else {
                            break;
                        }
                    }
                    map[key] = { span, hidden: false };
                    for (let s = 1; s < span; s++) {
                        map[`${row + s}-${col}`] = { span: 0, hidden: true };
                    }
                    row += span;
                } else {
                    map[key] = { span: 1, hidden: false };
                    row++;
                }
            }
        }
        return map;
    }, [scheduleData]);

    const getTodayClass = () => {
        if (!scheduleData) return null;

        const now = new Date();
        const dayIndex = now.getDay() - 1;
        if (dayIndex < 0 || dayIndex > 5) return { type: 'no-classes', message: '¡Hoy es domingo! Disfruta tu descanso.' };

        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const todaySchedule = scheduleData.map(row => row[dayIndex]);
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

    const handleCellPress = (cell: any, rowIndex: number, colIndex: number, span: number = 1) => {
        if (!cell || !cell.isFilled) return;
        const color = getColorForCell(cell);
        if (!color) return;
        setSelectedBlock({ cell, rowIndex, colIndex, color, span });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (!scheduleData || scheduleData.length === 0) {
        return (
            <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="calendar-outline" size={64} color={theme === 'dark' ? colors.border : '#ccc'} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin horario</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>No se encontraron datos del horario.</Text>
            </SafeAreaView>
        );
    }

    const dayColumnWidth = (screenWidth - 16 - 44 - 24) / DAYS.length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Mi Horario</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Semestre 2026-1</Text>
            </Animated.View>

            <View style={styles.dayHeaderRow}>
                <View style={styles.timeHeaderCell} />
                {DAYS.map((day, i) => {
                    const today = new Date().getDay();
                    const isToday = today === i + 1;
                    return (
                        <View
                            key={day}
                            style={[
                                styles.dayHeaderCell,
                                { width: dayColumnWidth },
                                isToday && { backgroundColor: colors.primary },
                            ]}
                        >
                            <Text style={[styles.dayHeaderText, { color: theme === 'dark' ? colors.textSecondary : '#666' }, isToday && { color: '#fff' }]}>
                                {day}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {scheduleData.slice(0, lastFilledRow + 1).map((row, rowIndex) => (
                    <Animated.View
                        key={rowIndex}
                        style={[styles.gridRow, { zIndex: scheduleData.length - rowIndex, overflow: 'visible' }]}
                        entering={FadeInDown.duration(400).delay(200 + (rowIndex * 50))}
                    >
                        <View style={styles.timeCell}>
                            <Text style={[styles.timeBlockLabel, { color: colors.primary }]}>{TIME_BLOCKS[rowIndex]?.label}</Text>
                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                                {TIME_BLOCKS[rowIndex]?.start}{'\n'}{TIME_BLOCKS[rowIndex]?.end}
                            </Text>
                        </View>

                        {row.map((cell: any, colIndex: number) => {
                            const mergeKey = `${rowIndex}-${colIndex}`;
                            const merge = mergeMap[mergeKey] || { span: 1, hidden: false };

                            if (merge.hidden) {
                                return <View key={colIndex} style={{ width: dayColumnWidth, margin: 2 }} />;
                            }

                            const color = getColorForCell(cell);
                            const isFilled = cell && cell.isFilled;
                            const span = merge.span;

                            if (span > 1) {
                                const mergedHeight = 56 * span + 4 * span + (span - 1) * 2;
                                return (
                                    <View key={colIndex} style={{ width: dayColumnWidth, minHeight: 56, margin: 2, overflow: 'visible' }}>
                                        <TouchableOpacity
                                            activeOpacity={0.6}
                                            onPress={() => handleCellPress(cell, rowIndex, colIndex, span)}
                                            style={[
                                                styles.gridCell,
                                                {
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    width: undefined,
                                                    height: mergedHeight,
                                                    minHeight: mergedHeight,
                                                    zIndex: 10,
                                                    margin: 0,
                                                },
                                                isFilled && color && {
                                                    backgroundColor: color.bg,
                                                    borderLeftWidth: 3,
                                                    borderLeftColor: color.border,
                                                },
                                            ]}
                                        >
                                            {isFilled && color && (
                                                <>
                                                    <Text style={[styles.cellSubjectCode, { color: color.text, fontSize: 9, opacity: 0.8, marginBottom: 1, fontWeight: '600' }]} numberOfLines={1}>
                                                        {cell.title?.split(' - ')[0]}
                                                    </Text>
                                                    <Text
                                                        style={[styles.cellSubjectCode, { color: color.text }]}
                                                        numberOfLines={1}
                                                    >
                                                        {(() => {
                                                            const t = cell.title || '';
                                                            const parts = t.split(' - ');
                                                            if (parts.length >= 2) {
                                                                return parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').toUpperCase();
                                                            }
                                                            return t.split(' ')[0];
                                                        })()}
                                                    </Text>
                                                    {cell.room ? (
                                                        <Text style={styles.cellRoom} numberOfLines={1}>
                                                            {cell.room}
                                                        </Text>
                                                    ) : null}
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={colIndex}
                                    activeOpacity={isFilled ? 0.6 : 1}
                                    onPress={() => handleCellPress(cell, rowIndex, colIndex, 1)}
                                    style={[
                                        styles.gridCell,
                                        { width: dayColumnWidth, backgroundColor: colors.surface },
                                        isFilled && color && {
                                            backgroundColor: color.bg,
                                            borderLeftWidth: 3,
                                            borderLeftColor: color.border,
                                        },
                                    ]}
                                >
                                    {isFilled && color && (
                                        <>
                                            <Text style={[styles.cellSubjectCode, { color: color.text, fontSize: 8, opacity: 0.8, marginBottom: 0, fontWeight: '600' }]} numberOfLines={1}>
                                                {(cell.type === 'Tope' ? '[TOPE]' : cell.title?.split(' - ')[0])}
                                            </Text>
                                            <Text
                                                style={[styles.cellSubjectCode, { color: color.text }]}
                                                numberOfLines={1}
                                            >
                                                {(() => {
                                                    if (cell.type === 'Tope' || cell.subject === 'TOPE') {
                                                        return 'HORARIO';
                                                    }
                                                    const t = cell.title || '';
                                                    const parts = t.split(' - ');
                                                    if (parts.length >= 2) {
                                                        return parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').toUpperCase();
                                                    }
                                                    return t.split(' ')[0];
                                                })()}
                                            </Text>
                                            {cell.type === 'Tope' && cell.topeSubjects ? (
                                                <Text style={[styles.cellRoom, { color: color.text }]} numberOfLines={2}>
                                                    {cell.topeSubjects.join('\n')}
                                                </Text>
                                            ) : cell.room ? (
                                                <Text style={styles.cellRoom} numberOfLines={1}>
                                                    {cell.room}
                                                </Text>
                                            ) : null}
                                        </>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </Animated.View>
                ))}

                <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={[styles.todayCardContainer, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.todayCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme === 'dark' ? 1 : 0 }]}>
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
                            <View style={styles.classWidgetContent}>
                                <View style={styles.classMainInfo}>
                                    <View style={{ flex: 1 }}>
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
                                        <Text style={[styles.classCode, { color: colors.textSecondary }]}>
                                            {todayClassInfo?.data.subject} · {todayClassInfo?.data.type}
                                        </Text>
                                    </View>
                                    <View style={[styles.blockBadge, { backgroundColor: theme === 'dark' ? 'rgba(157, 122, 255, 0.2)' : 'rgba(124, 77, 255, 0.1)' }]}>
                                        <Text style={[styles.blockBadgeText, { color: colors.primary }]}>B{todayClassInfo?.data.blockLabel}</Text>
                                    </View>
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
                                    {todayClassInfo?.data.professor ? (
                                        <View style={styles.classDetailItem}>
                                            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                                            <Text style={[styles.classDetailText, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {todayClassInfo.data.professor.split(' ').slice(0, 2).join(' ')}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </ScrollView>

            <ScheduleModal
                selectedBlock={selectedBlock}
                onClose={() => setSelectedBlock(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9ff',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        marginBottom: 24,
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9ff',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1a1a2e',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    dayHeaderRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        marginBottom: 4,
        gap: 4,
    },
    timeHeaderCell: {
        width: 44,
    },
    dayHeaderCell: {
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 8,
    },
    dayHeaderToday: {
        backgroundColor: '#7C4DFF',
    },
    dayHeaderText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
    },
    dayHeaderTextToday: {
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 8,
        paddingBottom: 20,
        flexGrow: 1,
    },
    gridRow: {
        flexDirection: 'row',
        marginBottom: 2,
        minHeight: 60,
    },
    timeCell: {
        width: 44,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
    },
    timeBlockLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#7C4DFF',
    },
    timeText: {
        fontSize: 9,
        color: '#aaa',
        textAlign: 'center',
        marginTop: 2,
        lineHeight: 12,
    },
    gridCell: {
        minHeight: 56,
        margin: 2,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    cellSubjectCode: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    cellRoom: {
        fontSize: 9,
        color: '#999',
        marginTop: 2,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ddd',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
    },
    modalAccent: {
        width: 4,
        height: '100%',
        borderRadius: 2,
        marginRight: 14,
        minHeight: 40,
    },
    modalHeaderContent: {
        flex: 1,
    },
    modalSubjectCode: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    modalSubjectTitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f0ecff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        marginTop: 2,
    },
    topeWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
    },
    topeWarningText: {
        fontSize: 14,
        color: '#B71C1C',
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
    },
    todayCardContainer: {
        flex: 1,
        paddingHorizontal: 1,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    todayCard: {
        borderRadius: 16,
        padding: 20,
        minHeight: 220,
    },
    todayCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    todayCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    noClassContent: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 10,
    },
    noClassText: {
        fontSize: 15,
        fontWeight: '500',
    },
    classWidgetContent: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 4,
    },
    classMainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    className: {
        fontSize: 18,
        fontWeight: '800',
    },
    classCode: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    classDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    classDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 4,
    },
    classDetailText: {
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 4,
    },
    blockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 8,
    },
    blockBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
});
