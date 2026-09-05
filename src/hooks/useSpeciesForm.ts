import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/authContext';
import type { Species, SpeciesAutocompleteItem } from '../types/domain';

export interface FamilyOption {
  id: string;
  familia_nome: string;
}

export interface LocalOption {
  id: string;
  nome: string;
}

export interface LocalData {
  notas_projeto: string;
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

  // Autocomplete & Selected Species ID
  selectedEspecieId: string | null;
  setSelectedEspecieId: React.Dispatch<React.SetStateAction<string | null>>;
  suggestions: SpeciesAutocompleteItem[];
  isSearching: boolean;
  showSuggestions: boolean;
  selectedGlobalSpecies: SpeciesAutocompleteItem | null;
  searchSpecies: (query: string) => void;
  handleNameChange: (value: string) => void;
  handleSelectGlobalSpecies: (species: SpeciesAutocompleteItem) => void;
  handleClearSelection: () => void;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  isAutorReadOnly: boolean;
  isFamiliaReadOnly: boolean;
  hasExistingOverride: boolean;
  setHasExistingOverride: React.Dispatch<React.SetStateAction<boolean>>;

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
  notas_projeto: '',
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
 * @description Hook complexo para gestão do formulário de espécies, abas, autocomplete no banco global, geolocalização e permissões.
 *
 * @param {UseSpeciesFormOptions} options - Contexto de abertura
 * @param {Species | null} [options.initialData] - Inicializador do formulário (vazio para Create)
 * @param {boolean} options.isOpen - Indica se modal está ativo (liga os queries iniciais)
 *
 * @returns {UseSpeciesFormReturn} Estado farto do form unificado
 *   - `formData`, `setFormData` — state global da Form de espécie
 *   - `localData`, `setLocalData` — state da aba de Local (Especie_Local)
 *   - `families`, `locais` — tabelas base de options selects
 *   - `dataLoading` — block spinner central
 *   - `activeTab`, `setActiveTab` — navegação entre tab base / herbário
 *   - `searchSpecies`, `handleNameChange`, `handleSelectGlobalSpecies` — lógica de autocompletar nomes científicos do acervo do banco
 *   - `userRole`, `isGlobalAdmin`, `isProjectUser` — info roles
 *
 * @example
 * const { formData, handleNameChange, shouldLockGlobalFields } = useSpeciesForm({ isOpen: true })
 */
export function useSpeciesForm({ initialData, isOpen }: UseSpeciesFormOptions): UseSpeciesFormReturn {
  const { profile } = useAuth();

  // Form state
  const [formData, setFormData] = useState<Species>(INITIAL_FORM_DATA);
  const [localData, setLocalData] = useState<LocalData>(INITIAL_LOCAL_DATA);

  // Auxiliary data
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [locais, setLocais] = useState<LocalOption[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Autocomplete state
  const [selectedEspecieId, setSelectedEspecieId] = useState<string | null>(null);
  const [selectedGlobalSpecies, setSelectedGlobalSpecies] = useState<SpeciesAutocompleteItem | null>(null);
  const [suggestions, setSuggestions] = useState<SpeciesAutocompleteItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasExistingOverride, setHasExistingOverride] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived permissions
  const userRole = profile?.role || '';
  const isGlobalAdmin = userRole === 'Curador Mestre' || userRole === 'Coordenador Científico' || userRole === 'Taxonomista Sênior';
  const isSenior = userRole === 'Taxonomista Sênior';
  const isProjectUser = userRole === 'Gestor de Acervo' || userRole === 'Taxonomista de Campo';
  const isLocalUser = !isGlobalAdmin;
  const isEditingExisting = !!initialData?.id;
  const isGlobalSpecies = Boolean(selectedEspecieId);
  const shouldLockGlobalFields = isEditingExisting && isLocalUser;
  const isAutorReadOnly = Boolean(selectedEspecieId) || shouldLockGlobalFields;
  const isFamiliaReadOnly = Boolean(selectedEspecieId) || shouldLockGlobalFields;

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
        supabase.from('locais').select('id, nome').order('nome'),
      ]);

      setFamilies(familiesRes.data || []);
      setLocais(locaisRes.data || []);
    } catch (error) {
      console.error('Error loading auxiliary data:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Load local overrides for a species
  const loadLocalData = useCallback(async (speciesId: string, localId: string | null) => {
    if (!localId) {
      setLocalData(INITIAL_LOCAL_DATA);
      setHasExistingOverride(false);
      return;
    }

    try {
      const { data: overrideData, error: overrideError } = await supabase
        .from('especie_local_overrides')
        .select('descricao_especie, notas_projeto')
        .eq('especie_id', speciesId)
        .eq('local_id', localId)
        .maybeSingle();

      if (overrideError && overrideError.code !== 'PGRST116') {
        console.error('Error fetching local overrides:', overrideError);
        setHasExistingOverride(false);
        setLocalData(INITIAL_LOCAL_DATA);
      } else if (overrideData) {
        setHasExistingOverride(true);
        if (overrideData.descricao_especie !== null && overrideData.descricao_especie !== undefined) {
          setFormData(prev => ({
            ...prev,
            descricao_especie: overrideData.descricao_especie,
          }));
        }
        setLocalData({
          notas_projeto: overrideData.notas_projeto || '',
        });
      } else {
        setHasExistingOverride(false);
        setLocalData(INITIAL_LOCAL_DATA);
      }
    } catch (err) {
      console.error('Erro ao carregar overrides locais:', err);
      setLocalData(INITIAL_LOCAL_DATA);
      setHasExistingOverride(false);
    }
  }, []);

  // Search for existing species via RPC (autocomplete)
  const searchSpecies = useCallback(async (query: string) => {
    const termo = query.trim();
    if (termo.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('buscar_especie_autocomplete', { termo });

      if (error) {
        console.error('Erro ao buscar autocomplete de espécies via RPC:', error);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const results = (data || []) as SpeciesAutocompleteItem[];
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (err) {
      console.error('Erro inesperado ao buscar autocomplete de espécies:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle name input change with debounce
  const handleNameChange = useCallback((value: string) => {
    // Se o usuário alterar ou limpar o nome após selecionar uma sugestão,
    // reseta selectedEspecieId para null e destrava o campo autor
    if (selectedEspecieId) {
      const isMatch = selectedGlobalSpecies && value.trim().toLowerCase() === selectedGlobalSpecies.nome_cientifico.trim().toLowerCase();
      if (!isMatch) {
        setSelectedEspecieId(null);
        setSelectedGlobalSpecies(null);
      }
    }

    setFormData(prev => ({ ...prev, nome_cientifico: value }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      searchSpecies(trimmed);
    }, 300);
  }, [selectedEspecieId, selectedGlobalSpecies, searchSpecies]);

  // Handle selection of a global species from autocomplete
  const handleSelectGlobalSpecies = useCallback((species: SpeciesAutocompleteItem) => {
    setSelectedEspecieId(species.id);
    setSelectedGlobalSpecies(species);
    setFormData(prev => ({
      ...prev,
      nome_cientifico: species.nome_cientifico,
      nome_popular: species.nome_popular || '',
      autor: species.autor || '',
      familia_id: species.familia_id || prev.familia_id || '',
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  // Clear global species selection
  const handleClearSelection = useCallback(() => {
    setSelectedEspecieId(null);
    setSelectedGlobalSpecies(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setFormData({
      ...INITIAL_FORM_DATA,
      local_id: isLocalUser ? String(profile?.local_id || '') : '',
    });
  }, [isLocalUser, profile?.local_id]);

  // Reset form state
  const resetForm = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_DATA,
      local_id: isLocalUser ? String(profile?.local_id || '') : '',
    });
    setLocalData(INITIAL_LOCAL_DATA);
    setSelectedEspecieId(null);
    setSelectedGlobalSpecies(null);
    setHasExistingOverride(false);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [isLocalUser, profile?.local_id]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAuxiliaryData();

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
    selectedEspecieId,
    setSelectedEspecieId,
    suggestions,
    isSearching,
    showSuggestions,
    selectedGlobalSpecies,
    searchSpecies,
    handleNameChange,
    handleSelectGlobalSpecies,
    handleClearSelection,
    setShowSuggestions,
    isAutorReadOnly,
    isFamiliaReadOnly,
    hasExistingOverride,
    setHasExistingOverride,
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
    resetForm,
  };
}

