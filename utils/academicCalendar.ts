import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://vra.usm.cl/wp-json/calendario/v1/eventos';
const CACHE_KEY = 'ACADEMIC_CALENDAR_CACHE';
const CACHE_TIME_KEY = 'ACADEMIC_CALENDAR_TIME';

export interface AcademicEvent {
    id: number;
    title: string;
    start: string;       // ISO datetime "2026-03-03T00:00"
    end: string;         // ISO datetime "2026-03-03T23:59"
    backgroundColor: string;
    borderColor: string;
    category: 'inicio_clases' | 'fin_clases' | 'vacaciones' | 'suspension' | 'academico' | 'ceremonia' | 'feriado';
    icon: string;
}

// ── Strict whitelist: only truly important student milestones ────────
const IMPORTANT_KEYWORDS = [
    'inicio de clases',
    'término de clases',
    'vacaciones de invierno',
    'vacaciones para estudiantes',
    'vacaciones verano',
    'inicio vacaciones verano',
    'término vacaciones verano',
    'termino vacaciones verano',
    'días sansanos',
    'días mechones',
    'inscripción de asignaturas',
    'colchón académico',
    'puertas abiertas',
    'día del funcionario',
    'suspensión de actividades acad',
    'bienvenida',
    'ceremonia',
    'pinvu',
    'feriado',
];

// These keywords EXCLUDE overly-granular or duplicate variants
const EXCLUDE_KEYWORDS = [
    'vespertino',
    'exclusivo para',
];

function isImportantEvent(title: string): boolean {
    const lower = title.toLowerCase();
    const matches = IMPORTANT_KEYWORDS.some((kw) => lower.includes(kw));
    if (!matches) return false;
    const excluded = EXCLUDE_KEYWORDS.some((kw) => lower.includes(kw));
    return !excluded;
}

// ── Categorize event by title keywords ──────────────────────────────
function categorizeEvent(title: string): { category: AcademicEvent['category']; icon: string } {
    const lower = title.toLowerCase();

    // 1. Vacations & Holidays (Highest priority for students)
    if (lower.includes('vacaciones') || lower.includes('receso')) {
        return { category: 'vacaciones', icon: 'sunny-outline' };
    }
    if (lower.includes('feriado')) {
        return { category: 'feriado', icon: 'flag-outline' };
    }

    // 2. Class starts/ends
    if (lower.includes('inicio de clases')) {
        return { category: 'inicio_clases', icon: 'school-outline' };
    }
    if (lower.includes('término de clases') || lower.includes('termino de clases')) {
        return { category: 'fin_clases', icon: 'checkmark-circle-outline' };
    }

    // 3. Academic Milestones (Enrollment, Pinvu, etc.)
    if (
        lower.includes('inscripción de asignaturas') ||
        lower.includes('modificaciones inscripción') ||
        lower.includes('colchón académico') ||
        lower.includes('colchon academico') ||
        lower.includes('pinvu') ||
        lower.includes('puertas abiertas')
    ) {
        return { category: 'academico', icon: 'document-text-outline' };
    }

    // 4. Ceremonies & Special Events
    if (
        lower.includes('bienvenida') ||
        lower.includes('ceremonia') ||
        lower.includes('titulación') ||
        lower.includes('titulacion') ||
        lower.includes('aniversario')
    ) {
        return { category: 'ceremonia', icon: 'ribbon-outline' };
    }

    // 5. Suspensions
    if (
        lower.includes('suspensión') ||
        lower.includes('suspension') ||
        lower.includes('día del funcionario') ||
        lower.includes('dia del funcionario') ||
        lower.includes('días sansanos') ||
        lower.includes('dias sansanos') ||
        lower.includes('días mechones') ||
        lower.includes('dias mechones')
    ) {
        return { category: 'suspension', icon: 'pause-circle-outline' };
    }

    // Default to academic for any other important milestone
    return { category: 'academico', icon: 'calendar-outline' };
}

// ── Color for each category ─────────────────────────────────────────
export function getCategoryColor(category: AcademicEvent['category']): string {
    switch (category) {
        case 'inicio_clases': return '#00C853'; // Green
        case 'fin_clases': return '#FF5252';    // Red
        case 'vacaciones': return '#FF9100';   // Orange
        case 'feriado': return '#F44336';      // Reddish/Hot
        case 'suspension': return '#607D8B';   // Blue Grey
        case 'academico': return '#2979FF';    // Blue
        case 'ceremonia': return '#7C4DFF';    // Purple
        default: return '#9E9E9E';             // Grey
    }
}

// ── Label for each category ─────────────────────────────────────────
export function getCategoryLabel(category: AcademicEvent['category']): string {
    switch (category) {
        case 'inicio_clases': return 'Inicio de Clases';
        case 'fin_clases': return 'Fin de Clases';
        case 'vacaciones': return 'Vacaciones / Receso';
        case 'feriado': return 'Feriado';
        case 'suspension': return 'Suspensión';
        case 'academico': return 'Académico';
        case 'ceremonia': return 'Ceremonia / Evento';
        default: return 'Otro';
    }
}

// ── Get events (from cache if < 24h, else fresh from API) ───────────
export async function getAcademicEvents(): Promise<AcademicEvent[]> {
    try {
        const cachedStr = await AsyncStorage.getItem(CACHE_KEY);
        const cachedTimeStr = await AsyncStorage.getItem(CACHE_TIME_KEY);

        if (cachedStr && cachedTimeStr) {
            const lastSync = parseInt(cachedTimeStr, 10);
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;
            if (Date.now() - lastSync < ONE_DAY_MS) {
                return JSON.parse(cachedStr);
            }
        }

        const response = await fetch(API_URL, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const rawEvents: any[] = await response.json();

        const processedEvents = rawEvents
            .filter((e) => isImportantEvent(e.title))
            .map((e) => {
                const { category, icon } = categorizeEvent(e.title);
                return {
                    id: e.id,
                    title: e.title.replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' '),
                    start: e.start,
                    end: e.end,
                    backgroundColor: e.backgroundColor,
                    borderColor: e.borderColor,
                    category,
                    icon,
                };
            });

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(processedEvents));
        await AsyncStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

        return processedEvents;
    } catch (error) {
        console.error('Error fetching academic calendar:', error);

        // Try to return fallback cache if network fails
        try {
            const fallbackStr = await AsyncStorage.getItem(CACHE_KEY);
            if (fallbackStr) {
                return JSON.parse(fallbackStr);
            }
        } catch { }

        return [];
    }
}

// ── Get events for a specific date ──────────────────────────────────
export function getEventsForDate(events: AcademicEvent[], dateStr: string): AcademicEvent[] {
    return events.filter((event) => {
        const startDate = event.start.split('T')[0];
        const endDate = event.end.split('T')[0];
        return dateStr >= startDate && dateStr <= endDate;
    });
}

// ── Get all dates that have events ──────────────────────────────────
export function getEventDates(events: AcademicEvent[]): string[] {
    const dates = new Set<string>();
    events.forEach((event) => {
        const startDate = new Date(event.start.split('T')[0] + 'T12:00:00');
        const endDate = new Date(event.end.split('T')[0] + 'T12:00:00');

        let current = new Date(startDate);
        while (current <= endDate) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            dates.add(`${y}-${m}-${d}`);
            current.setDate(current.getDate() + 1);
        }
    });
    return Array.from(dates);
}
