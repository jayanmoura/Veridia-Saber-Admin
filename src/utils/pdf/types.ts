export interface PDFGeneratorOptions {
    title: string;
    subtitle?: string;
    generatedBy?: string;
    userRole?: string;
    columns: string[];
    data: (string | number)[][];
    fileName: string;
    orientation?: 'portrait' | 'landscape';
}

export interface PDFGeneratorContext {
    userName?: string;
    userRole?: string;
}

export interface ChartDataItem {
    name: string;
    count: number;
}

export interface SpeciesReportData {
    nome_cientifico: string;
    nome_popular?: string | null;
    familia?: { familia_nome: string } | { familia_nome: string }[] | null;
    locais?: { nome: string } | { nome: string }[] | null;
}

export interface SpeciesReportOptions {
    isGlobalReport: boolean;
    projectName?: string;
}

export interface SingleSpeciesData {
    id?: string;
    nome_cientifico: string;
    nome_popular?: string | null;
    descricao_especie?: string | null;
    cuidados_luz?: string | null;
    cuidados_agua?: string | null;
    cuidados_temperatura?: string | null;
    cuidados_substrato?: string | null;
    cuidados_nutrientes?: string | null;
    familia?: { familia_nome: string } | { familia_nome: string }[] | null;
    locais?: { nome: string } | { nome: string }[] | null;
    imagens?: { url_imagem: string }[] | null;
    // Local fields
    descricao_ocorrencia?: string | null;
    detalhes_localizacao?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface FamiliesReportData {
    name: string;
    autoria_taxonomica?: string | null;
    count: number;
    createdAt: string;
}

export interface SpeciesData {
    nome_cientifico?: string;
    nome_popular?: string;
}

export interface FamilyDetailedData {
    familia_nome: string;
    autoria_taxonomica?: string | null;
    fonte_referencia?: string | null;
    link_referencia?: string | null;
    created_at?: string | null;
    created_by_name?: string | null;
}

export interface LegacyNameData {
    nome_legado: string;
    tipo?: string | null;
    fonte?: string | null;
}

export interface HerbariumLabelData {
    scientificName: string;
    author?: string;
    family: string;
    popularName?: string;
    collector: string;
    collectorNumber?: string;
    date: string;
    location: string;
    notes: string;
    morphology?: string;
    habitat?: string;
    determinant: string;
    determinationDate?: string;
    coordinates?: string;
    tomboNumber?: number | string;
}

export interface ProjectSpecimenReportData {
    id: number | string;
    tombo: string;
    especie_nome_cientifico: string;
    familia_nome: string;
    coletor_nome: string;
    data_coleta: string;
    coords_lat?: number | null;
    coords_lng?: number | null;
    coords_status?: string | null;
    foto_url?: string | null;
    projeto_nome?: string;
}
