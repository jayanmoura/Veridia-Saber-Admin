/**
 * ProjectDetails - Refactored version using extracted hooks and components.
 * 
 * Original: 1339 lines
 * Refactored: ~450 lines
 */
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoIcon from '../../assets/icon.png';
import {
    ArrowLeft,
    Leaf,
    Users,
    TreeDeciduous,
    Loader2,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { generateHerbariumLabels } from '../../utils/pdfGenerator';
import { downloadCSV } from '../../utils/csvGenerator';

// Extracted components
import { useProjectDetails } from '../../hooks';
import { SpeciesByFamilyModal } from '../../components/Modals/SpeciesByFamilyModal';
import {
    ProjectHeader,
    UsersTab,
    SpeciesTab,
    FamiliesTab,
    type LinkedSpecies
} from '../../components/ProjectDetails';

// ============ COMPONENT ============
export default function ProjectDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Use extracted hook for data management
    const {
        project,
        loading,
        error,
        activeTab,
        setActiveTab,
        linkedUsers,
        linkedSpecies,
        linkedFamilies,
        tabLoading,
        usersCount,
        speciesCountTotal,
        familiesCount,
        currentPage,
        setCurrentPage,
        totalPages,
        isModalOpen,
        selectedFamily,
        modalSpecies,
        modalLoading,
        openFamilyModal,
        closeModal,
        isGlobalAdmin
    } = useProjectDetails({ projectId: id });

    // Local UI states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [genLabelsLoading, setGenLabelsLoading] = useState(false);
    const [singleLabelLoading, setSingleLabelLoading] = useState<string | null>(null);
    const [exportCSVLoading, setExportCSVLoading] = useState(false);

    // Tab config
    const tabs = [
        { id: 'users' as const, label: 'Usuários', icon: Users, count: usersCount },
        { id: 'species' as const, label: 'Espécies', icon: Leaf, count: speciesCountTotal },
        { id: 'families' as const, label: 'Famílias', icon: TreeDeciduous, count: familiesCount },
    ];

    // Derived
    const speciesCount = useMemo(() => project?.especie?.[0]?.count || 0, [project]);

    // ============ ACTION HANDLERS ============

    const handleDeleteProject = async () => {
        if (!id || !project) return;
        setDeleteLoading(true);
        try {
            const { error } = await supabase.from('locais').delete().eq('id', id);
            if (error) {
                alert('Erro ao excluir projeto: ' + error.message);
            } else {
                setShowDeleteModal(false);
                setShowSuccessModal(true);
            }
        } catch {
            alert('Erro inesperado ao excluir projeto.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigate('/projects');
    };

    const handleGenerateReport = async () => {
        if (!project || !id) return;
        try {
            const { data: allSpecies } = await supabase
                .from('especie')
                .select('nome_cientifico, nome_popular, familia:familia_id(familia_nome)')
                .eq('local_id', id)
                .order('nome_cientifico');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 15;

            const img = new Image();
            img.src = logoIcon;
            doc.addImage(img, 'PNG', 15, y, 20, 20);

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Veridia Saber', 40, y + 8);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('Relatório de Local/Projeto', 40, y + 15);

            doc.setFontSize(9);
            const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.text(`Emitido em: ${today}`, pageWidth - 15, y + 8, { align: 'right' });

            y += 28;
            doc.setDrawColor(200);
            doc.line(15, y, pageWidth - 15, y);
            y += 10;

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 78, 59);
            doc.text(project.nome, 15, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Tipo: ${project.tipo || 'Não informado'}`, 15, y);
            y += 10;

            if (project.descricao) {
                doc.setFontSize(10);
                doc.setTextColor(60);
                const descLines = doc.splitTextToSize(project.descricao, pageWidth - 30);
                doc.text(descLines, 15, y);
                y += descLines.length * 5 + 5;
            }

            y += 5;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            doc.text('Estatísticas', 15, y);
            y += 7;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Total de Espécies: ${speciesCountTotal}`, 15, y);
            y += 5;
            doc.text(`Total de Usuários: ${usersCount}`, 15, y);
            y += 5;
            doc.text(`Total de Famílias: ${familiesCount}`, 15, y);
            y += 12;

            if (allSpecies && allSpecies.length > 0) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Lista de Espécies', 15, y);
                y += 5;

                const tableData = allSpecies.map((sp: any) => [
                    sp.nome_cientifico || '-',
                    sp.nome_popular || '-',
                    (Array.isArray(sp.familia) ? sp.familia[0]?.familia_nome : sp.familia?.familia_nome) || '-'
                ]);

                autoTable(doc, {
                    startY: y,
                    head: [['Nome Científico', 'Nome Popular', 'Família']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [6, 78, 59] },
                    styles: { fontSize: 9 },
                    margin: { left: 15, right: 15 }
                });
            }

            doc.save(`Relatorio_${project.nome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        } catch {
            alert('Erro ao gerar relatório PDF.');
        }
    };

    const handleGenerateLabels = async () => {
        if (!project || !id) return;
        setGenLabelsLoading(true);
        try {
            const { data: speciesData, error } = await supabase
                .from('especie_local')
                .select(`id, detalhes_localizacao, created_at, determinador, data_determinacao, coletor, numero_coletor, morfologia, habitat_ecologia,
                    especie:especie_id(nome_cientifico, autor, nome_popular, familia:familia_id(familia_nome))`)
                .eq('local_id', id);

            if (error) throw error;
            if (!speciesData || speciesData.length === 0) {
                alert('Nenhuma espécie encontrada para gerar etiquetas.');
                return;
            }

            const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : undefined;
            const labels = speciesData.map((item: any) => {
                const sp = item.especie;
                return {
                    scientificName: sp?.nome_cientifico || 'Sem Identificação',
                    author: sp?.autor || undefined,
                    family: sp?.familia?.familia_nome || 'INDETERMINADA',
                    popularName: sp?.nome_popular,
                    collector: item.coletor || project.nome,
                    collectorNumber: item.numero_coletor,
                    date: formatDate(item.created_at) || new Date().toLocaleDateString('pt-BR'),
                    location: `${project.nome} (${project.tipo || 'Local'})`,
                    notes: item.detalhes_localizacao || '',
                    morphology: item.morfologia,
                    habitat: item.habitat_ecologia,
                    determinant: item.determinador || 'Sistema Veridia',
                    determinationDate: formatDate(item.data_determinacao),
                    tomboNumber: item.id
                };
            });

            generateHerbariumLabels(labels, `Etiquetas_${project.nome.replace(/\s+/g, '_')}.pdf`);
        } catch {
            alert('Erro ao gerar etiquetas.');
        } finally {
            setGenLabelsLoading(false);
        }
    };

    const handleGenerateSingleLabel = async (species: LinkedSpecies) => {
        if (!project || !id) return;
        setSingleLabelLoading(species.id);
        try {
            const { data } = await supabase
                .from('especie_local')
                .select('id, detalhes_localizacao, created_at, determinador, data_determinacao, coletor, numero_coletor, morfologia, habitat_ecologia')
                .eq('local_id', id)
                .eq('especie_id', species.id)
                .maybeSingle();

            const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : undefined;
            const label = {
                scientificName: species.nome_cientifico || 'Sem Identificação',
                author: species.autor || undefined,
                family: species.familia?.familia_nome || 'INDETERMINADA',
                popularName: species.nome_popular || undefined,
                collector: data?.coletor || project.nome,
                collectorNumber: data?.numero_coletor,
                date: formatDate(data?.created_at) || new Date().toLocaleDateString('pt-BR'),
                location: `${project.nome} (${project.tipo || 'Local'})`,
                notes: data?.detalhes_localizacao || '',
                morphology: data?.morfologia,
                habitat: data?.habitat_ecologia,
                determinant: data?.determinador || 'Sistema Veridia',
                determinationDate: formatDate(data?.data_determinacao),
                tomboNumber: data?.id
            };
            generateHerbariumLabels([label], `Etiqueta_${(species.nome_cientifico || 'especie').replace(/\s+/g, '_')}.pdf`);
        } catch {
            alert('Erro ao gerar etiqueta.');
        } finally {
            setSingleLabelLoading(null);
        }
    };

    const handleExportCSV = async () => {
        if (!project || !id) return;
        setExportCSVLoading(true);
        try {
            const { data: speciesData, error } = await supabase
                .from('especie_local')
                .select(`id, latitude, longitude, detalhes_localizacao, created_at,
                    especie:especie_id(nome_cientifico, nome_popular, familia:familia_id(familia_nome))`)
                .eq('local_id', id);

            if (error) throw error;
            if (!speciesData || speciesData.length === 0) {
                alert('Nenhum dado encontrado para exportação.');
                return;
            }

            const csvData = speciesData.map((item: any) => {
                const sp = item.especie;
                return {
                    'Nome Científico': sp?.nome_cientifico || '',
                    'Nome Popular': sp?.nome_popular || '',
                    'Família': sp?.familia?.familia_nome || '',
                    'Data Cadastro': new Date(item.created_at).toLocaleDateString('pt-BR'),
                    'Latitude': item.latitude || '',
                    'Longitude': item.longitude || '',
                    'Localização': item.detalhes_localizacao || '',
                    'Projeto': project.nome
                };
            });
            downloadCSV(csvData, `Dados_Projeto_${project.nome.replace(/\s+/g, '_')}.csv`);
        } catch {
            alert('Erro ao exportar CSV.');
        } finally {
            setExportCSVLoading(false);
        }
    };

    // ============ ACCESS CONTROL ============
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

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={48} />
                <p className="mt-4 text-gray-500">Carregando detalhes do projeto...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro</h1>
                <p className="text-gray-500 max-w-md mb-4">{error || 'Projeto não encontrado.'}</p>
                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Voltar para Projetos
                </button>
            </div>
        );
    }

    // ============ RENDER ============
    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/projects')}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Voltar"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{project.nome}</h1>
                    <p className="text-gray-500">Detalhes do Projeto/Local</p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - ProjectHeader */}
                <ProjectHeader
                    project={project}
                    speciesCount={speciesCount}
                    usersCount={linkedUsers.length}
                    onGenerateReport={handleGenerateReport}
                    onGenerateLabels={handleGenerateLabels}
                    onExportCSV={handleExportCSV}
                    onDelete={() => setShowDeleteModal(true)}
                    genLabelsLoading={genLabelsLoading}
                    exportCSVLoading={exportCSVLoading}
                />

                {/* RIGHT COLUMN - TABS */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-200">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors relative
                                        ${activeTab === tab.id
                                            ? 'text-emerald-600 bg-emerald-50/50'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold
                                        ${activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {tab.count}
                                    </span>
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-5 min-h-[400px]">
                            {tabLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'users' && <UsersTab users={linkedUsers} />}
                                    {activeTab === 'species' && (
                                        <SpeciesTab
                                            species={linkedSpecies}
                                            singleLabelLoading={singleLabelLoading}
                                            onGenerateSingleLabel={handleGenerateSingleLabel}
                                        />
                                    )}
                                    {activeTab === 'families' && (
                                        <FamiliesTab
                                            families={linkedFamilies}
                                            onFamilyClick={openFamilyModal}
                                        />
                                    )}
                                </>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && !tabLoading && (
                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        <ArrowLeft size={16} />
                                        Anterior
                                    </button>
                                    <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Próximo
                                        <ArrowLeft size={16} className="rotate-180" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Species by Family Modal */}
            <SpeciesByFamilyModal
                isOpen={isModalOpen}
                onClose={closeModal}
                familyName={selectedFamily?.name || ''}
                species={modalSpecies}
                loading={modalLoading}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Excluir Projeto</h3>
                                <p className="text-sm text-gray-500">Esta ação é irreversível</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Tem certeza que deseja excluir <span className="font-semibold">{project.nome}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteProject}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {deleteLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Success Modal */}
            {showSuccessModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Sucesso!</h3>
                        <p className="text-gray-500 mb-6">O projeto foi excluído com sucesso.</p>
                        <button
                            onClick={handleSuccessClose}
                            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                            Voltar para Projetos
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
