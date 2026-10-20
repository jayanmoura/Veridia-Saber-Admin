import { pickSpeciesThumbnail, type ImageCandidate } from './speciesThumbnail';

export interface PlantLocation {
  id: number;
  latitude: number;
  longitude: number;
  species_name: string;
  family_name: string;
  project_id: number;
  project_name: string;
  image?: string;
  project_lat?: number;
  project_lng?: number;
  tombo: string | null;
  nome_popular: string | null;
  coletor: string | null;
  created_at: string | null;
  created_by: string | null;
  cadastrado_por: string | null;
}

export interface RawPlantRow {
  id: number;
  latitude: number | string;
  longitude: number | string;
  local_id: number;
  tombo_codigo?: string | null;
  nome_popular_local?: string | null;
  coletor?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  imagens?: ImageCandidate[] | null;
  especie?: {
    nome_cientifico?: string | null;
    nome_popular?: string | null;
    familia?: { familia_nome?: string | null } | { familia_nome?: string | null }[] | null;
    imagens?: ImageCandidate[] | null;
  } | {
    nome_cientifico?: string | null;
    nome_popular?: string | null;
    familia?: { familia_nome?: string | null } | { familia_nome?: string | null }[] | null;
    imagens?: ImageCandidate[] | null;
  }[] | null;
  locais?: {
    nome?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | {
    nome?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  }[] | null;
}

/**
 * Mapeia uma linha de espécime (especie_local + joins) para PlantLocation do Mapa dos Projetos.
 * Prioriza fotos Tipo B (do espécime) com fallback para fotos Tipo A (da espécie) via pickSpeciesThumbnail.
 */
export function mapSpecimenToPlantLocation(
  item: RawPlantRow,
  profileNames?: ReadonlyMap<string, string>,
): PlantLocation {
  const especie = Array.isArray(item.especie) ? item.especie[0] : item.especie;
  const familia = Array.isArray(especie?.familia) ? especie?.familia[0] : especie?.familia;
  const locais = Array.isArray(item.locais) ? item.locais[0] : item.locais;

  const thumbResult = pickSpeciesThumbnail({
    specimenImages: item.imagens,
    speciesImages: especie?.imagens,
  });

  const createdBy = item.created_by || null;
  const coletor = item.coletor || null;
  const nomePerfil = createdBy ? profileNames?.get(createdBy) : null;
  const cadastradoPor = nomePerfil || coletor || 'Não informado';

  return {
    id: item.id,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    species_name: especie?.nome_cientifico || 'Espécie Desconhecida',
    family_name: familia?.familia_nome || 'Sem Família',
    project_id: item.local_id,
    project_name: locais?.nome || 'Projeto Desconhecido',
    project_lat: locais?.latitude ? Number(locais.latitude) : undefined,
    project_lng: locais?.longitude ? Number(locais.longitude) : undefined,
    image: thumbResult?.thumb || undefined,
    tombo: item.tombo_codigo || null,
    nome_popular: especie?.nome_popular || item.nome_popular_local || null,
    coletor,
    created_at: item.created_at || null,
    created_by: createdBy,
    cadastrado_por: cadastradoPor,
  };
}
