import type { Tables } from './database.types';

export type EspecieRow = Tables<'especie'>;
export type EspecieLocalRow = Tables<'especie_local'>;
export type FamiliaRow = Tables<'familia'>;
export type ImagemRow = Tables<'imagens'>;
export type LocalRow = Tables<'locais'>;

/**
 * URLs das imagens derivadas de ImagemRow.
 * url_imagem é parcial/opcional para cobrir joins e candidatos onde a imagem principal pode ser ausente/nula.
 */
export type ImageUrls = {
  url_imagem?: ImagemRow['url_imagem'] | null;
  url_thumbnail?: ImagemRow['url_thumbnail'];
  url_micro?: ImagemRow['url_micro'];
};

/**
 * Referência resumida à família botânica em joins de espécie/espécime.
 */
export type FamilyRef = Partial<Pick<FamiliaRow, 'id'>> & Pick<FamiliaRow, 'familia_nome'>;

/**
 * Metadados do criador/autor do registro (join auth/perfis).
 */
export type CreatorRef = { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
