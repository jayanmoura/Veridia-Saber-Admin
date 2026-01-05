import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Upload, Loader2, Leaf, Image as ImageIcon, Trash2 } from 'lucide-react';

interface Species {
    id?: string;
    nome_cientifico: string;
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

interface FamilyOption {
    id: string;
    familia_nome: string;
}

interface LocalOption {
    id: string;
    nome: string;
}

interface SpeciesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData?: Species | null;
}

export function SpeciesModal({ isOpen, onClose, onSave, initialData }: SpeciesModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Auxiliary data
    const [families, setFamilies] = useState<FamilyOption[]>([]);
    const [locais, setLocais] = useState<LocalOption[]>([]);

    // Image handling
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<{ id: string; url_imagem: string; creditos: string | null }[]>([]);
    const [editedCredits, setEditedCredits] = useState<{ [id: string]: string }>({});
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state (global species data)
    const [formData, setFormData] = useState<Species>({
        nome_cientifico: '',
        nome_popular: '',
        familia_id: '',
        descricao_especie: '',
        cuidados_luz: '',
        cuidados_agua: '',
        cuidados_temperatura: '',
        cuidados_substrato: '',
        cuidados_nutrientes: '',
        local_id: '',
    });

    // Local data state (project-specific notes in especie_local)
    const [localData, setLocalData] = useState<{
        descricao_ocorrencia: string;
        detalhes_localizacao: string;
        latitude: string;
        longitude: string;
    }>({
        descricao_ocorrencia: '',
        detalhes_localizacao: '',
        latitude: '',
        longitude: ''
    });

    // Geolocation loading state
    const [geoLoading, setGeoLoading] = useState(false);

    // Autocomplete state for global species search
    const [suggestions, setSuggestions] = useState<Species[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedGlobalSpecies, setSelectedGlobalSpecies] = useState<Species | null>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Derived: Is this a global species being linked to a project?
    const isGlobalSpecies = !!selectedGlobalSpecies;

    // Flag to check if we're editing an existing species (global fields become read-only for non-admins)
    const isEditingExisting = !!initialData?.id;

    // Check user roles
    const userRole = profile?.role || '';

    // Global admins can edit ALL global fields
    const isGlobalAdmin = userRole === 'Curador Mestre' || userRole === 'Coordenador Científico' || userRole === 'Taxonomista Sênior';
    const isSenior = userRole === 'Taxonomista Sênior';

    // Project users see "Notas do Projeto" field and have read-only global fields when editing
    const isProjectUser = userRole === 'Gestor de Acervo' || userRole === 'Taxonomista de Campo';

    // Local user = anyone who is not a global admin (can't edit global data on existing species)
    const isLocalUser = !isGlobalAdmin;

    // Determine if fields should be locked (editing existing species as non-admin OR selecting a global species)
    const shouldLockGlobalFields = (isEditingExisting && isLocalUser) || isGlobalSpecies;

    // Search for existing species (autocomplete)
    const searchSpecies = async (query: string) => {
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
                .is('local_id', null) // Only global species
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
    };

    // Handle input change with debounce
    const handleNameChange = (value: string) => {
        setFormData(prev => ({ ...prev, nome_cientifico: value }));

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search
        searchTimeoutRef.current = setTimeout(() => {
            searchSpecies(value);
        }, 300);
    };

    // Handle selection of a global species
    const handleSelectGlobalSpecies = (species: any) => {
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
    };

    // Clear global species selection
    const handleClearSelection = () => {
        setSelectedGlobalSpecies(null);
        setFormData({
            nome_cientifico: '',
            nome_popular: '',
            familia_id: '',
            descricao_especie: '',
            cuidados_luz: '',
            cuidados_agua: '',
            cuidados_temperatura: '',
            cuidados_substrato: '',
            cuidados_nutrientes: '',
            local_id: isLocalUser ? String(profile?.local_id || '') : '',
        });
    };



    // Get user's local name for display when locked
    const getUserLocalName = (): string => {
        if (!profile?.local_id) return 'Sem permissão de local';
        // If locais not loaded yet, show loading indicator
        if (locais.length === 0) return 'Carregando...';
        // Compare both as strings to handle type mismatch (number vs string)
        const userLocal = locais.find(l => String(l.id) === String(profile.local_id));
        // If not found, show the local_id as fallback
        return userLocal?.nome || `Projeto ${profile.local_id}`;
    };

    // Load auxiliary data
    useEffect(() => {
        if (isOpen) {
            loadAuxiliaryData();
        }
    }, [isOpen]);

    // Reset form when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    nome_cientifico: initialData.nome_cientifico || '',
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
                // Load existing images and local data if editing
                if (initialData.id) {
                    const currentLocalId = initialData.local_id || (isLocalUser ? profile?.local_id : null);
                    loadExistingImages(initialData.id, currentLocalId ? String(currentLocalId) : null);
                    loadLocalData(initialData.id, currentLocalId ? String(currentLocalId) : null);
                }
            } else {
                // For new species:
                // - Global admins: null (Veridia Saber BD Global)
                // - Local users: their assigned local_id
                setFormData({
                    nome_cientifico: '',
                    nome_popular: '',
                    familia_id: '',
                    descricao_especie: '',
                    cuidados_luz: '',
                    cuidados_agua: '',
                    cuidados_temperatura: '',
                    cuidados_substrato: '',
                    cuidados_nutrientes: '',
                    local_id: isLocalUser ? String(profile?.local_id || '') : '',
                });
                setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '', latitude: '', longitude: '' });
                setExistingImages([]);
            }
            setImageFiles([]);
            setImagePreviews([]);
        }
    }, [isOpen, initialData, isLocalUser]);

    const loadAuxiliaryData = async () => {
        setDataLoading(true);
        try {
            // Load families
            const { data: familiesData } = await supabase
                .from('familia')
                .select('id, familia_nome')
                .order('familia_nome');

            setFamilies(familiesData || []);

            // Load locations
            const { data: locaisData } = await supabase
                .from('locais')
                .select('id, nome')
                .order('nome');

            setLocais(locaisData || []);
        } catch (error) {
            console.error('Error loading auxiliary data:', error);
        } finally {
            setDataLoading(false);
        }
    };

    // Load images filtered by local_id (project scope) or all (global scope)
    const loadExistingImages = async (speciesId: string, localId: string | null) => {
        let query = supabase
            .from('imagens')
            .select('id, url_imagem, creditos')
            .eq('especie_id', speciesId);

        // Filter by local_id if in project context
        if (localId) {
            query = query.eq('local_id', localId);
        }

        const { data } = await query;

        if (data) {
            setExistingImages(data.map(img => ({
                id: img.id,
                url_imagem: img.url_imagem,
                creditos: img.creditos || null
            })));
            // Initialize editedCredits with current values
            const credits: { [id: string]: string } = {};
            data.forEach(img => {
                credits[img.id] = img.creditos || '';
            });
            setEditedCredits(credits);
        }
    };

    // Load project-specific local data from especie_local
    const loadLocalData = async (speciesId: string, localId: string | null) => {
        if (!localId) {
            setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '', latitude: '', longitude: '' });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('especie_local')
                .select('descricao_ocorrencia, detalhes_localizacao, latitude, longitude')
                .eq('especie_id', speciesId)
                .eq('local_id', localId)
                .maybeSingle();

            if (error) {
                // Table may not exist yet - ignore silently
                setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '', latitude: '', longitude: '' });
                return;
            }

            if (data) {
                setLocalData({
                    descricao_ocorrencia: data.descricao_ocorrencia || '',
                    detalhes_localizacao: data.detalhes_localizacao || '',
                    latitude: data.latitude ? String(data.latitude) : '',
                    longitude: data.longitude ? String(data.longitude) : ''
                });
            } else {
                setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '', latitude: '', longitude: '' });
            }
        } catch (err) {
            setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '', latitude: '', longitude: '' });
        }
    };

    // Image handling
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (files: File[]) => {
        const imageFilesOnly = files.filter(f => f.type.startsWith('image/'));

        // Create previews
        const newPreviews = imageFilesOnly.map(file => URL.createObjectURL(file));

        setImageFiles(prev => [...prev, ...imageFilesOnly]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    /**
     * Extract storage path and bucket from full URL
     * Supports both 'imagens-plantas' (global) and 'arquivos-gerais' (project) buckets
     */
    const extractStorageInfo = (url: string): { bucket: string; path: string } | null => {
        try {
            // Check for imagens-plantas bucket
            const imagensMatch = url.match(/\/imagens-plantas\/(.+)$/);
            if (imagensMatch) {
                return { bucket: 'imagens-plantas', path: imagensMatch[1] };
            }

            // Check for arquivos-gerais bucket
            const arquivosMatch = url.match(/\/arquivos-gerais\/(.+)$/);
            if (arquivosMatch) {
                return { bucket: 'arquivos-gerais', path: arquivosMatch[1] };
            }

            return null;
        } catch {
            return null;
        }
    };

    // Delete existing image from storage and database
    const handleDeleteExistingImage = async (imageId: string, imageUrl: string) => {
        try {
            // 1. Remove from storage (detect bucket from URL)
            const storageInfo = extractStorageInfo(imageUrl);
            if (storageInfo) {
                await supabase.storage
                    .from(storageInfo.bucket)
                    .remove([storageInfo.path]);
            }

            // 2. Remove from database
            const { error: dbError } = await supabase
                .from('imagens')
                .delete()
                .eq('id', imageId);

            if (dbError) {
                throw dbError;
            }

            // 3. Update local state
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            setEditedCredits(prev => {
                const updated = { ...prev };
                delete updated[imageId];
                return updated;
            });

        } catch (error: any) {
            console.error('Erro ao excluir imagem:', error);
            alert('Erro ao excluir imagem: ' + (error.message || 'Erro desconhecido'));
        }
    };

    /**
     * Upload images with hybrid bucket strategy:
     * - NEW global species (crowdsourcing) -> 'imagens-plantas' bucket (persists globally)
     * - Project context (occurrences/field notes) -> 'arquivos-gerais' bucket (tied to project lifecycle)
     * 
     * Path structure for project images: locais/{projectId}/imagens/{speciesName}/{file}
     */
    const uploadImages = async (
        speciesId: string,
        options: {
            isCreatingNewGlobalSpecies: boolean;
            projectId: string | null;
            speciesName: string;
        }
    ): Promise<string[]> => {
        const urls: string[] = [];

        // Sanitize species name for folder path (consistent with user request)
        const sanitizedSpeciesName = options.speciesName
            ? options.speciesName.trim().replace(/\s+/g, '_').toLowerCase()
            : 'sem_nome';

        for (const file of imageFiles) {
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(7);

            let bucket: string;
            let filePath: string;

            if (options.isCreatingNewGlobalSpecies || !options.projectId) {
                // GLOBAL SPECIES CONTEXT: Upload to 'imagens-plantas' bucket
                bucket = 'imagens-plantas';
                filePath = `especies/${speciesId}/${timestamp}_${randomSuffix}.${fileExt}`;
            } else {
                // PROJECT CONTEXT: Upload to 'arquivos-gerais' bucket
                bucket = 'arquivos-gerais';
                // Path: locais/{projectId}/imagens/{sanitizedSpeciesName}/{file}
                filePath = `locais/${options.projectId}/imagens/${sanitizedSpeciesName}/${timestamp}_${randomSuffix}.${fileExt}`;
            }

            const { error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) {
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            urls.push(publicUrl);
        }

        return urls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome_cientifico.trim()) {
            alert('O nome científico é obrigatório.');
            return;
        }
        if (!formData.familia_id) {
            alert('Selecione uma família.');
            return;
        }

        setLoading(true);

        try {
            let speciesId = initialData?.id || (isGlobalSpecies ? selectedGlobalSpecies?.id : undefined);
            const effectiveLocalId = formData.local_id || (isLocalUser ? String(profile?.local_id || '') : null);

            // CASE 1: LINKING GLOBAL SPECIES TO LOCAL PROJECT
            if (isGlobalSpecies && selectedGlobalSpecies?.id) {
                speciesId = selectedGlobalSpecies.id;
                // Don't create new species, just link to especie_local below
            }
            // CASE 2: EDITING EXISTING SPECIES
            else if (isEditingExisting && speciesId) {
                // Global fields are read-only for local users, so we don't update especie table
                // Only global admins can update global data

                if (isGlobalAdmin) {
                    // Global admin CAN update species data
                    const dataToSave = {
                        nome_cientifico: formData.nome_cientifico.trim(),
                        nome_popular: formData.nome_popular?.trim() || null,
                        familia_id: formData.familia_id,
                        descricao_especie: formData.descricao_especie?.trim() || null,
                        cuidados_luz: formData.cuidados_luz?.trim() || null,
                        cuidados_agua: formData.cuidados_agua?.trim() || null,
                        cuidados_temperatura: formData.cuidados_temperatura?.trim() || null,
                        cuidados_substrato: formData.cuidados_substrato?.trim() || null,
                        cuidados_nutrientes: formData.cuidados_nutrientes?.trim() || null,
                        local_id: isSenior ? null : (formData.local_id || null),
                    };

                    const { error } = await supabase
                        .from('especie')
                        .update(dataToSave)
                        .eq('id', speciesId);

                    if (error) throw error;
                }
                // For local users, the global data remains unchanged

            }
            // CASE 3: CREATING NEW SPECIES (not linking global, not editing)
            else if (!isGlobalSpecies) {
                // All global data goes to especie table
                const dataToSaveNew = {
                    nome_cientifico: formData.nome_cientifico.trim(),
                    nome_popular: formData.nome_popular?.trim() || null,
                    familia_id: formData.familia_id,
                    descricao_especie: formData.descricao_especie?.trim() || null,
                    cuidados_luz: formData.cuidados_luz?.trim() || null,
                    cuidados_agua: formData.cuidados_agua?.trim() || null,
                    cuidados_temperatura: formData.cuidados_temperatura?.trim() || null,
                    cuidados_substrato: formData.cuidados_substrato?.trim() || null,
                    cuidados_nutrientes: formData.cuidados_nutrientes?.trim() || null,
                    local_id: isSenior ? null : effectiveLocalId,
                    created_by_institution_id: profile?.institution_id || null,
                    created_by: profile?.id || null,
                };

                const { data, error } = await supabase
                    .from('especie')
                    .insert(dataToSaveNew)
                    .select('id')
                    .single();

                if (error) throw error;
                speciesId = data.id;
            }

            // SAVE LOCAL DATA (especie_local) - project-specific notes
            if (effectiveLocalId && speciesId) {
                // Determine the correct institution_id
                let targetInstitutionId = profile?.institution_id;

                // Fallback: If user profile has no institution_id, try to get it from the local/project
                if (!targetInstitutionId) {
                    try {
                        const { data: localData } = await supabase
                            .from('locais')
                            .select('institution_id')
                            .eq('id', effectiveLocalId)
                            .single();

                        if (localData?.institution_id) {
                            targetInstitutionId = localData.institution_id;
                            // console.log('[DEBUG] Usando institution_id do projeto (fallback):', targetInstitutionId);
                        }
                    } catch (err) {
                        console.warn('Erro ao buscar fallback de instituição:', err);
                    }
                }

                if (!targetInstitutionId) {
                    console.warn('[DEBUG] ABORTANDO: user profile sem institution_id e fallback falhou');
                    alert('Erro: Seu perfil de usuário não está vinculado a uma instituição e não foi possível identificar a instituição do projeto.\n\nContate o administrador para atualizar seu cadastro.');
                } else {
                    const { error: localError } = await supabase
                        .from('especie_local')
                        .upsert({
                            especie_id: speciesId,
                            local_id: effectiveLocalId,
                            descricao_ocorrencia: localData.descricao_ocorrencia?.trim() || null,
                            detalhes_localizacao: localData.detalhes_localizacao?.trim() || null,
                            latitude: localData.latitude ? parseFloat(localData.latitude) : null,
                            longitude: localData.longitude ? parseFloat(localData.longitude) : null,
                            institution_id: targetInstitutionId
                        }, {
                            onConflict: 'especie_id,local_id'
                        });

                    if (localError) {
                        console.error('Erro ao salvar dados locais:', localError);
                        if (localError.code === '42501') {
                            alert('Erro de Permissão (RLS): O banco de dados bloqueou o salvamento. Seu usuário precisa que o "institution_id" esteja correto no perfil.');
                        } else {
                            alert(`Erro ao salvar notas locais: ${localError.message}`);
                        }
                    }
                }
            }

            // Upload new images if any
            if (imageFiles.length > 0 && speciesId) {
                // Determine upload context:
                // - Creating NEW global species (not linking existing global, not editing) -> global bucket
                // - Working in project context (linking, editing, or adding local images) -> project bucket
                // Uma espécie só é "global" se NÃO tiver projectId associado
                const isCreatingNewGlobalSpecies = !isGlobalSpecies && !isEditingExisting && !effectiveLocalId;

                const imageUrls = await uploadImages(speciesId, {
                    isCreatingNewGlobalSpecies,
                    projectId: effectiveLocalId,
                    speciesName: formData.nome_cientifico
                });

                // Insert image references WITH local_id for project scope
                const imageRecords = imageUrls.map(url => ({
                    especie_id: speciesId,
                    url_imagem: url,
                    local_id: effectiveLocalId, // Required for project images!
                    institution_id: profile?.institution_id || null,
                }));

                if (imageRecords.length > 0) {
                    await supabase.from('imagens').insert(imageRecords);
                }
            }

            // Update credits for existing images
            const creditUpdates = Object.entries(editedCredits)
                .filter(([imgId, newCredits]) => {
                    const original = existingImages.find(img => img.id === imgId);
                    return original && (original.creditos || '') !== newCredits;
                })
                .map(([imgId, newCredits]) =>
                    supabase
                        .from('imagens')
                        .update({ creditos: newCredits || null })
                        .eq('id', imgId)
                );

            if (creditUpdates.length > 0) {
                await Promise.all(creditUpdates);
                // console.log(`[DEBUG] ${creditUpdates.length} créditos de imagens atualizados`);
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error('Save error:', error);
            alert(error.message || 'Erro ao salvar espécie.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Editar Espécie' : 'Nova Espécie'}
                        </h2>
                        <p className="text-sm text-gray-500">Preencha os dados taxonômicos e de cultivo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-160px)]">
                    {dataLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-emerald-600" size={32} />
                        </div>
                    ) : (
                        <div className="p-6 space-y-8">
                            {/* Section 1: Taxonomy */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Leaf size={16} className="text-emerald-600" />
                                    Taxonomia e Identificação
                                    {shouldLockGlobalFields && (
                                        <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">
                                            🔒 Campos globais (somente leitura)
                                        </span>
                                    )}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Família <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.familia_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, familia_id: e.target.value }))}
                                            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                            required
                                            disabled={shouldLockGlobalFields}
                                        >
                                            <option value="">Selecione uma família...</option>
                                            {families.map(fam => (
                                                <option key={fam.id} value={fam.id}>{fam.familia_nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {!isSenior && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Local de Ocorrência
                                            </label>
                                            {(userRole === 'Curador Mestre' || userRole === 'Coordenador Científico') ? (
                                                <select
                                                    value={formData.local_id || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, local_id: e.target.value }))}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                                                >
                                                    <option value="">Veridia Saber BD (Global)</option>
                                                    {locais.map(loc => (
                                                        <option key={loc.id} value={loc.id}>{loc.nome}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed">
                                                    {getUserLocalName()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nome Científico <span className="text-red-500">*</span>
                                            {isGlobalSpecies && (
                                                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-2">
                                                    🔗 Espécie do catálogo global
                                                </span>
                                            )}
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.nome_cientifico}
                                                onChange={(e) => !shouldLockGlobalFields && handleNameChange(e.target.value)}
                                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                className={`flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all italic ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder={isProjectUser ? "Digite para buscar ou criar nova..." : "Ex: Justicia brandegeeana"}
                                                required
                                                readOnly={shouldLockGlobalFields}
                                            />
                                            {isGlobalSpecies && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearSelection}
                                                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                                    title="Limpar seleção"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        {/* Autocomplete Dropdown */}
                                        {showSuggestions && !isEditingExisting && isProjectUser && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {isSearching ? (
                                                    <div className="p-3 text-center text-gray-500 flex items-center justify-center gap-2">
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Buscando...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="px-3 py-2 bg-gray-50 border-b text-xs text-gray-500 font-medium">
                                                            Espécies encontradas no catálogo global:
                                                        </div>
                                                        {suggestions.map((species) => (
                                                            <button
                                                                key={species.id}
                                                                type="button"
                                                                onClick={() => handleSelectGlobalSpecies(species)}
                                                                className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-b-0"
                                                            >
                                                                <div className="font-medium text-gray-900 italic">
                                                                    {species.nome_cientifico}
                                                                </div>
                                                                {species.nome_popular && (
                                                                    <div className="text-sm text-gray-500">
                                                                        {species.nome_popular}
                                                                    </div>
                                                                )}
                                                                {(species as any).familia?.familia_nome && (
                                                                    <div className="text-xs text-emerald-600 mt-1">
                                                                        Família: {(species as any).familia.familia_nome}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nome Popular
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nome_popular || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nome_popular: e.target.value }))}
                                            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            placeholder="Ex: Camarão-vermelho"
                                            readOnly={shouldLockGlobalFields}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Description (Global) */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    Descrição Botânica
                                    {shouldLockGlobalFields && (
                                        <span className="text-xs font-normal text-gray-500">(Enciclopédia Veridia)</span>
                                    )}
                                </h3>
                                <textarea
                                    value={formData.descricao_especie || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, descricao_especie: e.target.value }))}
                                    rows={4}
                                    className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="Descreva as características morfológicas, habitat natural, curiosidades..."
                                    readOnly={shouldLockGlobalFields}
                                />
                            </section>

                            {/* Section 2.5: Project-specific Notes (Local) - Only for Gestor de Acervo / Taxonomista */}
                            {isProjectUser && (
                                <section className="space-y-4">
                                    {/* Descrição da Ocorrência */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            � Descrição da Ocorrência
                                            <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                Exibida no App
                                            </span>
                                        </h3>
                                        <textarea
                                            value={localData.descricao_ocorrencia}
                                            onChange={(e) => setLocalData(prev => ({ ...prev, descricao_ocorrencia: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none bg-emerald-50/30"
                                            placeholder="Texto descritivo sobre como a espécie ocorre neste local específico. Esta informação será exibida no aplicativo."
                                        />
                                    </div>

                                    {/* Notas de Campo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            📝 Notas de Campo / Observações Específicas
                                        </label>
                                        <textarea
                                            value={localData.detalhes_localizacao}
                                            onChange={(e) => setLocalData(prev => ({ ...prev, detalhes_localizacao: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                                            placeholder="Observações técnicas ou específicas sobre o indivíduo/grupo coletado neste local."
                                        />
                                    </div>

                                    {/* Geolocalização */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                                📍 Geolocalização
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => {
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
                                                }}
                                                disabled={geoLoading}
                                                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {geoLoading ? (
                                                    <>
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Obtendo...
                                                    </>
                                                ) : (
                                                    <>📍 Obter Localização Atual</>
                                                )}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    Latitude
                                                </label>
                                                <input
                                                    type="text"
                                                    value={localData.latitude}
                                                    onChange={(e) => setLocalData(prev => ({ ...prev, latitude: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                                                    placeholder="-23.550520"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                    Longitude
                                                </label>
                                                <input
                                                    type="text"
                                                    value={localData.longitude}
                                                    onChange={(e) => setLocalData(prev => ({ ...prev, longitude: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
                                                    placeholder="-46.633308"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}


                            {/* Section 3: Cultivation Guide - Hidden for Project Users */}
                            {!isProjectUser && (
                                <section>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        Guia de Cultivo
                                        {shouldLockGlobalFields && (
                                            <span className="text-xs font-normal text-gray-500">(Enciclopédia Veridia)</span>
                                        )}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ☀️ Luminosidade
                                            </label>
                                            <textarea
                                                value={formData.cuidados_luz || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, cuidados_luz: e.target.value }))}
                                                rows={3}
                                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder="Ex: Meia-sombra a sol pleno. Evitar luz direta intensa nas horas mais quentes do dia."
                                                readOnly={shouldLockGlobalFields}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                💧 Rega
                                            </label>
                                            <textarea
                                                value={formData.cuidados_agua || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, cuidados_agua: e.target.value }))}
                                                rows={3}
                                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder="Ex: Moderada. Manter o solo úmido mas não encharcado. Reduzir no inverno."
                                                readOnly={shouldLockGlobalFields}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                🌡️ Temperatura
                                            </label>
                                            <textarea
                                                value={formData.cuidados_temperatura || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, cuidados_temperatura: e.target.value }))}
                                                rows={3}
                                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder="Ex: 18°C a 28°C. Sensível a geadas. Proteger em invernos rigorosos."
                                                readOnly={shouldLockGlobalFields}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                🌱 Substrato
                                            </label>
                                            <textarea
                                                value={formData.cuidados_substrato || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, cuidados_substrato: e.target.value }))}
                                                rows={3}
                                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder="Ex: Rico em matéria orgânica, bem drenado."
                                                readOnly={shouldLockGlobalFields}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                🧪 Nutrientes
                                            </label>
                                            <textarea
                                                value={formData.cuidados_nutrientes || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, cuidados_nutrientes: e.target.value }))}
                                                rows={3}
                                                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                placeholder="Ex: Adubar na primavera e verão com NPK balanceado."
                                                readOnly={shouldLockGlobalFields}
                                            />
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Section 4: Images */}
                            <section>
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-emerald-600" />
                                    Galeria de Imagens
                                </h3>

                                {/* Existing Images */}
                                {existingImages.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 mb-2">Imagens existentes:</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {existingImages.map((img) => (
                                                <div key={img.id} className="relative group">
                                                    {/* Delete button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteExistingImage(img.id, img.url_imagem)}
                                                        className="absolute -top-2 -right-2 z-10 p-1.5 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                        title="Excluir imagem"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    <img
                                                        src={img.url_imagem}
                                                        alt="Imagem da espécie"
                                                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Créditos da foto..."
                                                        value={editedCredits[img.id] || ''}
                                                        onChange={(e) => setEditedCredits(prev => ({
                                                            ...prev,
                                                            [img.id]: e.target.value
                                                        }))}
                                                        className="mt-1 w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Upload area */}
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${dragActive
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileInput}
                                        className="hidden"
                                    />

                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <Upload size={24} className="text-emerald-600" />
                                        <p className="text-sm font-medium">Arraste imagens ou clique para selecionar</p>
                                        <p className="text-xs text-gray-400">PNG, JPG - Múltiplos arquivos permitidos</p>
                                    </div>
                                </div>

                                {/* New image previews */}
                                {imagePreviews.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 mb-2">Novas imagens a enviar:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {imagePreviews.map((preview, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${idx + 1}`}
                                                        className="w-20 h-20 object-cover rounded-lg border border-emerald-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeNewImage(idx);
                                                        }}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Authorship Info - Only show when editing */}
                            {initialData?.id && initialData?.created_at && (
                                <section className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                                    <p>
                                        <span className="font-medium">Cadastrado em:</span>{' '}
                                        {new Date(initialData.created_at).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    {initialData.creator && (
                                        <p>
                                            <span className="font-medium">Cadastrado por:</span>{' '}
                                            {Array.isArray(initialData.creator)
                                                ? initialData.creator[0]?.full_name || initialData.created_by || 'Usuário desconhecido'
                                                : initialData.creator?.full_name || initialData.created_by || 'Usuário desconhecido'}
                                        </p>
                                    )}
                                    {!initialData.creator && initialData.created_by && (
                                        <p>
                                            <span className="font-medium">Cadastrado por (ID):</span>{' '}
                                            <span className="font-mono text-gray-400">{initialData.created_by}</span>
                                        </p>
                                    )}
                                </section>
                            )}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading || dataLoading}
                        className="px-5 py-2.5 bg-[#064E3B] text-white rounded-lg hover:bg-[#053829] transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <span>{isGlobalSpecies ? '🔗 Vincular ao Projeto' : initialData ? 'Salvar Alterações' : 'Criar Espécie'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
