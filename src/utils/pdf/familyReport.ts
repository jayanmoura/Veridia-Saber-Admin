import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COLORS } from './constants';
import { addFooter, addHeader, drawHorizontalBarChart, getLogoBase64 } from './core';
import type { ChartDataItem, FamiliesReportData, FamilyDetailedData, LegacyNameData, PDFGeneratorContext, SpeciesData } from './types';

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
    const logo = getLogoBase64();
    if (logo) {
        try {
            // Centered logo
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

    // === TABLE ===

    // Prepare table data
    const tableData = data.map(d => [
        d.name,
        d.autoria_taxonomica || '-',
        d.count,
        new Date(d.createdAt).toLocaleDateString('pt-BR')
    ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text);
    doc.text('Detalhamento por Família', 14, contentStartY);
    contentStartY += 5;

    autoTable(doc, {
        startY: contentStartY,
        head: [['Família', 'Autoria', 'Espécies', 'Cadastro']],
        body: tableData,
        styles: {
            fontSize: 10,
            cellPadding: 4,
            textColor: [31, 41, 55], // Gray-800
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
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 'auto', fontStyle: 'italic' },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 35 },
        },
        didDrawPage: (data) => {
            // Add SubHeader on every new page (Page 2 was handled manually, but if table splits...)
            if (data.pageNumber > 2) {
                subHeader(doc);
            }
        }
    });

    // Add footer to all pages (starting from 2)
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

/**
 * Generates a detailed breakdown for a SINGLE Family
 */
export function generateFamilyReportWithCharts(
    familyData: FamilyDetailedData,
    speciesList: SpeciesData[],
    legacyNames: LegacyNameData[],
    fileName: string,
    context: PDFGeneratorContext = {}
): void {
    const doc = new jsPDF();

    // 1. Header
    const headerY = addHeader(doc, {
        title: 'Relatório Detalhado de Família'
    }, context);

    let y = headerY + 10;

    // 2. Family Info Block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.primary);
    doc.text(familyData.familia_nome.toUpperCase(), 14, y);

    y += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.textLight);
    doc.text(familyData.autoria_taxonomica || 'Autoria desconhecida', 14, y);

    if (familyData.fonte_referencia) {
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Fonte: ${familyData.fonte_referencia}`, 14, y);
    }
    y += 15;

    // 3. Species List (AutoTable)
    const speciesRows = speciesList.map(s => [
        s.nome_cientifico || '-',
        s.nome_popular || '-'
    ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text);
    doc.text(`Espécies Vinculadas (${speciesList.length})`, 14, y);
    y += 6;

    if (speciesList.length > 0) {
        autoTable(doc, {
            startY: y,
            head: [['Nome Científico', 'Nome Popular']],
            body: speciesRows,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: COLORS.headerBg },
            columnStyles: {
                0: { fontStyle: 'italic', cellWidth: 100 }
            },
            margin: { left: 14, right: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.textLight);
        doc.text('Nenhuma espécie vinculada.', 14, y + 5);
        y += 20;
    }

    // 4. Legacy Names (AutoTable)
    if (legacyNames.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLORS.text);
        doc.text(`Histórico de Nomes (${legacyNames.length})`, 14, y);
        y += 6;

        const legacyRows = legacyNames.map(n => [
            n.nome_legado,
            n.tipo || '-',
            n.fonte || '-'
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Nome Anterior', 'Tipo', 'Fonte']],
            body: legacyRows,
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [100, 100, 100] }, // Gray for legacy
            margin: { left: 14, right: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Footer
    addFooter(doc);

    doc.save(fileName);
}
