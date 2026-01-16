import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Corporate colors
const COLORS = {
    primary: '#064E3B',      // Verde escuro institucional
    secondary: '#10B981',    // Emerald-500
    text: '#1F2937',         // Gray-800
    textLight: '#6B7280',    // Gray-500
    headerBg: [6, 78, 59] as [number, number, number],   // RGB do verde escuro
    zebraRow: [249, 250, 251] as [number, number, number], // Gray-50
};

interface PDFGeneratorOptions {
    title: string;
    subtitle?: string;
    generatedBy?: string;
    userRole?: string;
    columns: string[];
    data: (string | number)[][];
    fileName: string;
    orientation?: 'portrait' | 'landscape';
}

interface PDFGeneratorContext {
    userName?: string;
    userRole?: string;
}

// Logo in Base64 - will be loaded dynamically
let logoBase64: string | null = null;

/**
 * Loads the logo image and converts it to base64
 * Should be called once at app initialization
 */
export async function initializePDFLogo(): Promise<void> {
    try {
        const response = await fetch('/icon.png');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                logoBase64 = reader.result as string;
                resolve();
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn('Could not load logo for PDF:', error);
    }
}

/**
 * Adds the corporate header to the PDF document
 */
function addHeader(doc: jsPDF, options: PDFGeneratorOptions, context: PDFGeneratorContext): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('pt-BR');
    let yPosition = 15;

    // Logo (left side)
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', 14, 10, 18, 18);
        } catch (e) {
            // Fallback if logo fails
        }
    }

    // Company name and tagline (center-left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary);
    doc.text('Veridia Saber', 38, yPosition + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.text('Sistema de Gestão de Acervo Botânico', 38, yPosition + 10);

    // Report info (right side)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.text(options.title, pageWidth - 14, yPosition, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);

    const generatedBy = context.userRole
        ? `Gerado por: ${context.userRole}`
        : 'Gerado por: Sistema';
    doc.text(generatedBy, pageWidth - 14, yPosition + 6, { align: 'right' });
    doc.text(`Data: ${today}`, pageWidth - 14, yPosition + 11, { align: 'right' });

    // Divider line
    yPosition = 32;
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(14, yPosition, pageWidth - 14, yPosition);

    // Subtitle if provided
    if (options.subtitle) {
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.text);
        doc.text(options.subtitle, 14, yPosition);
        return yPosition + 8;
    }

    return yPosition + 10;
}

/**
 * Adds the corporate footer to all pages
 */
function addFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer divider
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

        // Footer text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textLight);
        doc.text('Veridia Saber - Documento Confidencial', 14, pageHeight - 12);

        // Page numbers
        doc.text(`Pág. ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: 'right' });
    }
}

/**
 * Generates a professional PDF report with corporate styling
 */
export function generatePDF(options: PDFGeneratorOptions, context: PDFGeneratorContext = {}): void {
    const doc = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Add header
    const startY = addHeader(doc, options, context);

    // Add table with professional styling
    autoTable(doc, {
        startY,
        head: [options.columns],
        body: options.data,
        styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [31, 41, 55], // Gray-800
        },
        headStyles: {
            fillColor: COLORS.headerBg,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: COLORS.zebraRow,
        },
        margin: { left: 14, right: 14 },
        tableLineColor: [229, 231, 235], // Gray-200
        tableLineWidth: 0.1,
    });

    // Add footer to all pages
    addFooter(doc);

    // Save the file
    doc.save(options.fileName);
}

/**
 * Generates a detailed report for a single entity (e.g., Family report)
 */
export function generateDetailedReport(
    mainTitle: string,
    entityName: string,
    sections: Array<{
        title?: string;
        columns: string[];
        data: (string | number)[][];
    }>,
    fileName: string,
    context: PDFGeneratorContext = {}
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Add header
    const headerEndY = addHeader(doc, {
        title: mainTitle,
        columns: [],
        data: [],
        fileName
    }, context);

    let currentY = headerEndY;

    // Entity name as main focus
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.primary);
    doc.text(entityName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;

    // Add each section
    sections.forEach((section) => {
        if (section.title) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(COLORS.text);
            doc.text(section.title, 14, currentY);
            currentY += 6;
        }

        if (section.data.length > 0) {
            autoTable(doc, {
                startY: currentY,
                head: [section.columns],
                body: section.data,
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    textColor: [31, 41, 55],
                },
                headStyles: {
                    fillColor: COLORS.headerBg,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: COLORS.zebraRow,
                },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                    currentY = data.cursor?.y || currentY;
                },
            });

            // Get the final Y position after table
            currentY = (doc as any).lastAutoTable?.finalY || currentY + 20;
            currentY += 10;
        } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(COLORS.textLight);
            doc.text('Nenhum registro encontrado.', 14, currentY);
            currentY += 10;
        }
    });

    // Add footer to all pages
    addFooter(doc);

    // Save
    doc.save(fileName);
}

interface ChartDataItem {
    name: string;
    count: number;
}

/**
 * Draws a horizontal bar chart on the PDF
 */
function drawHorizontalBarChart(
    doc: jsPDF,
    data: ChartDataItem[],
    startY: number,
    title: string
): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Process Top 14 + Others
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const top14 = sorted.slice(0, 14);
    const othersCount = sorted.slice(14).reduce((sum, item) => sum + item.count, 0);

    const chartData = [...top14];
    if (othersCount > 0) {
        chartData.push({ name: 'Outros', count: othersCount });
    }

    // Chart configuration
    const barHeight = 9;
    const gap = 3;
    const maxVal = chartData[0]?.count || 1;
    const maxBarWidth = 90;
    const labelX = 16;
    const barX = 65;

    // Chart title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(COLORS.text);
    doc.text(title, pageWidth / 2, startY, { align: 'center' });

    let currentY = startY + 10;

    // Draw bars
    chartData.forEach((item, index) => {
        const y = currentY + (index * (barHeight + gap));
        const width = Math.max((item.count / maxVal) * maxBarWidth, 5); // Minimum width

        // Family name (truncated)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(COLORS.text);
        const displayName = item.name.length > 22 ? item.name.substring(0, 20) + '...' : item.name;
        doc.text(displayName, labelX, y + 6);

        // Bar
        doc.setFillColor(6, 78, 59); // Verde #064E3B
        doc.roundedRect(barX, y, width, barHeight, 1, 1, 'F');

        // Value inside or after bar
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        if (width > 20) {
            doc.setTextColor(255, 255, 255);
            doc.text(String(item.count), barX + width - 3, y + 6, { align: 'right' });
        } else {
            doc.setTextColor(COLORS.text);
            doc.text(String(item.count), barX + width + 3, y + 6);
        }
    });

    // Return the Y position after the chart
    return currentY + (chartData.length * (barHeight + gap)) + 10;
}

/**
 * Extracts genus (first word) and epithet (second word) from scientific names
 */
function extractGenusAndEpithet(speciesList: Array<{ nome_cientifico?: string }>): {
    genusData: ChartDataItem[];
    epithetData: ChartDataItem[];
} {
    const genusCounts: Record<string, number> = {};
    const epithetCounts: Record<string, number> = {};

    speciesList.forEach(species => {
        const name = species.nome_cientifico?.trim() || '';
        const parts = name.split(/\s+/);

        if (parts.length >= 1 && parts[0]) {
            const genus = parts[0];
            genusCounts[genus] = (genusCounts[genus] || 0) + 1;
        }

        if (parts.length >= 2 && parts[1]) {
            const epithet = parts[1].toLowerCase();
            epithetCounts[epithet] = (epithetCounts[epithet] || 0) + 1;
        }
    });

    // Convert to sorted arrays
    const genusData = Object.entries(genusCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const epithetData = Object.entries(epithetCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return { genusData, epithetData };
}

/**
 * Process data for chart: Top N + Others
 */
function processChartData(data: ChartDataItem[], topN: number = 10): ChartDataItem[] {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const topItems = sorted.slice(0, topN);
    const othersCount = sorted.slice(topN).reduce((sum, item) => sum + item.count, 0);

    const result = [...topItems];
    if (othersCount > 0) {
        result.push({ name: 'Outros', count: othersCount });
    }
    return result;
}

/**
 * Draws a compact horizontal bar chart (for side-by-side layout)
 */
function drawCompactChart(
    doc: jsPDF,
    data: ChartDataItem[],
    startX: number,
    startY: number,
    title: string,
    chartWidth: number = 75
): number {
    const chartData = processChartData(data, 10);

    // Chart configuration  
    const barHeight = 7;
    const gap = 2;
    const maxVal = chartData[0]?.count || 1;
    const maxBarWidth = chartWidth - 35;
    const labelX = startX;
    const barX = startX + 28;

    // Chart title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.text(title, startX + chartWidth / 2, startY, { align: 'center' });

    let currentY = startY + 8;

    // Draw bars
    chartData.forEach((item, index) => {
        const y = currentY + (index * (barHeight + gap));
        const width = Math.max((item.count / maxVal) * maxBarWidth, 4);

        // Label (truncated)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(COLORS.text);
        const displayName = item.name.length > 12 ? item.name.substring(0, 10) + '..' : item.name;
        doc.text(displayName, labelX, y + 5);

        // Bar
        doc.setFillColor(6, 78, 59);
        doc.roundedRect(barX, y, width, barHeight, 1, 1, 'F');

        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        if (width > 12) {
            doc.setTextColor(255, 255, 255);
            doc.text(String(item.count), barX + width - 2, y + 4.5, { align: 'right' });
        } else {
            doc.setTextColor(COLORS.text);
            doc.text(String(item.count), barX + width + 2, y + 5);
        }
    });

    return currentY + (chartData.length * (barHeight + gap)) + 5;
}

interface SpeciesData {
    nome_cientifico?: string;
    nome_popular?: string;
}

/**
 * Generates a Family Report with Dashboard (dual charts) on page 1 + species table on page 2+
 */
export function generateFamilyReportWithCharts(
    familyName: string,
    speciesList: SpeciesData[],
    fileName: string,
    context: PDFGeneratorContext = {}
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // === PAGE 1: Header + Family Title + Dashboard ===
    const headerEndY = addHeader(doc, {
        title: 'Relatório da Família',
        columns: [],
        data: [],
        fileName
    }, context);

    let currentY = headerEndY;

    // Family name as main title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary);
    doc.text(familyName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    // Subtitle with species count
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textLight);
    doc.text(`${speciesList.length} espécies catalogadas`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Extract genus and epithet data
    const { genusData, epithetData } = extractGenusAndEpithet(speciesList);

    // Draw side-by-side charts
    const chartStartY = currentY;
    const leftChartX = 15;
    const rightChartX = 110;

    if (genusData.length > 0 || epithetData.length > 0) {
        // Dashboard title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(COLORS.text);
        doc.text('Análise Taxonômica', pageWidth / 2, chartStartY, { align: 'center' });

        const chartsY = chartStartY + 10;

        // Left chart: Top Genera
        if (genusData.length > 0) {
            drawCompactChart(doc, genusData, leftChartX, chartsY, 'Principais Gêneros', 85);
        }

        // Right chart: Top Epithets
        if (epithetData.length > 0) {
            drawCompactChart(doc, epithetData, rightChartX, chartsY, 'Principais Epítetos', 85);
        }
    }

    // Summary at bottom of page 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.text(
        `Diversidade: ${genusData.length} gêneros | ${epithetData.length} epítetos únicos`,
        pageWidth / 2,
        pageHeight - 30,
        { align: 'center' }
    );

    // === PAGE 2+: Species Table ===
    doc.addPage();

    const tableHeaderY = addHeader(doc, {
        title: 'Relatório da Família',
        subtitle: `Lista de Espécies - ${familyName}`,
        columns: [],
        data: [],
        fileName
    }, context);

    // Prepare table data
    const tableData = speciesList.map(s => [
        s.nome_cientifico || '-',
        s.nome_popular || '-'
    ]);

    if (tableData.length > 0) {
        autoTable(doc, {
            startY: tableHeaderY,
            head: [['Nome Científico', 'Nome Popular']],
            body: tableData,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [31, 41, 55],
            },
            headStyles: {
                fillColor: COLORS.headerBg,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: COLORS.zebraRow,
            },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { fontStyle: 'italic' } // Scientific name in italic
            }
        });
    } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.textLight);
        doc.text('Nenhuma espécie cadastrada para esta família.', pageWidth / 2, tableHeaderY + 10, { align: 'center' });
    }

    // Add footer to all pages
    addFooter(doc);

    // Save
    doc.save(fileName);
}

interface FamiliesReportData {
    name: string;
    count: number;
    createdAt: string;
}

/**
 * Generates the Families Report with Chart (Page 1) + Table (Page 2+)
 */
export function generateFamiliesReportWithChart(
    data: FamiliesReportData[],
    fileName: string,
    context: PDFGeneratorContext = {}
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // === PAGE 1: Header + Chart ===
    const headerEndY = addHeader(doc, {
        title: 'Relatório Geral de Famílias',
        columns: [],
        data: [],
        fileName
    }, context);

    // Chart data preparation
    const chartItems: ChartDataItem[] = data.map(d => ({
        name: d.name,
        count: d.count
    }));

    // Draw the chart
    drawHorizontalBarChart(
        doc,
        chartItems,
        headerEndY + 5,
        'Distribuição de Riqueza por Família (Top 15)'
    );

    // Summary stats below chart
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalFamilies = data.length;
    const totalSpecies = data.reduce((sum, d) => sum + d.count, 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textLight);
    doc.text(`Total: ${totalFamilies} famílias | ${totalSpecies} espécies catalogadas`, 105, pageHeight - 30, { align: 'center' });

    // === PAGE 2+: Full Data Table ===
    doc.addPage();

    // Add header to new page
    const tableHeaderY = addHeader(doc, {
        title: 'Relatório Geral de Famílias',
        subtitle: 'Lista Completa de Famílias',
        columns: [],
        data: [],
        fileName
    }, context);

    // Prepare table data
    const tableData = data.map(d => [
        d.name,
        d.count,
        d.createdAt
    ]);

    // Add table
    autoTable(doc, {
        startY: tableHeaderY,
        head: [['Família', 'Nº Espécies', 'Data Cadastro']],
        body: tableData,
        styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [31, 41, 55],
        },
        headStyles: {
            fillColor: COLORS.headerBg,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
        },
        alternateRowStyles: {
            fillColor: COLORS.zebraRow,
        },
        margin: { left: 14, right: 14 },
        tableLineColor: [229, 231, 235] as [number, number, number],
        tableLineWidth: 0.1,
    });

    // Add footer to all pages
    addFooter(doc);

    // Save
    doc.save(fileName);
}

interface SpeciesReportData {
    nome_cientifico: string;
    nome_popular?: string | null;
    familia?: { familia_nome: string } | { familia_nome: string }[] | null;
    locais?: { nome: string } | { nome: string }[] | null;
}

interface SpeciesReportOptions {
    isGlobalReport: boolean;
    projectName?: string;
}

// Helper to extract single value from possibly array response
function extractFirst<T>(data: T | T[] | null | undefined): T | null {
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
}

/**
 * Generates a Species Report with Dashboard (chart) + Table
 * For global admins: shows all species with Local column
 * For local users: shows only their project's species without Local column
 */
export function generateSpeciesReport(
    species: SpeciesReportData[],
    fileName: string,
    options: SpeciesReportOptions,
    context: PDFGeneratorContext = {}
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // === PAGE 1: Header + Chart Dashboard ===
    const reportTitle = options.isGlobalReport
        ? 'Relatório Geral de Espécies'
        : `Relatório de Espécies - ${options.projectName || 'Projeto'}`;

    const headerEndY = addHeader(doc, {
        title: reportTitle,
        columns: [],
        data: [],
        fileName
    }, context);

    // Calculate family distribution for chart
    const familyCounts: Record<string, number> = {};
    species.forEach(s => {
        const fam = extractFirst(s.familia);
        const familyName = fam?.familia_nome || 'Sem Família';
        familyCounts[familyName] = (familyCounts[familyName] || 0) + 1;
    });

    const chartData: ChartDataItem[] = Object.entries(familyCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // Draw chart
    let currentY = headerEndY + 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text);
    doc.text('Distribuição por Família (Top 10)', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Draw horizontal bar chart
    const processedData = processChartData(chartData, 10);
    const barHeight = 8;
    const gap = 3;
    const maxVal = processedData[0]?.count || 1;
    const maxBarWidth = 85;
    const labelX = 16;
    const barX = 60;

    processedData.forEach((item, index) => {
        const y = currentY + (index * (barHeight + gap));
        const width = Math.max((item.count / maxVal) * maxBarWidth, 5);

        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.text);
        const displayName = item.name.length > 20 ? item.name.substring(0, 18) + '..' : item.name;
        doc.text(displayName, labelX, y + 5);

        // Bar
        doc.setFillColor(6, 78, 59);
        doc.roundedRect(barX, y, width, barHeight, 1, 1, 'F');

        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        if (width > 15) {
            doc.setTextColor(255, 255, 255);
            doc.text(String(item.count), barX + width - 3, y + 5, { align: 'right' });
        } else {
            doc.setTextColor(COLORS.text);
            doc.text(String(item.count), barX + width + 3, y + 5);
        }
    });

    // Summary stats
    const uniqueFamilies = Object.keys(familyCounts).length;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textLight);
    doc.text(
        `Total: ${species.length} espécies em ${uniqueFamilies} famílias`,
        pageWidth / 2,
        pageHeight - 30,
        { align: 'center' }
    );

    // === PAGE 2+: Species Table ===
    doc.addPage();

    const tableHeaderY = addHeader(doc, {
        title: reportTitle,
        subtitle: 'Lista Completa de Espécies',
        columns: [],
        data: [],
        fileName
    }, context);

    // Prepare columns and data based on report type
    const columns = options.isGlobalReport
        ? ['Nome Científico', 'Nome Popular', 'Família', 'Local']
        : ['Nome Científico', 'Nome Popular', 'Família'];

    const tableData = species.map(s => {
        const fam = extractFirst(s.familia);
        const loc = extractFirst(s.locais);
        const row = [
            s.nome_cientifico || '-',
            s.nome_popular || '-',
            fam?.familia_nome || '-'
        ];
        if (options.isGlobalReport) {
            row.push(loc?.nome || 'Veridia Saber BD');
        }
        return row;
    });

    autoTable(doc, {
        startY: tableHeaderY,
        head: [columns],
        body: tableData,
        styles: {
            fontSize: 8,
            cellPadding: 2.5,
            textColor: [31, 41, 55],
        },
        headStyles: {
            fillColor: COLORS.headerBg,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: COLORS.zebraRow,
        },
        columnStyles: {
            0: { fontStyle: 'italic' } // Scientific name in italic
        },
        margin: { left: 14, right: 14 },
    });

    // Add footer to all pages
    addFooter(doc);

    // Save
    doc.save(fileName);
}

interface SingleSpeciesData {
    id?: string;
    nome_cientifico: string;
    nome_popular?: string | null;
    descricao_especie?: string | null;
    cuidados_luz?: string | null;
    cuidados_agua?: string | null;
    cuidados_temperatura?: string | null;
    cuidados_substrato?: string | null;
    cuidados_nutrientes?: string | null;
    familia?: { familia_nome: string } | { familia_nome: string }[] | null;
    locais?: { nome: string } | { nome: string }[] | null;
    imagens?: { url_imagem: string }[] | null;
    // Local fields
    descricao_ocorrencia?: string | null;
    detalhes_localizacao?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

/**
 * Helper function to fetch image and convert to base64 for PDF embedding
 */
async function getBase64FromUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

/**
 * Generates a single species report (Ficha Técnica) with magazine/catalog style
 * Async to allow image fetching
 */
export async function generateSingleSpeciesReport(
    species: SingleSpeciesData,
    fileName: string,
    context: PDFGeneratorContext = {}
): Promise<void> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 16;
    const marginRight = 16;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const MARGIN_BOTTOM = 265; // Safe limit - footer starts around Y=275
    const LINE_HEIGHT = 5;

    // Helper: Check and add new page if needed
    const checkPageBreak = (neededSpace: number = 15) => {
        if (currentY > MARGIN_BOTTOM - neededSpace) {
            doc.addPage();
            currentY = 25;
        }
    };

    // Helper: Print a labeled block with page break protection
    const printBlock = (label: string, content: string, labelWidth: number = 35) => {
        const textLines = doc.splitTextToSize(content, contentWidth - labelWidth);
        const blockHeight = textLines.length * LINE_HEIGHT;

        // If entire block doesn't fit, start new page
        if (currentY + blockHeight > MARGIN_BOTTOM) {
            doc.addPage();
            currentY = 25;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, marginLeft, currentY);

        doc.setFont('helvetica', 'normal');
        textLines.forEach((line: string, idx: number) => {
            if (idx === 0) {
                doc.text(line, marginLeft + labelWidth, currentY);
            } else {
                currentY += LINE_HEIGHT;
                doc.text(line, marginLeft + labelWidth, currentY);
            }
        });
        currentY += LINE_HEIGHT + 3;
    };

    // === HEADER: Logo and green line ===
    const headerEndY = addHeader(doc, {
        title: 'Ficha Técnica',
        columns: [],
        data: [],
        fileName
    }, context);

    // === IDENTIFICATION SECTION (Two-column layout) ===
    const rightColX = 155; // Moved right for smaller image
    const imageWidth = 35;
    const imageHeight = 35;

    let currentY = headerEndY + 5;

    // === LEFT COLUMN: Taxonomy info ===
    const familia = extractFirst(species.familia);
    const local = extractFirst(species.locais);
    const isLocalUser = context.userRole === 'Gestor de Acervo';

    // Family name (uppercase, gray)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.textLight);
    doc.text((familia?.familia_nome || 'FAMÍLIA NÃO INFORMADA').toUpperCase(), marginLeft, currentY);
    currentY += 10;

    // Scientific name (large, italic, green)
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(22);
    doc.setTextColor(COLORS.primary);

    const maxTextWidth = rightColX - marginLeft - 10;
    const sciNameLines = doc.splitTextToSize(species.nome_cientifico, maxTextWidth);
    doc.text(sciNameLines, marginLeft, currentY);
    currentY += sciNameLines.length * 9 + 2;

    // Popular name (medium, gray, quoted)
    if (species.nome_popular) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(COLORS.text);

        // Fix: Auto-wrap text to prevent overlap with image
        const popNameLines = doc.splitTextToSize(`"${species.nome_popular}"`, maxTextWidth);
        doc.text(popNameLines, marginLeft, currentY);

        // Adjust Y based on number of lines (approx 7mm per line for font size 14)
        currentY += popNameLines.length * 7 + 3;
    }

    // Project name for local users (bottom left of header area)
    if (isLocalUser && local?.nome) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(COLORS.textLight);
        doc.text(`Projeto: ${local.nome}`, marginLeft, headerEndY + imageHeight + 5);
    }

    // === RIGHT COLUMN: Featured Image ===
    const imageUrl = species.imagens?.[0]?.url_imagem;
    if (imageUrl) {
        const base64Image = await getBase64FromUrl(imageUrl);
        if (base64Image) {
            try {
                doc.addImage(base64Image, 'JPEG', rightColX, headerEndY + 5, imageWidth, imageHeight);
            } catch {
                // Placeholder on failure
                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(245, 245, 245);
                doc.roundedRect(rightColX, headerEndY + 5, imageWidth, imageHeight, 3, 3, 'FD');
            }
        }
    }

    // Start content after header section
    currentY = headerEndY + imageHeight + 15;

    // Separator line
    doc.setDrawColor(6, 78, 59);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 12;

    // === SECTION 1: Description (Dynamic Source) ===
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);

    // Choose title and value based on role
    const descriptionTitle = isLocalUser ? 'Descrição Local da Ocorrência' : 'Descrição Botânica';
    // Priority: Local Description -> Global Description -> Empty
    const descriptionValue = (isLocalUser && species.descricao_ocorrencia)
        ? species.descricao_ocorrencia
        : species.descricao_especie;

    doc.text(descriptionTitle, marginLeft, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);

    if (descriptionValue) {
        const descLines = doc.splitTextToSize(descriptionValue, contentWidth);
        // Print line by line with page break protection
        descLines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, marginLeft, currentY);
            currentY += 5;
        });
        currentY += 8;
    } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(COLORS.textLight);
        doc.text('Nenhuma descrição disponível.', marginLeft, currentY);
        currentY += 10;
    }

    // === SECTION 2: Conditional Content (Cultivation OR Field Notes) ===
    checkPageBreak(25);

    if (isLocalUser) {
        // --- FIELD NOTES (For Gestor de Acervo) ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLORS.primary);
        doc.text('Detalhes de Campo & Localização', marginLeft, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.setTextColor(COLORS.text);

        // Technical Field Notes
        if (species.detalhes_localizacao) {
            printBlock('Notas de Campo', species.detalhes_localizacao);
        }

        // GPS Coordinates
        if (species.latitude || species.longitude) {
            const gpsText = `Lat: ${species.latitude || '-'} | Long: ${species.longitude || '-'}`;
            printBlock('Coordenadas GPS', gpsText);
        }

        if (!species.detalhes_localizacao && !species.latitude && !species.longitude) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(COLORS.textLight);
            doc.text('Nenhum dado de campo registrado para este projeto.', marginLeft, currentY);
        }

    } else {
        // --- CULTIVATION GUIDE (For General/Admin) ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLORS.primary);
        doc.text('Guia de Cultivo', marginLeft, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.setTextColor(COLORS.text);

        const careItems = [
            { label: 'Luminosidade', value: species.cuidados_luz },
            { label: 'Rega', value: species.cuidados_agua },
            { label: 'Temperatura', value: species.cuidados_temperatura },
            { label: 'Substrato', value: species.cuidados_substrato },
            { label: 'Nutrientes', value: species.cuidados_nutrientes },
        ];

        let hasCareInfo = false;
        careItems.forEach(item => {
            if (item.value) {
                hasCareInfo = true;
                printBlock(item.label, item.value);
            }
        });

        if (!hasCareInfo) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(COLORS.textLight);
            doc.text('Nenhuma informação de cultivo cadastrada.', marginLeft, currentY);
        }
    }

    // Add footer
    addFooter(doc);

    // Save
    doc.save(fileName);
}

// Auto-initialize logo when module loads
if (typeof window !== 'undefined') {
    initializePDFLogo();
}