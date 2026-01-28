import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COLORS } from './constants';
import { addFooter, addHeader, getLogoBase64 } from './core';
import type { PDFGeneratorContext, PDFGeneratorOptions } from './types';

/**
 * Standard PDF Generator for Generic Lists
 */
export function generatePDF(options: PDFGeneratorOptions, context: PDFGeneratorContext = {}): void {
    const doc = new jsPDF({
        orientation: options.orientation || 'portrait',
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

    // === PAGE 1: COVER PAGE ===

    // Logo
    const logo = getLogoBase64();
    if (logo) {
        try {
            const logoSize = 35;
            doc.addImage(logo, 'PNG', (pageWidth - logoSize) / 2, 40, logoSize, logoSize);
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
    doc.text(options.title, pageWidth / 2, currentY, { align: 'center' });

    if (options.subtitle) {
        currentY += 8;
        doc.setFontSize(12);
        doc.text(options.subtitle, pageWidth / 2, currentY, { align: 'center' });
    }

    currentY += 10;
    doc.setFontSize(10);
    doc.text(`Gerado em: ${today}`, pageWidth / 2, currentY, { align: 'center' });

    // Bottom Info
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.text('Fonte de Dados: Sistema Veridia Saber', pageWidth / 2, pageHeight - 40, { align: 'center' });

    const generatedBy = context.userName || context.userRole || 'Sistema';
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado por: ${generatedBy}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

    // === PAGE 2+: TABLE ===
    doc.addPage();

    // Compact Header function
    const subHeader = () => {
        const y = 15;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.primary);
        doc.text(options.title, 14, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textLight);
        doc.text(today, pageWidth - 14, y, { align: 'right' });

        doc.setDrawColor(COLORS.primary);
        doc.setLineWidth(0.5);
        doc.line(14, y + 3, pageWidth - 14, y + 3);

        return y + 10;
    };

    const headerY = subHeader();

    autoTable(doc, {
        startY: headerY,
        head: [options.columns],
        body: options.data,
        styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [31, 41, 55],
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: COLORS.headerBg,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: COLORS.zebraRow,
        },
        margin: { top: 25, left: 14, right: 14 },
        didDrawPage: (data) => {
            if (data.pageNumber > 2) {
                subHeader();
            }
        }
    });

    // Add footer to all pages (except page 1)
    const pageCount = doc.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textLight);
        doc.text('Veridia Saber - Documento Interno', 14, pageHeight - 8);
        doc.text(`Pág. ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }

    doc.save(options.fileName);
}

/**
 * Generates a detailed report with key-value pairs
 */
export function generateDetailedReport(
    title: string,
    details: Record<string, string | number>,
    fileName: string,
    context: PDFGeneratorContext = {}
): void {
    const doc = new jsPDF();

    // Uses shared header
    let currentY = addHeader(doc, {
        title,
        // fileName removed
    }, context);

    currentY += 10;

    // Simple Key-Value list
    doc.setFontSize(10);
    Object.entries(details).forEach(([key, value]) => {
        if (currentY > 270) {
            doc.addPage();
            currentY = addHeader(doc, { title }, context) + 10;
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.primary);
        doc.text(`${key}:`, 14, currentY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.text);
        doc.text(String(value), 60, currentY);

        currentY += 8;
    });

    // Add footer
    addFooter(doc);

    doc.save(fileName);
}
