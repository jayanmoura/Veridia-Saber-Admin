import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COLORS } from './constants';
import { addFooter, getLogoBase64 } from './core';
import type { PeriodicReport } from '../../types/domain';

/**
 * Utilitário client-side para geração do PDF de Relatório Periódico de Atividade.
 */
export function generatePeriodicActivityReport(report: PeriodicReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const periodStart = formatDate(report.periodo_inicio);
  const periodEnd = formatDate(report.periodo_fim);
  const generatedAt = formatDateTime(report.gerado_em);

  // === CABEÇALHO INSTITUCIONAL ===
  let currentY = 16;

  // Logo institucional
  const logo = getLogoBase64();
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 14, 11, 16, 16);
    } catch {
      // Ignora erro se logo não estiver disponível
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.text('Veridia Saber', 34, currentY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.textLight);
  doc.text('Sistema de Gestão de Acervo Botânico', 34, currentY + 8);

  // Linha divisória verde
  currentY = 32;
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(14, currentY, pageWidth - 14, currentY);

  // === TÍTULO E SUBTÍTULO ===
  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(COLORS.primary);
  doc.text(`Relatório de Atividade — ${report.periodo_label}`, 14, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(COLORS.textLight);
  doc.text(`Período: ${periodStart} a ${periodEnd}  |  Gerado em: ${generatedAt}`, 14, currentY);

  // === PREPARAÇÃO DOS DADOS DA TABELA ===
  const porTabela = report.dados?.por_tabela || {};
  const tables = Object.keys(porTabela).sort();

  // Coleta de todas as ações presentes
  const actionTypesSet = new Set<string>();
  tables.forEach((tbl) => {
    const actions = porTabela[tbl] || {};
    Object.keys(actions).forEach((act) => actionTypesSet.add(act));
  });

  // Ordenação preferencial das ações: INSERT, UPDATE, DELETE
  const preferredOrder = ['INSERT', 'UPDATE', 'DELETE'];
  const sortedActionTypes = Array.from(actionTypesSet).sort((a, b) => {
    const idxA = preferredOrder.indexOf(a);
    const idxB = preferredOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const actionColumns = sortedActionTypes.length > 0 ? sortedActionTypes : ['INSERT', 'UPDATE', 'DELETE'];

  // Cabeçalho da tabela
  const tableHead = [['Tabela', ...actionColumns, 'Total']];

  // Linhas da tabela e somatórios para o rodapé
  const totalsByAction: Record<string, number> = {};
  actionColumns.forEach((act) => {
    totalsByAction[act] = 0;
  });
  let grandTotal = 0;

  const tableBody = tables.map((tbl) => {
    const actions = porTabela[tbl] || {};
    let rowTotal = 0;
    const rowValues = actionColumns.map((act) => {
      const count = actions[act] || 0;
      rowTotal += count;
      totalsByAction[act] += count;
      return count.toLocaleString('pt-BR');
    });
    grandTotal += rowTotal;
    return [tbl, ...rowValues, rowTotal.toLocaleString('pt-BR')];
  });

  // Linha de total geral no fim
  const tableFoot = [
    [
      'Total Geral',
      ...actionColumns.map((act) => (totalsByAction[act] || 0).toLocaleString('pt-BR')),
      grandTotal.toLocaleString('pt-BR'),
    ],
  ];

  // === RENDERIZAÇÃO DA TABELA (AUTOTABLE) ===
  const columnStylesRecord: Record<number, { halign: 'right' | 'left'; fontStyle?: 'bold' | 'normal' }> = {};
  actionColumns.forEach((_, idx) => {
    columnStylesRecord[idx + 1] = { halign: 'right' };
  });
  columnStylesRecord[actionColumns.length + 1] = { halign: 'right', fontStyle: 'bold' };

  autoTable(doc, {
    startY: currentY + 6,
    head: tableHead,
    body: tableBody.length > 0 ? tableBody : [['Nenhuma alteração registrada no período', ...actionColumns.map(() => '-'), '-']],
    foot: tableFoot,
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
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
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: [6, 78, 59],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: columnStylesRecord,
    margin: { top: 20, left: 14, right: 14, bottom: 20 },
  });

  // Rodapé em todas as páginas
  addFooter(doc);

  const cleanLabel = report.periodo_label.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Relatorio_Atividade_${cleanLabel}_${report.ano}.pdf`;
  doc.save(fileName);
}
