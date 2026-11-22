const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;
const NUMERIC_STRING_REGEX = /^-?\d+([.,]\d+)?$/;

/**
 * Escapa uma célula para CSV protegendo contra injeção de fórmulas em planilhas
 * (CSV injection) e envolvendo o valor resultante entre aspas duplas.
 */
export const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '""';
  }

  let text: string;

  if (
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    text = String(value);
  } else if (typeof value === 'object') {
    text = JSON.stringify(value) ?? '';
  } else {
    const str = String(value);
    if (NUMERIC_STRING_REGEX.test(str.trim())) {
      text = str;
    } else if (FORMULA_PREFIX_REGEX.test(str)) {
      text = `'${str}`;
    } else {
      text = str;
    }
  }

  return `"${text.replace(/"/g, '""')}"`;
};

/**
 * Constrói o conteúdo CSV (sem BOM) a partir de um array de objetos,
 * usando as chaves do primeiro objeto como cabeçalho.
 */
export const buildCSV = (data: Record<string, unknown>[]): string => {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.map((header) => escapeCsvCell(header)).join(',');
  const dataRows = data.map((row) =>
    headers.map((fieldName) => escapeCsvCell(row[fieldName])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

export const downloadCSV = (data: Record<string, unknown>[], filename: string): void => {
  if (!data.length) return;

  const csvContent = buildCSV(data);

  // Trigger download with BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
