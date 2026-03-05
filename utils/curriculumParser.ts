import cheerio from 'react-native-cheerio';

export interface CurriculumSubject {
    sigla: string;
    name: string;
    semester: number;
    credits: number;
    hoursTheory: number;
    hoursPractice: number;
    hoursLab: number;
    hoursAssistant: number;
    department: string;
    codAsign: string;
}

export interface CurriculumData {
    career: string;
    campus: string;
    plan: string;
    totalSemesters: number;
    totalCredits: number;
    semesters: Record<number, CurriculumSubject[]>;
}

export function parseCurriculumHtml(html: string): CurriculumData {
    const $ = cheerio.load(html);

    const subjects: CurriculumSubject[] = [];
    const semesterCredits: Record<number, number> = {};

    // Extract subjects using hidden inputs (most reliable method)
    $('tr').each((_: any, row: any) => {
        const siglaInput = $(row).find('input[name="sigla"]');
        if (siglaInput.length === 0) return;

        const sigla = siglaInput.val()?.toString().trim() || '';
        const name = ($(row).find('input[name="nom_asign"]').val()?.toString().trim() || '').replace(/\s+/g, ' ').trim();
        const semester = parseInt($(row).find('input[name="nivel"]').val()?.toString() || '0', 10);
        const credits = parseInt($(row).find('input[name="credito"]').val()?.toString() || '0', 10);
        const department = $(row).find('input[name="depto"]').val()?.toString().trim() || '';
        const codAsign = $(row).find('input[name="cod_asign"]').val()?.toString().trim() || '';

        // Extract hours from visible tds
        const tds = $(row).find('td');
        let hoursTheory = 0;
        let hoursPractice = 0;
        let hoursLab = 0;
        let hoursAssistant = 0;

        if (tds.length >= 9) {
            // td[4] = Teo, td[5] = Pra, td[6] = Lab, td[7] = Ayu
            hoursTheory = parseInt($(tds[4]).text().trim(), 10) || 0;
            hoursPractice = parseInt($(tds[5]).text().trim(), 10) || 0;
            hoursLab = parseInt($(tds[6]).text().trim(), 10) || 0;
            hoursAssistant = parseInt($(tds[7]).text().trim(), 10) || 0;
        }

        if (sigla && semester > 0) {
            subjects.push({
                sigla,
                name,
                semester,
                credits,
                hoursTheory,
                hoursPractice,
                hoursLab,
                hoursAssistant,
                department,
                codAsign,
            });
        }
    });

    // Group by semester
    const semesters: Record<number, CurriculumSubject[]> = {};
    let maxSemester = 0;
    let totalCredits = 0;

    for (const subject of subjects) {
        if (!semesters[subject.semester]) {
            semesters[subject.semester] = [];
        }
        semesters[subject.semester].push(subject);
        if (subject.semester > maxSemester) maxSemester = subject.semester;
        totalCredits += subject.credits;
    }

    // Try to extract career info from the page
    let career = '';
    let campus = '';
    let plan = '';

    // Look for select elements or text containing career info
    $('select[name="carrera"] option[selected], select option[selected]').each((_: any, el: any) => {
        const text = $(el).text().trim();
        if (text && text.length > 3 && !text.includes('Concepción') && !text.includes('Diurna')) {
            career = text;
        }
    });

    // Extract total semesters and credits from the info bar
    const infoText = $('body').text();
    const durationMatch = infoText.match(/Duración en Semestres\s*:\s*(\d+)/);
    const creditsMatch = infoText.match(/Total Créditos\s*:\s*(\d+)/);

    const totalSemesters = durationMatch ? parseInt(durationMatch[1], 10) : maxSemester;
    if (creditsMatch) totalCredits = parseInt(creditsMatch[1], 10);

    return {
        career,
        campus,
        plan,
        totalSemesters,
        totalCredits,
        semesters,
    };
}
