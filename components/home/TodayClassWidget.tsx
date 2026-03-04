import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FULL_DAYS, TIME_BLOCKS } from "../../utils/scheduleConstants";
import { useTheme } from "../../utils/ThemeContext";

interface ClassInfo {
  title: string;
  subject: string;
  room: string;
  type: string;
  professor?: string;
  blockLabel: string;
  timeRange: string;
  blockStart: string;
  blockEnd: string;
}

interface WidgetState {
  current: ClassInfo | null;
  next: ClassInfo | null;
  nextDayLabel: string | null;
  noClassMessage: string | null;
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutes(mins: number): string {
  if (mins < 1) return "menos de 1 min";
  if (mins < 60) return `${Math.floor(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getClassNameFromTitle(title: string): string {
  const parts = title.split(" - ");
  if (parts.length >= 2) {
    return parts
      .slice(1)
      .join(" - ")
      .replace(/\s*\(.*\)\s*$/, "")
      .trim();
  }
  return title.split(" ")[0] || "Clase";
}

function extractClasses(schedule: any[][], dayIndex: number): ClassInfo[] {
  if (dayIndex < 0 || dayIndex > 5) return [];
  const classes: ClassInfo[] = [];
  for (let i = 0; i < TIME_BLOCKS.length && i < schedule.length; i++) {
    const cell = schedule[i]?.[dayIndex];
    const block = TIME_BLOCKS[i];
    if (
      cell &&
      cell.isFilled &&
      cell.title &&
      cell.title !== "" &&
      cell.type !== "Tope"
    ) {
      classes.push({
        title: cell.title,
        subject: cell.subject || "",
        room: cell.room || "",
        type: cell.type || "",
        professor: cell.professor,
        blockLabel: block.label,
        timeRange: `${block.start} - ${block.end}`,
        blockStart: block.start,
        blockEnd: block.end,
      });
    }
  }
  return classes;
}

function computeState(schedule: any[][]): WidgetState {
  const now = new Date();
  const dayIndex = now.getDay() - 1;
  const nowMins = now.getHours() * 60 + now.getMinutes();

  if (dayIndex === -1) {
    const monClasses = extractClasses(schedule, 0);
    if (monClasses.length > 0) {
      return {
        current: null,
        next: monClasses[0],
        nextDayLabel: "mañana (Lunes)",
        noClassMessage: "¡Hoy es domingo!",
      };
    }
    return {
      current: null,
      next: null,
      nextDayLabel: null,
      noClassMessage: "¡Disfruta tu fin de semana! 🎉",
    };
  }

  const todayClasses = extractClasses(schedule, dayIndex);

  if (todayClasses.length === 0) {
    return findNextDayClasses(schedule, dayIndex, "¡No tienes clases hoy! 🎉");
  }

  let current: ClassInfo | null = null;
  let next: ClassInfo | null = null;

  for (const cls of todayClasses) {
    const start = parseTime(cls.blockStart);
    const end = parseTime(cls.blockEnd);

    if (nowMins >= start && nowMins <= end) {
      current = cls;
    } else if (nowMins < start && !next) {
      next = cls;
    }
  }

  if (current) {
    if (!next) {
      for (const cls of todayClasses) {
        if (parseTime(cls.blockStart) > parseTime(current.blockEnd)) {
          next = cls;
          break;
        }
      }
    }
    return { current, next, nextDayLabel: null, noClassMessage: null };
  }

  if (next) {
    return { current: null, next, nextDayLabel: null, noClassMessage: null };
  }

  return findNextDayClasses(schedule, dayIndex, "No tienes más clases hoy.");
}

function findNextDayClasses(
  schedule: any[][],
  currentDayIndex: number,
  baseMessage: string,
): WidgetState {
  for (let offset = 1; offset <= 6; offset++) {
    let nextDay = currentDayIndex + offset;
    if (nextDay > 5) nextDay = nextDay - 6;

    const classes = extractClasses(schedule, nextDay);
    if (classes.length > 0) {
      const dayLabel =
        offset === 1
          ? `mañana (${FULL_DAYS[nextDay]})`
          : `el ${FULL_DAYS[nextDay]}`;
      return {
        current: null,
        next: classes[0],
        nextDayLabel: dayLabel,
        noClassMessage: baseMessage,
      };
    }
  }
  return {
    current: null,
    next: null,
    nextDayLabel: null,
    noClassMessage: baseMessage,
  };
}

function ProgressBar({
  progress,
  colors,
  theme,
}: {
  progress: number;
  colors: any;
  theme: string;
}) {
  return (
    <View
      style={[
        styles.progressTrack,
        {
          backgroundColor:
            theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            backgroundColor: colors.primary,
          },
        ]}
      />
    </View>
  );
}

function ClassCard({
  cls,
  label,
  colors,
  theme,
  timeInfo,
  progress,
  isCompact = false,
}: {
  cls: ClassInfo;
  label: string;
  colors: any;
  theme: string;
  timeInfo?: string;
  progress?: number;
  isCompact?: boolean;
}) {
  const isActive = label === "En clase ahora";
  return (
    <View style={isCompact ? styles.compactCard : undefined}>
      <View style={styles.cardLabelRow}>
        <Ionicons
          name={isActive ? "radio-button-on" : "time-outline"}
          size={14}
          color={isActive ? "#4CAF50" : colors.textSecondary}
        />
        <Text
          style={[
            styles.cardLabel,
            { color: isActive ? "#4CAF50" : colors.textSecondary },
          ]}
        >
          {label}
        </Text>
        {timeInfo && (
          <Text style={[styles.timeInfoText, { color: colors.primary }]}>
            {timeInfo}
          </Text>
        )}
      </View>

      <Text
        style={[
          isCompact ? styles.classNameCompact : styles.className,
          { color: colors.text },
        ]}
        numberOfLines={1}
      >
        {getClassNameFromTitle(cls.title)}
      </Text>

      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} colors={colors} theme={theme} />
        </View>
      )}

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Ionicons
            name="location-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {cls.room || "Sin sala"}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons
            name="time-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {cls.timeRange}
          </Text>
        </View>
        <View
          style={[
            styles.blockBadge,
            {
              backgroundColor:
                theme === "dark"
                  ? "rgba(0,56,118,0.25)"
                  : "rgba(0,56,118,0.08)",
            },
          ]}
        >
          <Text style={[styles.blockBadgeText, { color: colors.primary }]}>
            B{cls.blockLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function TodayClassWidget({ schedule }: { schedule: any[][] | null }) {
  const { colors, theme } = useTheme();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const state = useMemo(() => {
    if (!schedule) return null;
    return computeState(schedule);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule, tick]);

  if (!state) return null;

  let progress: number | undefined;
  let currentTimeInfo: string | undefined;
  let nextTimeInfo: string | undefined;

  if (state.current) {
    const now = new Date();
    const nowMins =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const start = parseTime(state.current.blockStart);
    const end = parseTime(state.current.blockEnd);
    const total = end - start;
    const elapsed = nowMins - start;
    progress = total > 0 ? elapsed / total : 0;
    const remaining = Math.max(0, end - nowMins);
    currentTimeInfo = `${formatMinutes(remaining)} restantes`;
  }

  if (state.next && !state.nextDayLabel) {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const start = parseTime(state.next.blockStart);
    const diff = start - nowMins;
    if (diff > 0) {
      nextTimeInfo = `en ${formatMinutes(diff)}`;
    }
  }

  const hasAnything = state.current || state.next;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.cardShadow,
          borderColor: colors.border,
          borderWidth: theme === "dark" ? 1 : 0,
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name={
            state.current
              ? "school"
              : hasAnything
                ? "calendar"
                : "calendar-clear"
          }
          size={18}
          color={colors.primary}
        />
        <Text style={[styles.headerTitle, { color: colors.primary }]}>
          {state.current ? "Tu Clase" : hasAnything ? "Próxima Clase" : "Hoy"}
        </Text>
      </View>

      {state.current && (
        <ClassCard
          cls={state.current}
          label="En clase ahora"
          colors={colors}
          theme={theme}
          timeInfo={currentTimeInfo}
          progress={progress}
        />
      )}

      {state.next && !state.nextDayLabel && (
        <>
          {state.current && (
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />
          )}
          <ClassCard
            cls={state.next}
            label={state.current ? "Siguiente" : "Próxima clase"}
            colors={colors}
            theme={theme}
            timeInfo={nextTimeInfo}
            isCompact={!!state.current}
          />
        </>
      )}

      {state.next && state.nextDayLabel && (
        <>
          {state.noClassMessage && (
            <Text
              style={[
                styles.noClassText,
                { color: colors.textSecondary, marginBottom: 10 },
              ]}
            >
              {state.noClassMessage}
            </Text>
          )}
          <View
            style={[
              styles.nextDayBanner,
              {
                backgroundColor:
                  theme === "dark"
                    ? "rgba(0,56,118,0.15)"
                    : "rgba(0,56,118,0.05)",
                borderColor:
                  theme === "dark"
                    ? "rgba(0,56,118,0.3)"
                    : "rgba(0,56,118,0.12)",
              },
            ]}
          >
            <Ionicons
              name="arrow-forward-circle-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.nextDayText, { color: colors.primary }]}>
              Primera clase {state.nextDayLabel}
            </Text>
          </View>
          <ClassCard
            cls={state.next}
            label={state.nextDayLabel}
            colors={colors}
            theme={theme}
            isCompact
          />
        </>
      )}

      {!hasAnything && state.noClassMessage && (
        <View style={styles.noClassContent}>
          <Text style={styles.noClassEmoji}>📚</Text>
          <Text style={[styles.noClassText, { color: colors.textSecondary }]}>
            {state.noClassMessage}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  timeInfoText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: "auto",
  },
  className: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  classNameCompact: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 3,
  },
  blockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  blockBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  compactCard: {},
  nextDayBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  nextDayText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  noClassContent: {
    alignItems: "center",
    paddingVertical: 8,
  },
  noClassEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  noClassText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
});
