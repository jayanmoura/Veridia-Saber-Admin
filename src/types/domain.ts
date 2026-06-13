/**
 * Definições canônicas das entidades de domínio do Veridia Saber.
 * Unifica campos encontrados nos hooks, páginas e serviços para garantir compatibilidade.
 */

/**
 * @description Entidade Family (Família Botânica) consolidada.
 * Origens: useFamilies, Families.tsx, FamilyTable.tsx
 */
export interface Family {
    id: string;
    familia_nome: string;
    autoria_taxonomica?: string | null;
    imagem_referencia?: string | null;
    imagem_thumbnail?: string | null;
    imagem_micro?: string | null;
    especie?: { count: number }[];
    quantidade_especies?: number;
    caracteristicas?: string | null;
    descricao_familia?: string | null;
    fonte_referencia?: string | null;
    link_referencia?: string | null;
    created_at?: string | null;
    created_by?: string | null;
    created_by_name?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

/**
 * @description Entidade Species (Espécie) consolidada.
 * Origens: useSpecies, useSpeciesForm, useSpeciesActions, types.ts, Species.tsx
 */
export interface Species {
    id?: string;
    codigo_vs?: string | null;
    nome_cientifico: string;
    autor?: string | null;
    nome_popular?: string | null;
    familia_id?: string;
    familia?: { id?: string | number; familia_nome: string } | null;
    descricao_especie?: string | null;
    cuidados_luz?: string | null;
    cuidados_agua?: string | null;
    cuidados_temperatura?: string | null;
    cuidados_substrato?: string | null;
    cuidados_nutrientes?: string | null;
    local_id?: string | null;
    imagens?: { 
        id?: string;
        url_imagem: string; 
        url_thumbnail?: string | null; 
        url_micro?: string | null;
        local_id?: string | number | null;
    }[] | null;
    created_at?: string | null;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
    locais?: { nome: string; tipo?: string };
}

/**
 * @description Entidade Specimen (Espécime/Registro de Campo) consolidada.
 * Origens: useSpecimens, SpecimensInspection, types.ts
 */
export interface Specimen {
    id: string | number;
    tombo_codigo?: string | null;
    especie_id: string;
    local_id: string | number;
    institution_id?: string | null;
    
    // Geolocalização
    latitude?: number | null;
    longitude?: number | null;
    detalhes_localizacao?: string | null;
    
    // Atributos Botânicos
    descricao_ocorrencia?: string | null;
    nome_popular_local?: string | null;
    morfologia?: string | null;
    habitat_ecologia?: string | null;
    
    // Coleta / Identificação
    coletor?: string | null;
    numero_coletor?: string | null;
    determinador?: string | null;
    data_determinacao?: string | null;
    
    // Metadados
    created_at?: string;
    created_by?: string | null;
    
    // Relações e Joins
    especie?: Species | {
        nome_cientifico: string;
        nome_popular?: string | null;
        familia?: { familia_nome: string };
    };
    
    // Campos planificados vindos de joins (ex: useSpecimens)
    nome_cientifico?: string;
    familia_nome?: string;
    url_imagem?: string;
    
    locais?: {
        id?: number;
        nome?: string;
        tipo?: string;
        latitude?: number | null;
        longitude?: number | null;
        institution_id?: string | null;
    };
    
    imagens?: {
        id?: string;
        url_imagem: string;
        url_thumbnail?: string | null;
        url_micro?: string | null;
    }[];
    imageCount?: number;
}
