import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSchedule } from '../../utils/storage';
import { useTheme } from '../../utils/ThemeContext';

// Temporary demo data for Chrome preview (matches user's actual schedule)
export const DEMO_DATA = [
    [
        { "title": "EIN112 - 702 (Ins)", "subject": "EIN112", "room": "702", "professor": "Dr. García", "type": "Cátedra", "block": "1-2", "isFilled": true },
        { "title": "MAT002 - 710 (Ins)", "subject": "MAT002", "room": "710", "professor": "Prof. Pérez", "type": "Taller", "block": "1-2", "isFilled": true },
        { "title": "EIN113 - 702 (Ins)", "subject": "EIN113", "room": "702", "professor": "Prof. López", "type": "Cátedra", "block": "1-2", "isFilled": true },
        { "title": "EIN114 - 703 (Ins)", "subject": "EIN114", "room": "703", "professor": "Dr. Soto", "type": "Laboratorio", "block": "1-2", "isFilled": true },
        { "title": "[TOPE] EFI100 - EDUCACION FISICA Y DEPORTES / EIN113 - INTRODUCCION A LA INFORMATICA Y COMPUTACION", "subject": "TOPE", "room": "", "professor": "", "type": "Tope", "block": "1-2", "isFilled": true, "topeSubjects": ["EFI100 - EDUCACION FISICA Y DEPORTES", "EIN113 - INTRODUCCION A LA INFORMATICA Y COMPUTACION"] },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "EIN112 - 702 (Ins)", "subject": "EIN112", "room": "702", "professor": "Dr. García", "type": "Cátedra", "block": "3-4", "isFilled": true },
        { "title": "MAT001 - 712 (Ins)", "subject": "MAT001", "room": "712", "professor": "Prof. Martínez", "type": "Cátedra", "block": "3-4", "isFilled": true },
        { "title": "MAT001 - 712 (Ins)", "subject": "MAT001", "room": "712", "professor": "Prof. Martínez", "type": "Cátedra", "block": "3-4", "isFilled": true },
        { "title": "HCW100 - 712 (Ins)", "subject": "HCW100", "room": "712", "professor": "Prof. Vargas", "type": "Cátedra", "block": "3-4", "isFilled": true },
        { "title": "HCW100 - 712 (Ins)", "subject": "HCW100", "room": "712", "professor": "Prof. Vargas", "type": "Cátedra", "block": "3-4", "isFilled": true },
        { "title": "FGY221 - 705 (Ins)", "subject": "FGY221", "room": "705", "professor": "Prof. Silva", "type": "Cátedra", "block": "3-4", "isFilled": true }
    ],
    [
        { "title": "EIN111 - 702 (Ins)", "subject": "EIN111", "room": "702", "professor": "Dr. Fernández", "type": "Cátedra", "block": "5-6", "isFilled": true },
        { "title": "HST105 - 704 (Ins)", "subject": "HST105", "room": "704", "professor": "Dr. Morales", "type": "Cátedra", "block": "5-6", "isFilled": true },
        { "title": "EIN112 - 702 (Ins)", "subject": "EIN112", "room": "702", "professor": "Dr. García", "type": "Cátedra", "block": "5-6", "isFilled": true },
        { "title": "EIN113 - 703 (Ins)", "subject": "EIN113", "room": "703", "professor": "Prof. López", "type": "Taller", "block": "5-6", "isFilled": true },
        { "title": "MAT001 - 712 (Ins)", "subject": "MAT001", "room": "712", "professor": "Prof. Martínez", "type": "Cátedra", "block": "5-6", "isFilled": true },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "EIN111 - 702 (Ins)", "subject": "EIN111", "room": "702", "professor": "Dr. Fernández", "type": "Cátedra", "block": "7-8", "isFilled": true },
        { "title": "", "isFilled": false },
        { "title": "EIN112 - 702 (Ins)", "subject": "EIN112", "room": "702", "professor": "Dr. García", "type": "Cátedra", "block": "7-8", "isFilled": true },
        { "title": "", "isFilled": false },
        { "title": "EIN114 - 703 (Ins)", "subject": "EIN114", "room": "703", "professor": "Dr. Soto", "type": "Laboratorio", "block": "7-8", "isFilled": true },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "MAT002 - 710 (Ins)", "subject": "MAT002", "room": "710", "professor": "Prof. Pérez", "type": "Ayudantía", "block": "9-10", "isFilled": true },
        { "title": "", "isFilled": false },
        { "title": "EIN111 - 706 (Ins)", "subject": "EIN111", "room": "706", "professor": "Dr. Fernández", "type": "Ayudantía", "block": "9-10", "isFilled": true },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "", "isFilled": false },
        { "title": "EIN113 - 703 (Ins)", "subject": "EIN113", "room": "703", "professor": "Prof. López", "type": "Laboratorio", "block": "11-12", "isFilled": true },
        { "title": "", "isFilled": false },
        { "title": "MAT002 - 710 (Ins)", "subject": "MAT002", "room": "710", "professor": "Prof. Pérez", "type": "Cátedra", "block": "11-12", "isFilled": true },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "DIB101 - 801 (Ins)", "subject": "DIB101", "room": "801", "professor": "Prof. Rojas", "type": "Cátedra", "block": "13-14", "isFilled": true },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "DIB101 - 801 (Ins)", "subject": "DIB101", "room": "801", "professor": "Prof. Rojas", "type": "Cátedra", "block": "13-14", "isFilled": true },
        { "title": "", "isFilled": false }
    ]
];

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const FULL_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const TIME_BLOCKS = [
    { label: '1-2', start: '08:15', end: '09:45' },
    { label: '3-4', start: '10:00', end: '11:30' },
    { label: '5-6', start: '11:45', end: '13:15' },
    { label: '7-8', start: '14:15', end: '15:45' },
    { label: '9-10', start: '16:00', end: '17:30' },
    { label: '11-12', start: '17:45', end: '19:15' },
    { label: '13-14', start: '19:30', end: '21:00' },
];

const SUBJECT_COLORS = [
    { bg: '#EDE7F6', border: '#7C4DFF', text: '#8f24c1ff' },
    { bg: '#E3F2FD', border: '#2979FF', text: '#3075ddff' },
    { bg: '#E8F5E9', border: '#00C853', text: '#34a93cff' },
    { bg: '#FFF3E0', border: '#FF9100', text: '#E65100' },
    { bg: '#FCE4EC', border: '#FF4081', text: '#c11e75ff' },
    { bg: '#E0F7FA', border: '#00BCD4', text: '#006064' },
    { bg: '#FFF8E1', border: '#FFD600', text: '#F57F17' },
    { bg: '#F3E5F5', border: '#E040FB', text: '#6A1B9A' },
    { bg: '#E8EAF6', border: '#536DFE', text: '#1A237E' },
    { bg: '#EFEBE9', border: '#8D6E63', text: '#3E2723' },
];

const TOPE_COLOR = { bg: '#FFEBEE', border: '#F44336', text: '#B71C1C' };

const screenWidth = Dimensions.get('window').width;

interface SelectedBlock {
    cell: any;
    rowIndex: number;
    colIndex: number;
    color: { bg: string; border: string; text: string };
}

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
                    // Use cell.subject as the key (e.g. "EIN112", "MAT001")
                    const key = cell.subject || cell.title.split(' ')[0].replace(/[^A-Z0-9]/gi, '');
                    if (key && !map[key] && cell.type !== 'Tope') {
                        // For the display name, prefer extracting from title if it has the format "CODE - Name (status)"
                        let name = key;
                        const parts = cell.title.split(' - ');
                        if (parts.length >= 2) {
                            const extracted = parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').trim();
                            // Only use extracted name if it's not just a room number
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

    // Map subject codes (e.g. "EIN113") to display names by scanning all cells
    const codeToNameMap = useMemo(() => {
        if (!scheduleData) return {};
        const map: Record<string, string> = {};
        for (const row of scheduleData) {
            for (const cell of row) {
                if (cell && cell.isFilled && cell.title && cell.type !== 'Tope') {
                    const t = cell.title || '';
                    // Extract the base code from the title (e.g. "EIN113" from "EIN113-A - Intro Ingeniería (Cát)")
                    const codeMatch = t.match(/^([A-Z]{2,}\d+)/);
                    if (codeMatch) {
                        const code = codeMatch[1];
                        if (!map[code]) {
                            // Try to get the name from the title
                            const parts = t.split(' - ');
                            if (parts.length >= 2) {
                                const extracted = parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').trim();
                                if (extracted && !/^\d+$/.test(extracted)) {
                                    map[code] = extracted;
                                }
                            }
                            // Also try using cell.subject if it's a meaningful name (not same as code)
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

    // Compute merge map: for each cell [row][col], determine if it should span multiple rows
    // or be hidden (absorbed into a previous cell's span)
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
                    // Count how many consecutive rows have the same subject in this column
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
                    // Mark subsequent cells as hidden
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
        const dayIndex = now.getDay() - 1; // 0 = Lunes, 5 = Sábado
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

    const handleCellPress = (cell: any, rowIndex: number, colIndex: number) => {
        if (!cell || !cell.isFilled) return;
        const color = getColorForCell(cell);
        if (!color) return;
        setSelectedBlock({ cell, rowIndex, colIndex, color });
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

    // 16 = paddingHorizontal (8*2), 44 = time cell width, 12 = cell margins (1px*2 sides * 6 cols)
    const dayColumnWidth = (screenWidth - 16 - 44 - 24) / DAYS.length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Mi Horario</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Semestre 2026-1</Text>
            </View>

            {/* Day Headers */}
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

            {/* Schedule Grid */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {scheduleData.slice(0, lastFilledRow + 1).map((row, rowIndex) => (
                    <View key={rowIndex} style={[styles.gridRow, { zIndex: scheduleData.length - rowIndex, overflow: 'visible' }]}>
                        {/* Time label */}
                        <View style={styles.timeCell}>
                            <Text style={[styles.timeBlockLabel, { color: colors.primary }]}>{TIME_BLOCKS[rowIndex]?.label}</Text>
                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                                {TIME_BLOCKS[rowIndex]?.start}{'\n'}{TIME_BLOCKS[rowIndex]?.end}
                            </Text>
                        </View>

                        {/* Day cells */}
                        {row.map((cell: any, colIndex: number) => {
                            const mergeKey = `${rowIndex}-${colIndex}`;
                            const merge = mergeMap[mergeKey] || { span: 1, hidden: false };

                            // Hidden cells (absorbed into a previous cell's span) - keep width for layout
                            if (merge.hidden) {
                                return <View key={colIndex} style={{ width: dayColumnWidth, margin: 2 }} />;
                            }

                            const color = getColorForCell(cell);
                            const isFilled = cell && cell.isFilled;
                            const span = merge.span;

                            // For merged cells: wrap in a normal-sized container so the row height isn't affected
                            if (span > 1) {
                                // Height = cell heights + margins + row gaps for spanned rows
                                const mergedHeight = 56 * span + 4 * span + (span - 1) * 2;
                                return (
                                    <View key={colIndex} style={{ width: dayColumnWidth, minHeight: 56, margin: 2, overflow: 'visible' }}>
                                        <TouchableOpacity
                                            activeOpacity={0.6}
                                            onPress={() => handleCellPress(cell, rowIndex, colIndex)}
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
                                                    <Text
                                                        style={[styles.cellSubjectCode, { color: color.text }]}
                                                        numberOfLines={2}
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

                            // Normal (non-merged) cell
                            return (
                                <TouchableOpacity
                                    key={colIndex}
                                    activeOpacity={isFilled ? 0.6 : 1}
                                    onPress={() => handleCellPress(cell, rowIndex, colIndex)}
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
                                            <Text
                                                style={[styles.cellSubjectCode, { color: color.text }]}
                                                numberOfLines={1}
                                            >
                                                {(() => {
                                                    if (cell.type === 'Tope' || cell.subject === 'TOPE') {
                                                        return '[TOPE]';
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
                    </View>
                ))}

                {/* Today's Class Widget */}
                <View style={styles.todayCardContainer}>
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
                </View>
            </ScrollView>

            {/* Subject Legend */}
            <View style={[styles.legendContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 32 }}>
                    {Object.entries(subjectColorMap).map(([code, color]) => (
                        <View key={code} style={[styles.legendItem, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : color.bg }]}>
                            <View style={[styles.legendDot, { backgroundColor: color.border }]} />
                            <Text style={[styles.legendText, { color: theme === 'dark' ? colors.text : color.text }]}>{color.name || code}</Text>
                        </View>
                    ))}
                </ScrollView>
                <LinearGradient
                    colors={theme === 'dark' ? ['rgba(30, 30, 30, 0)', 'rgba(30, 30, 30, 1)'] : ['rgba(248, 249, 255, 0)', 'rgba(248, 249, 255, 1)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.legendFade}
                    pointerEvents="none"
                />
            </View>

            {/* Block Detail Modal */}
            <Modal
                visible={!!selectedBlock}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedBlock(null)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setSelectedBlock(null)}
                >
                    <Pressable
                        style={[styles.modalSheet, { backgroundColor: colors.surface }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {selectedBlock && (
                            <>
                                {/* Handle bar */}
                                <View style={styles.modalHandle} />

                                {/* Header with color accent */}
                                <View style={[styles.modalHeader, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : selectedBlock.color.bg }]}>
                                    <View style={[styles.modalAccent, { backgroundColor: selectedBlock.color.border }]} />
                                    <View style={styles.modalHeaderContent}>
                                        <Text style={[styles.modalSubjectCode, { color: theme === 'dark' ? colors.text : selectedBlock.color.text }]}>
                                            {(() => {
                                                if (selectedBlock.cell.type === 'Tope') {
                                                    return 'TOPE DE HORARIO';
                                                }
                                                const t = selectedBlock.cell.title || '';
                                                const parts = t.split(' - ');
                                                if (parts.length >= 2) {
                                                    return parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').toUpperCase();
                                                }
                                                return t.split(' ')[0];
                                            })()}
                                        </Text>
                                        <Text style={[styles.modalSubjectTitle, { color: colors.textSecondary }]}>
                                            {(() => {
                                                if (selectedBlock.cell.type === 'Tope' && selectedBlock.cell.topeSubjects) {
                                                    return `Colisión: ${selectedBlock.cell.topeSubjects.join(' / ')}`;
                                                }
                                                const t = selectedBlock.cell.title || '';
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
                                        onPress={() => setSelectedBlock(null)}
                                    >
                                        <Ionicons name="close" size={22} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Detail rows */}
                                <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 16 }}>
                                    <DetailRow
                                        icon="calendar-outline"
                                        label="Día"
                                        value={FULL_DAYS[selectedBlock.colIndex] || '—'}
                                    />
                                    <DetailRow
                                        icon="time-outline"
                                        label="Bloque"
                                        value={`${TIME_BLOCKS[selectedBlock.rowIndex]?.label} (${TIME_BLOCKS[selectedBlock.rowIndex]?.start} - ${TIME_BLOCKS[selectedBlock.rowIndex]?.end})`}
                                    />
                                    {selectedBlock.cell.type !== 'Tope' && (
                                        <DetailRow
                                            icon="location-outline"
                                            label="Sala"
                                            value={selectedBlock.cell.room || 'Sin asignar'}
                                        />
                                    )}
                                    {selectedBlock.cell.type !== 'Tope' && (
                                        <DetailRow
                                            icon="person-outline"
                                            label="Profesor"
                                            value={selectedBlock.cell.professor || 'Sin asignar'}
                                        />
                                    )}
                                    <DetailRow
                                        icon="book-outline"
                                        label="Tipo"
                                        value={selectedBlock.cell.type || '—'}
                                    />
                                    {selectedBlock.cell.type === 'Tope' && (
                                        <View style={[styles.topeWarning, { backgroundColor: theme === 'dark' ? 'rgba(244, 67, 54, 0.15)' : '#FFEBEE' }]}>
                                            <Ionicons name="warning" size={18} color="#F44336" />
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={[styles.topeWarningText, { color: theme === 'dark' ? '#FF8A80' : '#B71C1C' }]}>
                                                    Este bloque tiene un tope de horario
                                                </Text>
                                                {selectedBlock.cell.topeSubjects && (
                                                    <Text style={[styles.topeWarningText, { fontWeight: '400', marginTop: 4, color: theme === 'dark' ? '#FF8A80' : '#B71C1C' }]}>
                                                        Asignaturas: {selectedBlock.cell.topeSubjects.join(', ')}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

function DetailRow({ icon, label, value }: {
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
        paddingBottom: 12,
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
    legendContainer: {
        paddingHorizontal: 0,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginRight: 8,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '700',
    },
    legendFade: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
    },

    // Modal styles
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
    // Today Card Styles
    todayCardContainer: {
        flex: 1,
        paddingHorizontal: 1,
        paddingVertical: 10,
        justifyContent: 'center',
    },
    todayCard: {
        flex: 1,
        borderRadius: 16,
        padding: 20,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        minHeight: 120, // Minimum height to look card-like
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
