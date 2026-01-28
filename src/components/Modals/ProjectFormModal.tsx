import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2, MapPin } from 'lucide-react';

interface ProjectFormData {
    nome: string;
    sigla: string;
    tipo: string;
    cidade: string;
    estado: string;
    latitude: string;
    longitude: string;
    descricao: string;
    gestor_id: string;
}

interface UserOption {
    id: string;
    full_name: string | null;
    email: string | null;
}

interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
    title: string;
    formData: ProjectFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
    imagePreview: string | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    users?: UserOption[];
    loadingUsers?: boolean;
}

const TIPOS_PROJETO = [
    { value: 'instituicao', label: 'Instituição (Jardim Botânico, Univ., etc)' },
    { value: 'publico', label: 'Lugar Público (Praça, Parque, Rua)' }
];

export function ProjectFormModal({
    isOpen,
    onClose,
    onSubmit,
    loading,
    title,
    formData,
    setFormData,
    imagePreview,
    onImageChange,
    users = [],
    loadingUsers = false
}: ProjectFormModalProps) {
    const [emailSearch, setEmailSearch] = useState('');

    // Sincronizar emailSearch com gestor_id selecionado
    useEffect(() => {
        if (formData.gestor_id) {
            const user = users.find(u => u.id === formData.gestor_id);
            if (user?.email) setEmailSearch(user.email);
        } else {
            setEmailSearch('');
        }
    }, [formData.gestor_id, users]);

    // Suprimir warning de loadingUsers (prop opcional, usada para controle externo)
    void loadingUsers;

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <MapPin className="text-emerald-600" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={loading}>
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagem de Capa</label>
                        <div className="relative">
                            {imagePreview ? (
                                <div className="relative h-40 rounded-xl overflow-hidden border-2 border-emerald-200">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <span className="px-3 py-1.5 bg-white/90 rounded-lg text-sm font-medium">Alterar</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
                                    </label>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors">
                                    <Upload className="text-gray-400 mb-2" size={32} />
                                    <span className="text-sm text-gray-500">Clique para adicionar imagem</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Projeto *</label>
                        <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            placeholder="Ex: Jardim Botânico do Rio"
                        />
                    </div>

                    {/* Sigla */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sigla do Projeto *
                            <span className="text-xs text-gray-500 font-normal ml-2">(identificador único para tombos)</span>
                        </label>
                        <input
                            type="text"
                            value={formData.sigla}
                            onChange={(e) => {
                                // Uppercase, replace spaces with underscores, remove special chars
                                const value = e.target.value
                                    .toUpperCase()
                                    .replace(/\s+/g, '_')
                                    .replace(/[^A-Z0-9_]/g, '');
                                setFormData(prev => ({ ...prev, sigla: value }));
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono tracking-wide"
                            placeholder="Ex: JB_UFRRJ"
                            maxLength={20}
                        />
                        <p className="text-xs text-gray-500 mt-1">Será usado como prefixo do tombo (ex: JB_UFRRJ-00001)</p>
                    </div>

                    {/* Tipo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                        <select
                            value={formData.tipo}
                            onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none bg-white"
                        >
                            <option value="">Selecione o tipo</option>
                            {TIPOS_PROJETO.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Gestor do Projeto - Campo de Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email do Gestor</label>
                        <input
                            type="email"
                            value={emailSearch}
                            onChange={(e) => {
                                const email = e.target.value;
                                setEmailSearch(email);
                                // Buscar usuário pelo email exato
                                const matchingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                                setFormData(prev => ({ ...prev, gestor_id: matchingUser?.id || '' }));
                            }}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors ${emailSearch && formData.gestor_id
                                ? 'border-emerald-300 bg-emerald-50/50'
                                : emailSearch && !formData.gestor_id
                                    ? 'border-amber-300 bg-amber-50/30'
                                    : 'border-gray-200'
                                }`}
                            placeholder="email@exemplo.com (opcional)"
                        />
                        {/* Feedback de validação */}
                        {emailSearch && (
                            <div className={`mt-2 text-sm flex items-center gap-2 ${formData.gestor_id ? 'text-emerald-600' : 'text-amber-600'}`}>
                                <span className={`w-2 h-2 rounded-full ${formData.gestor_id ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                {formData.gestor_id ? (
                                    <span>
                                        ✓ Usuário encontrado: {users.find(u => u.id === formData.gestor_id)?.full_name || 'Sem nome'}
                                    </span>
                                ) : (
                                    <span>Usuário não encontrado no sistema</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cidade / Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                            <input
                                type="text"
                                value={formData.cidade}
                                onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Ex: Rio de Janeiro"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                            <input
                                type="text"
                                value={formData.estado}
                                onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="Ex: RJ"
                            />
                        </div>
                    </div>

                    {/* Coordenadas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                            <input
                                type="text"
                                value={formData.latitude}
                                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="-22.9668"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                            <input
                                type="text"
                                value={formData.longitude}
                                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="-43.2177"
                            />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <textarea
                            value={formData.descricao}
                            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            placeholder="Descreva o projeto..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
