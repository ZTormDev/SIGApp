const API_URL = 'https://vra.usm.cl/wp-json/calendario/v1/eventos';

export interface AcademicEvent {
    id: number;
    title: string;
    start: string;       // ISO datetime "2026-03-03T00:00"
    end: string;         // ISO datetime "2026-03-03T23:59"
    backgroundColor: string;
    borderColor: string;
    category: 'inicio_clases' | 'fin_clases' | 'vacaciones' | 'suspension' | 'academico';
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

    if (lower.includes('inicio de clases')) {
        return { category: 'inicio_clases', icon: 'school-outline' };
    }
    if (lower.includes('término de clases') || lower.includes('termino de clases')) {
        return { category: 'fin_clases', icon: 'flag-outline' };
    }
    if (lower.includes('vacaciones') || lower.includes('receso')) {
        return { category: 'vacaciones', icon: 'sunny-outline' };
    }
    if (lower.includes('inscripción de asignaturas') || lower.includes('modificaciones inscripción')) {
        return { category: 'academico', icon: 'document-text-outline' };
    }
    return { category: 'suspension', icon: 'pause-circle-outline' };
}

// ── Color for each category ─────────────────────────────────────────
export function getCategoryColor(category: AcademicEvent['category']): string {
    switch (category) {
        case 'inicio_clases': return '#00C853';
        case 'fin_clases': return '#FF5252';
        case 'vacaciones': return '#FF9100';
        case 'suspension': return '#424242';
        case 'academico': return '#2979FF';
        default: return '#7C4DFF';
    }
}

// ── Label for each category ─────────────────────────────────────────
export function getCategoryLabel(category: AcademicEvent['category']): string {
    switch (category) {
        case 'inicio_clases': return 'Inicio de Clases';
        case 'fin_clases': return 'Fin de Clases';
        case 'vacaciones': return 'Vacaciones / Receso';
        case 'suspension': return 'Suspensión';
        case 'academico': return 'Académico';
        default: return 'Otro';
    }
}

// ── Get events (always fresh from API) ──────────────────────────────
export async function getAcademicEvents(): Promise<AcademicEvent[]> {
    try {
        const response = await fetch(API_URL, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const rawEvents: any[] = await response.json();

        return rawEvents
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
    } catch (error) {
        console.error('Error fetching academic calendar:', error);
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
