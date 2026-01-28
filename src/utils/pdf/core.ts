import jsPDF from 'jspdf';
import { COLORS } from './constants';
import type { ChartDataItem, PDFGeneratorContext, PDFGeneratorOptions } from './types';

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

export function getLogoBase64(): string | null {
    return logoBase64;
}

/**
 * Adds the corporate header to the PDF document
 */
export function addHeader(doc: jsPDF, options: Pick<PDFGeneratorOptions, 'title' | 'subtitle'>, context: PDFGeneratorContext): number {
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
export function addFooter(doc: jsPDF): void {
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
 * Draws a horizontal bar chart on the PDF
 */
export function drawHorizontalBarChart(
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
export function extractGenusAndEpithet(speciesList: Array<{ nome_cientifico?: string }>): {
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
export function processChartData(data: ChartDataItem[], topN: number = 10): ChartDataItem[] {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const topItems = sorted.slice(0, topN);
    const othersCount = sorted.slice(topN).reduce((sum, item) => sum + item.count, 0);

    const result = [...topItems];
    if (othersCount > 0) {
        result.push({ name: 'Outros', count: othersCount });
    }
    return result;
}

// Helper to extract single value from possibly array response
export function extractFirst<T>(data: T | T[] | null | undefined): T | null {
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
}

/**
 * Helper function to fetch image and convert to base64 for PDF embedding
 */
export async function getBase64FromUrl(url: string): Promise<string | null> {
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

// Initialize logo on module load (client-side only)
if (typeof window !== 'undefined') {
    initializePDFLogo();
}
