import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============ TYPES ============
export interface Species {
    id?: string;
    nome_cientifico: string;
    autor?: string | null;
    nome_popular?: string | null;
    familia_id: string;
    descricao_especie?: string | null;
    cuidados_luz?: string | null;
    cuidados_agua?: string | null;
    cuidados_temperatura?: string | null;
    cuidados_substrato?: string | null;
    cuidados_nutrientes?: string | null;
    local_id?: string | null;
    created_at?: string | null;
    created_by?: string | null;
    creator?: { full_name: string } | { full_name: string }[] | null;
}

export interface FamilyOption {
    id: string;
    familia_nome: string;
}

export interface LocalOption {
    id: string;
    nome: string;
}

export interface LocalData {
    id?: number;
    descricao_ocorrencia: string;
    detalhes_localizacao: string;
    latitude: string;
    longitude: string;
    determinador: string;
    data_determinacao: string;
    coletor: string;
    numero_coletor: string;
    morfologia: string;
    habitat_ecologia: string;
}

export interface UseSpeciesFormOptions {
    initialData?: Species | null;
    isOpen: boolean;
}

export interface UseSpeciesFormReturn {
    // Form state
    formData: Species;
    setFormData: React.Dispatch<React.SetStateAction<Species>>;
    localData: LocalData;
    setLocalData: React.Dispatch<React.SetStateAction<LocalData>>;

    // Auxiliary data
    families: FamilyOption[];
    locais: LocalOption[];
    dataLoading: boolean;

    // Tab state
    activeTab: 'species' | 'label';
    setActiveTab: React.Dispatch<React.SetStateAction<'species' | 'label'>>;

    // Autocomplete
    suggestions: Species[];
    isSearching: boolean;
    showSuggestions: boolean;
    selectedGlobalSpecies: Species | null;
    searchSpecies: (query: string) => void;
    handleNameChange: (value: string) => void;
    handleSelectGlobalSpecies: (species: Species) => void;
    handleClearSelection: () => void;
    setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;

    // Geolocation
    geoLoading: boolean;
    handleGetLocation: () => void;

    // Permissions
    userRole: string;
    isGlobalSpecies: boolean;
    isEditingExisting: boolean;
    isGlobalAdmin: boolean;
    isSenior: boolean;
    isProjectUser: boolean;
    isLocalUser: boolean;
    shouldLockGlobalFields: boolean;
    getUserLocalName: () => string;

    // Actions
    loadAuxiliaryData: () => Promise<void>;
    loadLocalData: (speciesId: string, localId: string | null) => Promise<void>;
    resetForm: () => void;
}

const INITIAL_LOCAL_DATA: LocalData = {
    descricao_ocorrencia: '',
    detalhes_localizacao: '',
    latitude: '',
    longitude: '',
    determinador: '',
    data_determinacao: '',
    coletor: '',
    numero_coletor: '',
    morfologia: '',
    habitat_ecologia: ''
};

const INITIAL_FORM_DATA: Species = {
    nome_cientifico: '',
    autor: '',
    nome_popular: '',
    familia_id: '',
    descricao_especie: '',
    cuidados_luz: '',
    cuidados_agua: '',
    cuidados_temperatura: '',
    cuidados_substrato: '',
    cuidados_nutrientes: '',
    local_id: '',
};

/**
 * Hook for managing species form state, autocomplete, permissions, and auxiliary data.
 */
export function useSpeciesForm({ initialData, isOpen }: UseSpeciesFormOptions): UseSpeciesFormReturn {
    const { profile } = useAuth();

    // Form state
    const [formData, setFormData] = useState<Species>(INITIAL_FORM_DATA);
    const [localData, setLocalData] = useState<LocalData>(INITIAL_LOCAL_DATA);
    const [activeTab, setActiveTab] = useState<'species' | 'label'>('species');

    // Auxiliary data
    const [families, setFamilies] = useState<FamilyOption[]>([]);
    const [locais, setLocais] = useState<LocalOption[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<Species[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedGlobalSpecies, setSelectedGlobalSpecies] = useState<Species | null>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Geolocation
    const [geoLoading, setGeoLoading] = useState(false);

    // Derived permissions
    const userRole = profile?.role || '';
    const isGlobalAdmin = userRole === 'Curador Mestre' || userRole === 'Coordenador Científico' || userRole === 'Taxonomista Sênior';
    const isSenior = userRole === 'Taxonomista Sênior';
    const isProjectUser = userRole === 'Gestor de Acervo' || userRole === 'Taxonomista de Campo';
    const isLocalUser = !isGlobalAdmin;
    const isEditingExisting = !!initialData?.id;
    const isGlobalSpecies = !!selectedGlobalSpecies;
    const shouldLockGlobalFields = (isEditingExisting && isLocalUser) || isGlobalSpecies;

    // Get user's local name for display
    const getUserLocalName = useCallback((): string => {
        if (!profile?.local_id) return 'Sem permissão de local';
        if (locais.length === 0) return 'Carregando...';
        const userLocal = locais.find(l => String(l.id) === String(profile.local_id));
        return userLocal?.nome || `Projeto ${profile.local_id}`;
    }, [profile?.local_id, locais]);

    // Load auxiliary data (families and locations)
    const loadAuxiliaryData = useCallback(async () => {
        setDataLoading(true);
        try {
            const [familiesRes, locaisRes] = await Promise.all([
                supabase.from('familia').select('id, familia_nome').order('familia_nome'),
                supabase.from('locais').select('id, nome').order('nome')
            ]);

            setFamilies(familiesRes.data || []);
            setLocais(locaisRes.data || []);
        } catch (error) {
            console.error('Error loading auxiliary data:', error);
        } finally {
            setDataLoading(false);
        }
    }, []);

    // Load local data for a species
    const loadLocalData = useCallback(async (speciesId: string, localId: string | null) => {
        if (!localId) {
            setLocalData(INITIAL_LOCAL_DATA);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('especie_local')
                .select('id, descricao_ocorrencia, details_localizacao:detalhes_localizacao, latitude, longitude, determinador, data_determinacao, coletor, numero_coletor, morfologia, habitat_ecologia')
                .eq('especie_id', speciesId)
                .eq('local_id', localId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching local data:', error);
                setLocalData(INITIAL_LOCAL_DATA);
                return;
            }

            if (data) {
                setLocalData({
                    id: data.id,
                    descricao_ocorrencia: data.descricao_ocorrencia || '',
                    detalhes_localizacao: data.details_localizacao || '',
                    latitude: data.latitude ? String(data.latitude) : '',
                    longitude: data.longitude ? String(data.longitude) : '',
                    determinador: data.determinador || '',
                    data_determinacao: data.data_determinacao || '',
                    coletor: data.coletor || '',
                    numero_coletor: data.numero_coletor || '',
                    morfologia: data.morfologia || '',
                    habitat_ecologia: data.habitat_ecologia || ''
                });
            } else {
                setLocalData(INITIAL_LOCAL_DATA);
            }
        } catch (err) {
            console.error('Erro ao carregar dados locais:', err);
            setLocalData(INITIAL_LOCAL_DATA);
        }
    }, []);

    // Search for existing species (autocomplete)
    const searchSpecies = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('especie')
                .select('id, nome_cientifico, nome_popular, familia_id, descricao_especie, cuidados_luz, cuidados_agua, cuidados_temperatura, cuidados_substrato, cuidados_nutrientes, familia:familia_id(familia_nome)')
                .is('local_id', null)
                .ilike('nome_cientifico', `%${query}%`)
                .limit(5);

            if (error) throw error;
            setSuggestions(data || []);
            setShowSuggestions((data || []).length > 0);
        } catch (err) {
            console.error('Erro ao buscar espécies:', err);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Handle name input change with debounce
    const handleNameChange = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, nome_cientifico: value }));

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchSpecies(value);
        }, 300);
    }, [searchSpecies]);

    // Handle selection of a global species
    const handleSelectGlobalSpecies = useCallback((species: Species) => {
        setSelectedGlobalSpecies(species);
        setFormData(prev => ({
            ...prev,
            id: species.id,
            nome_cientifico: species.nome_cientifico,
            nome_popular: species.nome_popular || '',
            familia_id: species.familia_id,
            descricao_especie: species.descricao_especie || '',
            cuidados_luz: species.cuidados_luz || '',
            cuidados_agua: species.cuidados_agua || '',
            cuidados_temperatura: species.cuidados_temperatura || '',
            cuidados_substrato: species.cuidados_substrato || '',
            cuidados_nutrientes: species.cuidados_nutrientes || '',
        }));
        setSuggestions([]);
        setShowSuggestions(false);
    }, []);

    // Clear global species selection
    const handleClearSelection = useCallback(() => {
        setSelectedGlobalSpecies(null);
        setFormData({
            ...INITIAL_FORM_DATA,
            local_id: isLocalUser ? String(profile?.local_id || '') : '',
        });
    }, [isLocalUser, profile?.local_id]);

    // Handle geolocation
    const handleGetLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert('Geolocalização não suportada pelo navegador.');
            return;
        }
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocalData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6)
                }));
                setGeoLoading(false);
            },
            (error) => {
                alert('Erro ao obter localização: ' + error.message);
                setGeoLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // Reset form state
    const resetForm = useCallback(() => {
        setFormData({
            ...INITIAL_FORM_DATA,
            local_id: isLocalUser ? String(profile?.local_id || '') : '',
        });
        setLocalData(INITIAL_LOCAL_DATA);
        setSelectedGlobalSpecies(null);
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveTab('species');
    }, [isLocalUser, profile?.local_id]);

    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            loadAuxiliaryData();
            setActiveTab('species');

            if (initialData) {
                setFormData({
                    nome_cientifico: initialData.nome_cientifico || '',
                    autor: initialData.autor || '',
                    nome_popular: initialData.nome_popular || '',
                    familia_id: initialData.familia_id || '',
                    descricao_especie: initialData.descricao_especie || '',
                    cuidados_luz: initialData.cuidados_luz || '',
                    cuidados_agua: initialData.cuidados_agua || '',
                    cuidados_temperatura: initialData.cuidados_temperatura || '',
                    cuidados_substrato: initialData.cuidados_substrato || '',
                    cuidados_nutrientes: initialData.cuidados_nutrientes || '',
                    local_id: initialData.local_id || '',
                });
            } else {
                resetForm();
            }
        }
    }, [isOpen, initialData, loadAuxiliaryData, resetForm]);

    return {
        formData,
        setFormData,
        localData,
        setLocalData,
        families,
        locais,
        dataLoading,
        activeTab,
        setActiveTab,
        suggestions,
        isSearching,
        showSuggestions,
        selectedGlobalSpecies,
        searchSpecies,
        handleNameChange,
        handleSelectGlobalSpecies,
        handleClearSelection,
        setShowSuggestions,
        geoLoading,
        handleGetLocation,
        userRole,
        isGlobalSpecies,
        isEditingExisting,
        isGlobalAdmin,
        isSenior,
        isProjectUser,
        isLocalUser,
        shouldLockGlobalFields,
        getUserLocalName,
        loadAuxiliaryData,
        loadLocalData,
        resetForm
    };
}
