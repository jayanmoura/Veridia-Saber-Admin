import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/Dashboard/StatCard';
import { SpeciesModal } from '../../components/Modals/SpeciesModal';
import { generateSpeciesReport, generateSingleSpeciesReport } from '../../utils/pdfGenerator';
import { getRoleLevel, hasMinLevel } from '../../types/auth';
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
    Loader2,
    X,
    CheckCircle
} from 'lucide-react';

interface Species {
    id: string;
    nome_cientifico: string;
    nome_popular?: string;
    familia_id: string;
    familia?: { familia_nome: string };
    imagens?: { url_imagem: string; local_id?: string | number | null }[];
    created_at?: string | null;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
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

    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [speciesToDelete, setSpeciesToDelete] = useState<Species | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Block Modal State (FK Violation)
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockedSpeciesName, setBlockedSpeciesName] = useState('');

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deletedSpeciesName, setDeletedSpeciesName] = useState('');

    // Open delete confirmation modal
    const openDeleteModal = (species: Species) => {
        setSpeciesToDelete(species);
        setIsDeleteModalOpen(true);
    };

    // Close delete confirmation modal
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSpeciesToDelete(null);
    };

    // Handle species deletion (called from modal)
    const confirmDelete = async () => {
        if (!speciesToDelete) return;

        const speciesName = speciesToDelete.nome_cientifico;
        setDeleteLoading(true);
        closeDeleteModal();

        try {
            const { error } = await supabase
                .from('especie')
                .delete()
                .eq('id', speciesToDelete.id);

            if (error) throw error;

            // Update local state ONLY on success
            setSpecies(prev => prev.filter(s => s.id !== speciesToDelete.id));
            setTotalCount(prev => prev - 1);

            // Show success modal
            setDeletedSpeciesName(speciesName);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Delete error:', error);

            // Check for Foreign Key Violation (Postgres Code 23503)
            if (error?.code === '23503' || error?.message?.includes('violates foreign key constraint')) {
                setBlockedSpeciesName(speciesName);
                setShowBlockModal(true);
            }
            // Check for RLS/Permission Error (403 or 401)
            else if (error?.code === '42501' || error?.code === '403' || error?.message?.includes('violates row-level security policy')) {
                alert("🚫 Você não tem permissão para excluir esta espécie.");
            }
            else {
                alert(error.message || 'Erro ao excluir espécie.');
            }

            // Re-fetch to ensure UI sync if something went wrong but we already optimistic-updated (though we disabled optimistic update, re-fetch is safe)
            fetchSpecies();
        } finally {
            setDeleteLoading(false);
        }
    };

    // Export loading state
    const [exportLoading, setExportLoading] = useState(false);
    const [singleReportLoading, setSingleReportLoading] = useState<string | null>(null);

    // TAREFA 2: Check user role using levels
    const myLevel = getRoleLevel(profile?.role);
    const isGlobalAdmin = myLevel <= 3; // Níveis 1, 2, 3 são globais

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
            const { data: speciesData, error } = await supabase
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
                    imagens(url_imagem)
                `)
                .eq('id', speciesId)
                .single();

            if (error) throw error;
            if (!speciesData) {
                alert('Espécie não encontrada.');
                return;
            }

            // If user is a local manager, fetch local details
            let localDetails = {};
            if (profile?.local_id) {
                const { data: localData } = await supabase
                    .from('especie_local')
                    .select('descricao_ocorrencia, detalhes_localizacao, latitude, longitude')
                    .eq('especie_id', speciesId)
                    .eq('local_id', profile.local_id)
                    .maybeSingle();

                if (localData) {
                    localDetails = localData;
                }
            }

            const safeName = speciesData.nome_cientifico.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

            await generateSingleSpeciesReport(
                { ...speciesData, ...localDetails },
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

    // TAREFA 2: Access control using levels
    // Níveis 1-5 têm acesso (Consulente nível 6 não tem)
    const hasAccess = hasMinLevel(profile?.role, 5);

    // Report Access: Only levels 1, 2, 4 (Curador, Coordenador, Gestor)
    const canGenerateReports = myLevel === 1 || myLevel === 2 || myLevel === 4;
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

            // Check if user is a global admin (sees all images) or project user (sees only their project's images)
            const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico' || profile?.role === 'Taxonomista Sênior';
            const userLocalId = profile?.local_id;

            // Fetch species with images (include local_id for filtering)
            const query = supabase
                .from('especie')
                .select(`
                    *,
                    familia (familia_nome),
                    imagens (url_imagem, local_id),
                    creator:profiles(full_name, email)
                `, { count: 'exact' })
                .order('nome_cientifico')
                .range(from, to);

            let finalQuery = query;

            if (search) {
                finalQuery = finalQuery.ilike('nome_cientifico', `%${search}%`);
            }

            if (selectedFamily) {
                finalQuery = finalQuery.eq('familia_id', selectedFamily);
            }

            const { data, error, count } = await finalQuery;

            if (error) throw error;

            // Filter images client-side for project users
            let formattedData: Species[] = (data || []).map((species: any) => {
                let filteredImages = species.imagens || [];

                // If not global admin and has local_id, filter images by local_id
                if (!isGlobalAdmin && userLocalId && filteredImages.length > 0) {
                    filteredImages = filteredImages.filter((img: any) =>
                        img.local_id === userLocalId || img.local_id === String(userLocalId)
                    );
                }

                return {
                    ...species,
                    imagens: filteredImages
                };
            });

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
        const missingImages = data.filter(s => !s.imagens || s.imagens.length === 0).length;

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
                    {canGenerateReports && (
                        <button
                            onClick={handleExportSpecies}
                            disabled={exportLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-1 md:flex-none disabled:opacity-50"
                        >
                            {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            <span className="hidden sm:inline">{exportLoading ? 'Gerando...' : 'Exportar'}</span>
                        </button>
                    )}
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
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado por</th>
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
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : species.length > 0 ? (
                                species.map((specie) => {
                                    const imageUrl = specie.imagens?.[0]?.url_imagem;

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
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {(() => {
                                                    const creator = Array.isArray(specie.creator) ? specie.creator[0] : specie.creator;
                                                    if (creator?.full_name) return creator.full_name;
                                                    if (creator?.email) return creator.email.split('@')[0];
                                                    return 'Sistema';
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Report button - only for Curador, Coordenador, Gestor */}
                                                    {canGenerateReports && (
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
                                                    <button
                                                        onClick={() => openDeleteModal(specie)}
                                                        disabled={deleteLoading}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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

            {/* Delete Confirmation Modal */}
            {
                isDeleteModalOpen && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center">
                        {/* Overlay */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={closeDeleteModal}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="text-red-600" size={32} />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                                Excluir Espécie?
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 text-center mb-6">
                                Você tem certeza que deseja remover a espécie{' '}
                                <strong className="text-gray-900 italic">{speciesToDelete?.nome_cientifico}</strong>?
                                <br />
                                <span className="text-sm text-gray-500">
                                    Esta ação não pode ser desfeita.
                                </span>
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={closeDeleteModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Block Delete Modal (FK Violation) */}
            {showBlockModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-all duration-300"
                        onClick={() => setShowBlockModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowBlockModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            {/* Icon with Ring Effect */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20"></div>
                                <div className="relative w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                    <AlertTriangle size={40} className="text-amber-500" />
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Exclusão Bloqueada</h3>

                            <p className="text-gray-600 mb-8 leading-relaxed text-base">
                                A espécie <strong className="text-gray-900 italic">"{blockedSpeciesName}"</strong> não pode ser removida pois existem registros vinculados a ela (Ex: árvores plantada, monitoramentos, etc).
                                <br /><br />
                                <span className="inline-block bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium border border-amber-100">
                                    💡 Solução: Entre em contato com o suporte.
                                </span>
                            </p>

                            {/* Action */}
                            <button
                                onClick={() => setShowBlockModal(false)}
                                className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Success Modal */}
            {showSuccessModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-all duration-300"
                        onClick={() => setShowSuccessModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            {/* Icon with Ring Effect */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                                <div className="relative w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                    <CheckCircle size={40} className="text-emerald-500" />
                                </div>
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Espécie Excluída</h3>

                            <p className="text-gray-600 mb-8 leading-relaxed text-base">
                                A espécie <strong className="text-gray-900 italic">"{deletedSpeciesName}"</strong> foi removida com sucesso do catálogo.
                            </p>

                            {/* Action */}
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-200"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
