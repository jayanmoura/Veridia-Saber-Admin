import type { Tables, TablesInsert, TablesUpdate } from './database.types';
export type { Tables, TablesInsert, TablesUpdate };

export type EspecieRow = Tables<'especie'>;
export type EspecieLocalRow = Tables<'especie_local'>;
export type FamiliaRow = Tables<'familia'>;
export type ImagemRow = Tables<'imagens'>;
export type LocalRow = Tables<'locais'>;

export type EspecieInsert = Omit<TablesInsert<'especie'>, 'codigo_vs'> & { codigo_vs?: string };
export type EspecieLocalInsert = Omit<TablesInsert<'especie_local'>, 'tombo_codigo' | 'tombo_num'> & {
  tombo_codigo?: string;
  tombo_num?: number;
};

export const AUDITED_TABLES = [
  'conteudo_orgaos',
  'especie',
  'especie_local',
  'especie_local_overrides',
  'familia',
  'familia_nomenclatura_legado',
  'imagens',
  'locais',
  'profiles'
] as const;

export type AuditedTable = (typeof AUDITED_TABLES)[number];

export function isAuditedTable(name: string): name is AuditedTable {
  return (AUDITED_TABLES as readonly string[]).includes(name);
}

/**
 * Helper tipado para normalizar relacionamentos que podem vir como objeto único ou array (PostgREST).
 */
export function firstOrSelf<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

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

