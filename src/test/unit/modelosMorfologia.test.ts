import { describe, it, expect } from 'vitest';
import {
  getModeloOrgao,
  parteDoNo
} from '../../pages/landingpage/components/morfologia3d/modelosMorfologia';

describe('modelosMorfologia', () => {
  describe('getModeloOrgao', () => {
    it('retorna o modelo para "Raiz"', () => {
      const modelo = getModeloOrgao('Raiz');
      expect(modelo).not.toBeNull();
      expect(modelo?.titulo).toBe('Raiz de eudicotiledônea');
      expect(modelo?.url).toBe('/modelos3d/raiz.glb');
      expect(modelo?.partes).toHaveLength(6);
    });

    it('retorna null para "Caule" e string vazia ""', () => {
      expect(getModeloOrgao('Caule')).toBeNull();
      expect(getModeloOrgao('')).toBeNull();
    });
  });

  describe('parteDoNo', () => {
    const modeloRaiz = getModeloOrgao('Raiz')!;

    it('identifica partes por nome exato e prefixos', () => {
      expect(parteDoNo(modeloRaiz, 'coifa')?.id).toBe('coifa');
      expect(parteDoNo(modeloRaiz, 'pelos_absorventes')?.id).toBe('zona_pilifera');
      expect(parteDoNo(modeloRaiz, 'primordios_laterais')?.id).toBe('zona_ramificacao');
      expect(parteDoNo(modeloRaiz, 'raiz_secundaria_07')?.id).toBe('laterais');
      expect(parteDoNo(modeloRaiz, 'raiz_terciaria_12')?.id).toBe('laterais');
    });

    it('retorna null para nós não selecionáveis ou desconhecidos', () => {
      expect(parteDoNo(modeloRaiz, 'solo_aderido')).toBeNull();
      expect(parteDoNo(modeloRaiz, 'qualquer_coisa')).toBeNull();
    });
  });
});
