/**
 * Species Page - Refactored version using extracted hooks and components.
 * 
 * Original: 898 lines
 * Refactored: ~400 lines
 */
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/Dashboard/StatCard';
import { SpeciesModalRefactored } from '../../components/Modals/SpeciesModal/index';
import { ConfirmDeleteModal } from '../../components/Modals/ConfirmDeleteModal';
import { SuccessModal } from '../../components/Modals/SuccessModal';
import { SpeciesTable } from '../../components/Tables';
import { useSpecies, useSpeciesActions } from '../../hooks';
import { hasMinLevel } from '../../types/auth';
import {
    Leaf,
    Image as ImageIcon,
    ImageOff,
    Search,
    Download,
    Plus,
    Filter,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Types for component
interface Species {
    id: string;
    nome_cientifico: string;
    autor?: string | null;
    nome_popular: string | null;
    familia_id: string;
    familia?: { familia_nome: string };
    imagens?: { url_imagem: string; local_id?: string | number | null }[];
    created_at?: string | null;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
    locais?: { nome: string; tipo?: string };
}

const ITEMS_PER_PAGE = 20;

export default function SpeciesPage() {
    const { profile } = useAuth();

    // Filters state
    const [search, setSearch] = useState('');
    const [selectedFamily, setSelectedFamily] = useState('');
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    // Data fetching hook
    const { species, families, loading, totalCount, stats, refetch } = useSpecies({
        page,
        search,
        familyId: selectedFamily,
        itemsPerPage: ITEMS_PER_PAGE
    });

    // Actions hook (PDF, export, labels)
    const actions = useSpeciesActions({
        profile: profile as any,
        search,
        selectedFamily
    });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecies, setEditingSpecies] = useState<Species | null>(null);

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [speciesToDelete, setSpeciesToDelete] = useState<Species | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Success/Block modals
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockedSpeciesName, setBlockedSpeciesName] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deletedSpeciesName, setDeletedSpeciesName] = useState('');

    // Handlers
    const handleNewSpecies = () => {
        setEditingSpecies(null);
        setIsModalOpen(true);
    };

    const handleEditSpecies = (species: any) => {
        setEditingSpecies(species as Species);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSpecies(null);
    };

    const openDeleteModal = (species: any) => {
        setSpeciesToDelete(species as Species);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSpeciesToDelete(null);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFamily(e.target.value);
        setPage(1);
    };

    // Delete confirmation handler
    const confirmDelete = async () => {
        if (!speciesToDelete) return;

        const speciesName = speciesToDelete.nome_cientifico;
        const userLocalId = profile?.local_id;

        setDeleteLoading(true);
        closeDeleteModal();

        try {
            if (!actions.isGlobalAdmin && userLocalId) {
                // Local user: unlink from project
                const { data: imagesToDelete } = await supabase
                    .from('imagens')
                    .select('url_imagem')
                    .eq('especie_id', speciesToDelete.id)
                    .eq('local_id', userLocalId);

                if (imagesToDelete && imagesToDelete.length > 0) {
                    const paths = imagesToDelete
                        .map(img => {
                            const match = img.url_imagem.match(/\/arquivos-gerais\/(.+)$/);
                            return match ? match[1] : null;
                        })
                        .filter(Boolean) as string[];

                    if (paths.length > 0) {
                        await supabase.storage.from('arquivos-gerais').remove(paths);
                    }
                }

                await supabase.from('imagens').delete().eq('especie_id', speciesToDelete.id).eq('local_id', userLocalId);
                await supabase.from('especie_local').delete().eq('especie_id', speciesToDelete.id).eq('local_id', userLocalId);

                const { data: remaining } = await supabase
                    .from('especie_local')
                    .select('id')
                    .eq('especie_id', speciesToDelete.id)
                    .limit(1);

                if (!remaining || remaining.length === 0) {
                    await supabase.from('especie').update({ local_id: null }).eq('id', speciesToDelete.id);
                }
            } else {
                // Global admin: try full delete
                const { data: localLinks } = await supabase
                    .from('especie_local')
                    .select('id')
                    .eq('especie_id', speciesToDelete.id)
                    .limit(1);

                if (localLinks && localLinks.length > 0) {
                    setBlockedSpeciesName(speciesName);
                    setShowBlockModal(true);
                    return;
                }

                const { data: globalImages } = await supabase
                    .from('imagens')
                    .select('url_imagem')
                    .eq('especie_id', speciesToDelete.id);

                if (globalImages && globalImages.length > 0) {
                    const paths = globalImages
                        .map(img => {
                            const match = img.url_imagem.match(/\/imagens-plantas\/(.+)$/);
                            return match ? match[1] : null;
                        })
                        .filter(Boolean) as string[];

                    if (paths.length > 0) {
                        await supabase.storage.from('imagens-plantas').remove(paths);
                    }
                }

                await supabase.from('imagens').delete().eq('especie_id', speciesToDelete.id);

                const { error } = await supabase.from('especie').delete().eq('id', speciesToDelete.id);
                if (error) throw error;
            }

            setDeletedSpeciesName(speciesName);
            setShowSuccessModal(true);
            refetch();
        } catch (error: any) {
            console.error('Delete error:', error);
            if (error.code === '23503') {
                setBlockedSpeciesName(speciesName);
                setShowBlockModal(true);
            } else {
                alert(error.message || 'Erro ao excluir espécie.');
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    // Access control
    const hasAccess = hasMinLevel(profile?.role as any, 5);
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    if (!hasAccess) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
                <p className="text-gray-500 max-w-md">Você não tem permissão para acessar esta área.</p>
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
                <StatCard title="Total de Espécies" value={stats.total} icon={Leaf} color="emerald" loading={loading} />
                <StatCard
                    title="Top Epíteto (Pág)"
                    value={loading ? "..." : (stats.topEpithet ? `${stats.topEpithet.name} (${stats.topEpithet.count})` : '-')}
                    icon={ImageIcon}
                    color="blue"
                    loading={loading}
                />
                <StatCard title="Sem Imagem" value={stats.missingImages} icon={ImageOff} color="red" loading={loading} />
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
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

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {actions.canGenerateReports && (
                        <>

                            <button
                                onClick={actions.handleExportSpecies}
                                disabled={actions.exportLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-1 md:flex-none disabled:opacity-50"
                            >
                                {actions.exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                <span className="hidden sm:inline">{actions.exportLoading ? 'Gerando...' : 'Exportar'}</span>
                            </button>
                        </>
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

            {/* Table Component */}
            <SpeciesTable
                species={species}
                loading={loading}
                totalCount={totalCount}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                onEdit={handleEditSpecies}
                onDelete={openDeleteModal}
                onGenerateReport={actions.handleGenerateSingleReport}
                singleReportLoading={actions.singleReportLoading}
                deleteLoading={deleteLoading}
                canGenerateReports={actions.canGenerateReports}
                onViewSpecimens={(speciesId) => navigate(`/admin/specimens?especie_id=${speciesId}`)}
            />

            {/* Modals */}
            <SpeciesModalRefactored
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={refetch}
                initialData={editingSpecies}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Excluir Espécie?"
                itemName={speciesToDelete?.nome_cientifico || ''}
                loading={deleteLoading}
            />

            <SuccessModal
                isOpen={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                title="Exclusão Bloqueada"
                variant="warning"
                message={
                    <>
                        A espécie <strong className="text-gray-900 italic">"{blockedSpeciesName}"</strong> não pode ser removida pois existem registros vinculados a ela.
                        <br /><br />
                        <span className="inline-block bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium border border-amber-100">
                            💡 Solução: Entre em contato com o suporte.
                        </span>
                    </>
                }
            />

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Espécie Excluída"
                variant="success"
                message={<>A espécie <strong className="text-gray-900 italic">"{deletedSpeciesName}"</strong> foi removida com sucesso do catálogo.</>}
            />
        </div>
    );
}
