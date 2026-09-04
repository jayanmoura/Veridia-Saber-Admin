
import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2, MapPin, User, Image as ImageIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ImageUploadZone } from '../Forms/ImageUploadZone';
import { useSpecimenImages } from '../../hooks/useSpecimenImages';
import type { SpecimenFormData } from '../../hooks/useSpecimens';

interface SpecimenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<number | null>;
    formData: SpecimenFormData;
    setFormData: React.Dispatch<React.SetStateAction<SpecimenFormData>>;
    loading: boolean;
    isEdit: boolean;
    initialSpeciesName?: string; // For edit mode display
    initialProjectName?: string; // For edit mode display
    specimenId?: number; // For duplicate check exclusion
}

interface OptionItem {
    id: string; // or number converted to string
    label: string;
    subLabel?: string;
    institutionId?: string;
}

export function SpecimenModal({
    isOpen,
    onClose,
    onSave,
    formData,
    setFormData,
    loading,
    isEdit,
    initialSpeciesName,
    initialProjectName,
    specimenId
}: SpecimenModalProps) {
    const { profile, isAdmin } = useAuth();
    // Species Search State
    const [speciesSearch, setSpeciesSearch] = useState('');
    const [speciesOptions, setSpeciesOptions] = useState<OptionItem[]>([]);
    const [speciesSearching, setSpeciesSearching] = useState(false);
    const [selectedSpeciesName, setSelectedSpeciesName] = useState('');

    // Project Search State
    const [projectSearch, setProjectSearch] = useState('');
    const [projectOptions, setProjectOptions] = useState<OptionItem[]>([]);
    const [projectSearching, setProjectSearching] = useState(false);
    const [selectedProjectName, setSelectedProjectName] = useState('');

    // Images Hook
    const images = useSpecimenImages();
    const [uploadStage, setUploadStage] = useState<'idle' | 'compressing' | 'uploading' | 'saving'>('idle');
    const isSubmitting = useRef(false);

    // Setup initial state; reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            images.reset();
            return;
        }

        if (specimenId) {
            // Edit mode
            images.loadExistingImages(specimenId);
            if (initialSpeciesName) setSelectedSpeciesName(initialSpeciesName);
            if (initialProjectName) setSelectedProjectName(initialProjectName);
        } else {
            // New mode
            setSpeciesSearch('');
            setProjectSearch('');
            // Only clear if empty, parent might pre-set them (e.g. from ProjectDetails or Wizard)
            if (!formData.especie_id) {
                setSelectedSpeciesName('');
            } else if (initialSpeciesName) {
                setSelectedSpeciesName(initialSpeciesName);
            }

            // Auto-fill or pre-fill project details
            const targetLocalId = formData.local_id || profile?.local_id;
            if (targetLocalId) {
                if (initialProjectName) {
                    setSelectedProjectName(initialProjectName);
                }
                (async () => {
                    try {
                        const { data: localData } = await supabase
                            .from('locais')
                            .select('id, nome, institution_id')
                            .eq('id', targetLocalId)
                            .single();

                        if (localData) {
                            setFormData(prev => ({
                                ...prev,
                                local_id: localData.id.toString(),
                                institution_id: prev.institution_id || localData.institution_id
                            }));
                            if (!initialProjectName && localData.nome) {
                                setSelectedProjectName(localData.nome);
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching project details:", err);
                    }
                })();
            } else {
                setSelectedProjectName('');
                setProjectOptions([]);
            }

            // Sets Defaults
            setFormData(prev => ({
                ...prev,
                coletor: prev.coletor || profile?.full_name || '',
                determinador: prev.determinador || profile?.full_name || '',
                data_determinacao: prev.data_determinacao || new Date().toISOString().split('T')[0]
            }));
            images.reset();
        }
    }, [isOpen, isEdit, initialSpeciesName, initialProjectName, formData.especie_id, profile, specimenId]);

    // Species Search Effect
    useEffect(() => {
        if (!speciesSearch.trim()) { setSpeciesOptions([]); return; }
        const timeoutId = setTimeout(async () => {
            setSpeciesSearching(true);
            try {
                const { data } = await supabase
                    .from('especie')
                    .select('id, nome_cientifico, nome_popular')
                    .ilike('nome_cientifico', `%${speciesSearch}%`)
                    .limit(10);
                setSpeciesOptions((data || []).map((d: any) => ({
                    id: d.id,
                    label: d.nome_cientifico,
                    subLabel: d.nome_popular
                })));
            } finally { setSpeciesSearching(false); }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [speciesSearch]);

    // Project Search Effect
    useEffect(() => {
        if (!projectSearch.trim()) { setProjectOptions([]); return; }
        const timeoutId = setTimeout(async () => {
            setProjectSearching(true);
            try {
                const { data } = await supabase
                    .from('locais')
                    .select('id, nome, tipo, institution_id')
                    .ilike('nome', `%${projectSearch}%`)
                    .limit(10);
                setProjectOptions((data || []).map((d: any) => ({
                    id: d.id.toString(),
                    label: d.nome,
                    subLabel: d.tipo,
                    institutionId: d.institution_id
                })));
            } finally { setProjectSearching(false); }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [projectSearch]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting.current) return;
        isSubmitting.current = true;

        try {
            if (formData.coletor && formData.numero_coletor && formData.local_id) {
                try {
                    const { count } = await supabase
                        .from('especie_local')
                        .select('*', { count: 'exact', head: true })
                        .eq('coletor', formData.coletor)
                        .eq('numero_coletor', formData.numero_coletor)
                        .eq('local_id', formData.local_id)
                        .neq('id', specimenId || -1);

                    if (count && count > 0) {
                        if (!window.confirm(`Atenção: Já existe um espécime com Coletor "${formData.coletor}" e Número "${formData.numero_coletor}" neste local. Deseja salvar mesmo assim?`)) {
                            return;
                        }
                    }
                } catch (err) {
                    console.error("Error checking duplicates", err);
                }
            }

            // 1. Save Specimen Data
            const savedId = await onSave(null);
            if (!savedId) return;

            // 2. Upload Images (if new images exist)
            if (formData.local_id) {
                // Upload new images
                if (images.imageFiles.length > 0) {
                    setUploadStage('uploading');
                    const uploadResults = await images.uploadImages(savedId, {
                        localId: parseInt(formData.local_id || '0'),
                        institutionId: formData.institution_id || null,
                        onStageChange: setUploadStage,
                    });

                    if (uploadResults.length > 0) {
                        setUploadStage('saving');
                        const imageRecords = uploadResults.map(result => ({
                            especime_id: savedId,
                            especie_id: null,
                            url_imagem: result.url,
                            url_thumbnail: result.thumbnailUrl || null,
                            url_micro: result.microUrl || null,
                            creditos: result.credits || null,
                            local_id: parseInt(formData.local_id || '0'),
                            institution_id: formData.institution_id || null,
                            tamanho_original: result.tamanhoOriginal || null,
                            tamanho_thumbnail: result.tamanhoThumbnail || null,
                            tamanho_micro: result.tamanhoMicro || null,
                            tamanho_estimado: false,
                        }));

                        await supabase.from('imagens').insert(imageRecords);
                    }
                }

                // Update credits for existing images
                const creditUpdates = Object.entries(images.editedCredits)
                    .filter(([imgId, newCredits]) => {
                        const original = images.existingImages.find(img => img.id === imgId);
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
                }
            }
            onClose();
        } finally {
            isSubmitting.current = false;
            setUploadStage('idle');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={uploadStage === 'idle' && !loading ? onClose : undefined} />

            {/* Modal Container */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {isEdit ? 'Editar Espécime' : 'Novo Espécime'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {isEdit ? 'Atualize os dados da exsicata' : 'Registre uma nova ocorrência no acervo'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={uploadStage !== 'idle' || loading}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-6 space-y-8">

                        {/* Section 1: Identificação e Localização */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MapPin size={16} className="text-emerald-600" />
                                Localização e Taxonomia
                            </h3>
                            <div className="space-y-4">
                                {/* Project Selection */}
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Projeto / Local <span className="text-red-500">*</span></label>
                                    {selectedProjectName ? (
                                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                            <span className="font-medium text-blue-900">{selectedProjectName}</span>
                                            {!profile?.local_id && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedProjectName(''); setFormData(prev => ({ ...prev, local_id: '' })); }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    Alterar
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Buscar projeto..."
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={projectSearch}
                                                onChange={(e) => setProjectSearch(e.target.value)}
                                            />
                                            {projectSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600" size={16} />}
                                            {projectOptions.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {projectOptions.map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    local_id: opt.id,
                                                                    institution_id: opt.institutionId
                                                                }));
                                                                setSelectedProjectName(opt.label);
                                                                setProjectSearch('');
                                                                setProjectOptions([]);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                                        >
                                                            <div className="font-medium text-gray-900">{opt.label}</div>
                                                            {opt.subLabel && <div className="text-xs text-gray-500">{opt.subLabel}</div>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Institution Warning with CTA */}
                                {formData.local_id && !formData.institution_id && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                                        <p className="font-bold text-amber-800 mb-1">⚠️ Instituição não vinculada ao Projeto</p>
                                        <p className="text-amber-700 text-xs mb-3">
                                            Este projeto precisa ter uma instituição vinculada para registrar espécimes.
                                        </p>
                                        <a
                                            href="/projetos"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                                        >
                                            Ir para Projetos e Corrigir
                                        </a>
                                    </div>
                                )}

                                {/* Species Selection */}
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Espécie <span className="text-red-500">*</span></label>
                                    {selectedSpeciesName ? (
                                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                            <span className="font-medium text-emerald-900 italic">{selectedSpeciesName}</span>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedSpeciesName(''); setFormData(prev => ({ ...prev, especie_id: '' })); }}
                                                className="text-xs text-emerald-600 hover:text-emerald-800 underline"
                                            >
                                                Alterar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Buscar por nome científico..."
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={speciesSearch}
                                                onChange={(e) => setSpeciesSearch(e.target.value)}
                                            />
                                            {speciesSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600" size={16} />}
                                            {speciesOptions.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {speciesOptions.map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, especie_id: opt.id }));
                                                                setSelectedSpeciesName(opt.label);
                                                                setSpeciesSearch('');
                                                                setSpeciesOptions([]);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                                        >
                                                            <div className="font-medium text-gray-900 italic">{opt.label}</div>
                                                            {opt.subLabel && <div className="text-xs text-gray-500">{opt.subLabel}</div>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Coordinates and Location details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            name="latitude"
                                            value={formData.latitude}
                                            onChange={handleChange}
                                            placeholder="-12.345678"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            name="longitude"
                                            value={formData.longitude}
                                            onChange={handleChange}
                                            placeholder="-45.678901"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Detalhes de Localização</label>
                                        <textarea
                                            name="detalhes_localizacao"
                                            value={formData.detalhes_localizacao}
                                            onChange={handleChange}
                                            rows={2}
                                            placeholder="Ex: Próximo à trilha principal, lado norte do rio..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Dados de Coleta */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={16} className="text-emerald-600" />
                                Dados da Coleta
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Coletor</label>
                                    <input type="text" name="coletor" value={formData.coletor} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Número Coletor</label>
                                    <input type="text" name="numero_coletor" value={formData.numero_coletor} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Determinador</label>
                                    <input
                                        type="text"
                                        name="determinador"
                                        value={formData.determinador}
                                        onChange={handleChange}
                                        readOnly={!isAdmin}
                                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${!isAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Data Determinação</label>
                                    <div className="relative">
                                        <input type="date" name="data_determinacao" value={formData.data_determinacao} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                                        {/* Optional: could add calendar icon absolute right */}
                                    </div>
                                </div>
                            </div>
                        </section>





                        {/* Section 4: Galeria de Imagens (Only in Edit Mode or if Saved) */}
                        <section>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <ImageIcon size={16} className="text-emerald-600" />
                                Galeria de Imagens do Espécime
                            </h3>
                            <ImageUploadZone
                                imagePreviews={images.imagePreviews}
                                newImageCredits={images.newImageCredits}
                                onRemoveNewImage={images.removeNewImage}
                                onNewImageCreditsChange={(index, credits) => {
                                    images.setNewImageCredits(prev => {
                                        const updated = [...prev];
                                        updated[index] = credits;
                                        return updated;
                                    });
                                }}
                                existingImages={images.existingImages}
                                editedCredits={images.editedCredits}
                                onCreditsChange={(id, credits) => images.setEditedCredits(prev => ({ ...prev, [id]: credits }))}
                                onDeleteExisting={images.handleDeleteExistingImage}
                                dragActive={images.dragActive}
                                onDrag={images.handleDrag}
                                onDrop={images.handleDrop}
                                onFileInput={images.handleFileInput}
                                fileInputRef={images.fileInputRef}
                            />
                        </section>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50 min-h-[76px]">
                    {uploadStage !== 'idle' ? (
                        <div className="flex items-center gap-2.5 text-emerald-700">
                            <Loader2 size={18} className="animate-spin text-emerald-600 shrink-0" />
                            <span className="text-sm font-medium">
                                {uploadStage === 'compressing' ? 'Comprimindo imagens...' :
                                 uploadStage === 'uploading' ? 'Enviando imagens...' :
                                 'Salvando dados...'}
                            </span>
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || !formData.especie_id || !formData.local_id || !formData.institution_id}
                                title={!formData.institution_id ? "Projeto sem instituição vinculada - veja acima" : ""}
                                className="px-5 py-2.5 bg-[#064E3B] text-white rounded-lg hover:bg-[#053829] transition-colors flex items-center justify-center gap-2 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (isEdit ? 'Salvar Alterações' : 'Criar Espécime')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
