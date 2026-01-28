import jsPDF from 'jspdf';
import type { HerbariumLabelData } from './types';

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

        // --- TOMBO NUMBER ---
        if (item.tomboNumber) {
            doc.setFont('times', 'bold');
            doc.setFontSize(9);
            doc.text(`${item.tomboNumber}`, x + labelWidth - 5, y + 8, { align: 'right' });
        }

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
