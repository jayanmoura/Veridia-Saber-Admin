import { isGlobalRole, type UserRole } from '../types/auth';

export interface CanUploadSpeciesImagesParams {
  localId?: string | number | null;
  role?: string | null;
}

/**
 * Determina se é permitido fazer upload de imagem de espécie (Tipo A).
 *
 * Regras:
 * 1. Dentro de um local (localId preenchido): NÃO aceita foto nova de espécie (fotos entram pelo espécime - Tipo B).
 * 2. Fora de local (espécie global): upload de Tipo A permitido apenas para taxonomistas globais
 *    ('Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior').
 */
export function canUploadSpeciesImages({
  localId,
  role,
}: CanUploadSpeciesImagesParams): boolean {
  if (localId !== undefined && localId !== null && String(localId).trim() !== '') {
    return false;
  }
  if (!role) {
    return false;
  }
  return isGlobalRole(role as UserRole);
}
