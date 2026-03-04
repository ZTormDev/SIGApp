import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { TodayClassWidget } from "../../components/home/TodayClassWidget";
import { ScheduleModal } from "../../components/schedule/ScheduleModal";
import {
  DAYS,
  DEMO_DATA,
  SelectedBlock,
  SUBJECT_COLORS,
  TIME_BLOCKS,
  TOPE_COLOR,
} from "../../utils/scheduleConstants";
import { getSchedule } from "../../utils/storage";
import { useTheme } from "../../utils/ThemeContext";

const screenWidth = Dimensions.get("window").width;

export default function ScheduleScreen() {
  const [scheduleData, setScheduleData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(
    null,
  );
  const { colors, theme } = useTheme();
  const scheduleRef = useRef<ViewShot>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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
    const map: Record<string, (typeof SUBJECT_COLORS)[0] & { name: string }> =
      {};
    let colorIdx = 0;
    for (const row of scheduleData) {
      for (const cell of row) {
        if (cell && cell.isFilled && cell.title) {
          const key =
            cell.subject || cell.title.split(" ")[0].replace(/[^A-Z0-9]/gi, "");
          if (key && !map[key] && cell.type !== "Tope") {
            let name = key;
            const parts = cell.title.split(" - ");
            if (parts.length >= 2) {
              const extracted = parts
                .slice(1)
                .join(" - ")
                .replace(/\s*\(.*\)\s*$/, "")
                .trim();
              if (extracted && !/^\d+$/.test(extracted)) {
                name = extracted;
              }
            }
            map[key] = {
              ...SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length],
              name,
            };
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
        if (cell && cell.isFilled && cell.title && cell.type !== "Tope") {
          const t = cell.title || "";
          const codeMatch = t.match(/^([A-Z]{2,}\d+)/);
          if (codeMatch) {
            const code = codeMatch[1];
            if (!map[code]) {
              const parts = t.split(" - ");
              if (parts.length >= 2) {
                const extracted = parts
                  .slice(1)
                  .join(" - ")
                  .replace(/\s*\(.*\)\s*$/, "")
                  .trim();
                if (extracted && !/^\d+$/.test(extracted)) {
                  map[code] = extracted;
                }
              }
              if (
                !map[code] &&
                cell.subject &&
                cell.subject !== code &&
                !/^\d+$/.test(cell.subject)
              ) {
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
    if (cell.type === "Tope" || cell.title?.includes("TOPE")) return TOPE_COLOR;
    const key =
      cell.subject ||
      cell.title?.split(" ")[0]?.replace(/[^A-Z0-9]/gi, "") ||
      "";
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
        if (cell && cell.isFilled && cell.subject && cell.type !== "Tope") {
          let span = 1;
          while (row + span < numRows) {
            const nextCell = scheduleData[row + span]?.[col];
            if (
              nextCell &&
              nextCell.isFilled &&
              nextCell.subject === cell.subject &&
              nextCell.type !== "Tope"
            ) {
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

  const handleCellPress = (
    cell: any,
    rowIndex: number,
    colIndex: number,
    span: number = 1,
  ) => {
    if (!cell || !cell.isFilled) return;
    const color = getColorForCell(cell);
    if (!color) return;
    setSelectedBlock({ cell, rowIndex, colIndex, color, span });
  };

  const captureSchedule = useCallback(async (): Promise<string | null> => {
    if (!scheduleRef.current || !scheduleRef.current.capture) return null;
    setIsCapturing(true);
    try {
      const uri = await scheduleRef.current.capture();
      return uri;
    } catch (error) {
      console.error('Error capturing schedule:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleShareImage = useCallback(async () => {
    const uri = await captureSchedule();
    if (!uri) {
      Alert.alert('Error', 'No se pudo capturar el horario.');
      return;
    }
    try {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Compartir Mi Horario',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [captureSchedule]);

  const handleSaveImage = useCallback(async () => {
    Alert.alert(
      '📋 Descargar Horario',
      'Recuerda que tu horario siempre estará actualizado dentro de la app. Te recomendamos revisarlo aquí para tener la información más reciente.\n\n¿Deseas guardar una imagen de tu horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descargar',
          onPress: async () => {
            const uri = await captureSchedule();
            if (!uri) {
              Alert.alert('Error', 'No se pudo capturar el horario.');
              return;
            }
            try {
              const asset = await MediaLibrary.createAssetAsync(uri);
              if (asset) {
                Alert.alert('✅ Guardado', 'Horario guardado en la galería.');
              }
            } catch (error) {
              console.error('Error saving:', error);
              try {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status === 'granted') {
                  await MediaLibrary.createAssetAsync(uri);
                  Alert.alert('✅ Guardado', 'Horario guardado en la galería.');
                } else {
                  Alert.alert('Permisos', 'No se otorgaron los permisos necesarios.');
                }
              } catch (e) {
                Alert.alert('Error', 'No se pudo guardar la imagen.');
              }
            }
          },
        },
      ],
    );
  }, [captureSchedule]);

  const hasSaturdayClasses = useMemo(() => {
    if (!scheduleData) return false;
    return scheduleData.some((row) => row[5] && row[5].isFilled);
  }, [scheduleData]);

  const displayedDays = useMemo(() => {
    return hasSaturdayClasses ? DAYS : DAYS.slice(0, 5);
  }, [hasSaturdayClasses]);

  const dayColumnWidth = (screenWidth - 16 - 44 - 24) / displayedDays.length;

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!scheduleData || scheduleData.length === 0) {
    return (
      <SafeAreaView
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons
          name="calendar-outline"
          size={64}
          color={theme === "dark" ? colors.border : "#ccc"}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Sin horario
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          No se encontraron datos del horario.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <Animated.View
        entering={FadeInDown.duration(400).delay(100).springify()}
        style={styles.header}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mi Horario
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Semestre 2026-1
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleSaveImage}
            disabled={isCapturing}
          >
            <Ionicons name="save-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.primary }]}
            onPress={handleShareImage}
            disabled={isCapturing}
          >
            <Ionicons name="share-social-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot
          ref={scheduleRef}
          options={{ format: 'png', quality: 1 }}
          style={{ backgroundColor: colors.background, paddingBottom: 8 }}
        >
          <View style={styles.dayHeaderRow}>
            <View style={styles.timeHeaderCell} />
            {displayedDays.map((day, i) => {
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
                  <Text
                    style={[
                      styles.dayHeaderText,
                      { color: theme === "dark" ? colors.textSecondary : "#666" },
                      isToday && { color: "#fff" },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
          {scheduleData.slice(0, lastFilledRow + 1).map((row, rowIndex) => (
            <Animated.View
              key={rowIndex}
              style={[
                styles.gridRow,
                { zIndex: scheduleData.length - rowIndex, overflow: "visible" },
              ]}
              entering={FadeInDown.duration(400).delay(200 + rowIndex * 50)}
            >
              <View style={styles.timeCell}>
                <Text style={[styles.timeBlockLabel, { color: colors.primary }]}>
                  {TIME_BLOCKS[rowIndex]?.label}
                </Text>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {TIME_BLOCKS[rowIndex]?.start}
                  {"\n"}
                  {TIME_BLOCKS[rowIndex]?.end}
                </Text>
              </View>

              {row
                .slice(0, displayedDays.length)
                .map((cell: any, colIndex: number) => {
                  const mergeKey = `${rowIndex}-${colIndex}`;
                  const merge = mergeMap[mergeKey] || { span: 1, hidden: false };

                  if (merge.hidden) {
                    return (
                      <View
                        key={colIndex}
                        style={{ width: dayColumnWidth, margin: 2 }}
                      />
                    );
                  }

                  const color = getColorForCell(cell);
                  const isFilled = cell && cell.isFilled;
                  const span = merge.span;

                  if (span > 1) {
                    const mergedHeight = 56 * span + 4 * span + (span - 1) * 2;
                    return (
                      <View
                        key={colIndex}
                        style={{
                          width: dayColumnWidth,
                          minHeight: 56,
                          margin: 2,
                          overflow: "visible",
                        }}
                      >
                        <TouchableOpacity
                          activeOpacity={0.6}
                          onPress={() =>
                            handleCellPress(cell, rowIndex, colIndex, span)
                          }
                          style={[
                            styles.gridCell,
                            {
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              width: undefined,
                              height: mergedHeight,
                              minHeight: mergedHeight,
                              zIndex: 10,
                              margin: 0,
                            },
                            isFilled &&
                            color && {
                              backgroundColor: color.bg,
                              borderLeftWidth: 3,
                              borderLeftColor: color.border,
                            },
                          ]}
                        >
                          {isFilled && color && (
                            <>
                              <Text
                                style={[
                                  styles.cellSubjectCode,
                                  {
                                    color: color.text,
                                    fontSize: 9,
                                    opacity: 0.8,
                                    marginBottom: 1,
                                    fontWeight: "600",
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {cell.title?.split(" - ")[0]}
                              </Text>
                              <Text
                                style={[
                                  styles.cellSubjectCode,
                                  { color: color.text },
                                ]}
                                numberOfLines={1}
                              >
                                {(() => {
                                  const t = cell.title || "";
                                  const parts = t.split(" - ");
                                  if (parts.length >= 2) {
                                    return parts
                                      .slice(1)
                                      .join(" - ")
                                      .replace(/\s*\(.*\)\s*$/, "")
                                      .toUpperCase();
                                  }
                                  return t.split(" ")[0];
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
                        {
                          width: dayColumnWidth,
                          backgroundColor: colors.surface,
                        },
                        isFilled &&
                        color && {
                          backgroundColor: color.bg,
                          borderLeftWidth: 3,
                          borderLeftColor: color.border,
                        },
                      ]}
                    >
                      {isFilled && color && (
                        <>
                          <Text
                            style={[
                              styles.cellSubjectCode,
                              {
                                color: color.text,
                                fontSize: 8,
                                opacity: 0.8,
                                marginBottom: 0,
                                fontWeight: "600",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {cell.type === "Tope"
                              ? "[TOPE]"
                              : cell.title?.split(" - ")[0]}
                          </Text>
                          <Text
                            style={[
                              styles.cellSubjectCode,
                              { color: color.text },
                            ]}
                            numberOfLines={1}
                          >
                            {(() => {
                              if (
                                cell.type === "Tope" ||
                                cell.subject === "TOPE"
                              ) {
                                return "HORARIO";
                              }
                              const t = cell.title || "";
                              const parts = t.split(" - ");
                              if (parts.length >= 2) {
                                return parts
                                  .slice(1)
                                  .join(" - ")
                                  .replace(/\s*\(.*\)\s*$/, "")
                                  .toUpperCase();
                              }
                              return t.split(" ")[0];
                            })()}
                          </Text>
                          {cell.type === "Tope" && cell.topeSubjects ? (
                            <Text
                              style={[styles.cellRoom, { color: color.text }]}
                              numberOfLines={2}
                            >
                              {cell.topeSubjects.join("\n")}
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
        </ViewShot>

        <Animated.View
          entering={FadeInUp.duration(500).delay(400).springify()}
          style={[
            styles.todayCardContainer,
            { backgroundColor: "transparent" },
          ]}
        >
          <TodayClassWidget schedule={scheduleData} />
        </Animated.View>
      </ScrollView>

      <ScheduleModal
        selectedBlock={selectedBlock}
        onClose={() => setSelectedBlock(null)}
      />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    marginBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a2e",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    marginBottom: 4,
    gap: 4,
  },
  timeHeaderCell: {
    width: 44,
  },
  dayHeaderCell: {
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
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
    flexDirection: "row",
    marginBottom: 2,
    minHeight: 60,
  },
  timeCell: {
    width: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  timeBlockLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C4DFF",
  },
  timeText: {
    fontSize: 9,
    color: "#aaa",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 12,
  },
  gridCell: {
    minHeight: 56,
    margin: 2,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cellSubjectCode: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  cellRoom: {
    fontSize: 9,
    color: "#999",
    marginTop: 2,
  },
  todayCardContainer: {
    flex: 1,
    paddingHorizontal: 1,
    paddingVertical: 10,
    justifyContent: "center",
  },
});
