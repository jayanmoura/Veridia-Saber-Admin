import type {
  CreatorRef,
  EspecieLocalRow,
  EspecieRow,
  FamiliaRow,
  FamilyRef,
  ImagemRow,
  ImageUrls,
  LocalRow,
} from './db';

export type { CreatorRef, FamilyRef, ImageUrls } from './db';

/**
 * @description Entidade Family (Família Botânica) consolidada, derivada de FamiliaRow.
 * Origens: useFamilies, Families.tsx, FamilyTable.tsx
 */
export type Family = Pick<FamiliaRow, 'id' | 'familia_nome'> &
  Partial<Omit<FamiliaRow, 'id' | 'familia_nome'>> & {
    // Campos derivados de join/agregação
    especie?: { count: number }[];
    quantidade_especies?: number; // campo derivado de join/mapeamento
    creator?: CreatorRef;
  };

/**
 * @description Entidade Species (Espécie) consolidada, derivada de EspecieRow.
 * Origens: useSpecies, useSpeciesForm, useSpeciesActions, types.ts, Species.tsx
 */
export type Species = {
  id?: EspecieRow['id'];
  codigo_vs?: EspecieRow['codigo_vs'] | null;
  nome_cientifico: EspecieRow['nome_cientifico'];
  autor?: EspecieRow['autor'];
  nome_popular?: EspecieRow['nome_popular'];
  familia_id?: EspecieRow['familia_id'];
  familia_custom?: EspecieRow['familia_custom'];
  descricao_especie?: EspecieRow['descricao_especie'];
  cuidados_agua?: EspecieRow['cuidados_agua'];
  cuidados_luz?: EspecieRow['cuidados_luz'];
  cuidados_nutrientes?: EspecieRow['cuidados_nutrientes'];
  cuidados_substrato?: EspecieRow['cuidados_substrato'];
  cuidados_temperatura?: EspecieRow['cuidados_temperatura'];
  local_id?: EspecieRow['local_id'];
  created_at?: EspecieRow['created_at'];
  created_by?: EspecieRow['created_by'];
  created_by_institution_id?: EspecieRow['created_by_institution_id'];
  created_by_name?: EspecieRow['created_by_name'];

  // Relações e Joins
  familia?: FamilyRef | null;
  imagens?: (ImageUrls & {
    id?: ImagemRow['id'];
    url_imagem: ImagemRow['url_imagem'];
    local_id?: ImagemRow['local_id'];
  })[] | null;
  especie_local?: {
    id?: EspecieLocalRow['id'];
    local_id?: EspecieLocalRow['local_id'];
    descricao_ocorrencia?: EspecieLocalRow['descricao_ocorrencia'];
    imagens?: ImageUrls[] | null;
  }[] | null;
  creator?: CreatorRef;
  locais?: Pick<LocalRow, 'nome'> & Partial<Pick<LocalRow, 'tipo'>>;
};

/**
 * @description Item retornado pela RPC buscar_especie_autocomplete.
 */
export interface SpeciesAutocompleteItem {
  id: string;
  nome_cientifico: string;
  autor?: string | null;
  nome_popular?: string | null;
  familia_id?: string | null;
}

/**
 * @description Entidade Specimen (Espécime/Registro de Campo) consolidada, derivada de EspecieLocalRow.
 * Origens: useSpecimens, SpecimensInspection, types.ts
 */
export type Specimen = {
  id: EspecieLocalRow['id'];
  local_id: EspecieLocalRow['local_id'];
  especie_id: EspecieLocalRow['especie_id'];
  institution_id?: EspecieLocalRow['institution_id'] | null;
  tombo_codigo?: EspecieLocalRow['tombo_codigo'] | null;
  tombo_num?: EspecieLocalRow['tombo_num'] | null;

  // Geolocalização
  latitude?: EspecieLocalRow['latitude'];
  longitude?: EspecieLocalRow['longitude'];
  detalhes_localizacao?: EspecieLocalRow['detalhes_localizacao'];

  // Atributos Botânicos
  descricao_ocorrencia?: EspecieLocalRow['descricao_ocorrencia'];
  nome_popular_local?: EspecieLocalRow['nome_popular_local'];
  morfologia?: EspecieLocalRow['morfologia'];
  habitat_ecologia?: EspecieLocalRow['habitat_ecologia'];

  // Coleta / Identificação
  coletor?: EspecieLocalRow['coletor'];
  numero_coletor?: EspecieLocalRow['numero_coletor'];
  determinador?: EspecieLocalRow['determinador'];
  data_determinacao?: EspecieLocalRow['data_determinacao'];

  // Metadados
  created_at?: EspecieLocalRow['created_at'];
  created_by?: EspecieLocalRow['created_by'];

  // Relações e Joins
  especie?: Species | (Pick<EspecieRow, 'nome_cientifico'> & Partial<Pick<EspecieRow, 'nome_popular'>> & {
    familia?: FamilyRef | null;
  });
  locais?: Partial<LocalRow>;
  imagens?: (ImageUrls & {
    id?: ImagemRow['id'];
    url_imagem: ImagemRow['url_imagem'];
  })[];

  // Campos planificados vindos de joins/mapeamento (ex: useSpecimens)
  nome_cientifico?: string; // campo derivado de join/mapeamento
  familia_nome?: string; // campo derivado de join/mapeamento
  url_imagem?: string; // campo derivado de join/mapeamento
  imageCount?: number; // campo derivado de join/mapeamento
};

/**
 * @description Entidade PeriodicReport (Relatório Periódico de Atividade).
 * Origem: tabela relatorios_periodicos
 */
export type PeriodicReportType = 'mensal' | 'bimestral' | 'semestral' | 'anual';

export interface PeriodicReportData {
  por_tabela?: Record<string, Record<string, number>>;
  total?: number;
  [key: string]: unknown;
}

export interface PeriodicReport {
  id: string | number;
  tipo: PeriodicReportType | string;
  ano: number;
  periodo_inicio: string;
  periodo_fim: string;
  periodo_label: string;
  dados: PeriodicReportData;
  gerado_em: string;
}
