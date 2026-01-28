
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COLORS } from './constants';
import { addFooter, addHeader, drawHorizontalBarChart, extractFirst, extractGenusAndEpithet, getBase64FromUrl, getLogoBase64, processChartData } from './core';
import type { ChartDataItem, PDFGeneratorContext, SingleSpeciesData, SpeciesReportData, SpeciesReportOptions } from './types';

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
    const MARGIN_BOTTOM = pageHeight - 35; // Safe area before footer
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const reportTitle = options.isGlobalReport
        ? 'Relatório Geral de Espécies'
        : `Relatório de Espécies - ${options.projectName || 'Projeto'} `;

    // --- Data Preparation ---
    // 1. Family Counts
    const familyCounts: Record<string, number> = {};
    species.forEach(s => {
        const fam = extractFirst(s.familia);
        const familyName = fam?.familia_nome || 'Sem Família';
        familyCounts[familyName] = (familyCounts[familyName] || 0) + 1;
    });
    const familyChartData: ChartDataItem[] = Object.entries(familyCounts)
        .map(([name, count]) => ({ name, count }));

    // 2. Genus & Epithet Data
    const { genusData, epithetData } = extractGenusAndEpithet(species);

    // 3. Location Counts (if global)
    const locationCounts: Record<string, number> = {};
    if (options.isGlobalReport) {
        species.forEach(s => {
            const loc = extractFirst(s.locais);
            const locName = loc?.nome || 'Não informado';
            locationCounts[locName] = (locationCounts[locName] || 0) + 1;
        });
    }

    // Stats
    const totalSpecies = species.length;
    const uniqueFamilies = Object.keys(familyCounts).length;
    const uniqueLocations = Object.keys(locationCounts).length;

    // Count species without common name
    const noCommonNameCount = species.filter(s => !s.nome_popular).length;

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

    currentY += 10;
    doc.setFontSize(10);
    doc.text(`Gerado em: ${today} `, pageWidth / 2, currentY, { align: 'center' });

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

    drawStat('Total de Espécies', totalSpecies, col1, statsY);
    drawStat('Total de Famílias', uniqueFamilies, col2, statsY);

    if (options.isGlobalReport) {
        drawStat('Total de Locais', uniqueLocations, col1, statsY + 25);
        drawStat('Sem Nome Popular', noCommonNameCount, col2, statsY + 25);
    } else {
        const uniqueGenera = genusData.length;
        drawStat('Gêneros Únicos', uniqueGenera, col1, statsY + 25);
        drawStat('Sem Nome Popular', noCommonNameCount, col2, statsY + 25);
    }

    // Bottom Info (Page 1)
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textLight);
    const sourceText = options.isGlobalReport ? 'Veridia Saber BD - Global' : `Veridia Saber BD - ${options.projectName} `;
    doc.text(`Fonte de Dados: ${sourceText} `, pageWidth / 2, pageHeight - 40, { align: 'center' });

    const generatedBy = context.userName || context.userRole || 'Sistema';
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado por: ${generatedBy} `, pageWidth / 2, pageHeight - 30, { align: 'center' });


    // === PAGE 2: CONTENT ===
    doc.addPage();

    // Compact Header for Page 2+
    const subHeader = (d: jsPDF) => {
        const y = 15;
        d.setFont('helvetica', 'bold');
        d.setFontSize(10);
        d.setTextColor(COLORS.primary);
        d.text(reportTitle, 14, y);

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

    if (totalSpecies > 0) {
        // --- Charts Section ---

        // Helper to check page break
        const ensureSpaceForChart = (heightNeeded: number = 80) => {
            if (contentStartY + heightNeeded > MARGIN_BOTTOM) {
                doc.addPage();
                contentStartY = subHeader(doc) + 5;
            }
        };

        // Chart 1: Families (Top 15)
        const processedFamilyData = processChartData(familyChartData, 15);
        contentStartY = drawHorizontalBarChart(
            doc,
            processedFamilyData,
            contentStartY + 5,
            'Distribuição por Família (Top 15)'
        );
        contentStartY += 10;

        // Chart 2: Genera (Top 10)
        if (genusData.length > 0) {
            ensureSpaceForChart();
            const processedGenusData = processChartData(genusData, 10);
            contentStartY = drawHorizontalBarChart(
                doc,
                processedGenusData,
                contentStartY,
                'Gêneros mais Frequentes (Top 10)'
            );
            contentStartY += 10;
        }

        // Chart 3: Epithets (Top 10)
        if (epithetData.length > 0) {
            ensureSpaceForChart();
            const processedEpithetData = processChartData(epithetData, 10);
            contentStartY = drawHorizontalBarChart(
                doc,
                processedEpithetData,
                contentStartY,
                'Epítetos mais Frequentes (Top 10)'
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
        doc.text('Ainda não há espécies catalogadas. Os gráficos serão exibidos quando houver registros.', pageWidth / 2, contentStartY + 11, { align: 'center' });

        contentStartY += 30;
    }

    // === SPECIES TABLE ===

    // Sort: Family ASC, then Name ASC
    const sortedSpecies = [...species].sort((a, b) => {
        const famA = extractFirst(a.familia)?.familia_nome || '';
        const famB = extractFirst(b.familia)?.familia_nome || '';
        if (famA !== famB) return famA.localeCompare(famB, 'pt-BR');

        const nameA = a.nome_cientifico || '';
        const nameB = b.nome_cientifico || '';
        return nameA.localeCompare(nameB, 'pt-BR');
    });

    const truncate = (str: string, maxLength: number) => {
        if (!str) return '-';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    };

    // Columns
    const columns = options.isGlobalReport
        ? ['Nome Científico', 'Nome Popular', 'Família', 'Local']
        : ['Nome Científico', 'Nome Popular', 'Família'];

    const tableData = sortedSpecies.map(s => {
        const fam = extractFirst(s.familia);
        const loc = extractFirst(s.locais);

        const row = [
            truncate(s.nome_cientifico || '-', 60),
            truncate(s.nome_popular || '-', 40),
            truncate(fam?.familia_nome || '-', 30)
        ];

        if (options.isGlobalReport) {
            row.push(truncate(loc?.nome || 'Veridia Saber BD', 30));
        }
        return row;
    });

    // Column Styles
    const colStyles: any = {
        0: { fontStyle: 'italic', cellWidth: 'auto' }, // Scientific
        1: { cellWidth: 40 }, // Pop
        2: { cellWidth: 40 }  // Fam
    };

    if (options.isGlobalReport) {
        colStyles[3] = { cellWidth: 35 }; // Local
    }

    // Header Title for Table
    // Check if we need a new page for the table header text if we are at bottom
    if (contentStartY > MARGIN_BOTTOM - 20) {
        doc.addPage();
        contentStartY = subHeader(doc) + 5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.text);
    doc.text('Lista Completa de Espécies', 14, contentStartY);
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
        columnStyles: colStyles,
        margin: { top: 25, left: 14, right: 14 },
        didDrawPage: (data) => {
            // Add SubHeader on every new page (Page 2 is handled by logic above, but subsequent pages need header)
            if (data.pageNumber > 2) {
                subHeader(doc);
            }
        }
    });

    // === FOOTER (Page 2+) ===
    // "Veridia Saber - Documento Confidencial"
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
        doc.text(`Pág.${i} de ${pageCount} `, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }

    // Save
    doc.save(fileName);
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
        doc.text(`${label}: `, marginLeft, currentY);

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
        title: 'Ficha Técnica'
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
        doc.text(`Projeto: ${local.nome} `, marginLeft, headerEndY + imageHeight + 5);
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
            const gpsText = `Lat: ${species.latitude || '-'} | Long: ${species.longitude || '-'} `;
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
