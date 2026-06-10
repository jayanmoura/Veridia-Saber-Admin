import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import {
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    AlertTriangle,
    Loader2,
    Folder,
    Image as ImageIcon,
    ArrowLeft,
    Check,
    Download
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import RichTextEditor from '../../components/RichTextEditor';
import { SuccessModal } from '../../components/Modals/SuccessModal';
import { deleteFile, getStorageUrl } from '../../utils/storage';

interface ContentItem {
    id: number;
    orgao: string;
    titulo: string;
    conteudo: string;
    ordem: number;
}

const ORGAOS = ['Raiz', 'Caule', 'Folha', 'Flor', 'Fruto', 'Semente'];
const PASTAS_ARQUIVOS = ['Raiz', 'Caule', 'Folha', 'Flor', 'Fruto', 'Semente', 'Outros'];

export default function EducationalContent() {
    const [items, setItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('Raiz');

    // Feedback Modal State
    const [feedbackModal, setFeedbackModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'success' | 'warning';
    }>({ isOpen: false, title: '', message: '', variant: 'success' });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    const [formData, setFormData] = useState<Partial<ContentItem>>({
        ordem: 10,
        orgao: 'Raiz',
        titulo: '',
        conteudo: ''
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
    const [filesLoading, setFilesLoading] = useState(false);
    const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [folderFiles, setFolderFiles] = useState<any[]>([]);

    // Bulk action states
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeletingFiles, setIsDeletingFiles] = useState(false);

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
            setFeedbackModal({
                isOpen: true,
                title: 'Erro ao Carregar',
                message: 'Não foi possível carregar o conteúdo.',
                variant: 'warning'
            });
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.titulo || !formData.conteudo) {
            setFeedbackModal({
                isOpen: true,
                title: 'Atenção',
                message: 'Preencha o título e o conteúdo antes de salvar.',
                variant: 'warning'
            });
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

            setFeedbackModal({
                isOpen: true,
                title: 'Sucesso!',
                message: 'O conteúdo foi salvo com sucesso.',
                variant: 'success'
            });
            setIsModalOpen(false);
            setEditingItem(null);
            fetchContent();
        } catch (err: any) {
            console.error('Error saving:', err);
            setFeedbackModal({
                isOpen: true,
                title: 'Erro ao Salvar',
                message: 'Ocorreu um erro ao salvar: ' + err.message,
                variant: 'warning'
            });
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteLoading(true);
        try {
            const { error } = await supabase
                .from('conteudo_orgaos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            fetchContent();
        } catch (err: any) {
            console.error('Error deleting:', err);
            setFeedbackModal({
                isOpen: true,
                title: 'Erro ao Excluir',
                message: 'Ocorreu um erro ao tentar excluir: ' + err.message,
                variant: 'warning'
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const openDeleteModal = (item: ContentItem) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const openNewModal = () => {
        setEditingItem(null);
        setFormData({
            ordem: (items.length + 1) * 10,
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

    const openFilesModal = async () => {
        setIsFilesModalOpen(true);
        setCurrentFolder(null);
        setFilesLoading(true);
        const counts: Record<string, number> = {};
        for (const pasta of PASTAS_ARQUIVOS) {
            const { data } = await supabase.storage.from('imagens_conteudo').list(pasta);
            counts[pasta] = data ? data.filter(f => f.name !== '.emptyFolderPlaceholder').length : 0;
        }
        setFolderCounts(counts);
        setFilesLoading(false);
    };

    const openFolder = async (pasta: string) => {
        setCurrentFolder(pasta);
        setFilesLoading(true);
        setSelectedFiles(new Set());
        const { data } = await supabase.storage.from('imagens_conteudo').list(pasta);
        if (data) {
            const filesWithUrls = data.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => {
                return { ...f, publicUrl: getStorageUrl('imagens_conteudo', `${pasta}/${f.name}`) };
            });
            setFolderFiles(filesWithUrls);
        } else {
            setFolderFiles([]);
        }
        setFilesLoading(false);
    };

    const toggleFileSelection = (fileName: string) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(fileName)) newSet.delete(fileName);
        else newSet.add(fileName);
        setSelectedFiles(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedFiles.size === folderFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(folderFiles.map(f => f.name)));
        }
    };

    const handleDownloadSelected = async () => {
        if (selectedFiles.size === 0) return;
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            const promises = Array.from(selectedFiles).map(async (fileName) => {
                const fileObj = folderFiles.find(f => f.name === fileName);
                if (!fileObj) return;
                const res = await fetch(fileObj.publicUrl);
                const blob = await res.blob();
                zip.file(fileName, blob);
            });
            await Promise.all(promises);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `imagens_${currentFolder}_${Date.now()}.zip`);
        } catch (e: any) {
            console.error('Erro ao baixar ZIP:', e);
            setFeedbackModal({ isOpen: true, title: 'Erro de Download', message: 'Falha ao compactar imagens: ' + e.message, variant: 'warning' });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedFiles.size === 0 || !currentFolder) return;
        if (!window.confirm(`Tem certeza que deseja excluir permanentemente as ${selectedFiles.size} imagem(ns) selecionada(s) do servidor?`)) {
            return;
        }
        
        setIsDeletingFiles(true);
        try {
            const deletePromises = Array.from(selectedFiles).map(name => 
                deleteFile('imagens_conteudo', `${currentFolder}/${name}`)
            );
            await Promise.allSettled(deletePromises);
            
            setFeedbackModal({ isOpen: true, title: 'Sucesso', message: 'Imagens excluídas com sucesso!', variant: 'success' });
            setSelectedFiles(new Set()); 
            
            const { data } = await supabase.storage.from('imagens_conteudo').list(currentFolder);
            if (data) {
                const filesWithUrls = data.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => {
                    return { ...f, publicUrl: getStorageUrl('imagens_conteudo', `${currentFolder}/${f.name}`) };
                });
                setFolderFiles(filesWithUrls);
            } else {
                setFolderFiles([]);
            }
        } catch (e: any) {
            console.error('Erro ao excluir imagens no Supabase:', e);
            setFeedbackModal({ isOpen: true, title: 'Erro de Exclusão', message: 'Falha ao remover imagens: ' + e.message, variant: 'warning' });
        } finally {
            setIsDeletingFiles(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-emerald-600" />
                        Conteúdo Didático do App
                    </h1>
                    <p className="text-gray-500">Gerencie os textos educativos exibidos na seção "Aprenda Mais" do aplicativo.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={openFilesModal}
                        className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        <Folder size={18} />
                        Arquivos
                    </button>
                    <button
                        onClick={openNewModal}
                        className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <Plus size={18} />
                        Novo Conteúdo
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-2 mb-6">
                {ORGAOS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === tab
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

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
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.ordem}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.titulo}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.orgao === 'Raiz' ? 'bg-amber-100 text-amber-800' :
                                                    item.orgao === 'Folha' ? 'bg-emerald-100 text-emerald-800' :
                                                        item.orgao === 'Flor' ? 'bg-pink-100 text-pink-800' :
                                                            item.orgao === 'Fruto' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-slate-100 text-slate-800'
                                                }`}>
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
                                                    onClick={() => openDeleteModal(item)}
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

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Conteúdo Educativo
                                </label>
                                <RichTextEditor
                                    key={editingItem ? editingItem.id : 'new_item'}
                                    content={formData.conteudo || ''}
                                    onChange={(html) => setFormData(prev => ({ ...prev, conteudo: html }))}
                                    placeholder="Escreva o conteúdo aqui..."
                                    orgao={formData.orgao || 'Outros'}
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
                </div>,
                document.body
            )}

            {isDeleteModalOpen && itemToDelete && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={closeDeleteModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Excluir Conteúdo?</h3>
                        <p className="text-gray-600 text-center mb-4">
                            Você tem certeza que deseja excluir o conteúdo{' '}
                            <strong className="text-gray-900">"{itemToDelete.titulo}"</strong>?
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                                <div className="text-sm text-amber-800">
                                    <strong className="font-semibold">Atenção:</strong> Este conteúdo é exibido na seção "Aprenda Mais" do aplicativo. Ao excluí-lo, os usuários não terão mais acesso a esta informação educativa.
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(itemToDelete.id)}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <><Loader2 size={18} className="animate-spin" />Excluindo...</>
                                ) : (
                                    <><Trash2 size={18} />Sim, Excluir</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isFilesModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                {currentFolder && (
                                    <button 
                                        onClick={() => setCurrentFolder(null)}
                                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Folder className="text-emerald-600" />
                                    {currentFolder ? `Arquivos: ${currentFolder}` : 'Gerenciador de Arquivos'}
                               </h2>
                            </div>
                            <button onClick={() => setIsFilesModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                            {filesLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <p>Carregando arquivos...</p>
                                </div>
                            ) : !currentFolder ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {PASTAS_ARQUIVOS.map(pasta => (
                                        <button
                                            key={pasta}
                                            onClick={() => openFolder(pasta)}
                                            className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-colors group"
                                        >
                                            <Folder size={40} className="text-gray-300 group-hover:text-emerald-500 mb-3 transition-colors" />
                                            <span className="font-semibold text-gray-700">{pasta}</span>
                                            <span className="text-xs text-gray-400 mt-1">
                                                {folderCounts[pasta] || 0} arquivo{folderCounts[pasta] !== 1 && 's'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                folderFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <ImageIcon size={48} className="mb-4 opacity-50 text-gray-300" />
                                        <p>Nenhuma imagem nesta pasta.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col relative w-full h-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-sm text-gray-500">{folderFiles.length} imagens encontradas</p>
                                            <button 
                                                onClick={toggleSelectAll} 
                                                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                                            >
                                                {selectedFiles.size === folderFiles.length ? 'Desmarcar todas' : 'Selecionar todas'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {folderFiles.map(file => (
                                                <div 
                                                    key={file.id} 
                                                    onClick={() => toggleFileSelection(file.name)}
                                                    className={`bg-white rounded-lg overflow-hidden group relative aspect-square cursor-pointer transition-colors border-2 ${
                                                        selectedFiles.has(file.name) ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500 ring-offset-1' : 'border-gray-200 hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                                        selectedFiles.has(file.name) ? 'bg-emerald-500 border-none' : 'bg-white/80 border border-gray-300 opacity-0 group-hover:opacity-100'
                                                    }`}>
                                                        {selectedFiles.has(file.name) && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <img 
                                                        src={file.publicUrl} 
                                                        alt={file.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white text-xs truncate" title={file.name}>{file.name}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        {currentFolder && selectedFiles.size > 0 && (
                            <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between z-20">
                                <span className="font-semibold text-gray-800">{selectedFiles.size} selecionada{selectedFiles.size > 1 ? 's' : ''}</span>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleDownloadSelected}
                                        disabled={isDownloading || isDeletingFiles}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                                    >
                                        {isDownloading ? <Loader2 size={18} className="animate-spin text-emerald-600"/> : <Download size={18} />}
                                        Baixar
                                    </button>
                                    <button 
                                        onClick={handleDeleteSelected}
                                        disabled={isDownloading || isDeletingFiles}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm font-medium"
                                    >
                                        {isDeletingFiles ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            <SuccessModal
                isOpen={feedbackModal.isOpen}
                onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
                title={feedbackModal.title}
                message={feedbackModal.message}
                variant={feedbackModal.variant}
            />
        </div>
    );
}