/**
 * Constantes centralizadas para Firebase Analytics.
 * Usar estas constantes en lugar de strings hardcodeados para evitar typos
 * y facilitar la búsqueda/refactorización de eventos.
 *
 * Convención de nombres:
 * - Eventos: snake_case (requerido por Firebase)
 * - User properties: snake_case (requerido por Firebase)
 * - Máximo 40 caracteres por nombre de evento
 * - Máximo 24 user properties personalizadas
 */

// ─── Eventos de Autenticación ──────────────────────────────
export const ANALYTICS_EVENTS = {
  // Login
  LOGIN_START: "login_start",
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILURE: "login_failure",
  LOGOUT: "logout",

  // Sincronización de datos
  DATA_REFRESH: "data_refresh",
  DATA_SYNC_SUCCESS: "data_sync_success",
  DATA_SYNC_FAILURE: "data_sync_failure",

  // Calendario y exámenes
  EXAM_CREATED: "exam_created",
  EXAM_DELETED: "exam_deleted",
  EXAM_EDITED: "exam_edited",
  EXAM_NOTIFICATION_SET: "exam_notification_set",
  ACADEMIC_CALENDAR_VIEWED: "academic_calendar_viewed",

  // Horario
  SCHEDULE_VIEWED: "schedule_viewed",
  SCHEDULE_CLASS_TAPPED: "schedule_class_tapped",

  // Curriculum
  CURRICULUM_VIEWED: "curriculum_viewed",

  // Configuración
  THEME_CHANGED: "theme_changed",
  NOTIFICATION_TEST: "notification_test",

  // Engagement
  SESSION_START: "custom_session_start",
  SESSION_END: "custom_session_end",
  FEATURE_USED: "feature_used",

  // Errores (para diagnóstico)
  APP_ERROR: "app_error",
} as const;

// ─── User Properties ───────────────────────────────────────
export const USER_PROPERTIES = {
  CAMPUS: "campus",
  CAREER: "career",
  SERVER: "server_domain",
  THEME_PREFERENCE: "theme_preference",
  APP_VERSION: "app_version",
  LOGIN_COUNT: "login_count",
  HAS_EXAMS: "has_exams",
} as const;

// ─── Parámetros comunes ────────────────────────────────────
export const ANALYTICS_PARAMS = {
  SERVER: "server",
  ERROR_MESSAGE: "error_message",
  DURATION_MS: "duration_ms",
  THEME: "theme",
  EXAM_SUBJECT: "exam_subject",
  FEATURE_NAME: "feature_name",
  SUCCESS: "success",
  SOURCE: "source",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
export type UserPropertyName =
  (typeof USER_PROPERTIES)[keyof typeof USER_PROPERTIES];
