import { describe, it, expect } from 'vitest';
import { canUploadSpeciesImages } from '../../utils/permissions';
import type { UserRole } from '../../types/auth';

describe('canUploadSpeciesImages', () => {
  describe('com localId e qualquer papel = false', () => {
    const allRoles: UserRole[] = [
      'Curador Mestre',
      'Coordenador Científico',
      'Taxonomista Sênior',
      'Gestor de Acervo',
      'Taxonomista de Campo',
      'Consulente',
    ];

    it.each(allRoles)('retorna false quando localId é string preenchida para o papel %s', (role) => {
      expect(canUploadSpeciesImages({ localId: '123', role })).toBe(false);
    });

    it.each(allRoles)('retorna false quando localId é número para o papel %s', (role) => {
      expect(canUploadSpeciesImages({ localId: 42, role })).toBe(false);
    });
  });

  describe('sem localId e Curador/Coordenador/Tax. Sênior = true', () => {
    const globalRoles: UserRole[] = [
      'Curador Mestre',
      'Coordenador Científico',
      'Taxonomista Sênior',
    ];

    it.each(globalRoles)('retorna true quando localId é null para o papel %s', (role) => {
      expect(canUploadSpeciesImages({ localId: null, role })).toBe(true);
    });

    it.each(globalRoles)('retorna true quando localId é undefined para o papel %s', (role) => {
      expect(canUploadSpeciesImages({ localId: undefined, role })).toBe(true);
    });

    it.each(globalRoles)('retorna true quando localId é string vazia para o papel %s', (role) => {
      expect(canUploadSpeciesImages({ localId: '', role })).toBe(true);
    });
  });

  describe('sem localId e Gestor/Tax. de Campo/Consulente = false', () => {
    const nonGlobalRoles: UserRole[] = [
      'Gestor de Acervo',
      'Taxonomista de Campo',
      'Consulente',
    ];

    it.each(nonGlobalRoles)('retorna false mesmo sem localId para o papel %s', (role) => {
      expect(canUploadSpeciesImages({ localId: null, role })).toBe(false);
      expect(canUploadSpeciesImages({ localId: undefined, role })).toBe(false);
    });
  });

  describe('role ausente = false', () => {
    it('retorna false quando role é null', () => {
      expect(canUploadSpeciesImages({ localId: null, role: null })).toBe(false);
    });

    it('retorna false quando role é undefined', () => {
      expect(canUploadSpeciesImages({ localId: null, role: undefined })).toBe(false);
      expect(canUploadSpeciesImages({})).toBe(false);
    });

    it('retorna false quando role é string vazia', () => {
      expect(canUploadSpeciesImages({ localId: null, role: '' })).toBe(false);
    });
  });
});
