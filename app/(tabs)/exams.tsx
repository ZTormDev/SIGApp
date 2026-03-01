import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from '../../components/exams/Calendar';
import { ExamModal } from '../../components/exams/ExamModal';
import { cancelExamNotifications, scheduleExamNotifications } from '../../utils/notifications';
import { Exam, getExams, getSchedule, saveExams } from '../../utils/storage';
import { useTheme } from '../../utils/ThemeContext';

export default function ExamsScreen() {
    const { colors, theme } = useTheme();
    const [exams, setExams] = useState<Exam[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [storedExams, scheduleData] = await Promise.all([
            getExams(),
            getSchedule()
        ]);
        setExams(storedExams);

        if (scheduleData) {
            const subjectSet = new Set<string>();
            scheduleData.forEach((row: any[]) => {
                row.forEach((cell: any) => {
                    if (cell && cell.isFilled && cell.title && cell.type !== 'Tope') {
                        const parts = cell.title.split(' - ');
                        if (parts.length >= 2) {
                            const name = parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').trim();
                            if (name) subjectSet.add(name);
                        } else {
                            const simpleName = cell.title.split(' ')[0];
                            if (simpleName) subjectSet.add(simpleName);
                        }
                    }
                });
            });
            setSubjects(Array.from(subjectSet).sort());
        }
    }

    const examsDates = useMemo(() => {
        return Array.from(new Set(exams.map(e => e.date)));
    }, [exams]);

    const activeExams = useMemo(() => {
        return exams
            .filter(e => e.date === selectedDate)
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [exams, selectedDate]);

    const handleSaveExam = async (exam: Exam) => {
        let newExams;
        const exists = exams.find(e => e.id === exam.id);

        if (exists) {
            newExams = exams.map(e => e.id === exam.id ? exam : e);
        } else {
            newExams = [...exams, exam];
        }

        setExams(newExams);
        await saveExams(newExams);

        // Schedule notifications for the new/updated exam
        await scheduleExamNotifications(exam);

        setModalVisible(false);
        setEditingExam(null);
    };

    const handleDeleteExam = (id: string) => {
        Alert.alert(
            "Eliminar Evaluación",
            "¿Estás seguro de que quieres eliminar esta evaluación?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        const newExams = exams.filter(e => e.id !== id);
                        setExams(newExams);
                        await saveExams(newExams);

                        // Cancel any pending notifications for this exam
                        await cancelExamNotifications(id);
                    }
                }
            ]
        );
    };

    const handleEditExam = (exam: Exam) => {
        setEditingExam(exam);
        setModalVisible(true);
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid TZ issues
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
        const formatted = date.toLocaleDateString('es-ES', options);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const getTypeColor = (type: Exam['type']) => {
        switch (type) {
            case 'Certamen': return '#7C4DFF';
            case 'Control': return '#2979FF';
            case 'Tarea': return '#00C853';
            default: return '#FF9100';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />

            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Certámenes</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Gestiona tus evaluaciones</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        setEditingExam(null);
                        setModalVisible(true);
                    }}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(400).springify()}>
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        examsDates={examsDates}
                    />
                </Animated.View>

                <Animated.View
                    layout={Layout.springify()}
                    style={styles.sectionHeader}
                >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {formatDisplayDate(selectedDate)}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>
                            {activeExams.length} {activeExams.length === 1 ? 'evaluación' : 'evaluaciones'}
                        </Text>
                    </View>
                </Animated.View>

                <View style={styles.examsList}>
                    {activeExams.length === 0 ? (
                        <Animated.View
                            entering={FadeInUp.delay(200)}
                            style={styles.emptyState}
                        >
                            <View style={[styles.emptyIconContainer, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary + '44'} />
                            </View>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay evaluaciones para este día</Text>
                            <TouchableOpacity
                                style={[styles.emptyAddBtn, { borderColor: colors.primary }]}
                                onPress={() => {
                                    setEditingExam(null);
                                    setModalVisible(true);
                                }}
                            >
                                <Text style={[styles.emptyAddBtnText, { color: colors.primary }]}>Programar evaluación</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        activeExams.map((exam, index) => (
                            <Animated.View
                                key={exam.id}
                                entering={FadeInDown.delay(index * 100).springify()}
                                style={[styles.examCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            >
                                <View style={[styles.typeAccent, { backgroundColor: getTypeColor(exam.type) }]} />
                                <View style={styles.examCardContent}>
                                    <View style={styles.examTopRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.examSubject, { color: colors.text }]} numberOfLines={1}>
                                                {exam.subject}
                                            </Text>
                                            <Text style={[styles.examType, { color: getTypeColor(exam.type) }]}>
                                                {exam.type}
                                            </Text>
                                        </View>
                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity onPress={() => handleEditExam(exam)} style={styles.actionBtn}>
                                                <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDeleteExam(exam.id)} style={styles.actionBtn}>
                                                <Ionicons name="trash-outline" size={18} color="#FF5252" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.examDetails}>
                                        <View style={styles.detailItem}>
                                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{exam.time}</Text>
                                        </View>
                                        {exam.room ? (
                                            <View style={styles.detailItem}>
                                                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                                                <Text style={[styles.detailText, { color: colors.textSecondary }]}>{exam.room}</Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    {exam.notes ? (
                                        <Text style={[styles.examNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                                            {exam.notes}
                                        </Text>
                                    ) : null}
                                </View>
                            </Animated.View>
                        ))
                    )}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            <ExamModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setEditingExam(null);
                }}
                onSave={handleSaveExam}
                initialDate={selectedDate}
                existingExam={editingExam}
                subjects={subjects}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: 32,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    examsList: {
        paddingHorizontal: 20,
    },
    examCard: {
        flexDirection: 'row',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    typeAccent: {
        width: 6,
    },
    examCardContent: {
        flex: 1,
        padding: 16,
    },
    examTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    examSubject: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    examType: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        padding: 4,
    },
    examDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 13,
        fontWeight: '500',
    },
    examNotes: {
        fontSize: 13,
        lineHeight: 18,
        opacity: 0.8,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 20,
        textAlign: 'center',
    },
    emptyAddBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    emptyAddBtnText: {
        fontSize: 15,
        fontWeight: '700',
    }
});
