import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { StatCard } from '../components/Dashboard/StatCard';
import { FamilyModal } from '../components/Modals/FamilyModal';
import { generateFamiliesReportWithChart, generateFamilyReportWithCharts } from '../utils/pdfGenerator';
import {
    TreeDeciduous,
    ImageOff,
    Crown,
    Search,
    Download,
    Plus,
    FileText,
    Pencil,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
    CheckCircle
} from 'lucide-react';

interface Family {
    id: string;
    familia_nome: string;
    imagem_referencia: string | null;
    especie?: { count: number }[];
    quantidade_especies: number;
}

interface FamilyStats {
    total: number;
    richest: { name: string; count: number } | null;
    missingImages: number;
}

const ITEMS_PER_PAGE = 20;

export default function Families() {
    const { profile } = useAuth();
    const [families, setFamilies] = useState<Family[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState<FamilyStats>({ total: 0, richest: null, missingImages: 0 });

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);

    // Open modal for new family
    const handleNewFamily = () => {
        setEditingFamily(null);
        setIsModalOpen(true);
    };

    // Open modal for editing
    const handleEditFamily = (family: Family) => {
        setEditingFamily(family);
        setIsModalOpen(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFamily(null);
    };

    // Loading states for actions
    const [exportLoading, setExportLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null);

    // Block Modal State (FK Violation)
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockedFamilyName, setBlockedFamilyName] = useState('');

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deletedFamilyName, setDeletedFamilyName] = useState('');

    // Open delete confirmation modal
    const openDeleteModal = (family: Family) => {
        setFamilyToDelete(family);
        setIsDeleteModalOpen(true);
    };

    // Close delete confirmation modal
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setFamilyToDelete(null);
    };

    // Helper: Extract storage path from public URL
    const extractStoragePath = (publicUrl: string): string | null => {
        try {
            // URL format: .../storage/v1/object/public/bucket-name/path/to/file.ext
            const match = publicUrl.match(/\/imagens-plantas\/(.+)$/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    // Export all families to PDF with Chart
    const handleExportAll = async () => {
        setExportLoading(true);
        try {
            // Fetch all families (not paginated)
            const { data: allFamilies, error } = await supabase
                .from('familia')
                .select('familia_nome, created_at, especie(count)')
                .order('familia_nome');

            if (error) throw error;

            // Prepare data for the chart + table report
            const reportData = (allFamilies || []).map((f: any) => ({
                name: f.familia_nome,
                count: f.especie?.[0]?.count || 0,
                createdAt: f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : '-'
            }));

            // Generate PDF with chart on page 1 and table on page 2+
            generateFamiliesReportWithChart(
                reportData,
                'relatorio_familias_geral.pdf',
                {
                    userName: profile?.full_name,
                    userRole: profile?.role,
                }
            );
        } catch (error) {
            console.error('Export error:', error);
            alert('Erro ao exportar relatório.');
        } finally {
            setExportLoading(false);
        }
    };

    // Generate individual family report with charts
    const generateFamilyReport = async (family: Family) => {
        setReportLoading(family.id);
        try {
            // Fetch species for this family
            const { data: species, error } = await supabase
                .from('especie')
                .select('nome_cientifico, nome_popular')
                .eq('familia_id', family.id)
                .order('nome_cientifico');

            if (error) throw error;

            const safeName = family.familia_nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

            // Generate report with dashboard charts
            generateFamilyReportWithCharts(
                family.familia_nome,
                species || [],
                `relatorio_${safeName}.pdf`,
                {
                    userName: profile?.full_name,
                    userRole: profile?.role,
                }
            );
        } catch (error) {
            console.error('Report error:', error);
            alert('Erro ao gerar relatório.');
        } finally {
            setReportLoading(null);
        }
    };

    // Delete family with audit log (called from modal)
    const confirmDelete = async () => {
        if (!familyToDelete) return;

        const familyName = familyToDelete.familia_nome; // Capture name before clearing state
        setDeleteLoading(familyToDelete.id);
        closeDeleteModal();

        try {
            // 1. Delete image from storage if exists
            if (familyToDelete.imagem_referencia) {
                const storagePath = extractStoragePath(familyToDelete.imagem_referencia);
                if (storagePath) {
                    await supabase.storage
                        .from('imagens-plantas')
                        .remove([storagePath]);
                }
            }

            // 2. Delete from database
            const { error: deleteError } = await supabase
                .from('familia')
                .delete()
                .eq('id', familyToDelete.id);

            if (deleteError) throw deleteError;

            // 3. Audit log
            await supabase.from('audit_logs').insert({
                action_type: 'DELETE',
                table_name: 'familia',
                record_id: familyToDelete.id,
                details: `Família "${familyToDelete.familia_nome}" excluída por ${profile?.full_name || profile?.id || 'Unknown'}`,
                user_id: profile?.id
            });

            // 4. Show success modal
            setDeletedFamilyName(familyName);
            setShowSuccessModal(true);

            // 5. Refresh table
            fetchFamilies();
        } catch (error: any) {
            console.error('Delete error:', error);

            // Check for Foreign Key Violation (Postgres Code 23503)
            if (error?.code === '23503' || error?.message?.includes('violates foreign key constraint')) {
                setBlockedFamilyName(familyName);
                setShowBlockModal(true);
            } else {
                alert(error.message || 'Erro ao excluir família.');
            }
        } finally {
            setDeleteLoading(null);
        }
    };

    // Permissions Check: Only Global Admins
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico' || profile?.role === 'Taxonomista Sênior';

    // Reports Access: Only Curador and Coordenador (Senior Taxonomist excluded)
    const canGenerateReports = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    useEffect(() => {
        if (isGlobalAdmin) fetchFamilies();
    }, [profile, page, search]); // Re-fetch on page or search change

    const fetchFamilies = async () => {
        setLoading(true);
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('familia')
                .select('*, especie(count)', { count: 'exact' })
                .order('familia_nome')
                .range(from, to);

            // Apply search filter if exists
            if (search) {
                query = query.ilike('familia_nome', `%${search}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            // Process data
            const formattedData: Family[] = (data || []).map((item: any) => ({
                ...item,
                quantidade_especies: item.especie?.[0]?.count || 0
            }));

            setFamilies(formattedData);
            setTotalCount(count || 0);

            // Calculate stats based on current page data as requested
            calculateStats(formattedData, count || 0);

        } catch (error: any) {
            console.error('Error fetching families:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Family[], total: number) => {
        // Find missing images in current view
        const missingImages = data.filter(f => !f.imagem_referencia || f.imagem_referencia.trim() === '').length;

        // Richest family in current view
        const campea = [...data].sort((a, b) => b.quantidade_especies - a.quantidade_especies)[0];

        setStats({
            total, // Total from DB
            missingImages, // Only current page
            richest: {
                name: campea && campea.quantidade_especies > 0 ? campea.familia_nome : '-',
                count: campea ? campea.quantidade_especies : 0
            }
        });
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to page 1 on search
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    if (!isGlobalAdmin) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
                <p className="text-gray-500 max-w-md">
                    Esta área é restrita para Curadores Mestres, Coordenadores Científicos e Taxonomistas Sêniores.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8 animate-fade-in-up">
                {/* Header & Metrics */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Famílias</h1>
                    <p className="text-gray-500">Administração taxonômica global.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total de Famílias"
                        value={stats.total}
                        icon={TreeDeciduous}
                        color="emerald"
                        loading={loading}
                    />
                    <StatCard
                        title="Família + Rica (Pág)"
                        value={loading ? "..." : (stats.richest ? `${stats.richest.name} (${stats.richest.count})` : '-')}
                        icon={Crown}
                        color="amber"
                        loading={loading}
                    />
                    <StatCard
                        title="Sem Imagem (Pág)"
                        value={stats.missingImages}
                        icon={ImageOff}
                        color="purple"
                        loading={loading}
                    />
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {canGenerateReports && (
                            <button
                                onClick={handleExportAll}
                                disabled={exportLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-1 sm:flex-none disabled:opacity-50"
                            >
                                {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                <span>{exportLoading ? 'Exportando...' : 'Exportar'}</span>
                            </button>
                        )}
                        <button
                            onClick={handleNewFamily}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex-1 sm:flex-none"
                        >
                            <Plus size={18} />
                            <span>Nova Família</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Capa</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome da Família</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Riqueza</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-10 w-10 bg-gray-100 rounded-lg"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-100 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-100 rounded ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : families.length > 0 ? (
                                    families.map((family) => (
                                        <tr key={family.id} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="w-10 h-10 flex-shrink-0 relative">
                                                    {family.imagem_referencia ? (
                                                        <img
                                                            src={family.imagem_referencia}
                                                            alt={family.familia_nome}
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm peer"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                // Show the fallback sibling
                                                                const fallback = e.currentTarget.nextElementSibling;
                                                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    {/* Fallback icon - always rendered but hidden if image loads */}
                                                    <div
                                                        className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 items-center justify-center text-emerald-600 absolute inset-0"
                                                        style={{ display: family.imagem_referencia ? 'none' : 'flex' }}
                                                    >
                                                        <TreeDeciduous size={18} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">{family.familia_nome}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                    {family.quantidade_especies} spp.
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canGenerateReports && (
                                                        <button
                                                            onClick={() => generateFamilyReport(family)}
                                                            disabled={reportLoading === family.id}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Relatório"
                                                        >
                                                            {reportLoading === family.id ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditFamily(family)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(family)}
                                                        disabled={deleteLoading === family.id}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Excluir"
                                                    >
                                                        {deleteLoading === family.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            Nenhum registro encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            Mostrando <span className="font-medium text-gray-900">{families.length}</span> de <span className="font-medium text-gray-900">{totalCount}</span> resultados
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
            </div >

            {/* Family Modal */}
            <FamilyModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={fetchFamilies}
                initialData={editingFamily}
            />

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
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
                            Excluir Família?
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 text-center mb-6">
                            Você tem certeza que deseja remover a família{' '}
                            <strong className="text-gray-900">{familyToDelete?.familia_nome}</strong>?
                            <br />
                            <span className="text-sm text-gray-500">
                                Esta ação removerá todos os dados e fotos associados e não pode ser desfeita.
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
                </div>
            )}

            {/* Block Delete Modal (FK Violation) */}
            {showBlockModal && (
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
                                A família <strong className="text-gray-900">"{blockedFamilyName}"</strong> não pode ser removida pois possui espécies associadas.
                                <br /><br />
                                <span className="inline-block bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium border border-amber-100">
                                    💡 Sugestão: Remova ou mova as espécies primeiro.
                                </span>
                            </p>

                            {/* Action */}
                            <button
                                onClick={() => setShowBlockModal(false)}
                                className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
                            >
                                Entendi, vou verificar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
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
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Família Excluída</h3>

                            <p className="text-gray-600 mb-8 leading-relaxed text-base">
                                A família <strong className="text-gray-900">"{deletedFamilyName}"</strong> foi removida com sucesso do sistema.
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
                </div>
            )}
        </>
    );
}
