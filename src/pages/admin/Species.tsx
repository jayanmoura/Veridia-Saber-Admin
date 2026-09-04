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
import { SpecimenModal } from '../../components/Modals/SpecimenModal';
import { ConfirmDeleteModal } from '../../components/Modals/ConfirmDeleteModal';
import { SuccessModal } from '../../components/Modals/SuccessModal';
import { SpeciesTable } from '../../components/Tables';
import { useSpecies, useSpeciesActions } from '../../hooks';
import { useToast } from '../../hooks/useToast';
import { deleteFile, parseStorageUrl } from '../../utils/storage';
import { specimenRepo } from '../../services/specimenRepo';
import type { SpecimenFormData } from '../../hooks/useSpecimens';
import { hasMinLevel } from '../../types/auth';
import {
    Leaf,
    ImageOff,
    Search,
    Download,
    Plus,
    Filter,
    Loader2,
    AlertTriangle,
    TreeDeciduous
} from 'lucide-react';


// Types for component
import type { Species } from '../../types/domain';

const ITEMS_PER_PAGE = 20;

export default function SpeciesPage() {
    const { profile } = useAuth();
    const { showToast } = useToast();

    // Filters state
    const [search, setSearch] = useState('');
    const [selectedFamily, setSelectedFamily] = useState('');
    const [page, setPage] = useState(1);



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

    // Specimen Modal State (wizard flow)
    const [isSpecimenModalOpen, setIsSpecimenModalOpen] = useState(false);
    const [specimenFormData, setSpecimenFormData] = useState<SpecimenFormData>({
        local_id: '',
        especie_id: '',
        latitude: '',
        longitude: '',
        detalhes_localizacao: '',
        descricao_ocorrencia: '',
        coletor: '',
        numero_coletor: '',
        determinador: '',
        data_determinacao: '',
    });
    const [specimenInitialSpeciesName, setSpecimenInitialSpeciesName] = useState('');
    const [specimenInitialProjectName, setSpecimenInitialProjectName] = useState('');
    const [specimenActionLoading, setSpecimenActionLoading] = useState(false);

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

    const handleRequestSpecimenCreation = async (especieId: string, localId: string, speciesName?: string) => {
        let projectName = '';
        let institutionId = profile?.institution_id || '';

        try {
            const { data: localData } = await supabase
                .from('locais')
                .select('nome, institution_id')
                .eq('id', localId)
                .single();

            if (localData) {
                projectName = localData.nome || '';
                if (localData.institution_id) {
                    institutionId = localData.institution_id;
                }
            }
        } catch (err) {
            console.warn('Erro ao buscar dados do projeto para o espécime:', err);
        }

        setSpecimenInitialSpeciesName(speciesName || '');
        setSpecimenInitialProjectName(projectName);
        setSpecimenFormData({
            local_id: localId,
            institution_id: institutionId,
            especie_id: especieId,
            latitude: '',
            longitude: '',
            detalhes_localizacao: '',
            descricao_ocorrencia: '',
            coletor: profile?.full_name || '',
            numero_coletor: '',
            determinador: profile?.full_name || '',
            data_determinacao: new Date().toISOString().split('T')[0],
        });

        setIsSpecimenModalOpen(true);
    };

    const handleSaveSpecimen = async (): Promise<number | null> => {
        if (!specimenFormData.local_id || !specimenFormData.especie_id) return null;
        setSpecimenActionLoading(true);

        try {
            const payload = {
                especie_id: specimenFormData.especie_id,
                local_id: parseInt(specimenFormData.local_id),
                institution_id: specimenFormData.institution_id || profile?.institution_id || null,
                created_by: profile?.id,
                latitude: specimenFormData.latitude ? parseFloat(specimenFormData.latitude) : null,
                longitude: specimenFormData.longitude ? parseFloat(specimenFormData.longitude) : null,
                detalhes_localizacao: specimenFormData.detalhes_localizacao || null,
                descricao_ocorrencia: specimenFormData.descricao_ocorrencia || null,
                coletor: specimenFormData.coletor || null,
                numero_coletor: specimenFormData.numero_coletor || null,
                determinador: specimenFormData.determinador || null,
                data_determinacao: specimenFormData.data_determinacao || null,
            };

            const created = await specimenRepo.createSpecimen(payload);
            refetch();
            showToast('Espécime registrado com sucesso!', 'success');
            return created?.id || null;
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error('Error creating specimen:', err);
            showToast(error.message || 'Erro ao criar espécime.', 'error');
            return null;
        } finally {
            setSpecimenActionLoading(false);
        }
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
                    const deletePromises = imagesToDelete.map(async (img) => {
                        const storageInfo = parseStorageUrl(img.url_imagem);
                        if (storageInfo) {
                            await deleteFile(storageInfo.bucket, storageInfo.path);
                        }
                    });
                    await Promise.allSettled(deletePromises);
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
                    const deletePromises = globalImages.map(async (img) => {
                        const storageInfo = parseStorageUrl(img.url_imagem);
                        if (storageInfo) {
                            await deleteFile(storageInfo.bucket, storageInfo.path);
                        }
                    });
                    await Promise.allSettled(deletePromises);
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
                showToast(error.message || 'Erro ao excluir espécie.', 'error');
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
                    <AlertTriangle className="text-forest-300" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-forest-800 mb-2">Acesso Negado</h1>
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
                <StatCard title="Total de Espécies" value={stats.total} icon={Leaf} color="forest-100" loading={loading} />
                <StatCard
                    title="Top Gênero"
                    value={loading ? "..." : (stats.topGenus ? `${stats.topGenus.name} (${stats.topGenus.count})` : '-')}
                    icon={TreeDeciduous}
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest-500 outline-none"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forest-500 outline-none appearance-none bg-white"
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
                                className="flex items-center justify-center gap-2 px-4 py-2 text-forest-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-1 md:flex-none disabled:opacity-50"
                            >
                                {actions.exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                <span className="hidden sm:inline">{actions.exportLoading ? 'Gerando...' : 'Exportar'}</span>
                            </button>
                        </>
                    )}
                    {hasMinLevel(profile?.role as any, 4) ? (
                        <button
                            onClick={handleNewSpecies}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors shadow-sm flex-1 md:flex-none"
                        >
                            <Plus size={18} />
                            <span className="whitespace-nowrap">Nova Espécie</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => window.location.href = '/specimens?action=new'} // Or simpler navigation logic
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors shadow-sm flex-1 md:flex-none"
                        >
                            <Plus size={18} />
                            <span className="whitespace-nowrap">Adicionar Espécime</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Table Component */}
            <SpeciesTable
                species={species as any}
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
            />

            {/* Modals */}
            <SpeciesModalRefactored
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={refetch}
                initialData={editingSpecies}
                onRequestSpecimenCreation={handleRequestSpecimenCreation}
            />

            <SpecimenModal
                isOpen={isSpecimenModalOpen}
                onClose={() => setIsSpecimenModalOpen(false)}
                onSave={handleSaveSpecimen}
                formData={specimenFormData}
                setFormData={setSpecimenFormData}
                loading={specimenActionLoading}
                isEdit={false}
                initialSpeciesName={specimenInitialSpeciesName}
                initialProjectName={specimenInitialProjectName}
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
