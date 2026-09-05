import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/authContext';
import { X, Upload, Loader2, Info, List } from 'lucide-react';
import { FamilyLegacyNamesSection } from '../Families/FamilyLegacyNamesSection';
import { compressImage, compressForListing } from '../../utils/imageCompressor';
import { uploadFile, getStorageUrl } from '../../utils/storage';
import { useToast } from '../../hooks/useToast';

import type { Family } from '../../types/domain';

interface FamilyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData?: Family | null;
}

export function FamilyModal({ isOpen, onClose, onSave, initialData }: FamilyModalProps) {
    const { showToast } = useToast();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState<Family>({
        id: '',
        familia_nome: '',
        autoria_taxonomica: '',
        caracteristicas: '',
        descricao_familia: '',
        fonte_referencia: '',
        link_referencia: '',
    });

    // Duplicate check state
    const [isChecking, setIsChecking] = useState(false);
    const [duplicateError, setDuplicateError] = useState<string | null>(null);
    const [similarFamilies, setSimilarFamilies] = useState<string[]>([]);
    const isSubmitting = useRef(false);
    const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Tab Interface
    const [activeTab, setActiveTab] = useState<'details' | 'legacy'>('details');

    const checkFamilyName = async (name: string) => {
        // Clear previous timeout
        if (checkTimeout.current) {
            clearTimeout(checkTimeout.current);
        }

        // If empty or same as initial (editing), clear errors
        if (!name.trim() || (initialData && name.trim().toLowerCase() === initialData.familia_nome.toLowerCase())) {
            setDuplicateError(null);
            setSimilarFamilies([]);
            setIsChecking(false);
            return;
        }

        setIsChecking(true);
        setDuplicateError(null);

        // Debounce 500ms
        checkTimeout.current = setTimeout(async () => {
            try {
                // Check exact match
                const { data: exactMatch } = await supabase
                    .from('familia')
                    .select('familia_nome')
                    .ilike('familia_nome', name.trim())
                    .maybeSingle();

                if (exactMatch) {
                    setDuplicateError(`A família "${exactMatch.familia_nome}" já está cadastrada no sistema.`);
                    setSimilarFamilies([]);
                } else {
                    // Check similars (optional, simple logic using ilike with %)
                    // A proper "similarity" search usually requires pg_trgm extension, forcing simple partial match for now.
                    // If user typed "Olea", find "Oleaceae"
                    const { data: similars } = await supabase
                        .from('familia')
                        .select('familia_nome')
                        .ilike('familia_nome', `%${name.trim()}%`)
                        .limit(3);

                    if (similars && similars.length > 0) {
                        setSimilarFamilies(similars.map(f => f.familia_nome));
                    } else {
                        setSimilarFamilies([]);
                    }
                }
            } catch (err) {
                console.error("Error checking family name", err);
            } finally {
                setIsChecking(false);
            }
        }, 500);
    };

    // Reset form when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    id: initialData.id,
                    familia_nome: initialData.familia_nome || '',
                    autoria_taxonomica: initialData.autoria_taxonomica || '',
                    caracteristicas: initialData.caracteristicas || '',
                    descricao_familia: initialData.descricao_familia || '',
                    fonte_referencia: initialData.fonte_referencia || '',
                    link_referencia: initialData.link_referencia || '',
                });
                setImagePreview(initialData.imagem_thumbnail || initialData.imagem_referencia || null);
            } else {
                setFormData({
                    id: '',
                    familia_nome: '',
                    autoria_taxonomica: '',
                    caracteristicas: '',
                    descricao_familia: '',
                    fonte_referencia: '',
                    link_referencia: '',
                });
                setImagePreview(null);
            }
            setImageFile(null);
            setDuplicateError(null);
            setSimilarFamilies([]);
            setActiveTab('details'); // Reset to details on open
        }
    }, [isOpen, initialData]);

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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione apenas imagens.', 'warning');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const uploadImage = async (): Promise<{ original: string | null; thumbnail: string | null; micro: string | null }> => {
        if (!imageFile) return {
            original: initialData?.imagem_referencia || null,
            thumbnail: initialData?.imagem_thumbnail || null,
            micro: initialData?.imagem_micro || null,
        };

        const fileExt = imageFile.name.split('.').pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileName = `familias/${timestamp}_${random}.${fileExt}`;

        let originalUrl: string | null = null;
        try {
            originalUrl = await uploadFile('imagens-plantas', fileName, imageFile);
        } catch (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Erro ao fazer upload da imagem');
        }

        // Generate and upload thumbnail + micro (non-critical — failure does not abort the save)
        const base = `${timestamp}_${random}.jpg`;
        let thumbnailUrl: string | null = null;
        let microUrl: string | null = null;
        try {
            const [thumbFile, microFile] = await Promise.all([
                compressImage(imageFile),
                compressForListing(imageFile),
            ]);
            const [thumbResult, microResult] = await Promise.allSettled([
                uploadFile('imagens-plantas', `familias/thumbs/${base}`, thumbFile),
                uploadFile('imagens-plantas', `familias/micro/${base}`, microFile),
            ]);
            if (thumbResult.status === 'fulfilled' && thumbResult.value) {
                thumbnailUrl = getStorageUrl('imagens-plantas', `familias/thumbs/${base}`);
            }
            if (microResult.status === 'fulfilled' && microResult.value) {
                microUrl = getStorageUrl('imagens-plantas', `familias/micro/${base}`);
            }
        } catch {
            // Thumbnails are non-critical; original already uploaded safely
        }

        return { original: originalUrl, thumbnail: thumbnailUrl, micro: microUrl };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting.current) return;
        isSubmitting.current = true;

        if (!formData.familia_nome.trim()) {
            showToast('O nome da família é obrigatório.', 'warning');
            isSubmitting.current = false;
            return;
        }

        if (duplicateError) {
            showToast("Corrija o erro de nome duplicado antes de salvar.", 'warning');
            isSubmitting.current = false;
            return;
        }

        setLoading(true);

        try {
            // Upload image if there's a new one
            const { original: imageUrl, thumbnail: thumbnailUrl, micro: microUrl } = await uploadImage();

            const dataToSave = {
                familia_nome: formData.familia_nome.trim(),
                autoria_taxonomica: formData.autoria_taxonomica?.trim() || null,
                caracteristicas: formData.caracteristicas?.trim() || null,
                descricao_familia: formData.descricao_familia?.trim() || null,
                fonte_referencia: formData.fonte_referencia?.trim() || null,
                link_referencia: formData.link_referencia?.trim() || null,
                imagem_referencia: imageUrl,
                imagem_thumbnail: thumbnailUrl,
                imagem_micro: microUrl,
            };

            if (initialData?.id) {
                // Update existing
                const { error } = await supabase
                    .from('familia')
                    .update(dataToSave)
                    .eq('id', initialData.id);

                if (error) throw error;
            } else {
                // Insert new - include created_by and created_by_name
                const { error } = await supabase
                    .from('familia')
                    .insert({
                        ...dataToSave,
                        created_by: profile?.id || null,
                        created_by_name: profile?.full_name || null,
                    });

                if (error) throw error;
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            const err = error as { message?: string };
            showToast(err.message || 'Erro ao salvar família.', 'error');
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in-up flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-none">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Editar Família' : 'Nova Família'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs - Only show if editing */}
                {initialData?.id && (
                    <div className="flex border-b border-gray-200 px-6 flex-none">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Info size={16} />
                            Dados da Família
                        </button>
                        <button
                            onClick={() => setActiveTab('legacy')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'legacy'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List size={16} />
                            Nomenclatura Legada
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'details' ? (
                        <form id="family-form" onSubmit={handleSubmit} className="space-y-5">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Imagem de Capa
                                </label>
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
                                        onChange={handleFileInput}
                                        className="hidden"
                                    />

                                    {imagePreview ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm"
                                            />
                                            <div className="flex flex-col items-center">
                                                <p className="text-sm font-medium text-emerald-600">Imagem selecionada</p>
                                                <p className="text-xs text-gray-400">Clique ou arraste para substituir</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-500">
                                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <Upload size={28} />
                                            </div>
                                            <p className="text-sm font-medium">Arraste uma imagem ou clique para selecionar</p>
                                            <p className="text-xs text-gray-400">PNG, JPG até 5MB (Capa única)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Nome da Família e Autoria */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome da Família <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.familia_nome}
                                        onChange={(e) => {
                                            const newName = e.target.value;
                                            setFormData(prev => ({ ...prev, familia_nome: newName }));
                                            checkFamilyName(newName);
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-colors ${duplicateError
                                            ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50'
                                            : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                                            }`}
                                        placeholder="Ex: Fabaceae"
                                        required
                                    />
                                    {/* Status Checker */}
                                    <div className="mt-2 min-h-[20px]">
                                        {isChecking ? (
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Loader2 size={12} className="animate-spin" /> Verificando disponibilidade...
                                            </p>
                                        ) : duplicateError ? (
                                            <p className="text-sm text-red-600 font-medium flex items-center gap-1 animate-in slide-in-from-top-1">
                                                <span>⚠️</span> {duplicateError}
                                            </p>
                                        ) : similarFamilies.length > 0 ? (
                                            <div className="text-xs text-gray-500 animate-in fade-in">
                                                <span className="font-medium text-gray-600">Famílias similares encontradas:</span>
                                                <ul className="flex flex-wrap gap-2 mt-1">
                                                    {similarFamilies.map(f => (
                                                        <li key={f} className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Autoria Taxonômica
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.autoria_taxonomica || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, autoria_taxonomica: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                                        placeholder="Ex: Juss., R.Br."
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Autoria botânica do nome científico da família.
                                    </p>
                                </div>
                            </div>

                            {/* Características */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Características Chave
                                </label>
                                <textarea
                                    value={formData.caracteristicas || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, caracteristicas: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none"
                                    placeholder="Descreva as características principais..."
                                />
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição Detalhada
                                </label>
                                <textarea
                                    value={formData.descricao_familia || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, descricao_familia: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none"
                                    placeholder="Informações detalhadas sobre a família..."
                                />
                            </div>

                            {/* Fonte */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fontes / Referências <span className="text-gray-400 font-normal">(uma por linha)</span>
                                </label>
                                <textarea
                                    value={formData.fonte_referencia || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fonte_referencia: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none"
                                    placeholder="Ex: Flora do Brasil 2020&#10;Lorenzi, H. - Árvores Brasileiras&#10;APG IV (2016)"
                                />
                            </div>

                            {/* Links */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Links / URLs
                                </label>
                                <textarea
                                    value={formData.link_referencia || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, link_referencia: e.target.value }))}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none font-mono text-sm"
                                    placeholder="Insira um link por linha..."
                                />
                            </div>

                            {/* Authorship Info - Only show when editing */}
                            {initialData?.id && initialData?.created_at && (
                                <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
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
                                </div>
                            )}
                        </form>
                    ) : (
                        initialData?.id && <FamilyLegacyNamesSection familiaId={initialData.id} />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-none">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                        {activeTab === 'details' ? 'Cancelar' : 'Fechar'}
                    </button>
                    {activeTab === 'details' && (
                        <button
                            type="submit"
                            form="family-form"
                            onClick={handleSubmit}
                            disabled={loading || !!duplicateError || isChecking}
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <span>{initialData ? 'Salvar Alterações' : 'Criar Família'}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
