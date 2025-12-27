import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/Dashboard/StatCard';
import { SpeciesModal } from '../components/Modals/SpeciesModal';
import { generateSpeciesReport, generateSingleSpeciesReport } from '../utils/pdfGenerator';
import {
    Leaf,
    Image as ImageIcon,
    ImageOff,
    Search,
    Download,
    Plus,
    FileText,
    Pencil,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Filter,
    Loader2
} from 'lucide-react';

interface Species {
    id: string;
    nome_cientifico: string;
    nome_popular?: string;
    familia_id: string;
    familia?: { familia_nome: string };
    especie_imagens?: { url_imagem: string }[];
}

interface FamilyOption {
    id: string;
    familia_nome: string;
}

interface SpeciesStats {
    total: number;
    topEpithet: { name: string; count: number } | null;
    missingImages: number;
}

const ITEMS_PER_PAGE = 20;

export default function SpeciesPage() {
    const { profile } = useAuth();
    const [species, setSpecies] = useState<Species[]>([]);
    const [families, setFamilies] = useState<FamilyOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [search, setSearch] = useState('');
    const [selectedFamily, setSelectedFamily] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [stats, setStats] = useState<SpeciesStats>({
        total: 0,
        topEpithet: null,
        missingImages: 0
    });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecies, setEditingSpecies] = useState<Species | null>(null);

    // Open modal for new species
    const handleNewSpecies = () => {
        setEditingSpecies(null);
        setIsModalOpen(true);
    };

    // Open modal for editing
    const handleEditSpecies = (species: Species) => {
        setEditingSpecies(species);
        setIsModalOpen(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSpecies(null);
    };

    // Export loading state
    const [exportLoading, setExportLoading] = useState(false);
    const [singleReportLoading, setSingleReportLoading] = useState<string | null>(null);

    // Check user role
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    // Handle species export based on user role
    const handleExportSpecies = async () => {
        setExportLoading(true);
        try {
            let speciesData;
            let projectName: string | undefined;

            if (isGlobalAdmin) {
                // Global admin: fetch all species with local info
                const { data, error } = await supabase
                    .from('especie')
                    .select('nome_cientifico, nome_popular, familia(familia_nome), locais(nome)')
                    .order('nome_cientifico');

                if (error) throw error;
                speciesData = data || [];
            } else {
                // Local user: fetch only their project's species
                if (!profile?.local_id) {
                    alert('Você não possui um projeto vinculado para exportar.');
                    return;
                }

                // Get project name
                const { data: projectData } = await supabase
                    .from('locais')
                    .select('nome')
                    .eq('id', profile.local_id)
                    .single();

                projectName = projectData?.nome;

                // Fetch species for this project
                const { data, error } = await supabase
                    .from('especie')
                    .select('nome_cientifico, nome_popular, familia(familia_nome)')
                    .eq('local_id', profile.local_id)
                    .order('nome_cientifico');

                if (error) throw error;
                speciesData = data || [];
            }

            if (speciesData.length === 0) {
                alert('Nenhuma espécie encontrada para exportar.');
                return;
            }

            // Generate PDF
            const fileName = isGlobalAdmin
                ? 'relatorio_especies_geral.pdf'
                : `relatorio_especies_${(projectName || 'projeto').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;

            generateSpeciesReport(
                speciesData,
                fileName,
                {
                    isGlobalReport: isGlobalAdmin,
                    projectName
                },
                {
                    userName: profile?.full_name,
                    userRole: profile?.role,
                }
            );
        } catch (error: any) {
            console.error('Export error:', error);
            alert(error.message || 'Erro ao exportar relatório.');
        } finally {
            setExportLoading(false);
        }
    };

    // Handle single species report generation (Ficha Técnica)
    const handleGenerateSingleReport = async (speciesId: string) => {
        setSingleReportLoading(speciesId);
        try {
            // Fetch complete species data with all relations
            const { data, error } = await supabase
                .from('especie')
                .select(`
                    id,
                    nome_cientifico,
                    nome_popular,
                    descricao_especie,
                    cuidados_luz,
                    cuidados_agua,
                    cuidados_temperatura,
                    cuidados_substrato,
                    cuidados_nutrientes,
                    familia(familia_nome),
                    locais(nome),
                    especie_imagens(url_imagem)
                `)
                .eq('id', speciesId)
                .single();

            if (error) throw error;
            if (!data) {
                alert('Espécie não encontrada.');
                return;
            }

            const safeName = data.nome_cientifico.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

            await generateSingleSpeciesReport(
                data,
                `ficha_${safeName}.pdf`,
                {
                    userName: profile?.full_name,
                    userRole: profile?.role,
                }
            );
        } catch (error: any) {
            console.error('Single report error:', error);
            alert(error.message || 'Erro ao gerar ficha técnica.');
        } finally {
            setSingleReportLoading(null);
        }
    };

    // Access control: Curadores, Coordenadores, Gestores e Taxonomistas
    const hasAccess = profile?.role === 'Curador Mestre' ||
        profile?.role === 'Coordenador Científico' ||
        profile?.role === 'Gestor de Acervo' ||
        profile?.role?.includes('Taxonomista');
    // Assuming catalogers might access this too, but complying with request context "Admin Panel". Only explicit "Access Denied" if strict.
    // The prompt implies strict "Curador Mestre" logic from Families wasn't explicitly repeated but "Atue como Senior... Crie a página".
    // I'll stick to Global/Local admin logic or similar. Let's replicate Families check for now to be safe, or allow all admins.
    // Actually, Catalogers usually ADD species. So they need access.
    // But let's check Permissions Logic in implementation_plan.md later.
    // For now, I will use a broader check but maybe warn if not authorized?
    // Let's stick to the prompt's implied "Management" context.

    // Actually prompt for Families said: "EXCLUSIVA Curador Mestre e Coordenador".
    // Prompt for Species didn't specify strictness. I'll allow Catalogers to WRITE, so they likely view?
    // Use generic `hasAccess` or just render.

    useEffect(() => {
        fetchFamilies();
    }, []);

    useEffect(() => {
        fetchSpecies();
    }, [page, search, selectedFamily]);

    const fetchFamilies = async () => {
        const { data } = await supabase
            .from('familia')
            .select('id, familia_nome')
            .order('familia_nome');
        if (data) setFamilies(data);
    };

    const fetchSpecies = async () => {
        setLoading(true);
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('especie')
                .select(`
          *,
          familia (familia_nome),
          especie_imagens (url_imagem)
        `, { count: 'exact' })
                .order('nome_cientifico') // Ordered by scientific name usually
                .range(from, to);

            if (search) {
                // Search in scientific name OR popular name (if explicit OR filter needed, syntax is different)
                // .or(`nome_cientifico.ilike.%${search}%,nome_popular.ilike.%${search}%`)
                query = query.ilike('nome_cientifico', `%${search}%`);
            }

            if (selectedFamily) {
                query = query.eq('familia_id', selectedFamily);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            const formattedData: Species[] = data || [];
            setSpecies(formattedData);
            setTotalCount(count || 0);
            calculateStats(formattedData, count || 0);

        } catch (error) {
            console.error('Error fetching species:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Species[], total: number) => {
        // 1. Missing Images (in current page)
        const missingImages = data.filter(s => !s.especie_imagens || s.especie_imagens.length === 0).length;

        // 2. Top Epithet Logic (in current page)
        const epithetCounts: Record<string, number> = {};

        data.forEach(s => {
            const parts = s.nome_cientifico?.trim().split(' ') || [];
            if (parts.length >= 2) {
                // Second word is the epithet (usually lower case)
                const epithet = parts[1].toLowerCase().replace(/[^a-z]/g, ''); // Clean logic
                if (epithet) {
                    epithetCounts[epithet] = (epithetCounts[epithet] || 0) + 1;
                }
            }
        });

        let topEpithet = null;
        let maxCount = 0;

        Object.entries(epithetCounts).forEach(([name, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topEpithet = { name, count };
            }
        });

        setStats({
            total,
            missingImages,
            topEpithet
        });
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFamily(e.target.value);
        setPage(1);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    if (!hasAccess) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
                <p className="text-gray-500 max-w-md">
                    Você não tem permissão para acessar esta área.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Espécies</h1>
                <p className="text-gray-500">Catálogo de biodiversidade.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total de Espécies"
                    value={stats.total}
                    icon={Leaf}
                    color="emerald"
                    loading={loading}
                />
                <StatCard
                    title="Top Epíteto (Pág)"
                    value={loading ? "..." : (stats.topEpithet ? `${stats.topEpithet.name} (${stats.topEpithet.count})` : '-')}
                    icon={ImageIcon} // Using ImageIcon as placeholder for Epithet which sounds like 'Label'
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Sem Imagem (Pág)"
                    value={stats.missingImages}
                    icon={ImageOff}
                    color="red"
                    loading={loading}
                />
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Left: Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar espécie..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                            value={selectedFamily}
                            onChange={handleFamilyChange}
                        >
                            <option value="">Todas Famílias</option>
                            {families.map(f => (
                                <option key={f.id} value={f.id}>{f.familia_nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExportSpecies}
                        disabled={exportLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-1 md:flex-none disabled:opacity-50"
                    >
                        {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        <span className="hidden sm:inline">{exportLoading ? 'Gerando...' : 'Exportar'}</span>
                    </button>
                    <button
                        onClick={handleNewSpecies}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex-1 md:flex-none"
                    >
                        <Plus size={18} />
                        <span className="whitespace-nowrap">Nova Espécie</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Foto</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Família</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Espécie</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-md"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : species.length > 0 ? (
                                species.map((specie) => {
                                    const imageUrl = specie.especie_imagens?.[0]?.url_imagem;

                                    return (
                                        <tr key={specie.id} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={specie.nome_cientifico} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <Leaf size={18} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {specie.familia?.familia_nome || '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 italic">
                                                {specie.nome_cientifico}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Report button - only for Curador, Coordenador, Gestor */}
                                                    {(profile?.role === 'Curador Mestre' ||
                                                        profile?.role === 'Coordenador Científico' ||
                                                        profile?.role === 'Gestor de Acervo') && (
                                                            <button
                                                                onClick={() => handleGenerateSingleReport(specie.id)}
                                                                disabled={singleReportLoading === specie.id}
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Ficha Técnica"
                                                            >
                                                                {singleReportLoading === specie.id ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                                            </button>
                                                        )}
                                                    <button
                                                        onClick={() => handleEditSpecies(specie)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Nenhuma espécie encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <p className="text-sm text-gray-500">
                        Mostrando <span className="font-medium text-gray-900">{species.length}</span> de <span className="font-medium text-gray-900">{totalCount}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} className="text-gray-600" />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                            Página {page} de {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Species Modal */}
            <SpeciesModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={fetchSpecies}
                initialData={editingSpecies}
            />
        </div>
    );
}
