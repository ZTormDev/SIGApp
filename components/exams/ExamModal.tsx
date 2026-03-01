import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../utils/ThemeContext';
import { Exam } from '../../utils/storage';

interface ExamModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (exam: Exam) => void;
    initialDate: string;
    existingExam?: Exam | null;
    subjects: string[];
}

const EXAM_TYPES = ['Certamen', 'Control', 'Tarea', 'Otro'];
const ITEM_HEIGHT = 50; // A bit taller for better feel

// Data with padding for the wheel effect
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PADDED_HOURS = ["", "", ...HOURS, "", ""];
const PADDED_MINUTES = ["", "", ...MINUTES, "", ""];

export function ExamModal({ visible, onClose, onSave, initialDate, existingExam, subjects }: ExamModalProps) {
    const { colors, theme } = useTheme();
    const [subject, setSubject] = useState('');
    const [room, setRoom] = useState('');
    const [type, setType] = useState<Exam['type']>('Certamen');
    const [notes, setNotes] = useState('');

    // Modern Time Picker States
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedHour, setSelectedHour] = useState('08');
    const [selectedMinute, setSelectedMinute] = useState('30');

    // Subject Picker States
    const [showSubjectPicker, setShowSubjectPicker] = useState(false);

    useEffect(() => {
        if (existingExam) {
            setSubject(existingExam.subject);
            setRoom(existingExam.room);
            setType(existingExam.type);
            setNotes(existingExam.notes || '');

            const [h, m] = existingExam.time.split(':');
            setSelectedHour(h || '08');
            setSelectedMinute(m || '30');
        } else {
            setSubject(subjects[0] || '');
            setSelectedHour('08');
            setSelectedMinute('30');
            setRoom('');
            setType('Certamen');
            setNotes('');
        }
    }, [existingExam, visible, subjects]);

    const handleSave = () => {
        if (!subject) {
            Alert.alert("Faltan datos", "Por favor selecciona una asignatura.");
            return;
        }
        if (!room.trim()) {
            Alert.alert("Faltan datos", "La sala es obligatoria.");
            return;
        }

        const exam: Exam = {
            id: existingExam?.id || Math.random().toString(36).substr(2, 9),
            subject: subject,
            date: initialDate,
            time: `${selectedHour}:${selectedMinute}`,
            room: room.trim(),
            type,
            notes: notes.trim()
        };
        onSave(exam);
    };

    const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.y;
        const index = Math.round(offset / ITEM_HEIGHT);
        if (HOURS[index]) setSelectedHour(HOURS[index]);
    };

    const handleMinuteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = event.nativeEvent.contentOffset.y;
        const index = Math.round(offset / ITEM_HEIGHT);
        if (MINUTES[index]) setSelectedMinute(MINUTES[index]);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />

                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {existingExam ? 'Editar Evaluación' : 'Nueva Evaluación'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Asignatura</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }]}
                                onPress={() => setShowSubjectPicker(true)}
                            >
                                <Text style={{ color: subject ? colors.text : colors.textSecondary + '88', fontSize: 16 }}>
                                    {subject || "Seleccionar asignatura..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ position: 'absolute', right: 16 }} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Hora</Text>
                                <TouchableOpacity
                                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, justifyContent: 'center' }]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Text style={{ color: colors.text, fontSize: 16 }}>
                                        {selectedHour}:{selectedMinute}
                                    </Text>
                                    <Ionicons name="time-outline" size={20} color={colors.textSecondary} style={{ position: 'absolute', right: 16 }} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Sala *</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Eje: B221"
                                    placeholderTextColor={colors.textSecondary + '88'}
                                    value={room}
                                    onChangeText={setRoom}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo</Text>
                            <View style={styles.typeContainer}>
                                {EXAM_TYPES.map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setType(t as Exam['type'])}
                                        style={[
                                            styles.typeChip,
                                            { backgroundColor: colors.background, borderColor: colors.border },
                                            type === t && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.typeChipText,
                                            { color: colors.textSecondary },
                                            type === t && { color: '#fff', fontWeight: '700' }
                                        ]}>
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Notas (opcional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="Temas a estudiar, materiales, etc."
                                placeholderTextColor={colors.textSecondary + '88'}
                                multiline
                                numberOfLines={3}
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveBtnText}>Guardar Evaluación</Text>
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>

                {/* Subject Picker Overlay */}
                <Modal visible={showSubjectPicker} transparent animationType="fade">
                    <TouchableOpacity
                        style={styles.pickerOverlay}
                        activeOpacity={1}
                        onPress={() => setShowSubjectPicker(false)}
                    >
                        <View style={[styles.pickerContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.pickerHeader}>
                                <Text style={[styles.pickerTitle, { color: colors.text }]}>Seleccionar Asignatura</Text>
                                <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={subjects}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.subjectItem, { borderBottomColor: colors.border }]}
                                        onPress={() => {
                                            setSubject(item);
                                            setShowSubjectPicker(false);
                                        }}
                                    >
                                        <Text style={[styles.subjectItemText, { color: colors.text }, subject === item && { color: colors.primary, fontWeight: '700' }]}>
                                            {item}
                                        </Text>
                                        {subject === item && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>No hay asignaturas en tu horario.</Text>
                                }
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Modern Wheel Time Picker Overlay */}
                <Modal visible={showTimePicker} transparent animationType="fade">
                    <View style={styles.pickerOverlay}>
                        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowTimePicker(false)} />

                        <View style={[styles.wheelPickerContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.pickerHeader}>
                                <Text style={[styles.pickerTitle, { color: colors.text }]}>Seleccionar Hora</Text>
                            </View>

                            <View style={styles.wheelContainer}>
                                {/* Highlight Center Area */}
                                <View style={[styles.highlightArea, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '10' }]} />

                                <View style={styles.wheelRow}>
                                    {/* Hours Wheel */}
                                    <View style={styles.wheelColumn}>
                                        <FlatList
                                            data={PADDED_HOURS}
                                            keyExtractor={(_, i) => `h-${i}`}
                                            showsVerticalScrollIndicator={false}
                                            renderItem={({ item }) => (
                                                <View style={styles.wheelItem}>
                                                    <Text style={[
                                                        styles.wheelItemText,
                                                        { color: colors.textSecondary },
                                                        selectedHour === item && { color: colors.primary, fontWeight: '900', fontSize: 28 }
                                                    ]}>
                                                        {item}
                                                    </Text>
                                                </View>
                                            )}
                                            getItemLayout={(_, index) => ({
                                                length: ITEM_HEIGHT,
                                                offset: ITEM_HEIGHT * index,
                                                index,
                                            })}
                                            initialScrollIndex={HOURS.indexOf(selectedHour)}
                                            snapToInterval={ITEM_HEIGHT}
                                            onMomentumScrollEnd={handleHourScroll}
                                            decelerationRate="fast"
                                        />
                                    </View>

                                    <Text style={[styles.wheelSeparator, { color: colors.text }]}>:</Text>

                                    {/* Minutes Wheel */}
                                    <View style={styles.wheelColumn}>
                                        <FlatList
                                            data={PADDED_MINUTES}
                                            keyExtractor={(_, i) => `m-${i}`}
                                            showsVerticalScrollIndicator={false}
                                            renderItem={({ item }) => (
                                                <View style={styles.wheelItem}>
                                                    <Text style={[
                                                        styles.wheelItemText,
                                                        { color: colors.textSecondary },
                                                        selectedMinute === item && { color: colors.primary, fontWeight: '900', fontSize: 28 }
                                                    ]}>
                                                        {item}
                                                    </Text>
                                                </View>
                                            )}
                                            getItemLayout={(_, index) => ({
                                                length: ITEM_HEIGHT,
                                                offset: ITEM_HEIGHT * index,
                                                index,
                                            })}
                                            initialScrollIndex={MINUTES.indexOf(selectedMinute)}
                                            snapToInterval={ITEM_HEIGHT}
                                            onMomentumScrollEnd={handleMinuteScroll}
                                            decelerationRate="fast"
                                        />
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
                                onPress={() => setShowTimePicker(false)}
                            >
                                <Text style={styles.confirmBtnText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        height: 100,
        paddingTop: 14,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    typeChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    saveBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerContent: {
        width: '100%',
        maxHeight: '70%',
        borderRadius: 24,
        padding: 20,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    subjectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    subjectItemText: {
        fontSize: 16,
        flex: 1,
    },

    // Wheel Picker Styles
    wheelPickerContent: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
    },
    wheelContainer: {
        height: ITEM_HEIGHT * 5,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    highlightArea: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
    },
    wheelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    wheelColumn: {
        width: 80,
        height: '100%',
    },
    wheelItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelItemText: {
        fontSize: 22,
        fontWeight: '500',
    },
    wheelSeparator: {
        fontSize: 32,
        fontWeight: '800',
        marginHorizontal: 15,
        marginBottom: 4,
    },
    confirmBtn: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    }
});
