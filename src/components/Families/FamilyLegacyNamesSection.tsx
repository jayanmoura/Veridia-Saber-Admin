import { useState } from 'react';
import { useFamilyLegacyNames, type FamilyLegacyName } from '../../hooks/useFamilyLegacyNames';
import { Loader2, Plus, Trash2, Edit2, Save } from 'lucide-react';

interface FamilyLegacyNamesSectionProps {
    familiaId: string;
}

export function FamilyLegacyNamesSection({ familiaId }: FamilyLegacyNamesSectionProps) {
    const {
        legacyNames,
        loading,
        addLegacyName,
        updateLegacyName,
        removeLegacyName
    } = useFamilyLegacyNames(familiaId);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Omit<FamilyLegacyName, 'id' | 'created_at' | 'familia_id'>>({
        nome_legado: '',
        tipo: 'sinonimo',
        fonte: '',
        observacao: ''
    });

    const resetForm = () => {
        setFormData({
            nome_legado: '',
            tipo: 'sinonimo',
            fonte: '',
            observacao: ''
        });
        setEditingId(null);
        setIsAdding(false);
    };

    const handleEditClick = (item: FamilyLegacyName) => {
        setFormData({
            nome_legado: item.nome_legado,
            tipo: item.tipo,
            fonte: item.fonte || '',
            observacao: item.observacao || ''
        });
        setEditingId(item.id);
        setIsAdding(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedName = formData.nome_legado.trim();

        if (!normalizedName) {
            alert("O nome legado é obrigatório.");
            return;
        }

        // UI-side duplicate check
        const isDuplicate = legacyNames.some(item =>
            (editingId ? item.id !== editingId : true) &&
            item.nome_legado.trim().toLowerCase() === normalizedName.toLowerCase()
        );

        if (isDuplicate) {
            alert("Esse nome já está cadastrado para esta família.");
            return;
        }

        setActionLoading(true);
        try {
            if (editingId) {
                await updateLegacyName(editingId, {
                    nome_legado: normalizedName,
                    tipo: formData.tipo,
                    fonte: formData.fonte?.trim() || null,
                    observacao: formData.observacao?.trim() || null
                });
            } else {
                await addLegacyName({
                    nome_legado: normalizedName,
                    tipo: formData.tipo,
                    fonte: formData.fonte?.trim() || null,
                    observacao: formData.observacao?.trim() || null
                });
            }
            resetForm();
        } catch (err: any) {
            alert(err.message || 'Erro ao salvar nome legado.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este nome legado?')) return;

        setActionLoading(true);
        try {
            await removeLegacyName(id);
        } catch (err: any) {
            alert(err.message || 'Erro ao remover nome legado.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Nomenclatura Legada</h3>
                    <p className="text-sm text-gray-500">Sinônimos históricos e nomes alternativos para esta família.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        Adicionar Novo
                    </button>
                )}
            </div>

            {/* Form Area */}
            {isAdding && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Nome Legado <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nome_legado}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nome_legado: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                    placeholder="Ex: Gramineae"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                                >
                                    <option value="sinonimo">Sinônimo</option>
                                    <option value="nome_historico">Nome Histórico</option>
                                    <option value="nome_alternativo">Nome Alternativo</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Fonte / Referência
                                </label>
                                <input
                                    type="text"
                                    value={formData.fonte || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fonte: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                    placeholder="Ex: APG IV"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Observação
                                </label>
                                <input
                                    type="text"
                                    value={formData.observacao || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                    placeholder="Notas adicionais..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={actionLoading}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {editingId ? 'Salvar Edição' : 'Adicionar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Area */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-emerald-600" />
                </div>
            ) : legacyNames.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">Nenhum nome legado cadastrado.</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {legacyNames.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-start justify-between p-3 bg-white border rounded-lg transition-all hover:shadow-sm ${editingId === item.id ? 'border-emerald-500 ring-1 ring-emerald-100' : 'border-gray-100'
                                }`}
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{item.nome_legado}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${item.tipo === 'sinonimo' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        item.tipo === 'nome_historico' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {item.tipo === 'sinonimo' ? 'Sinônimo' :
                                            item.tipo === 'nome_historico' ? 'Nome Histórico' : 'Alternativo'}
                                    </span>
                                </div>
                                {(item.fonte || item.observacao) && (
                                    <div className="text-xs text-gray-500 space-y-0.5">
                                        {item.fonte && <p><span className="font-medium">Fonte:</span> {item.fonte}</p>}
                                        {item.observacao && <p><span className="font-medium">Obs:</span> {item.observacao}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEditClick(item)}
                                    disabled={actionLoading}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    disabled={actionLoading}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Remover"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
