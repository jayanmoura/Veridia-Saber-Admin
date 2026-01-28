import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COLORS } from './constants';
import { drawHorizontalBarChart, getLogoBase64, processChartData } from './core';
import type { ChartDataItem, PDFGeneratorContext, ProjectSpecimenReportData } from './types';

export function generateProjectSpecimensReport(
    specimens: ProjectSpecimenReportData[],
    fileName: string,
    options: { projectName: string; projectCode?: string; isGlobalReport?: boolean },
    context: PDFGeneratorContext = {}
): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const MARGIN_BOTTOM = pageHeight - 35;
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const reportTitle = 'Relatório de Espécimes do Projeto';
    const subTitle = options.projectCode
        ? `${options.projectName} (${options.projectCode})`
        : options.projectName;

    // --- Data Preparation ---

    // 1. Stats
    const totalSpecimens = specimens.length;

    // Count distinct
    const uniqueSpecies = new Set(specimens.map(s => s.especie_nome_cientifico)).size;
    const uniqueCollectors = new Set(specimens.map(s => s.coletor_nome)).size;
    const withCoords = specimens.filter(s =>
        (s.coords_lat !== null && s.coords_lat !== undefined) &&
        (s.coords_lng !== null && s.coords_lng !== undefined)
    ).length;

    // 2. Chart Data
    // Species distribution
    const speciesCounts: Record<string, number> = {};
    specimens.forEach(s => {
        const name = s.especie_nome_cientifico || 'Indeterminado';
        speciesCounts[name] = (speciesCounts[name] || 0) + 1;
    });
    const speciesChartData: ChartDataItem[] = Object.entries(speciesCounts)
        .map(([name, count]) => ({ name, count }));

    // Family distribution
    const familyCounts: Record<string, number> = {};
    specimens.forEach(s => {
        const name = s.familia_nome || 'Indeterminado';
        familyCounts[name] = (familyCounts[name] || 0) + 1;
    });
    const familyChartData: ChartDataItem[] = Object.entries(familyCounts)
        .map(([name, count]) => ({ name, count }));

    // Collector distribution
    const collectorCounts: Record<string, number> = {};
    specimens.forEach(s => {
        const name = s.coletor_nome || 'Sem Coletor';
        collectorCounts[name] = (collectorCounts[name] || 0) + 1;
    });
    const collectorChartData: ChartDataItem[] = Object.entries(collectorCounts)
        .map(([name, count]) => ({ name, count }));


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
    doc.text(reportTitle, pageWidth / 2, currentY, { align: 'center' });

    currentY += 8;
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.text(subTitle, pageWidth / 2, currentY, { align: 'center' });

    currentY += 10;
    doc.setFontSize(10);
    doc.setTextColor(COLORS.textLight);
    doc.text(`Gerado em: ${today}`, pageWidth / 2, currentY, { align: 'center' });

    // Stats Grid
    currentY += 35;
    const statsY = currentY;
    const col1 = pageWidth / 2 - 40;
    const col2 = pageWidth / 2 + 40;

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

    drawStat('Total de Espécimes', totalSpecimens, col1, statsY);
    drawStat('Espécies Únicas', uniqueSpecies, col2, statsY);
    drawStat('Coletores Únicos', uniqueCollectors, col1, statsY + 25);
    drawStat('Com Coordenadas', withCoords, col2, statsY + 25);

    // Bottom Info
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    doc.text('Fonte de Dados: Veridia Saber BD', pageWidth / 2, pageHeight - 40, { align: 'center' });

    const generatedBy = context.userName || context.userRole || 'Sistema';
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado por: ${generatedBy}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

    // === PAGE 2: CONTENT ===
    doc.addPage();

    // Compact Header for Page 2+
    const subHeader = (d: jsPDF) => {
        const y = 15;
        d.setFont('helvetica', 'bold');
        d.setFontSize(10);
        d.setTextColor(COLORS.primary);
        const headerTitle = `Relatório de Espécimes — ${options.projectName}`;
        d.text(headerTitle, 14, y);

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

    // --- Charts ---
    if (totalSpecimens > 0) {

        const ensureSpaceForChart = (heightNeeded: number = 80) => {
            if (contentStartY + heightNeeded > MARGIN_BOTTOM) {
                doc.addPage();
                contentStartY = subHeader(doc) + 5;
            }
        };

        // 1. Species Top 10
        const processedSpeciesData = processChartData(speciesChartData, 10);
        contentStartY = drawHorizontalBarChart(
            doc,
            processedSpeciesData,
            contentStartY + 5,
            'Distribuição por Espécie (Top 10)'
        );
        contentStartY += 10;

        // 2. Family Top 10
        ensureSpaceForChart();
        const processedFamilyData = processChartData(familyChartData, 10);
        contentStartY = drawHorizontalBarChart(
            doc,
            processedFamilyData,
            contentStartY,
            'Distribuição por Família (Top 10)'
        );
        contentStartY += 10;

        // 3. Collector Top 10 (Optional if space)
        if (collectorChartData.length > 0) {
            ensureSpaceForChart();
            const processedCollectorData = processChartData(collectorChartData, 10);
            contentStartY = drawHorizontalBarChart(
                doc,
                processedCollectorData,
                contentStartY,
                'Coletores mais Ativos (Top 10)'
            );
            contentStartY += 10;
        }

    } else {
        // Warning Box
        doc.setFillColor(243, 244, 246);
        doc.setDrawColor(209, 213, 219);
        doc.roundedRect(14, contentStartY, pageWidth - 28, 20, 2, 2, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.text);
        doc.text('Nenhum registro encontrado.', pageWidth / 2, contentStartY + 11, { align: 'center' });

        contentStartY += 30;
    }

    // === TABLE ===

    // Sort: Tombo ASC (fallback to Date DESC if no Tombo, but Tombo preferred)
    const sortedSpecimens = [...specimens].sort((a, b) => {
        const tA = a.tombo || '';
        const tB = b.tombo || '';
        return tA.localeCompare(tB, undefined, { numeric: true });
    });

    const columns = ['Tombo', 'Espécie', 'Família', 'Coletor', 'Data', 'GPS'];

    const truncate = (str: string, maxLength: number) => {
        if (!str) return '-';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    };

    const tableData = sortedSpecimens.map(s => {
        // Format date
        let dateStr = '-';
        if (s.data_coleta) {
            const dateObj = new Date(s.data_coleta);
            if (!isNaN(dateObj.getTime())) {
                dateStr = dateObj.toLocaleDateString('pt-BR');
            } else {
                dateStr = s.data_coleta; // Keep as string if invalid date obj but exists
            }
        }

        // GPS status
        const hasGPS = (s.coords_lat !== null && s.coords_lat !== undefined) &&
            (s.coords_lng !== null && s.coords_lng !== undefined);
        const gpsStatus = hasGPS ? 'GPS OK' : 'Sem GPS';

        return [
            s.tombo || '-',
            truncate(s.especie_nome_cientifico || 'Indeterminada', 50),
            truncate(s.familia_nome || 'Indeterminada', 30),
            truncate(s.coletor_nome || '-', 30),
            dateStr,
            gpsStatus
        ];
    });

    if (contentStartY > MARGIN_BOTTOM - 20) {
        doc.addPage();
        contentStartY = subHeader(doc) + 5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text);
    doc.text('Lista Completa de Espécimes', 14, contentStartY);
    contentStartY += 5;

    autoTable(doc, {
        startY: contentStartY,
        head: [columns],
        body: tableData,
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
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 35 }, // Tombo
            1: { fontStyle: 'italic', cellWidth: 'auto' }, // Species
            2: { cellWidth: 35 }, // Family
            3: { cellWidth: 35 }, // Collector
            4: { halign: 'center', cellWidth: 25 }, // Date
            5: { halign: 'center', cellWidth: 20 }, // GPS
        },
        margin: { top: 25, left: 14, right: 14 },
        didDrawPage: (data) => {
            if (data.pageNumber > 2) {
                subHeader(doc);
            }
        }
    });

    // === FOOTER ===
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
