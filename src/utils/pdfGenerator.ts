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
// Extract stats
interface SpeciesData {
    nome_cientifico?: string;
    nome_popular?: string;
}

interface FamilyDetailedData {
    familia_nome: string;
    autoria_taxonomica?: string | null;
    fonte_referencia?: string | null;
    link_referencia?: string | null;
    created_at?: string | null;
    created_by_name?: string | null;
}

interface LegacyNameData {
    nome_legado: string;
    tipo?: string | null;
    fonte?: string | null;
}

/**
 * Generates a Detailed Family Report with ID Block, Legacy Names, and Species List
 */
export function generateFamilyReportWithCharts(
    family: FamilyDetailedData,
    speciesList: SpeciesData[],
    legacyNames: LegacyNameData[],
    fileName: string
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Extract stats
    const { genusData } = extractGenusAndEpithet(speciesList);
    const totalSpecies = speciesList.length;
    const totalGenus = genusData.length;

    // === PAGE 1: IDENTIFICATION HEADER ===

    // Compact Header/Logo
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', 14, 15, 12, 12);
        } catch { }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.text('Veridia Saber', 30, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.text('Relatório da Família', 30, 24);

    doc.setFontSize(8);
    doc.text(`Gerado em: ${today}`, pageWidth - 14, 22, { align: 'right' });

    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(14, 30, pageWidth - 14, 30);

    let currentY = 45;

    // === FAMILY IDENTITY BLOCK ===
    // Family Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(COLORS.primary);
    doc.text(family.familia_nome.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    // Authorship
    if (family.autoria_taxonomica) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(COLORS.textLight);
        doc.text(family.autoria_taxonomica, pageWidth / 2, currentY, { align: 'center' });
        currentY += 12;
    } else {
        currentY += 8;
    }

    // Stats Grid (Two Columns)
    const col1 = pageWidth / 2 - 30;
    const col2 = pageWidth / 2 + 30;
    const statBoxY = currentY;

    // Stat 1: Richness
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.text);
    doc.text(String(totalSpecies), col1, statBoxY, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);
    doc.text('ESPÉCIES', col1, statBoxY + 5, { align: 'center' });

    // Stat 2: Diversity (Genus)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.text);
    doc.text(String(totalGenus), col2, statBoxY, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textLight);
    doc.text('GÊNEROS', col2, statBoxY + 5, { align: 'center' });

    currentY += 25;

    // Metadata & References Block
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, currentY, pageWidth - 28, 35, 2, 2, 'F');
    doc.roundedRect(14, currentY, pageWidth - 28, 35, 2, 2, 'S');

    const metaStartY = currentY + 8;
    const metaLeft = 18;

    // Created By
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text);
    doc.text('Criado por:', metaLeft, metaStartY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    doc.text(family.created_by_name || 'Sistema', metaLeft + 20, metaStartY);

    // References
    if (family.fonte_referencia) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.text);
        doc.text('Referências:', metaLeft, metaStartY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.textLight);
        const refSnippet = family.fonte_referencia.split('\n')[0].substring(0, 80);
        doc.text(refSnippet + (family.fonte_referencia.length > 80 ? '...' : ''), metaLeft + 20, metaStartY + 6);
    }

    // Links
    if (family.link_referencia) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.text);
        doc.text('Links:', metaLeft, metaStartY + 12);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.primary);
        const links = family.link_referencia.split('\n').filter(l => l.trim());
        if (links.length > 0) {
            doc.text(links[0].substring(0, 80), metaLeft + 20, metaStartY + 12);
            if (links.length > 1) {
                doc.setFontSize(7);
                doc.setTextColor(COLORS.textLight);
                doc.text(`(+${links.length - 1} outros)`, metaLeft + 20, metaStartY + 16);
            }
        }
    }

    currentY += 45;

    // === SECTION: LEGACY NOMENCLATURE ===
    if (legacyNames.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(COLORS.primary);
        doc.text('Nomenclatura Legada', 14, currentY);
        currentY += 4;

        const legacyRows = legacyNames.map(l => [
            l.nome_legado,
            l.tipo || '-',
            l.fonte || '-'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Nome Legado', 'Tipo', 'Fonte']],
            body: legacyRows,
            styles: { fontSize: 8, cellPadding: 2, textColor: [55, 65, 81] },
            headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontStyle: 'bold' },
            margin: { left: 14, right: 14 },
            columnStyles: { 0: { fontStyle: 'italic' } }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // === SECTION: SPECIES LIST ===

    // Check space for Header
    if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary);
    doc.text('Lista de Espécies Catalogadas', 14, currentY);
    currentY += 6;

    if (totalSpecies > 0) {
        // Data prep: Genus, Epithet extracting
        const tableRows = speciesList.map(s => {
            const parts = (s.nome_cientifico || '').split(/\s+/);
            const genus = parts[0] || '';
            const epithet = parts[1] || '';
            return [
                s.nome_cientifico || '-',
                s.nome_popular || '-', // Using Popular name instead of Author for now as Author is not in SpeciesData interface usually?
                // Wait, SpeciesData has: nome_cientifico, nome_popular. 
                // User asked for: Species, Author, Genus, Epithet. 
                // Currently fetching: nome_cientifico, nome_popular.
                // I don't have Author column in Species table in this fetch.
                // I will stick to available data: Scientific, Popular, Genus, Epithet.
                genus,
                epithet
            ];
        });

        // Add table
        autoTable(doc, {
            startY: currentY,
            head: [['Nome Científico', 'Nome Popular', 'Gênero', 'Epíteto']],
            body: tableRows,
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

            margin: { top: 25, left: 14, right: 14 } // Ensure space for header on new pages
        });

    } else {
        // Empty State
        doc.setFillColor(243, 244, 246);
        doc.setDrawColor(209, 213, 219);
        doc.roundedRect(14, currentY, pageWidth - 28, 30, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.text);
        doc.text('Nenhuma espécie cadastrada para esta família.', pageWidth / 2, currentY + 12, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.textLight);
        doc.text('Sugestão: cadastre espécies manualmente ou importe um lote.', pageWidth / 2, currentY + 20, { align: 'center' });
    }

    // === FOOTER (All Pages) ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textLight);
        doc.text('Veridia Saber - Documento Confidencial', 14, pageHeight - 8);
        doc.text(`Pág. ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }

    doc.save(fileName);
}

interface FamiliesReportData {
    name: string;
    autoria_taxonomica?: string | null;
    count: number;
    createdAt: string;
}

/**
 * Generates the Families Report with Cover Page, Conditional Chart and Detailed Table
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

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Calculate Stats
    const totalFamilies = data.length;
    const totalSpecies = data.reduce((sum, d) => sum + d.count, 0);
    const familiesWithSpecies = data.filter(d => d.count > 0).length;
    const familiesWithoutSpecies = data.filter(d => d.count === 0).length;

    // === PAGE 1: COVER PAGE ===

    // Logo
    if (logoBase64) {
        try {
            // Centered logo
            const logoSize = 35;
            doc.addImage(logoBase64, 'PNG', (pageWidth - logoSize) / 2, 40, logoSize, logoSize);
        } catch (e) {
            // Ignore
        }
    }

    let currentY = 90;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(COLORS.primary);
    doc.text('Veridia Saber', pageWidth / 2, currentY, { align: 'center' });

    currentY += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(COLORS.textLight);
    doc.text('Relatório Geral de Famílias', pageWidth / 2, currentY, { align: 'center' });

    currentY += 10;
    doc.setFontSize(10);
    doc.text(`Gerado em: ${today}`, pageWidth / 2, currentY, { align: 'center' });

    // Stats Grid
    currentY += 40;
    const statsY = currentY;
    const col1 = pageWidth / 2 - 40;
    const col2 = pageWidth / 2 + 40;

    // Helper text function
    const drawStat = (label: string, value: number, x: number, y: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(COLORS.primary);
        doc.text(String(value), x, y, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(COLORS.textLight);
        doc.text(label, x, y + 6, { align: 'center' });
    };

    drawStat('Total de Famílias', totalFamilies, col1, statsY);
    drawStat('Total de Espécies', totalSpecies, col2, statsY);
    drawStat('Com Espécies', familiesWithSpecies, col1, statsY + 25);
    drawStat('Sem Espécies', familiesWithoutSpecies, col2, statsY + 25);

    // Bottom Info
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.text('Fonte de Dados: Flora do Brasil 2020 / SiBBr', pageWidth / 2, pageHeight - 40, { align: 'center' });

    const generatedBy = context.userName || context.userRole || 'Sistema';
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado por: ${generatedBy}`, pageWidth / 2, pageHeight - 30, { align: 'center' });


    // === PAGE 2: CHART (Optional) & TABLE ===
    doc.addPage();

    // Compact Header for Page 2+
    const subHeader = (d: jsPDF) => {
        const y = 15;
        d.setFont('helvetica', 'bold');
        d.setFontSize(10);
        d.setTextColor(COLORS.primary);
        d.text('Relatório Geral de Famílias', 14, y);

        d.setFont('helvetica', 'normal');
        d.setFontSize(8);
        d.setTextColor(COLORS.textLight);
        d.text(today, pageWidth - 14, y, { align: 'right' });

        d.setDrawColor(COLORS.primary);
        d.setLineWidth(0.5);
        d.line(14, y + 3, pageWidth - 14, y + 3);

        return y + 10;
    };

    let contentStartY = subHeader(doc);

    // Chart Logic
    if (totalSpecies > 0) {
        // Chart data: Top 15
        const chartItems: ChartDataItem[] = data.map(d => ({
            name: d.name,
            count: d.count
        }));

        // Draw the chart
        const chartEndY = drawHorizontalBarChart(
            doc,
            chartItems,
            contentStartY + 5,
            'Distribuição de Riqueza por Família (Top 15)'
        );

        contentStartY = chartEndY + 15;
    } else {
        // Warning Box
        doc.setFillColor(243, 244, 246); // Gray-100
        doc.setDrawColor(209, 213, 219); // Gray-300
        doc.roundedRect(14, contentStartY, pageWidth - 28, 20, 2, 2, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.text);
        doc.text('Ainda não há espécies catalogadas. O gráfico será exibido quando houver registros.', pageWidth / 2, contentStartY + 11, { align: 'center' });

        contentStartY += 30; // Space after warning
    }

    // Sort Data: Species Count DESC, then Name ASC
    const sortedTableData = [...data].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
    });

    // Prepare table data including Authorship
    const tableRows = sortedTableData.map(d => [
        d.name,
        d.autoria_taxonomica || '',
        d.count,
        d.createdAt
    ]);

    // Table Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text);
    doc.text('Lista Completa de Famílias', 14, contentStartY - 4);

    // Add table
    autoTable(doc, {
        startY: contentStartY,
        head: [['Família', 'Autoria', 'Nº Espécies', 'Data Cadastro']],
        body: tableRows,
        styles: {
            fontSize: 9,
            cellPadding: 4, // More padding/spacing
            textColor: [31, 41, 55],
        },
        headStyles: {
            fillColor: COLORS.headerBg,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left',
        },
        columnStyles: {
            0: { fontStyle: 'bold' }, // Family Name
            1: { fontStyle: 'italic', textColor: [107, 114, 128] }, // Authorship (Gray-500)
            2: { halign: 'center' },
            3: { halign: 'center' }
        },
        alternateRowStyles: {
            fillColor: COLORS.zebraRow,
        },
        margin: { top: 30, left: 14, right: 14 },
        tableLineColor: [229, 231, 235],
        tableLineWidth: 0.1,
        // Header on every page
        didDrawPage: (data) => {
            // Add header/footer to every page if needed (autoTable handles head repetition)
            // We just add our custom header if it's a new page?
            // Actually autoTable startY only affects first page.
            // We need to add the "Compact Header" on subsequent pages too?
            // autoTable has a didDrawPage hook.
            if (data.pageNumber > 2) { // Page 1 is Cover, Page 2 is Chart+Table. If Table goes to Page 3...
                subHeader(doc);
            }
        }
    });

    // Add footer to all pages (Page 1 footer is custom in Cover logic, but addFooter adds to ALL pages)
    // We should be careful. addFooter loop starts at 1.
    // The requirement: Page 1 has specific footer "Gerado por...". Page 2+ "Documento Confidencial...".
    // My implemented `addFooter` loops from 1 to pageCount.
    // I should modify `addFooter` to skip page 1 IF I want a custom one there, OR just overwrite/let it be.
    // Requirement says: "A partir da página 2... Rodapé...". 
    // So Page 1 should NOT have the standard footer. 

    // I need to use a custom footer loop here in this function since I can't easily modify the global `addFooter` without affecting other reports.
    // Or I just implement the loop here.

    const pageCount = doc.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textLight);
        doc.text('Veridia Saber - Documento Confidencial', 14, pageHeight - 8);
        doc.text(`Pág. ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }

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

// --- HERBARIUM LABEL TYPES ---

export interface HerbariumLabelData {
    scientificName: string;
    author?: string;
    family: string;
    popularName?: string;
    collector: string;
    collectorNumber?: string;
    date: string;
    location: string;
    notes: string;
    morphology?: string;
    habitat?: string;
    determinant: string;
    determinationDate?: string;
    coordinates?: string;
    tomboNumber?: number | string;
}

// --- HERBARIUM LABEL GENERATOR (Coimbra Style) ---

export const generateHerbariumLabels = (data: HerbariumLabelData[], fileName: string = 'etiquetas.pdf') => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const labelWidth = 90;
    const labelHeight = 130;
    const margin = 10;
    const gap = 10;

    let col = 0;
    let row = 0;

    data.forEach((item, index) => {
        if (index > 0 && index % 4 === 0) {
            doc.addPage();
            col = 0;
            row = 0;
        }

        const x = margin + col * (labelWidth + gap);
        const y = margin + row * (labelHeight + gap);

        // --- BORDER ---
        doc.setLineWidth(0.4);
        doc.rect(x, y, labelWidth, labelHeight);

        // --- HEADER ---
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.text('FLORA DO BRASIL', x + labelWidth / 2, y + 10, { align: 'center' });

        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text('Veridia Saber - Herbário Digital', x + labelWidth / 2, y + 15, { align: 'center' });

        doc.setLineWidth(0.2);
        doc.line(x + 5, y + 18, x + labelWidth - 5, y + 18);

        let currentY = y + 24;

        // --- FAMILY ---
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text(item.family.toUpperCase(), x + labelWidth / 2, currentY, { align: 'center' });
        currentY += 6;

        // --- SPECIE & AUTHOR ---
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(11);

        let nameText = item.scientificName;
        if (item.author) {
            nameText += ` ${item.author}`;
        }

        const specieLines = doc.splitTextToSize(nameText, labelWidth - 10);
        doc.text(specieLines, x + labelWidth / 2, currentY, { align: 'center' });
        currentY += (specieLines.length * 5) + 2;

        const leftBase = x + 5;
        const valueX = x + 18;
        const rightLimit = labelWidth - 20;

        // --- COMMON NAME ---
        if (item.popularName) {
            doc.setFont('times', 'normal');
            doc.setFontSize(10);
            const popText = `Nome Popular: ${item.popularName}`;
            const popLines = doc.splitTextToSize(popText, labelWidth - 10);
            doc.text(popLines, leftBase, currentY);
            currentY += (popLines.length * 5) + 2;
        } else {
            currentY += 2;
        }

        const lineHeight = 4.5;

        // --- DET ---
        doc.setFontSize(9);
        doc.setFont('times', 'bold');
        doc.text('Det.:', leftBase, currentY);
        doc.setFont('times', 'normal');
        let detText = item.determinant || 'Sistema Veridia';
        if (item.determinationDate) {
            detText += `  Data: ${item.determinationDate}`;
        }
        doc.text(detText, valueX, currentY);
        currentY += lineHeight;

        // --- LOC ---
        doc.setFont('times', 'bold');
        doc.text('Loc.:', leftBase, currentY);
        doc.setFont('times', 'normal');
        let locText = item.location;
        if (item.coordinates) {
            locText += `  ${item.coordinates}`;
        }
        const locLines = doc.splitTextToSize(locText, rightLimit);
        doc.text(locLines, valueX, currentY);
        currentY += (locLines.length * lineHeight);

        // --- HABITAT (Ecology) ---
        if (item.habitat) {
            doc.setFont('times', 'bold');
            doc.text('Hab.:', leftBase, currentY);
            doc.setFont('times', 'normal');
            const habLines = doc.splitTextToSize(item.habitat, rightLimit);
            doc.text(habLines, valueX, currentY);
            currentY += (habLines.length * lineHeight);
        }

        // --- DESC (Morphology + Notes) ---
        const descParts = [];
        if (item.morphology) descParts.push(item.morphology);
        if (item.notes) descParts.push(item.notes);

        if (descParts.length > 0) {
            doc.setFont('times', 'bold');
            doc.text('Descr.:', leftBase, currentY);
            doc.setFont('times', 'normal');

            const fullDesc = descParts.join('. ');
            const noteLines = doc.splitTextToSize(fullDesc, rightLimit);

            const footerStart = y + labelHeight - 14;
            const maxFreeHeight = footerStart - currentY;
            const maxLines = Math.floor(maxFreeHeight / lineHeight);

            let notesToPrint = noteLines;
            if (noteLines.length > maxLines) {
                notesToPrint = noteLines.slice(0, maxLines);
                if (notesToPrint.length > 0) {
                    const last = notesToPrint.length - 1;
                    if (notesToPrint[last].length > 3) {
                        notesToPrint[last] = notesToPrint[last].slice(0, -3) + '...';
                    }
                }
            }

            doc.text(notesToPrint, valueX, currentY);
            currentY += (notesToPrint.length * lineHeight);
        }

        // --- FOOTER (Collector, Number, Date) ---
        const footerY = y + labelHeight - 12;

        doc.setFont('times', 'bold');
        doc.text('Coll.:', leftBase, footerY);
        doc.setFont('times', 'normal');

        let colText = item.collector;
        if (item.collectorNumber) {
            colText += `  Nº: ${item.collectorNumber}`;
        }
        if (colText.length > 35) colText = colText.substring(0, 32) + '...';
        doc.text(colText, x + 14, footerY);

        doc.setFont('times', 'bold');
        doc.text('Data:', leftBase, footerY + 5);
        doc.setFont('times', 'normal');
        doc.text(item.date, x + 14, footerY + 5);

        // --- GRID ---
        col++;
        if (col >= 2) {
            col = 0;
            row++;
        }
    });

    doc.save(fileName);
};