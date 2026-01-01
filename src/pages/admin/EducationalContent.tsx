import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    Save,
    X
} from 'lucide-react';

interface ContentItem {
    id: number;
    orgao: string;
    titulo: string;
    conteudo: string;
    ordem: number;
}

const ORGAOS = ['Raiz', 'Caule', 'Folha', 'Flor', 'Fruto', 'Semente'];

export default function EducationalContent() {
    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('Raiz');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    const [formData, setFormData] = useState<Partial<ContentItem>>({
        ordem: 10,
        orgao: 'Raiz',
        titulo: '',
        conteudo: ''
    });

    useEffect(() => {
        fetchContent();
    }, [selectedTab]);

    const fetchContent = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('conteudo_orgaos')
            .select('*')
            .eq('orgao', selectedTab)
            .order('ordem', { ascending: true });

        if (error) {
            console.error('Error fetching content:', error);
            alert('Erro ao carregar conteúdo.');
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.titulo || !formData.conteudo) {
            alert('Preencha título e conteúdo.');
            return;
        }

        try {
            const payload = {
                orgao: formData.orgao,
                titulo: formData.titulo,
                conteudo: formData.conteudo,
                ordem: Number(formData.ordem),
            };

            let error;
            if (editingItem) {
                const { error: updateError } = await supabase
                    .from('conteudo_orgaos')
                    .update(payload)
                    .eq('id', editingItem.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('conteudo_orgaos')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            alert('Salvo com sucesso!');
            setIsModalOpen(false);
            setEditingItem(null);
            fetchContent();
        } catch (err: any) {
            console.error('Error saving:', err);
            alert('Erro ao salvar: ' + err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return;

        try {
            const { error } = await supabase
                .from('conteudo_orgaos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchContent();
        } catch (err: any) {
            console.error('Error deleting:', err);
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const openNewModal = () => {
        setEditingItem(null);
        setFormData({
            ordem: (items.length + 1) * 10, // Auto-suggest next order
            orgao: selectedTab,
            titulo: '',
            conteudo: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: ContentItem) => {
        setEditingItem(item);
        setFormData({
            ordem: item.ordem,
            orgao: item.orgao,
            titulo: item.titulo,
            conteudo: item.conteudo
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-emerald-600" />
                        Conteúdo Didático do App
                    </h1>
                    <p className="text-gray-500">Gerencie os textos educativos exibidos na seção "Aprenda Mais" do aplicativo.</p>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus size={20} />
                    Novo Conteúdo
                </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-2 mb-6">
                {ORGAOS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-colors
                            ${selectedTab === tab
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Ordem</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Órgão</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-32">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Carregando...</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum conteúdo encontrado.</td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                            {item.ordem}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {item.titulo}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`
                                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${item.orgao === 'Raiz' ? 'bg-amber-100 text-amber-800' :
                                                    item.orgao === 'Folha' ? 'bg-emerald-100 text-emerald-800' :
                                                        item.orgao === 'Flor' ? 'bg-pink-100 text-pink-800' :
                                                            item.orgao === 'Fruto' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-slate-100 text-slate-800'}
                                            `}>
                                                {item.orgao}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingItem ? 'Editar Conteúdo' : 'Novo Conteúdo'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Órgão</label>
                                    <select
                                        value={formData.orgao}
                                        onChange={(e) => setFormData(prev => ({ ...prev, orgao: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        {ORGAOS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                                    <input
                                        type="number"
                                        value={formData.ordem}
                                        onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={formData.titulo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="Ex: Estrutura Interna da Raiz"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                                    <span>Conteúdo (HTML/Markdown)</span>
                                    <span className="text-xs text-gray-400 font-normal">Use tags HTML ou texto simples</span>
                                </label>
                                <textarea
                                    value={formData.conteudo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, conteudo: e.target.value }))}
                                    rows={15}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm bg-slate-50"
                                    placeholder="<p>Escreva o conteúdo aqui...</p>"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                            >
                                <Save size={18} />
                                Salvar Conteúdo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
