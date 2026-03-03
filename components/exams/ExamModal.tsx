import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Animated as RNAnimated,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { initNotifications } from "../../utils/notifications";
import { Exam } from "../../utils/storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedPressable = RNAnimated.createAnimatedComponent(Pressable);

interface ExamModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (exam: Exam) => void | Promise<void>;
  initialDate: string;
  existingExam?: Exam | null;
  subjects: string[];
}

const EXAM_TYPES = ["Certamen", "Control", "Tarea", "Otro"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

export function ExamModal({
  visible,
  onClose,
  onSave,
  initialDate,
  existingExam,
  subjects,
}: ExamModalProps) {
  const { colors, theme } = useTheme();
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState("");
  const [type, setType] = useState<Exam["type"]>("Certamen");
  const [notes, setNotes] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modern Time Picker States
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("30");
  const [activeMode, setActiveMode] = useState<"hour" | "minute">("hour");

  // Subject Picker States
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  // Manual Animations
  const translateY = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new RNAnimated.Value(0)).current;
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      RNAnimated.parallel([
        RNAnimated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 0,
        }),
        RNAnimated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
      initNotifications();
    } else {
      RNAnimated.parallel([
        RNAnimated.spring(translateY, {
          toValue: SCREEN_HEIGHT,
          useNativeDriver: true,
          speed: 12,
          bounciness: 0,
        }),
        RNAnimated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start((result) => {
        if (result.finished) {
          setIsRendering(false);
        }
      });
    }
  }, [visible, translateY, opacity]);

  useEffect(() => {
    if (existingExam) {
      setSubject(existingExam.subject);
      setRoom(existingExam.room);
      setType(existingExam.type);
      setNotes(existingExam.notes || "");
      setNotificationsEnabled(existingExam.notificationsEnabled ?? true);

      const [h, m] = existingExam.time.split(":");
      setSelectedHour(h || "08");
      setSelectedMinute(m || "30");
    } else {
      setSubject(subjects[0] || "");
      setSelectedHour("08");
      setSelectedMinute("30");
      setRoom("");
      setType("Certamen");
      setNotes("");
      setNotificationsEnabled(true);
    }
  }, [existingExam, subjects, visible]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!subject) {
      Alert.alert("Faltan datos", "Por favor selecciona una asignatura.");
      return;
    }

    const exam: Exam = {
      id: existingExam?.id || Math.random().toString(36).substr(2, 9),
      subject: subject,
      date: initialDate,
      time: `${selectedHour}:${selectedMinute}`,
      room: room.trim(),
      type,
      notes: notes.trim(),
      notificationsEnabled: notificationsEnabled,
    };

    setIsSaving(true);
    try {
      await onSave(exam);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isRendering && !visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
      <AnimatedPressable
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.4)", opacity },
        ]}
        onPress={onClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
        pointerEvents="box-none"
      >
        <RNAnimated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, transform: [{ translateY }] },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {existingExam ? "Editar Evaluación" : "Nueva Evaluación"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.background }]}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!showSubjectPicker && !showTimePicker}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Asignatura *
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    justifyContent: "center",
                    height: "auto",
                    paddingVertical: 12,
                  },
                ]}
                onPress={() => setShowSubjectPicker(true)}
              >
                <Text
                  style={{
                    color: subject ? colors.text : colors.textSecondary + "88",
                    fontSize: 16,
                    width: "80%",
                  }}
                >
                  {subject || "Seleccionar asignatura..."}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                  style={{ position: "absolute", right: 16 }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Hora
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      justifyContent: "center",
                    },
                  ]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    {selectedHour}:{selectedMinute}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.textSecondary}
                    style={{ position: "absolute", right: 16 }}
                  />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Sala
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Eje: B221"
                  placeholderTextColor={colors.textSecondary + "88"}
                  value={room}
                  onChangeText={setRoom}
                />
              </View>
            </View>

            <View
              style={[
                styles.inputGroup,
                styles.notificationRow,
                theme === "dark"
                  ? { backgroundColor: colors.background }
                  : { backgroundColor: "rgba(0, 0, 0, 0.02)" },
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.label,
                    { color: colors.textSecondary, marginBottom: 0 },
                  ]}
                >
                  Notificaciones
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  Alertas: 7d, 3d, 1d y 1h antes
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={
                  notificationsEnabled ? colors.primary : colors.textSecondary
                }
                ios_backgroundColor={colors.border}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Tipo
              </Text>
              <View style={styles.typeContainer}>
                {EXAM_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t as Exam["type"])}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                      type === t && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: colors.textSecondary },
                        type === t && { color: "#fff", fontWeight: "700" },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Notas (opcional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Temas a estudiar, materiales, etc."
                placeholderTextColor={colors.textSecondary + "88"}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary },
                isSaving && { opacity: 0.7 },
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.saveBtnText}>Guardando...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Guardar Evaluación</Text>
              )}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </RNAnimated.View>
      </KeyboardAvoidingView>

      {/* Subject Picker Overlay */}
      <Modal
        visible={showSubjectPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
              backgroundColor: "rgba(0,0,0,0.6)",
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowSubjectPicker(false)}
          />
          <View
            style={[styles.pickerContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                Seleccionar Asignatura
              </Text>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ maxHeight: 350 }}>
              {subjects.length === 0 ? (
                <Text
                  style={{
                    textAlign: "center",
                    paddingVertical: 20,
                    color: colors.textSecondary,
                  }}
                >
                  No hay asignaturas en tu horario.
                </Text>
              ) : (
                <ScrollView
                  nestedScrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {subjects.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.subjectItem,
                        { borderBottomColor: colors.border },
                      ]}
                      onPress={() => {
                        setSubject(item);
                        setShowSubjectPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.subjectItemText,
                          { color: colors.text },
                          subject === item && {
                            color: colors.primary,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {item}
                      </Text>
                      {subject === item && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={colors.primary}
                          style={{ position: "absolute", right: 20 }}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Premium Modern Time Picker Overlay */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
              backgroundColor: "rgba(0,0,0,0.7)",
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowTimePicker(false)}
          />
          <View
            style={[
              styles.modernPickerContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                Seleccionar Hora
              </Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Large Digital Display */}
            <View style={styles.displayContainer}>
              <TouchableOpacity
                style={[
                  styles.displayCard,
                  activeMode === "hour" && {
                    backgroundColor:
                      theme === "dark"
                        ? colors.primary + "30"
                        : colors.primary + "15",
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveMode("hour")}
              >
                <Text
                  style={[
                    styles.displayText,
                    {
                      color:
                        activeMode === "hour" ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {selectedHour}
                </Text>
                <Text
                  style={[
                    styles.displayLabel,
                    {
                      color:
                        activeMode === "hour"
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  HORA
                </Text>
              </TouchableOpacity>

              <Text style={[styles.displaySeparator, { color: colors.border }]}>
                :
              </Text>

              <TouchableOpacity
                style={[
                  styles.displayCard,
                  activeMode === "minute" && {
                    backgroundColor:
                      theme === "dark"
                        ? colors.primary + "30"
                        : colors.primary + "15",
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveMode("minute")}
              >
                <Text
                  style={[
                    styles.displayText,
                    {
                      color:
                        activeMode === "minute" ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {selectedMinute}
                </Text>
                <Text
                  style={[
                    styles.displayLabel,
                    {
                      color:
                        activeMode === "minute"
                          ? colors.primary
                          : colors.textSecondary,
                    },
                  ]}
                >
                  MINUTO
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector Grid */}
            <View style={styles.gridContainer}>
              {activeMode === "hour" ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.gridContent}
                >
                  <View style={styles.gridRow}>
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.gridItem,
                          selectedHour === h && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() => {
                          setSelectedHour(h);
                          setActiveMode("minute");
                        }}
                      >
                        <Text
                          style={[
                            styles.gridItemText,
                            {
                              color: selectedHour === h ? "#fff" : colors.text,
                            },
                          ]}
                        >
                          {h}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.gridContent}>
                  <View style={styles.gridRow}>
                    {/* Quick select minutes + 00 */}
                    {[
                      "00",
                      "05",
                      "10",
                      "15",
                      "20",
                      "25",
                      "30",
                      "35",
                      "40",
                      "45",
                      "50",
                      "55",
                    ].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.gridItem,
                          selectedMinute === m && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() => setSelectedMinute(m)}
                      >
                        <Text
                          style={[
                            styles.gridItemText,
                            {
                              color:
                                selectedMinute === m ? "#fff" : colors.text,
                            },
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.minuteFineAdjust}>
                    <TouchableOpacity
                      style={[
                        styles.adjustBtn,
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => {
                        const current = parseInt(selectedMinute);
                        setSelectedMinute(
                          Math.max(0, current - 1)
                            .toString()
                            .padStart(2, "0"),
                        );
                      }}
                    >
                      <Ionicons name="remove" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text
                      style={[styles.fineText, { color: colors.textSecondary }]}
                    >
                      Ajuste fino
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.adjustBtn,
                        { backgroundColor: colors.background },
                      ]}
                      onPress={() => {
                        const current = parseInt(selectedMinute);
                        setSelectedMinute(
                          Math.min(59, current + 1)
                            .toString()
                            .padStart(2, "0"),
                        );
                      }}
                    >
                      <Ionicons name="add" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.confirmBtnText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "85%",
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
  },
  notificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
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
    textAlignVertical: "top",
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    fontWeight: "500",
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  pickerContent: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: 24,
    padding: 20,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  subjectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  subjectItemText: {
    fontSize: 16,
    width: "80%",
  },
  modernPickerContainer: {
    width: "100%",
    borderRadius: 32,
    padding: 24,
    maxHeight: "80%",
  },
  displayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    gap: 12,
  },
  displayCard: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  displayText: {
    fontSize: 36,
    fontWeight: "800",
  },
  displayLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  displaySeparator: {
    fontSize: 40,
    fontWeight: "300",
  },
  gridContainer: {
    height: 280,
    marginBottom: 20,
  },
  gridContent: {
    paddingBottom: 10,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  gridItem: {
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  gridItemText: {
    fontSize: 17,
    fontWeight: "700",
  },
  minuteFineAdjust: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 20,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fineText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  confirmBtn: {
    height: 56,
    width: "100%",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
