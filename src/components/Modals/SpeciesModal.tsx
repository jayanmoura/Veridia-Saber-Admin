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
    const [localData, setLocalData] = useState<{ descricao_ocorrencia: string; detalhes_localizacao: string }>({
        descricao_ocorrencia: '',
        detalhes_localizacao: ''
    });

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

    // Determine if fields should be locked (editing existing species as non-admin)
    const shouldLockGlobalFields = isEditingExisting && isLocalUser;



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
                setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '' });
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
            setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '' });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('especie_local')
                .select('descricao_ocorrencia, detalhes_localizacao')
                .eq('especie_id', speciesId)
                .eq('local_id', localId)
                .maybeSingle();

            if (error) {
                // Table may not exist yet - ignore silently
                setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '' });
                return;
            }

            if (data) {
                setLocalData({
                    descricao_ocorrencia: data.descricao_ocorrencia || '',
                    detalhes_localizacao: data.detalhes_localizacao || ''
                });
            } else {
                setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '' });
            }
        } catch (err) {
            setLocalData({ descricao_ocorrencia: '', detalhes_localizacao: '' });
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

    // Extract storage path from full URL
    const extractStoragePath = (url: string): string | null => {
        try {
            // URL format: .../storage/v1/object/public/imagens-plantas/especies/...
            const match = url.match(/\/imagens-plantas\/(.+)$/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    // Delete existing image from storage and database
    const handleDeleteExistingImage = async (imageId: string, imageUrl: string) => {
        try {
            // 1. Remove from storage
            const storagePath = extractStoragePath(imageUrl);
            if (storagePath) {
                const { error: storageError } = await supabase.storage
                    .from('imagens-plantas')
                    .remove([storagePath]);

                if (storageError) {
                    console.warn('[DEBUG] Erro ao remover do storage (pode já não existir):', storageError);
                } else {
                    // console.log('[DEBUG] Imagem removida do storage:', storagePath);
                }
            }

            // 2. Remove from database
            const { error: dbError } = await supabase
                .from('imagens')
                .delete()
                .eq('id', imageId);

            if (dbError) {
                throw dbError;
            }

            // console.log('[DEBUG] Registro de imagem removido do banco:', imageId);

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

    const uploadImages = async (speciesId: string): Promise<string[]> => {
        const urls: string[] = [];

        for (const file of imageFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `especies/${speciesId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error } = await supabase.storage
                .from('imagens-plantas')
                .upload(fileName, file);

            if (!error) {
                const { data: { publicUrl } } = supabase.storage
                    .from('imagens-plantas')
                    .getPublicUrl(fileName);
                urls.push(publicUrl);
            }
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
            let speciesId = initialData?.id;
            const effectiveLocalId = formData.local_id || (isLocalUser ? String(profile?.local_id || '') : null);

            if (isEditingExisting && speciesId) {
                // EDITING EXISTING SPECIES
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

            } else {
                // CREATING NEW SPECIES
                // All global data goes to especie table
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
                    local_id: isSenior ? null : effectiveLocalId,
                    created_by_institution_id: profile?.institution_id || null,
                    created_by: profile?.id || null,
                };

                const { data, error } = await supabase
                    .from('especie')
                    .insert(dataToSave)
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

            // Upload new images if any (with local_id!)
            if (imageFiles.length > 0 && speciesId) {
                const imageUrls = await uploadImages(speciesId);

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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nome Científico <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nome_cientifico}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nome_cientifico: e.target.value }))}
                                            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all italic ${shouldLockGlobalFields ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            placeholder="Ex: Justicia brandegeeana"
                                            required
                                            readOnly={shouldLockGlobalFields}
                                        />
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
                                    {/* Descrição Local */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            📍 Descrição Local
                                            <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                Editável
                                            </span>
                                        </h3>
                                        <textarea
                                            value={localData.descricao_ocorrencia}
                                            onChange={(e) => setLocalData(prev => ({ ...prev, descricao_ocorrencia: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none bg-emerald-50/30"
                                            placeholder="Anotações sobre a ocorrência da espécie neste projeto (visível para a equipe)."
                                        />
                                    </div>

                                    {/* Notas de Campo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            📝 Notas de Campo
                                        </label>
                                        <textarea
                                            value={localData.detalhes_localizacao}
                                            onChange={(e) => setLocalData(prev => ({ ...prev, detalhes_localizacao: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                                            placeholder="Detalhes técnicos de campo, coordenadas específicas ou observações de coleta..."
                                        />
                                    </div>
                                </section>
                            )}

                            {/* Section 3: Cultivation Guide */}
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
                            <span>{initialData ? 'Salvar Alterações' : 'Criar Espécie'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
