import { describe, it, expect } from 'vitest';
import { escapeCsvCell, buildCSV } from '../../utils/csvGenerator';

describe('csvGenerator', () => {
  describe('escapeCsvCell', () => {
    it('neutraliza fórmula iniciada por "=" e duplica aspas internas', () => {
      expect(escapeCsvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    });

    it('prefixa com aspa simples strings iniciadas por +, -, @, \\t e \\r', () => {
      expect(escapeCsvCell('+1')).toBe('"\'+1"');
      expect(escapeCsvCell('-cmd')).toBe('"\'-cmd"');
      expect(escapeCsvCell('@SUM(A1)')).toBe('"\'@SUM(A1)"');
      expect(escapeCsvCell('\tX')).toBe('"\'\tX"');
      expect(escapeCsvCell('\rX')).toBe('"\'\rX"');
    });

    it('mantém número negativo e string numérica negativa sem prefixo', () => {
      expect(escapeCsvCell(-22.5)).toBe('"-22.5"');
      expect(escapeCsvCell('-22.5')).toBe('"-22.5"');
      expect(escapeCsvCell(' -22,5 ')).toBe('" -22,5 "');
      expect(escapeCsvCell(0)).toBe('"0"');
    });

    it('retorna "" para null e undefined', () => {
      expect(escapeCsvCell(null)).toBe('""');
      expect(escapeCsvCell(undefined)).toBe('""');
    });

    it('duplica aspas internas em strings normais', () => {
      expect(escapeCsvCell('Espécie "rara"')).toBe('"Espécie ""rara"""');
    });

    it('serializa objetos com JSON.stringify e escapa aspas', () => {
      expect(escapeCsvCell({ a: 1 })).toBe('"{""a"":1}"');
    });
  });

  describe('buildCSV', () => {
    it('retorna string vazia para array vazio', () => {
      expect(buildCSV([])).toBe('');
    });

    it('gera cabeçalho e linhas na ordem certa sem BOM', () => {
      const csv = buildCSV([
        { Nome: 'Ipê', Latitude: -22.5, Nota: '=1+1' },
        { Nome: 'Aroeira', Latitude: 0, Nota: null },
      ]);

      expect(csv.startsWith('\uFEFF')).toBe(false);
      expect(csv).toBe(
        [
          '"Nome","Latitude","Nota"',
          '"Ipê","-22.5","\'=1+1"',
          '"Aroeira","0",""',
        ].join('\n')
      );
    });
  });
});
