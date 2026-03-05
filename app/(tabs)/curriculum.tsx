import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../utils/ThemeContext";
import { CurriculumData } from "../../utils/curriculumParser";
import { getCurriculum, getSchedule } from "../../utils/storage";

const { width: screenWidth } = Dimensions.get("window");

const SEMESTER_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ef4444", // red
  "#10b981", // emerald
  "#ec4899", // pink
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
];

export default function CurriculumScreen() {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";

  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSemester, setExpandedSemester] = useState<number | null>(null);
  const [passedSubjects, setPassedSubjects] = useState<Set<string>>(new Set());

  const progressAnim = useSharedValue(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getCurriculum();
      if (data && data.semesters) {
        setCurriculum(data);
        await loadCurrentSubjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSubjects = async () => {
    const schedule = await getSchedule();
    if (schedule) {
      const currentSiglas = new Set<string>();
      for (const row of schedule) {
        for (const cell of row) {
          if (cell && cell.isFilled && cell.title) {
            const match = cell.title.match(/^([A-Z]{2,}\d+(?:-[A-Z0-9]+)?)/);
            if (match) currentSiglas.add(match[1]);
          }
        }
      }
      setPassedSubjects(currentSiglas);
    }
  };

  const progress = useMemo(() => {
    if (!curriculum || !curriculum.semesters)
      return {
        passed: 0,
        total: 0,
        percentage: 0,
        credits: 0,
        totalCredits: 0,
      };

    let total = 0;
    let inProgress = 0;
    let totalCredits = curriculum.totalCredits || 0;
    let earnedCredits = 0;

    for (const [_, subjects] of Object.entries(curriculum.semesters)) {
      for (const sub of subjects) {
        total++;
        if (passedSubjects.has(sub.sigla)) {
          inProgress++;
          earnedCredits += sub.credits;
        }
      }
    }

    if (totalCredits === 0) totalCredits = total * 5;

    return {
      passed: inProgress,
      total,
      percentage: total > 0 ? (inProgress / total) * 100 : 0,
      credits: earnedCredits,
      totalCredits,
    };
  }, [curriculum, passedSubjects]);

  useEffect(() => {
    if (!isLoading && curriculum) {
      progressAnim.value = withDelay(
        500,
        withTiming(progress.percentage / 100, {
          duration: 1500,
          easing: Easing.out(Easing.cubic),
        }),
      );
    }
  }, [isLoading, curriculum, progress.percentage]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%` as any,
  }));

  const toggleSemester = useCallback((sem: number) => {
    setExpandedSemester((prev) => (prev === sem ? null : sem));
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Cargando información...
        </Text>
      </SafeAreaView>
    );
  }

  if (
    !curriculum ||
    !curriculum.semesters ||
    Object.keys(curriculum.semesters).length === 0
  ) {
    return (
      <SafeAreaView
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons
          name="book-outline"
          size={64}
          color={isDark ? colors.border : "#ccc"}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Sin malla curricular
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          No se pudieron obtener los datos de la malla.{"\n"}Por favor, fuerza
          una actualización manual desde los ajustes.
        </Text>
      </SafeAreaView>
    );
  }

  const semesterNumbers = Object.keys(curriculum.semesters)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Malla Curricular
          </Text>
          {curriculum.career ? (
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {curriculum.career}
            </Text>
          ) : null}
        </Animated.View>

        {/* Progress Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={[
            styles.progressCard,
            {
              backgroundColor: isDark ? "#1a2332" : "#f0f4ff",
              borderColor: isDark
                ? "rgba(59, 130, 246, 0.2)"
                : "rgba(0, 56, 118, 0.1)",
            },
          ]}
        >
          {/* Main progress circle area */}
          <View style={styles.progressTopRow}>
            <View style={styles.progressCircleContainer}>
              <View
                style={[
                  styles.progressCircleBg,
                  {
                    borderColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <Text
                  style={[styles.progressPercentage, { color: colors.primary }]}
                >
                  {Math.round(progress.percentage)}%
                </Text>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Progreso
                </Text>
              </View>
            </View>

            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {progress.passed}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Cursando
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {progress.total}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Total Ramos
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {curriculum.totalSemesters}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Semestres
                </Text>
              </View>
            </View>
          </View>

          {/* Animated progress bar */}
          <View style={styles.progressBarSection}>
            <View style={styles.progressBarLabels}>
              <Text
                style={[
                  styles.progressBarLabelLeft,
                  { color: colors.textSecondary },
                ]}
              >
                Avance de carrera
              </Text>
              <Text
                style={[
                  styles.progressBarLabelRight,
                  { color: colors.primary },
                ]}
              >
                {progress.credits} / {progress.totalCredits} créditos SCT
              </Text>
            </View>
            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              <Animated.View style={[styles.progressFill, progressBarStyle]} />
            </View>
          </View>
        </Animated.View>

        {/* Semester List */}
        {semesterNumbers.map((semNum, index) => {
          const subjects = curriculum.semesters[semNum];
          const isExpanded = expandedSemester === semNum;
          const color = SEMESTER_COLORS[(semNum - 1) % SEMESTER_COLORS.length];
          const semCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

          return (
            <Animated.View
              key={semNum}
              entering={FadeInDown.delay(300 + index * 80).duration(400)}
            >
              {/* Semester header */}
              <TouchableOpacity
                onPress={() => toggleSemester(semNum)}
                activeOpacity={0.7}
                style={[
                  styles.semesterHeader,
                  {
                    backgroundColor: isDark ? colors.surface : "#fff",
                    borderColor: isDark ? colors.border : "#eee",
                    borderLeftColor: color,
                  },
                ]}
              >
                <View style={styles.semesterLeft}>
                  <View
                    style={[styles.semesterBadge, { backgroundColor: color }]}
                  >
                    <Text style={styles.semesterBadgeText}>{semNum}°</Text>
                  </View>
                  <View>
                    <Text
                      style={[styles.semesterTitle, { color: colors.text }]}
                    >
                      {semNum}° Semestre
                    </Text>
                    <Text
                      style={[
                        styles.semesterMeta,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {subjects.length} ramos · {semCredits} créditos SCT
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Subject list */}
              {isExpanded && (
                <View
                  style={[
                    styles.subjectList,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.01)",
                      borderColor: isDark ? colors.border : "#eee",
                    },
                  ]}
                >
                  {subjects.map((subject, sIdx) => {
                    const isCurrentlyTaking = passedSubjects.has(subject.sigla);
                    return (
                      <Animated.View
                        key={subject.sigla}
                        entering={FadeIn.delay(sIdx * 50).duration(300)}
                        style={[
                          styles.subjectCard,
                          {
                            backgroundColor: isDark ? colors.surface : "#fff",
                            borderColor: isCurrentlyTaking
                              ? color
                              : isDark
                                ? colors.border
                                : "#eee",
                            borderLeftColor: isCurrentlyTaking
                              ? color
                              : "transparent",
                            borderLeftWidth: isCurrentlyTaking ? 3 : 0,
                          },
                        ]}
                      >
                        <View style={styles.subjectTop}>
                          <View
                            style={[
                              styles.siglaBadge,
                              {
                                backgroundColor: isDark
                                  ? `${color}22`
                                  : `${color}12`,
                              },
                            ]}
                          >
                            <Text style={[styles.siglaText, { color }]}>
                              {subject.sigla}
                            </Text>
                          </View>
                          {isCurrentlyTaking && (
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: `${color}20` },
                              ]}
                            >
                              <View
                                style={[
                                  styles.statusDot,
                                  { backgroundColor: color },
                                ]}
                              />
                              <Text style={[styles.statusText, { color }]}>
                                Cursando
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={[styles.subjectName, { color: colors.text }]}
                        >
                          {subject.name.charAt(0) +
                            subject.name.slice(1).toLowerCase()}
                        </Text>

                        <View style={styles.subjectDetails}>
                          <View style={styles.detailChip}>
                            <Ionicons
                              name="ribbon-outline"
                              size={12}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.detailText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {subject.credits} SCT
                            </Text>
                          </View>
                          {subject.hoursTheory > 0 && (
                            <View style={styles.detailChip}>
                              <Ionicons
                                name="school-outline"
                                size={12}
                                color={colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.detailText,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {subject.hoursTheory}h Teo
                              </Text>
                            </View>
                          )}
                          {subject.hoursPractice > 0 && (
                            <View style={styles.detailChip}>
                              <Ionicons
                                name="code-outline"
                                size={12}
                                color={colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.detailText,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {subject.hoursPractice}h Prác
                              </Text>
                            </View>
                          )}
                          {subject.hoursLab > 0 && (
                            <View style={styles.detailChip}>
                              <Ionicons
                                name="flask-outline"
                                size={12}
                                color={colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.detailText,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {subject.hoursLab}h Lab
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.departmentText,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {subject.department}
                        </Text>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },

  progressCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  progressCircleContainer: {
    marginRight: 10,
  },
  progressCircleBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 26,
    fontWeight: "900",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: -2,
  },
  progressStats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
  },
  progressBarSection: {
    marginTop: 4,
  },
  progressBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressBarLabelLeft: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBarLabelRight: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },

  semesterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  semesterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  semesterBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  semesterBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  semesterMeta: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },

  subjectList: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    marginTop: -4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  subjectCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  subjectTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  siglaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  siglaText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  subjectName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    lineHeight: 20,
  },
  subjectDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    fontWeight: "600",
  },
  departmentText: {
    fontSize: 11,
    fontWeight: "500",
    fontStyle: "italic",
  },
});
