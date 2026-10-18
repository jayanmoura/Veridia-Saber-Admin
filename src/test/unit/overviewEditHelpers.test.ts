import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../lib/supabase');
import { mockSupabaseResponse } from '../mocks/supabase';
import { supabase } from '../../lib/supabase';
import { speciesRepo } from '../../services/speciesRepo';
import { familyRepo } from '../../services/familyRepo';

describe('Helpers de busca para edição (BUG 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('speciesRepo.getFullSpeciesForEdit', () => {
    it('busca dados completos da espécie com joins esperados', async () => {
      const mockSpecies = {
        id: 'sp-1',
        nome_cientifico: 'Paubrasilia echinata',
        descricao_especie: 'Árvore nativa',
        familia: { familia_nome: 'Fabaceae' },
        imagens: [{ url_imagem: 'https://img.com/full.jpg', local_id: null }],
      };

      mockSupabaseResponse('especie', 'single', { data: mockSpecies, error: null });

      const result = await speciesRepo.getFullSpeciesForEdit('sp-1');

      expect(supabase.from).toHaveBeenCalledWith('especie');
      expect(result).toEqual(mockSpecies);
    });

    it('lança erro se a query falhar', async () => {
      mockSupabaseResponse('especie', 'single', { data: null, error: new Error('DB error') });

      await expect(speciesRepo.getFullSpeciesForEdit('sp-1')).rejects.toThrow('DB error');
    });
  });

  describe('familyRepo.getFamilyById', () => {
    it('busca dados completos da família com contagem de espécies', async () => {
      const mockFamily = {
        id: 'fam-1',
        familia_nome: 'Fabaceae',
        descricao_familia: 'Família das leguminosas',
        especie: [{ count: 12 }],
      };

      mockSupabaseResponse('familia', 'single', { data: mockFamily, error: null });

      const result = await familyRepo.getFamilyById('fam-1');

      expect(supabase.from).toHaveBeenCalledWith('familia');
      expect(result).toEqual(mockFamily);
    });

    it('lança erro se a query falhar', async () => {
      mockSupabaseResponse('familia', 'single', { data: null, error: new Error('DB error') });

      await expect(familyRepo.getFamilyById('fam-1')).rejects.toThrow('DB error');
    });
  });
});
