import cheerio from 'react-native-cheerio';

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
    console.log(`[Schedule Parser] HTML length: ${html.length}`);
    console.log(`[Schedule Parser] Contains 'Detalle de tope': ${html.includes('Detalle de tope')}`);
    console.log(`[Schedule Parser] Contains 'tope de horario': ${html.includes('tope de horario')}`);
    console.log(`[Schedule Parser] Contains '---TOPE---': ${html.includes('---TOPE---')}`);
    console.log(`[Schedule Parser] Contains 'Detalle de horario': ${html.includes('Detalle de horario')}`);
    console.log(`[Schedule Parser] HTML last 500 chars:`, html.substring(html.length - 500));

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

    $('table tr').each((i, row) => {
        const text = $(row).text();

        if (text.includes('tope de horario')) {
            parsingTopes = true;
            return;
        }

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

    parsingTopes = false;
    currentDayIndex = -1;
    const topeCollisions: Record<string, Set<string>> = {};

    $('table tr').each((i, row) => {
        const text = $(row).text();

        if (text.includes('tope de horario')) {
            console.log('[TOPE Parser] Found tope section header');
            parsingTopes = true;
            return;
        }

        if (!parsingTopes) return;

        const firstB = $(row).find('b').first().text().trim();
        if (firstB && DAYS.includes(firstB)) {
            currentDayIndex = DAYS.indexOf(firstB);
            console.log(`[TOPE Parser] Day header: ${firstB}, dayIndex: ${currentDayIndex}`);
            return;
        }

        if (currentDayIndex === -1) return;

        const tds = $(row).find('td');
        if (tds.length >= 6) {
            const td0 = $(tds[0]).text().trim();
            const blockMatch = td0.match(/^[\d]+(?:-[\d]+)*/);
            if (!blockMatch) return;

            const blocksStr = blockMatch[0];
            const blockNums = blocksStr.split('-').map(Number);

            let fullTitle = '';
            const fonts = $(tds[1]).find('font');
            if (fonts.length >= 1) {
                fullTitle = $(fonts[0]).text().trim();
            } else {
                fullTitle = $(tds[1]).text().trim();
            }

            const siglaMatch = fullTitle.match(/^([A-Z]{2,}\d+(?:-[A-Z0-9]+)?)/);
            const subjectCode = siglaMatch ? siglaMatch[1] : fullTitle.split(' ')[0];
            const baseCode = subjectCode.split('-')[0];
            let namePart = '';
            const parts = fullTitle.split(' - ');
            if (parts.length >= 2) {
                namePart = parts.slice(1).join(' - ').replace(/\s*\(.*\)\s*$/, '').trim();
            }
            const subjectDescription = namePart ? `${baseCode} - ${namePart}` : baseCode;

            console.log(`[TOPE Parser] Entry: block="${blocksStr}", subject="${baseCode}", title="${fullTitle.substring(0, 50)}"`);

            for (const blockNum of blockNums) {
                const matrixRow = Math.floor((blockNum - 1) / 2);
                if (matrixRow < 0 || matrixRow >= 7) continue;

                const cellKey = `${matrixRow}-${currentDayIndex}`;

                if (!topeCollisions[cellKey]) {
                    topeCollisions[cellKey] = new Set<string>();
                }
                topeCollisions[cellKey].add(subjectDescription);
                console.log(`[TOPE Parser] Added ${subjectDescription} to cell ${cellKey}`);
            }
        }
    });

    console.log(`[TOPE Parser] Total tope collisions found: ${Object.keys(topeCollisions).length}`);
    for (const [key, subjects] of Object.entries(topeCollisions)) {
        console.log(`[TOPE Parser] Cell ${key}: ${Array.from(subjects).join(', ')}`);
    }

    for (const [cellKey, subjects] of Object.entries(topeCollisions)) {
        const [rowStr, colStr] = cellKey.split('-');
        const matrixRow = parseInt(rowStr);
        const dayCol = parseInt(colStr);
        const topeSubjects = Array.from(subjects);

        scheduleMatrix[matrixRow][dayCol] = {
            title: `[TOPE] ${topeSubjects.join(' / ')}`,
            subject: 'TOPE',
            room: '',
            professor: '',
            type: 'Tope',
            block: '',
            isFilled: true,
            topeSubjects: topeSubjects,
        } as any;
    }

    if (!hasData) {
        console.log("No table data found. Dumping HTML...");
        const trimmedHtml = html.trim();
        throw new Error(`HTML RAW (Length: ${html.length}) (No table found): \n\n` + trimmedHtml.substring(0, 1500));
    }

    return scheduleMatrix;
}
