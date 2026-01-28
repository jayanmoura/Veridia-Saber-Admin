export interface Species {
    id: string;
    nome_cientifico: string;
    autor?: string | null;
    nome_popular?: string | null;
    familia?: {
        id: number | string;
        familia_nome: string;
    } | null;
    imagens?: {
        url_imagem: string;
    }[] | null;
    created_at?: string;
    // Add other fields as needed mainly for reading
}

export interface Specimen {
    id: number;
    tombo_codigo?: string | null;
    // Foreign Keys
    especie_id: string;
    local_id: number;
    institution_id?: string | null;

    // Location
    latitude: number | null;
    longitude: number | null;
    detalhes_localizacao?: string | null;

    // Attributes
    descricao_ocorrencia?: string | null;
    nome_popular_local?: string | null;
    morfologia?: string | null;
    habitat_ecologia?: string | null;

    // Context / Collection Data
    coletor?: string | null;
    numero_coletor?: string | null;
    determinador?: string | null;
    data_determinacao?: string | null; // or Date

    // Metadata
    created_at: string;
    created_by?: string | null;

    // Joined Data (from Species)
    especie?: Species;

    // Joined Data (from Project/Local)
    locais?: {
        id: number;
        nome: string;
        latitude?: number | null;
        longitude?: number | null;
        institution_id?: string | null;
    };

    // Joined Data (from Images)
    imagens?: {
        url_imagem: string;
    }[];
}

export interface SpecimenFilters {
    localId?: number | string;
    especieId?: string;
    limit?: number;
    withCoordinates?: boolean;
}
