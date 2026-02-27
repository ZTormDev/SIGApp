import * as cheerio from 'cheerio';

export async function loginToSiga(rut: string, pass: string, server: string): Promise<any[]> {
    try {
        console.log('1. Sending Login POST via Fetch...');

        const formBody = [];
        formBody.push(encodeURIComponent('login') + '=' + encodeURIComponent(rut));
        formBody.push(encodeURIComponent('passwd') + '=' + encodeURIComponent(pass));
        formBody.push(encodeURIComponent('server') + '=' + encodeURIComponent(server));
        const formData = formBody.join('&');

        const loginUrl = 'https://siga.usm.cl/pag/valida_login.jsp';

        const defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,**;q=0.8'
        };

        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...defaultHeaders,
                'Referer': 'https://siga.usm.cl/pag/menu.jsp'
            },
            body: formData,
            credentials: 'include',
            redirect: 'follow'
        });

        const printUrl = 'https://siga.usm.cl/pag/sistinsc/insc_generar.jsp';

        const res = await fetch(printUrl, {
            method: 'GET',
            headers: defaultHeaders,
            credentials: 'include',
            redirect: 'follow'
        });

        if (res.status === 404) {
            console.warn("Got 404 on schedule table.");
            throw new Error(`El endpoint de generar horario imprimible devuelve 404.`);
        }

        const html = await res.text();

        return parseHtmlSchedule(html);

    } catch (error: any) {
        console.error('Error fetching schedule HTML:', error.message);
        throw error;
    }
}

export function parseHtmlSchedule(html: string): any[] {
    const $ = cheerio.load(html);

    if ($('input[name="passwd"]').length > 0) {
        throw new Error("Sesión caducada al intentar cargar el horario.");
    }

    const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const scheduleMatrix = Array.from({ length: 7 }, () =>
        Array.from({ length: 6 }, () => ({ title: '', isFilled: false }))
    );

    let currentDayIndex = -1;
    let parsingTopes = false;
    let hasData = false;

    // First pass: parse the regular schedule (non-tope entries)
    $('table tr').each((i, row) => {
        const text = $(row).text();

        if (text.includes('Detalle de tope de horario')) {
            parsingTopes = true;
            return; // skip this row
        }

        // Skip tope section rows in the first pass
        if (parsingTopes) return;

        const firstB = $(row).find('b').first().text().trim();
        if (firstB && DAYS.includes(firstB)) {
            currentDayIndex = DAYS.indexOf(firstB);
            hasData = true;
            return;
        }

        if (currentDayIndex === -1) return;

        const tds = $(row).find('td');
        if (tds.length >= 6) {
            const td0 = $(tds[0]).text().trim();
            const blockMatch = td0.match(/^[\d-]+/);
            if (!blockMatch) return;

            const blocksStr = blockMatch[0];
            const blockNums = blocksStr.split('-').map(Number);

            let fullTitle = '';
            let fullRoom = '';
            const fonts = $(tds[1]).find('font');
            if (fonts.length >= 2) {
                fullTitle = $(fonts[0]).text().trim();
                fullRoom = $(fonts[1]).text().trim();
            } else {
                fullTitle = $(tds[1]).text().trim();
            }

            let subject = fullTitle;
            const siglaMatch = fullTitle.match(/^([A-Z0-9]+-[A-Z]+)\s+-\s+(.+?)(?:\s+\(|$)/);
            if (siglaMatch) {
                subject = siglaMatch[2].trim();
            }

            const professor = $(tds[4]).text().trim();

            const cellData = {
                title: fullTitle,
                subject: subject,
                room: fullRoom.replace(/^sala\s+/i, '').trim(),
                professor: professor,
                type: fullTitle.toLowerCase().includes('ayudantia') ? 'Ayudantía' : 'Cátedra',
                block: blocksStr,
                isFilled: true
            };

            for (let j = 0; j < blockNums.length; j += 2) {
                const currentBlock = blockNums[j];
                const matrixRow = Math.floor((currentBlock - 1) / 2);
                if (matrixRow >= 0 && matrixRow < 7) {
                    scheduleMatrix[matrixRow][currentDayIndex] = cellData;
                }
            }
        }
    });

    // Second pass: detect topes from the tope detail table
    parsingTopes = false;
    currentDayIndex = -1;

    $('table tr').each((i, row) => {
        const text = $(row).text();

        if (text.includes('Detalle de tope de horario')) {
            parsingTopes = true;
            return;
        }

        if (!parsingTopes) return;

        const firstB = $(row).find('b').first().text().trim();
        if (firstB && DAYS.includes(firstB)) {
            currentDayIndex = DAYS.indexOf(firstB);
            return;
        }

        if (currentDayIndex === -1) return;

        const tds = $(row).find('td');
        if (tds.length >= 6) {
            const td0 = $(tds[0]).text().trim();
            const blockMatch = td0.match(/^[\d-]+/);
            if (!blockMatch) return;

            const blocksStr = blockMatch[0];
            const blockNums = blocksStr.split('-').map(Number);

            // Extract the subject code from the tope entry (e.g. "EIN113-A - INTRODUCCION...")
            let fullTitle = '';
            const fonts = $(tds[1]).find('font');
            if (fonts.length >= 1) {
                fullTitle = $(fonts[0]).text().trim();
            } else {
                fullTitle = $(tds[1]).text().trim();
            }

            // Extract subject code (e.g. "EIN113" from "EIN113-A - INTRODUCCION...")
            const codeMatch = fullTitle.match(/^([A-Z]{2,}[\d]+)/);
            const subjectCode = codeMatch ? codeMatch[1] : fullTitle.split(' ')[0];

            for (let j = 0; j < blockNums.length; j += 2) {
                const currentBlock = blockNums[j];
                const matrixRow = Math.floor((currentBlock - 1) / 2);
                if (matrixRow >= 0 && matrixRow < 7) {
                    const existing = scheduleMatrix[matrixRow][currentDayIndex];
                    // Mark this cell as a tope if it's not already
                    if (existing && existing.isFilled && (existing as any).type !== 'Tope') {
                        // Convert existing cell to TOPE, storing the colliding subjects
                        const topeSubjects = [(existing as any).subject || '', subjectCode];
                        scheduleMatrix[matrixRow][currentDayIndex] = {
                            title: `[TOPE] ${topeSubjects.join(' / ')}`,
                            subject: 'TOPE',
                            room: '',
                            professor: '',
                            type: 'Tope',
                            block: blocksStr,
                            isFilled: true,
                            topeSubjects: topeSubjects,
                        } as any;
                    } else if (existing && (existing as any).type === 'Tope') {
                        // Already a TOPE, add this subject to the list
                        const topeSubjects = (existing as any).topeSubjects || [];
                        if (!topeSubjects.includes(subjectCode)) {
                            topeSubjects.push(subjectCode);
                            (existing as any).title = `[TOPE] ${topeSubjects.join(' / ')}`;
                        }
                    } else {
                        // Cell was empty, create a TOPE cell
                        scheduleMatrix[matrixRow][currentDayIndex] = {
                            title: `[TOPE] ${subjectCode}`,
                            subject: 'TOPE',
                            room: '',
                            professor: '',
                            type: 'Tope',
                            block: blocksStr,
                            isFilled: true,
                            topeSubjects: [subjectCode],
                        } as any;
                    }
                }
            }
        }
    });

    if (!hasData) {
        console.log("No table data found. Dumping HTML...");
        const trimmedHtml = html.trim();
        throw new Error(`HTML RAW (Length: ${html.length}) (No table found): \n\n` + trimmedHtml.substring(0, 1500));
    }

    return scheduleMatrix;
}
