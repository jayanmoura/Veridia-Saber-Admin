import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/Dashboard/StatCard';
import {
    MapPin,
    Crown,
    Search,
    Plus,
    FileText,
    Pencil,
    Trash2,
    AlertTriangle,
    Leaf,
    Building2,
    Trees,
    Loader2,
    Upload,
    X
} from 'lucide-react';

interface Project {
    id: string;
    nome: string;
    descricao: string | null;
    imagem_capa: string | null;
    tipo: string | null; // 'Instituição', 'Parque', etc
    especie?: { count: number }[]; // Relation returns an array of objects
    quantidade_especies: number; // Mapped number for display
}

// Helper to normalize and format the 'tipo' field from database
const formatTipo = (tipo: string | null): string => {
    if (!tipo) return '';
    const normalized = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tipoMap: Record<string, string> = {
        'instituicao': 'Instituição',
        'intituicao': 'Instituição', // common typo
        'parque': 'Parque',
        'reserva': 'Reserva',
        'jardim': 'Jardim',
    };
    return tipoMap[normalized] || tipo; // fallback to original if not mapped
};

// Helper to check if tipo is an institution
const isInstituicao = (tipo: string | null): boolean => {
    if (!tipo) return false;
    const normalized = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized === 'instituicao' || normalized === 'intituicao';
};

interface ProjectStats {
    total: number;
    topProject: { name: string; count: number } | null;
}

export default function Projects() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState<ProjectStats>({ total: 0, topProject: null });

    // New Project Modal State
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [newProjectLoading, setNewProjectLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        tipo: '',
        cidade: '',
        estado: '',
        descricao: ''
    });

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form Options
    const TIPOS_PROJETO = [
        'Jardim Botânico',
        'Parque',
        'Reserva',
        'Escola',
        'Universidade',
        'Instituição',
        'Outro'
    ];

    // Permissions Check: Only Global Admins
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    useEffect(() => {
        if (isGlobalAdmin) fetchProjects();
    }, [profile]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // Fetch projects with the count of related species
            // Supabase returns relations as arrays, e.g., especie: [{ count: 5 }]
            const { data, error } = await supabase
                .from('locais')
                .select('*, especie(count)')
                .order('nome');

            if (error) throw error;

            // Process and map the data safely
            const formattedData: Project[] = (data || []).map((item: any) => {
                // Safe extraction of the count from the relation array
                const extractedCount = item.especie?.[0]?.count || 0;

                return {
                    ...item,
                    quantidade_especies: extractedCount
                };
            });

            setProjects(formattedData);
            calculateStats(formattedData);

        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Project[]) => {
        const total = data.length;

        // Top Project Logic: Sort by the mapped 'quantidade_especies'
        const top = [...data].sort((a, b) => b.quantidade_especies - a.quantidade_especies)[0];

        setStats({
            total,
            topProject: {
                name: top && top.quantidade_especies > 0 ? top.nome : '-',
                count: top ? top.quantidade_especies : 0
            }
        });
    };

    const filteredProjects = projects.filter(p =>
        p.nome.toLowerCase().includes(search.toLowerCase())
    );

    // Toast helper
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Image handler
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Por favor, selecione apenas arquivos de imagem.', 'error');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Upload image to Supabase Storage
    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `projeto_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `projetos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('arquivos-gerais')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('arquivos-gerais')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    // Create new project
    const handleCreateProject = async () => {
        // Validation
        if (!formData.nome.trim()) {
            showToast('O nome do projeto é obrigatório.', 'error');
            return;
        }

        if (!profile?.institution_id) {
            showToast('Erro: Usuário não possui instituição vinculada.', 'error');
            return;
        }

        setNewProjectLoading(true);

        try {
            let imagemUrl: string | null = null;

            // Upload image if selected
            if (imageFile) {
                imagemUrl = await uploadImage(imageFile);
                if (!imagemUrl) {
                    showToast('Erro ao fazer upload da imagem.', 'error');
                    setNewProjectLoading(false);
                    return;
                }
            }

            // Insert into 'locais' table
            const { error } = await supabase
                .from('locais')
                .insert([{
                    nome: formData.nome.trim(),
                    tipo: formData.tipo || null,
                    cidade: formData.cidade.trim() || null,
                    estado: formData.estado.trim() || null,
                    descricao: formData.descricao.trim() || null,
                    institution_id: profile.institution_id,
                    imagem_capa: imagemUrl
                }]);

            if (error) throw error;

            // Success!
            showToast('Projeto criado com sucesso!');
            setIsNewModalOpen(false);
            resetForm();
            fetchProjects(); // Refresh the list

        } catch (err: any) {
            console.error('Error creating project:', err);
            showToast('Erro ao criar projeto: ' + err.message, 'error');
        } finally {
            setNewProjectLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({ nome: '', tipo: '', cidade: '', estado: '', descricao: '' });
        setImageFile(null);
        setImagePreview(null);
    };

    // Close modal handler
    const closeNewModal = () => {
        setIsNewModalOpen(false);
        resetForm();
    };

    if (!isGlobalAdmin) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
                <p className="text-gray-500 max-w-md">
                    Esta área é restrita para Curadores Mestres e Coordenadores Científicos.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header & Metrics */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Projetos</h1>
                <p className="text-gray-500">Locais e instituições vinculados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    title="Total de Projetos"
                    value={stats.total}
                    icon={MapPin}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Top Projeto (+ Espécies)"
                    value={loading ? "..." : (stats.topProject ? `${stats.topProject.name} (${stats.topProject.count})` : '-')}
                    icon={Crown}
                    color="amber"
                    loading={loading}
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar projeto..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto"
                >
                    <Plus size={18} />
                    <span>Novo Projeto</span>
                </button>
            </div>

            {/* Grid Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 h-80 animate-pulse">
                            <div className="h-48 bg-gray-100 rounded-t-xl"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-6 w-3/4 bg-gray-100 rounded"></div>
                                <div className="h-4 w-full bg-gray-100 rounded"></div>
                                <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        >
                            {/* Card Image */}
                            <div className="relative h-48 bg-gray-100">
                                {project.imagem_capa ? (
                                    <img
                                        src={project.imagem_capa}
                                        alt={project.nome}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <MapPin size={48} />
                                    </div>
                                )}

                                {/* Badge Type */}
                                {project.tipo && (
                                    <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm shadow-sm rounded-full text-xs font-semibold text-gray-700 flex items-center gap-1">
                                        {isInstituicao(project.tipo) ? <Building2 size={12} /> : <Trees size={12} />}
                                        {formatTipo(project.tipo)}
                                    </div>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate" title={project.nome}>
                                    {project.nome}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                                    {project.descricao || 'Sem descrição cadastrada.'}
                                </p>

                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                                    <Leaf size={16} />
                                    {/* Using the mapped amount guaranteed to be a number */}
                                    <span className="text-sm font-medium">{project.quantidade_especies} espécies</span>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={(e) => { e.stopPropagation(); /* TODO: Gerar relatório */ }}
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    <FileText size={16} />
                                    <span className="hidden sm:inline">Relatório</span>
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); /* TODO: Editar */ }}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); /* TODO: Excluir */ }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                    Nenhum projeto encontrado.
                </div>
            )}

            {/* New Project Modal */}
            {isNewModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeNewModal}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-fade-in-up">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <MapPin className="text-emerald-600" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Novo Projeto</h2>
                                    <p className="text-sm text-gray-500">Preencha os dados do local</p>
                                </div>
                            </div>
                            <button
                                onClick={closeNewModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                            {/* Nome (Required) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Projeto <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="Ex: Jardim Botânico de Brasília"
                                />
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                >
                                    <option value="">Selecione um tipo</option>
                                    {TIPOS_PROJETO.map(tipo => (
                                        <option key={tipo} value={tipo}>{tipo}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Cidade e Estado */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                    <input
                                        type="text"
                                        value={formData.cidade}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Ex: São Paulo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <input
                                        type="text"
                                        value={formData.estado}
                                        onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Ex: SP"
                                        maxLength={2}
                                    />
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                    placeholder="Uma breve descrição do projeto..."
                                />
                            </div>

                            {/* Imagem de Capa */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Capa</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-emerald-400 transition-colors">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-40 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="flex flex-col items-center gap-2 py-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Upload className="text-gray-400" size={24} />
                                                </div>
                                                <p className="text-sm text-gray-500">Clique para selecionar uma imagem</p>
                                                <p className="text-xs text-gray-400">PNG, JPG ou WEBP</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
                            <button
                                onClick={closeNewModal}
                                disabled={newProjectLoading}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateProject}
                                disabled={newProjectLoading || !formData.nome.trim()}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {newProjectLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        Criar Projeto
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Toast Notification */}
            {toast && createPortal(
                <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-up ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {toast.type === 'success' ? (
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ) : (
                        <AlertTriangle size={20} />
                    )}
                    <span className="font-medium">{toast.message}</span>
                </div>,
                document.body
            )}
        </div>
    );
}
