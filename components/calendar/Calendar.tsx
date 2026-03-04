import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../utils/ThemeContext';

interface CalendarProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    examsDates: string[]; // ['2026-03-10', ...]
}

const MONTH_TITLES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function Calendar({ selectedDate, onDateSelect, examsDates }: CalendarProps) {
    const { colors, theme } = useTheme();
    const [viewDate, setViewDate] = useState(new Date(selectedDate + 'T12:00:00'));

    const changeMonth = (offset: number) => {
        const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(next);
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        // 0 = Sunday, 1 = Monday... we want 0 = Monday
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        // Days from previous month
        const prevMonth = new Date(year, month - 1, 1);
        const daysInPrevMonth = getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());

        const days = [];

        // Fill previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                day: daysInPrevMonth - i,
                month: month - 1,
                year: year,
                currentMonth: false
            });
        }

        // Fill current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                month: month,
                year: year,
                currentMonth: true
            });
        }

        // Fill next month days to complete the weeks
        const totalCells = Math.ceil(days.length / 7) * 7;
        const remainingCells = totalCells - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                month: month + 1,
                year: year,
                currentMonth: false
            });
        }

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        return days.map((item, index) => {
            const dateStr = `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isToday = todayStr === dateStr;
            const hasExam = examsDates.includes(dateStr);

            return (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => onDateSelect(dateStr)}
                >
                    <Text style={[
                        styles.dayText,
                        { color: item.currentMonth ? colors.text : colors.textSecondary + '66' },
                        isSelected && { color: '#fff', fontWeight: '800' },
                        item.currentMonth && isToday && !isSelected && { color: colors.primary, fontWeight: '800' }
                    ]}>
                        {item.day}
                    </Text>
                    {hasExam && (
                        <View style={[
                            styles.examIndicator,
                            { backgroundColor: isSelected ? '#fff' : colors.primary }
                        ]} />
                    )}
                </TouchableOpacity>
            );
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.monthYear, { color: colors.text }]}>
                        {MONTH_TITLES[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </Text>
                </View>
                <View style={styles.navButtons}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.weekDaysRow}>
                {DAYS_SHORT.map(day => (
                    <Text key={day} style={[styles.weekDayText, { color: colors.textSecondary }]}>
                        {day}
                    </Text>
                ))}
            </View>

            <View style={styles.daysGrid}>
                {(() => {
                    const allDays = renderDays();
                    const rows = [];
                    for (let i = 0; i < allDays.length; i += 7) {
                        rows.push(
                            <View key={i} style={styles.weekRow}>
                                {allDays.slice(i, i + 7)}
                            </View>
                        );
                    }
                    return rows;
                })()}
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 12,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    monthYear: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    navButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    navBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekDaysRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        opacity: 0.5,
    },
    daysGrid: {
        width: '100%',
    },
    weekRow: {
        flexDirection: 'row',
        width: '100%',
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1.1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginVertical: 1,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '500',
    },
    examIndicator: {
        position: 'absolute',
        bottom: 4,
        width: 3,
        height: 3,
        borderRadius: 1.5,
    }
});
