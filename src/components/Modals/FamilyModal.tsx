import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Loader2 } from 'lucide-react';

interface Family {
    id?: string;
    familia_nome: string;
    imagem_referencia?: string | null;
    caracteristicas?: string | null;
    descricao_familia?: string | null;
    fonte_referencia?: string | null;
    link_referencia?: string | null;
}

interface FamilyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    initialData?: Family | null;
}

export function FamilyModal({ isOpen, onClose, onSave, initialData }: FamilyModalProps) {
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState<Family>({
        familia_nome: '',
        caracteristicas: '',
        descricao_familia: '',
        fonte_referencia: '',
        link_referencia: '',
    });

    // Reset form when modal opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    familia_nome: initialData.familia_nome || '',
                    caracteristicas: initialData.caracteristicas || '',
                    descricao_familia: initialData.descricao_familia || '',
                    fonte_referencia: initialData.fonte_referencia || '',
                    link_referencia: initialData.link_referencia || '',
                });
                setImagePreview(initialData.imagem_referencia || null);
            } else {
                setFormData({
                    familia_nome: '',
                    caracteristicas: '',
                    descricao_familia: '',
                    fonte_referencia: '',
                    link_referencia: '',
                });
                setImagePreview(null);
            }
            setImageFile(null);
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
            alert('Por favor, selecione apenas imagens.');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return initialData?.imagem_referencia || null;

        const fileExt = imageFile.name.split('.').pop();
        const fileName = `familias/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('imagens-plantas')
            .upload(fileName, imageFile);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('Erro ao fazer upload da imagem');
        }

        const { data: { publicUrl } } = supabase.storage
            .from('imagens-plantas')
            .getPublicUrl(fileName);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.familia_nome.trim()) {
            alert('O nome da família é obrigatório.');
            return;
        }

        setLoading(true);

        try {
            // Upload image if there's a new one
            const imageUrl = await uploadImage();

            const dataToSave = {
                familia_nome: formData.familia_nome.trim(),
                caracteristicas: formData.caracteristicas?.trim() || null,
                descricao_familia: formData.descricao_familia?.trim() || null,
                fonte_referencia: formData.fonte_referencia?.trim() || null,
                link_referencia: formData.link_referencia?.trim() || null,
                imagem_referencia: imageUrl,
            };

            if (initialData?.id) {
                // Update existing
                const { error } = await supabase
                    .from('familia')
                    .update(dataToSave)
                    .eq('id', initialData.id);

                if (error) throw error;
            } else {
                // Insert new
                const { error } = await supabase
                    .from('familia')
                    .insert(dataToSave);

                if (error) throw error;
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error('Save error:', error);
            alert(error.message || 'Erro ao salvar família.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
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
                                    <p className="text-sm text-gray-500">Clique ou arraste para substituir</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <Upload size={28} />
                                    </div>
                                    <p className="text-sm font-medium">Arraste uma imagem ou clique para selecionar</p>
                                    <p className="text-xs text-gray-400">PNG, JPG até 5MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nome da Família */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome da Família <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.familia_nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, familia_nome: e.target.value }))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            placeholder="Ex: Fabaceae"
                            required
                        />
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
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
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
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
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
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
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
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none font-mono text-sm"
                            placeholder="Insira um link por linha..."
                        />
                    </div>
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
                        form="family-form"
                        onClick={handleSubmit}
                        disabled={loading}
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
                </div>
            </div>
        </div>
    );
}
