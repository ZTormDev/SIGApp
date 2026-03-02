import cheerio from 'react-native-cheerio';
import { UserProfile } from './storage';

export function parseProfileHtml(html: string): UserProfile {
    const $ = cheerio.load(html);

    function findByNextTd(label: string): string {
        let value = '';
        const lowerLabel = label.toLowerCase();
        $('td').each((_: any, td: any) => {
            const text = $(td).text().trim().toLowerCase();
            if (text === lowerLabel || text.includes(lowerLabel)) {
                const nextTd = $(td).next('td');
                if (nextTd.length) {
                    const v = nextTd.text().trim().replace(/\s+/g, ' ');
                    if (v && v !== ':') {
                        value = v;
                        return false;
                    }
                }
            }
        });
        return value;
    }

    function findByBoldLabel(label: string): string {
        let value = '';
        const lowerLabel = label.toLowerCase();
        $('b, strong').each((_: any, el: any) => {
            const text = $(el).text().trim().toLowerCase();
            if (text.includes(lowerLabel)) {
                const parentTd = $(el).closest('td');
                if (parentTd.length) {
                    const nextTd = parentTd.next('td');
                    if (nextTd.length) {
                        const v = nextTd.text().trim().replace(/\s+/g, ' ');
                        if (v && v !== ':') {
                            value = v;
                            return false;
                        }
                    }
                    const fullText = parentTd.text().trim();
                    const colonIdx = fullText.indexOf(':');
                    if (colonIdx !== -1) {
                        const v = fullText.substring(colonIdx + 1).trim().replace(/\s+/g, ' ');
                        if (v) {
                            value = v;
                            return false;
                        }
                    }
                }
            }
        });
        return value;
    }

    function findByFontLabel(label: string): string {
        let value = '';
        const lowerLabel = label.toLowerCase();
        $('font').each((_: any, el: any) => {
            const text = $(el).text().trim().toLowerCase();
            if (text.includes(lowerLabel)) {
                const parentTd = $(el).closest('td');
                if (parentTd.length) {
                    const nextTd = parentTd.next('td');
                    if (nextTd.length) {
                        const v = nextTd.text().trim().replace(/\s+/g, ' ');
                        if (v && v !== ':') {
                            value = v;
                            return false;
                        }
                    }
                }
                const nextFont = $(el).next('font');
                if (nextFont.length) {
                    const v = nextFont.text().trim().replace(/\s+/g, ' ');
                    if (v) {
                        value = v;
                        return false;
                    }
                }
            }
        });
        return value;
    }

    function findFieldValue(...labels: string[]): string {
        for (const label of labels) {
            const v = findByNextTd(label)
                || findByBoldLabel(label)
                || findByFontLabel(label);
            if (v) return v;
        }
        return '';
    }

    let fullName = findFieldValue('Nombre completo', 'Nombre', 'Alumno', 'Nombre Alumno');
    let rut = findFieldValue('R.U.T.', 'RUT', 'Rut');
    let emailUsm = findFieldValue('E-mail USM', 'Correo USM', 'Mail USM', 'Email USM');
    let emailPersonal = findFieldValue('E-mail personal', 'Correo Personal', 'Mail Personal', 'Email Personal');
    let situation = findFieldValue('Situación', 'Situacion', 'Sit.');

    // Inicializamos en blanco para que solo el extractor de la tabla horizontal los llene
    let career = '';
    let campus = '';
    let jornada = '';
    let rol = '';
    let lastEnrollment = '';
    let plan = '';

    // Extraer desde datos académicos (frame2) usando la estructura real del DOM The AI Browser Agent encontró
    $('tr').each((_: any, row: any) => {
        // Obtenemos el texto de la fila completa, en minúsculas y sin espacios extra
        const text = $(row).text().replace(/\s+/g, ' ').toLowerCase();

        // Verificamos que sea EXACTAMENTE la fila de encabezados de Datos Académicos
        if (text.includes('carrera') && text.includes('campus/sede') && text.includes('jornada') && text.includes('rol')) {
            // La información real del estudiante está infaliblemente en la siguiente fila (tr)
            const nextRow = $(row).next('tr');
            if (nextRow.length > 0) {
                const tds = nextRow.find('td');
                if (tds.length >= 7) {
                    // El índice 0 es Carrera (ej: "Téc. Univ. en Informática\nVigente"). Tomamos solo la primera línea.
                    const rawCareer = $(tds[0]).text().trim();
                    career = rawCareer.split('\n')[0].replace('Vigente', '').trim();

                    campus = $(tds[1]).text().trim();
                    jornada = $(tds[2]).text().trim();
                    rol = $(tds[3]).text().trim();

                    // Índice 4 es Año carrera, 5 es Plan, 6 es Última matrícula, 7 es Situación académica
                    plan = $(tds[5]).text().trim();
                    lastEnrollment = $(tds[6]).text().trim();

                    // Solo sobreescribir situation si encontramos una válida ahí, sino usar el default
                    const sit = $(tds[7]).text().trim();
                    if (sit) situation = sit;

                    return false; // Break out of the .each() loop! Extracción exitosa.
                }
            }
        }
    });

    // Default situation fallback
    if (!situation) {
        if (html.toLowerCase().includes('condicional')) situation = 'Condicional';
        else if (html.toLowerCase().includes('titulado')) situation = 'Titulado';
        else situation = 'Alumno Regular'; // Default asumido
    }

    const nameParts = fullName.split(' ').filter(Boolean);
    let firstName = fullName;
    if (nameParts.length >= 3) {
        firstName = nameParts[2];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    } else if (nameParts.length > 0) {
        firstName = nameParts[0];
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }

    const profile: UserProfile = {
        fullName,
        firstName,
        rut,
        career,
        campus,
        jornada,
        rol,
        emailUsm,
        emailPersonal,
        situation,
        lastEnrollment,
        plan,
    };

    return profile;
}
