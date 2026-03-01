export const DEMO_DATA = [
    [
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ],
    [
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false },
        { "title": "", "isFilled": false }
    ]
];

export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const FULL_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const TIME_BLOCKS = [
    { label: '1-2', start: '08:15', end: '09:25' },
    { label: '3-4', start: '09:40', end: '10:50' },
    { label: '5-6', start: '11:05', end: '12:15' },
    { label: '7-8', start: '12:30', end: '13:40' },
    { label: '9-10', start: '14:40', end: '15:50' },
    { label: '11-12', start: '16:05', end: '17:15' },
    { label: '13-14', start: '17:30', end: '18:40' },
    { label: '15-16', start: '18:55', end: '20:05' },
    { label: '17-18', start: '20:20', end: '21:30' },
    { label: '19-20', start: '21:45', end: '22:55' },
];

export const SUBJECT_COLORS = [
    { bg: '#EDE7F6', border: '#7C4DFF', text: '#8f24c1ff' },
    { bg: '#E3F2FD', border: '#2979FF', text: '#3075ddff' },
    { bg: '#E8F5E9', border: '#00C853', text: '#34a93cff' },
    { bg: '#FFF3E0', border: '#FF9100', text: '#E65100' },
    { bg: '#FCE4EC', border: '#FF4081', text: '#c11e75ff' },
    { bg: '#E0F7FA', border: '#00BCD4', text: '#006064' },
    { bg: '#FFF8E1', border: '#FFD600', text: '#F57F17' },
    { bg: '#F3E5F5', border: '#E040FB', text: '#6A1B9A' },
    { bg: '#E8EAF6', border: '#536DFE', text: '#1A237E' },
    { bg: '#EFEBE9', border: '#8D6E63', text: '#3E2723' },
];

export const TOPE_COLOR = { bg: '#FFEBEE', border: '#F44336', text: '#B71C1C' };

export interface SelectedBlock {
    cell: any;
    rowIndex: number;
    colIndex: number;
    color: { bg: string; border: string; text: string };
    span?: number;
}
