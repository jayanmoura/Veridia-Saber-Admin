import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/Dashboard/StatCard';
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
    Trees
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

interface ProjectStats {
    total: number;
    topProject: { name: string; count: number } | null;
}

export default function Projects() {
    const { profile } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState<ProjectStats>({ total: 0, topProject: null });

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

                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto">
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
                        <div key={project.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
                                        {project.tipo === 'Instituição' ? <Building2 size={12} /> : <Trees size={12} />}
                                        {project.tipo}
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
                                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                    <FileText size={16} />
                                    <span className="hidden sm:inline">Relatório</span>
                                </button>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                        <Pencil size={18} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
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
        </div>
    );
}
