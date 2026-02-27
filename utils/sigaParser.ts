import * as cheerio from 'cheerio';
import { UserProfile } from './storage';

export function parseProfileHtml(html: string): UserProfile {
    const $ = cheerio.load(html);

    console.log('[Parser] Profile HTML length:', html.length);
    console.log('[Parser] Profile HTML preview:', html.substring(0, 800));

    function findByNextTd(label: string): string {
        let value = '';
        $('td').each((_, td) => {
            const text = $(td).text().trim();
            if (text.includes(label)) {
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
        $('b, strong').each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes(label)) {
                
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
        $('font').each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes(label)) {
                
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

    function findByRegex(label: string): string {
        
        const patterns = [
            new RegExp(label + '[^<]*<\\/(?:td|font|b)[^>]*>[\\s\\S]*?<td[^>]*>\\s*(?:<font[^>]*>)?\\s*([^<]+)', 'i'),
            new RegExp(label + '\\s*:?\\s*<\\/(?:td|font|b)[^>]*>[\\s\\S]*?<td[^>]*>\\s*([^<]+)', 'i'),
            new RegExp(label + '\\s*:?\\s*([^<]{2,})', 'i'),
        ];
        for (const re of patterns) {
            const match = html.match(re);
            if (match && match[1]) {
                const v = match[1].trim().replace(/\s+/g, ' ');
                if (v && v.length > 1 && v !== ':') {
                    return v;
                }
            }
        }
        return '';
    }

    function findFieldValue(...labels: string[]): string {
        for (const label of labels) {
            const v = findByNextTd(label)
                || findByBoldLabel(label)
                || findByFontLabel(label)
                || findByRegex(label);
            if (v) return v;
        }
        return '';
    }

    const fullName = findFieldValue('Nombre', 'Alumno', 'Nombre Alumno');
    const rut = findFieldValue('R.U.T.', 'RUT', 'Rut');
    const career = findFieldValue('Carrera');
    const campus = findFieldValue('Sede', 'Campus');
    const jornada = findFieldValue('Jornada');
    const rol = findFieldValue('Rol');
    const emailUsm = findFieldValue('Correo USM', 'Mail USM', 'E-Mail USM', 'Email USM', 'e-mail usm');
    const emailPersonal = findFieldValue('Correo Personal', 'Mail Personal', 'E-Mail Personal', 'Email Personal', 'e-mail personal');
    const situation = findFieldValue('Situación', 'Situacion', 'Sit.');
    const lastEnrollment = findFieldValue('Última Matrícula', 'Ult. Matrícula', 'Ultima Matricula', 'Últ. Matrícula');
    const plan = findFieldValue('Plan');

    console.log('[Parser] Extracted fields:', {
        fullName, rut, career, campus, jornada, rol,
        emailUsm, emailPersonal, situation, lastEnrollment, plan
    });

    const nameParts = fullName.split(' ').filter(Boolean);
    let firstName = fullName;
    if (nameParts.length >= 3) {
        
        firstName = nameParts[2];
        
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

    const criticalFields = [fullName, rut, career];
    const allEmpty = criticalFields.every(f => !f);
    if (allEmpty) {
        console.warn('[Parser] WARNING: All critical fields are empty! Raw HTML dump (first 2000 chars):');
        console.warn(html.substring(0, 2000));
    }

    return profile;
}
