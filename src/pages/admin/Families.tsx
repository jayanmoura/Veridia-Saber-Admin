/**
 * Families Page - Refactored version using extracted hooks and components.
 * 
 * Original: 653 lines
 * Refactored: ~350 lines
 */
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/Dashboard/StatCard';
import { FamilyModal } from '../../components/Modals/FamilyModal';
import { FamilyTable } from '../../components/Tables';
import { ConfirmDeleteModal } from '../../components/Modals/ConfirmDeleteModal';
import { SuccessModal } from '../../components/Modals/SuccessModal';
import { useFamilies, useFamilyActions } from '../../hooks';
import {
    TreeDeciduous,
    Crown,
    ImageOff,
    Search,
    Download,
    Plus,
    AlertTriangle,
    Loader2,
    FileQuestion,
    List,
    CheckCircle
} from 'lucide-react';

interface Family {
    id: string;
    familia_nome: string;
    imagem_referencia: string | null;
    quantidade_especies: number;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

const ITEMS_PER_PAGE = 20;

export default function Families() {
    const { profile } = useAuth();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'official' | 'pending'>('official');

    // Data fetching hook
    const { families, loading, totalCount, stats, pendingFamilies, refetch, refetchPending } = useFamilies({
        page,
        search,
        itemsPerPage: ITEMS_PER_PAGE
    });

    // Actions hook
    const actions = useFamilyActions({
        profile: profile as any,
        onSuccess: refetch,
        onPendingRefetch: refetchPending
    });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFamily, setEditingFamily] = useState<Family | null>(null);

    const handleNewFamily = () => {
        setEditingFamily(null);
        setIsModalOpen(true);
    };

    const handleEditFamily = (family: Family) => {
        setEditingFamily(family);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFamily(null);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    if (!actions.isGlobalAdmin) {
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
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Famílias</h1>
                        <p className="text-gray-500">Administração taxonômica global.</p>
                    </div>
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => setActiveTab('official')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'official' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List size={16} />
                            Oficiais
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FileQuestion size={16} />
                            Sugestões de Campo
                            {pendingFamilies.length > 0 && (
                                <span className="ml-1 bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">
                                    {pendingFamilies.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total de Famílias" value={stats.total} icon={TreeDeciduous} color="emerald" loading={loading} />
                    <StatCard
                        title="Família + Rica (Pág)"
                        value={loading ? "..." : (stats.richest ? `${stats.richest.name} (${stats.richest.count})` : '-')}
                        icon={Crown}
                        color="amber"
                        loading={loading}
                    />
                    <StatCard title="Sem Imagem (Pág)" value={stats.missingImages} icon={ImageOff} color="purple" loading={loading} />
                </div>

                {/* Official Tab Content */}
                {activeTab === 'official' && (
                    <>
                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    value={search}
                                    onChange={handleSearch}
                                />
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {actions.canGenerateReports && (
                                    <button
                                        onClick={actions.handleExportAll}
                                        disabled={actions.exportLoading}
                                        className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-1 sm:flex-none disabled:opacity-50"
                                    >
                                        {actions.exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                        <span>{actions.exportLoading ? 'Exportando...' : 'Exportar'}</span>
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

                        {/* Family Table */}
                        <FamilyTable
                            families={families}
                            loading={loading}
                            totalCount={totalCount}
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            onEdit={handleEditFamily}
                            onDelete={actions.openDeleteModal}
                            onGenerateReport={actions.generateFamilyReport}
                            reportLoading={actions.reportLoading}
                            deleteLoading={actions.deleteLoading}
                            canGenerateReports={actions.canGenerateReports}
                        />
                    </>
                )}

                {/* Pending Tab Content */}
                {activeTab === 'pending' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sugestões de Campo</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Famílias sugeridas por catalogadores durante o trabalho de campo que ainda não estão no catálogo oficial.
                        </p>
                        {pendingFamilies.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <FileQuestion size={48} className="mx-auto mb-3 opacity-50" />
                                <p>Nenhuma sugestão pendente.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingFamilies.map((pending) => (
                                    <div
                                        key={pending.name}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                                    >
                                        <div>
                                            <span className="font-medium text-gray-900">{pending.name}</span>
                                            <span className="ml-2 text-xs text-gray-400">({pending.count} registros)</span>
                                        </div>
                                        <button
                                            onClick={() => actions.handleApproveFamily(pending.name)}
                                            disabled={actions.approveLoading === pending.name}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                        >
                                            {actions.approveLoading === pending.name ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <CheckCircle size={14} />
                                            )}
                                            Aprovar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <FamilyModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={refetch}
                initialData={editingFamily}
            />

            <ConfirmDeleteModal
                isOpen={actions.isDeleteModalOpen}
                onClose={actions.closeDeleteModal}
                onConfirm={actions.confirmDelete}
                title="Excluir Família?"
                itemName={actions.familyToDelete?.familia_nome || ''}
                loading={!!actions.deleteLoading}
            />

            <SuccessModal
                isOpen={actions.showBlockModal}
                onClose={actions.closeBlockModal}
                title="Exclusão Bloqueada"
                variant="warning"
                message={
                    <>
                        A família <strong className="text-gray-900">"{actions.blockedFamilyName}"</strong> não pode ser removida pois existem espécies vinculadas.
                        <br /><br />
                        <span className="inline-block bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium border border-amber-100">
                            💡 Solução: Migre as espécies para outra família antes de excluir.
                        </span>
                    </>
                }
            />

            <SuccessModal
                isOpen={actions.showSuccessModal}
                onClose={actions.closeSuccessModal}
                title="Família Excluída"
                variant="success"
                message={<>A família <strong className="text-gray-900">"{actions.deletedFamilyName}"</strong> foi removida com sucesso.</>}
            />
        </>
    );
}
