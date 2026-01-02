import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ROLES_CONFIG, type UserRole } from '../../types/auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoIcon from '../../assets/icon.png';
import {
    ArrowLeft,
    MapPin,
    Leaf,
    Building2,
    Trees,
    Calendar,
    FileText,
    Pencil,
    Trash2,
    AlertTriangle,
    Loader2,
    Users,
    TreeDeciduous,
    Mail,
    Shield,
    X,
    CheckCircle
} from 'lucide-react';

// ============ TYPES ============
interface ProjectDetails {
    id: string;
    nome: string;
    descricao: string | null;
    imagem_capa: string | null;
    tipo: string | null;
    created_at: string | null;
    latitude: number | null;
    longitude: number | null;
    especie?: { count: number }[];
}

interface LinkedUser {
    id: string;
    full_name: string | null;
    email: string;
    role: string | null;
    avatar_url: string | null;
}

interface LinkedSpecies {
    id: string;
    nome_cientifico: string | null;
    nome_popular: string | null;
    familia_id: number | null;
    familia?: { familia_nome: string } | null;
    imagem?: string | null; // URL da primeira imagem
}

interface LinkedFamily {
    id: number;
    familia_nome: string;
    speciesCount: number;
}

interface ModalSpecies {
    id: string;
    nome_cientifico: string | null;
    nome_popular: string | null;
}

type TabType = 'users' | 'species' | 'families';

// ============ SPECIES BY FAMILY MODAL COMPONENT ============
interface SpeciesByFamilyModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyName: string;
    species: ModalSpecies[];
    loading: boolean;
}

function SpeciesByFamilyModal({ isOpen, onClose, familyName, species, loading }: SpeciesByFamilyModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                            <TreeDeciduous size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Espécies de {familyName}</h2>
                            <p className="text-sm text-gray-500">{species.length} espécie(s) encontrada(s)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-emerald-600" size={32} />
                        </div>
                    ) : species.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Leaf size={48} className="mx-auto mb-3 opacity-50" />
                            <p>Nenhuma espécie encontrada para esta família.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {species.map((sp) => (
                                <div
                                    key={sp.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <Leaf size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 italic truncate">
                                            {sp.nome_cientifico || 'Sem nome científico'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {sp.nome_popular || 'Nome popular não informado'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============ HELPERS ============
const formatTipo = (tipo: string | null): string => {
    if (!tipo) return '';
    const normalized = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tipoMap: Record<string, string> = {
        'instituicao': 'Instituição',
        'intituicao': 'Instituição',
        'parque': 'Parque',
        'reserva': 'Reserva',
        'jardim': 'Jardim',
    };
    return tipoMap[normalized] || tipo;
};

const isInstituicao = (tipo: string | null): boolean => {
    if (!tipo) return false;
    const normalized = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized === 'instituicao' || normalized === 'intituicao';
};

// TAREFA 4: Badge styling using ROLES_CONFIG
const getRoleBadgeStyle = (role: string | null): React.CSSProperties => {
    if (!role) return { backgroundColor: '#F5F5F5', color: '#616161' };
    const config = ROLES_CONFIG[role as UserRole];
    return {
        backgroundColor: config?.bgColor ?? '#F5F5F5',
        color: config?.color ?? '#616161',
    };
};

// ============ COMPONENT ============
export default function ProjectDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Constants
    const ITEMS_PER_PAGE = 15;

    // Core States
    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tab States
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
    const [linkedSpecies, setLinkedSpecies] = useState<LinkedSpecies[]>([]);
    const [linkedFamilies, setLinkedFamilies] = useState<LinkedFamily[]>([]);
    const [tabLoading, setTabLoading] = useState(false);

    // Counter States (for tab badges - loaded once on mount)
    const [usersCount, setUsersCount] = useState(0);
    const [speciesCountTotal, setSpeciesCountTotal] = useState(0);
    const [familiesCount, setFamiliesCount] = useState(0);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState<{ id: number; name: string } | null>(null);
    const [modalSpecies, setModalSpecies] = useState<ModalSpecies[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Delete Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    // ============ ACTION HANDLERS ============
    const handleEditProject = () => {
        // TODO: Create edit page at /projects/:id/edit
        alert('Funcionalidade de edição ainda não implementada. A página de edição precisa ser criada.');
        // navigate(`/projects/${id}/edit`);
    };

    const handleDeleteProject = async () => {
        if (!id || !project) return;
        setDeleteLoading(true);

        try {
            const { error } = await supabase
                .from('locais')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('[DEBUG] Erro ao excluir projeto:', error);
                alert('Erro ao excluir projeto: ' + error.message);
            } else {
                console.log('[DEBUG] Projeto excluído com sucesso');
                setShowDeleteModal(false);
                setShowSuccessModal(true);
            }
        } catch (err) {
            console.error('[DEBUG] Erro geral ao excluir:', err);
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
            // Fetch all species for this project for the report
            const { data: allSpecies } = await supabase
                .from('especie')
                .select('nome_cientifico, nome_popular, familia:familia_id(familia_nome)')
                .eq('local_id', id)
                .order('nome_cientifico');

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 15;

            // Header with logo
            const img = new Image();
            img.src = logoIcon;
            doc.addImage(img, 'PNG', 15, y, 20, 20);

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Veridia Saber', 40, y + 8);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('Relatório de Local/Projeto', 40, y + 15);

            // Date
            doc.setFontSize(9);
            const today = new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            doc.text(`Emitido em: ${today}`, pageWidth - 15, y + 8, { align: 'right' });

            // Separator line
            y += 28;
            doc.setDrawColor(200);
            doc.line(15, y, pageWidth - 15, y);
            y += 10;

            // Project Name
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 78, 59); // emerald-900
            doc.text(project.nome, 15, y);
            y += 8;

            // Type badge
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Tipo: ${project.tipo || 'Não informado'}`, 15, y);
            y += 10;

            // Description
            if (project.descricao) {
                doc.setFontSize(10);
                doc.setTextColor(60);
                const descLines = doc.splitTextToSize(project.descricao, pageWidth - 30);
                doc.text(descLines, 15, y);
                y += descLines.length * 5 + 5;
            }

            // Statistics
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

            // Species Table
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

            // Download
            const fileName = `Relatorio_${project.nome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            doc.save(fileName);
            console.log('[DEBUG] Relatório gerado:', fileName);

        } catch (err) {
            console.error('[DEBUG] Erro ao gerar relatório:', err);
            alert('Erro ao gerar relatório PDF.');
        }
    };

    // ============ MODAL FUNCTIONS ============
    const openFamilyModal = async (familyId: number, familyName: string) => {
        setSelectedFamily({ id: familyId, name: familyName });
        setIsModalOpen(true);
        setModalLoading(true);
        setModalSpecies([]);

        console.log('[DEBUG] Abrindo modal para família:', familyName, '| ID:', familyId);

        try {
            const { data, error } = await supabase
                .from('especie')
                .select('id, nome_cientifico, nome_popular')
                .eq('local_id', id)
                .eq('familia_id', familyId)
                .order('nome_cientifico');

            if (error) {
                console.error('[DEBUG] Erro ao buscar espécies da família:', error);
            } else {
                console.log('[DEBUG] Espécies da família encontradas:', data?.length);
                setModalSpecies(data || []);
            }
        } catch (err) {
            console.error('[DEBUG] Erro geral no modal:', err);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedFamily(null);
        setModalSpecies([]);
    };

    // ============ FETCH COUNTS (runs once on mount) ============
    const fetchCounts = async () => {
        if (!id) return;
        console.log('[DEBUG] Buscando contadores iniciais para projeto ID:', id);

        try {
            // Count Users
            const { count: userCount, error: userError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('local_id', id);

            if (!userError && userCount !== null) {
                console.log('[DEBUG] Total de usuários:', userCount);
                setUsersCount(userCount);
            }

            // Count Species
            const { count: specCount, error: specError } = await supabase
                .from('especie')
                .select('*', { count: 'exact', head: true })
                .eq('local_id', id);

            if (!specError && specCount !== null) {
                console.log('[DEBUG] Total de espécies:', specCount);
                setSpeciesCountTotal(specCount);
            }

            // Count Families (via species familia_id distinct)
            const { data: familyData, error: familyError } = await supabase
                .from('especie')
                .select('familia_id')
                .eq('local_id', id)
                .not('familia_id', 'is', null);

            if (!familyError && familyData) {
                const uniqueFamilyIds = new Set(familyData.map(s => s.familia_id));
                console.log('[DEBUG] Total de famílias únicas:', uniqueFamilyIds.size);
                setFamiliesCount(uniqueFamilyIds.size);
            }
        } catch (err) {
            console.error('[DEBUG] Erro ao buscar contadores:', err);
        }
    };

    // ============ DATA FETCHING ============
    useEffect(() => {
        if (id && isGlobalAdmin) {
            console.log('[DEBUG] Iniciando fetch do projeto. ID:', id);
            fetchProjectDetails();
            fetchCounts(); // Load counts immediately
        }
    }, [id, profile]);

    // When tab changes, reset pagination and fetch data
    useEffect(() => {
        if (id && project) {
            console.log('[DEBUG] Aba alterada para:', activeTab, '- Resetando página para 1');
            setCurrentPage(1);
            fetchTabData(activeTab, 1);
        }
    }, [activeTab, project]);

    // When page changes (but not tab), fetch data for new page
    useEffect(() => {
        if (id && project && currentPage > 0) {
            console.log('[DEBUG] Página alterada para:', currentPage);
            fetchTabData(activeTab, currentPage);
        }
    }, [currentPage]);

    const fetchProjectDetails = async () => {
        setLoading(true);
        setError(null);
        console.log('[DEBUG] fetchProjectDetails() - Buscando projeto ID:', id);
        try {
            const { data, error: fetchError } = await supabase
                .from('locais')
                .select('*, especie(count)')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('[DEBUG] ERRO ao buscar projeto:', fetchError);
                throw fetchError;
            }
            console.log('[DEBUG] Projeto encontrado:', data);
            setProject(data);
        } catch (err) {
            console.error('Error fetching project details:', err);
            setError('Não foi possível carregar os detalhes do projeto.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTabData = async (tab: TabType, page: number = 1) => {
        if (!id) return;
        setTabLoading(true);

        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE - 1;

        console.log('[DEBUG] fetchTabData() - Aba:', tab, '| Página:', page, '| Range:', start, '-', end);

        try {
            switch (tab) {
                case 'users':
                    console.log('[DEBUG] Buscando usuários com local_id =', id);
                    const { data: usersData, error: usersError } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, role, avatar_url')
                        .eq('local_id', id)
                        .order('full_name')
                        .range(start, end);

                    if (usersError) {
                        console.error('[DEBUG] ERRO ao buscar usuários:', usersError);
                    } else {
                        console.log('[DEBUG] Usuários encontrados:', usersData?.length, usersData);
                    }
                    setLinkedUsers(usersData || []);
                    setTotalPages(Math.ceil(usersCount / ITEMS_PER_PAGE) || 1);
                    break;

                case 'species':
                    console.log('[DEBUG] Buscando espécies com local_id =', id);
                    const { data: speciesData, error: speciesError } = await supabase
                        .from('especie')
                        .select('id, nome_cientifico, nome_popular, familia_id, familia:familia_id(id, familia_nome), imagens(url_imagem)')
                        .eq('local_id', id)
                        .order('nome_cientifico')
                        .range(start, end);

                    if (speciesError) {
                        console.error('[DEBUG] ERRO ao buscar espécies:', speciesError);
                    } else {
                        console.log('[DEBUG] Espécies encontradas:', speciesData?.length, speciesData);
                    }

                    // Normalize familia and imagem from arrays to single values
                    const normalizedSpecies: LinkedSpecies[] = (speciesData || []).map((s: any) => {
                        const familia = Array.isArray(s.familia) ? s.familia[0] : s.familia;
                        // Get first image from imagens array
                        const imagem = s.imagens && s.imagens.length > 0 ? s.imagens[0]?.url_imagem : null;
                        return {
                            id: s.id,
                            nome_cientifico: s.nome_cientifico,
                            nome_popular: s.nome_popular,
                            familia_id: s.familia_id,
                            familia,
                            imagem
                        };
                    });
                    setLinkedSpecies(normalizedSpecies);
                    setTotalPages(Math.ceil(speciesCountTotal / ITEMS_PER_PAGE) || 1);
                    break;

                case 'families':
                    console.log('[DEBUG] Buscando famílias (via espécies) com local_id =', id);
                    // Fetch ALL species to aggregate by family (then paginate client-side)
                    const { data: speciesForFamilies, error: familiesError } = await supabase
                        .from('especie')
                        .select('familia_id, familia:familia_id(id, familia_nome)')
                        .eq('local_id', id);

                    if (familiesError) {
                        console.error('[DEBUG] ERRO ao buscar famílias:', familiesError);
                    } else {
                        console.log('[DEBUG] Espécies para agregação de famílias:', speciesForFamilies?.length, speciesForFamilies);
                    }

                    if (speciesForFamilies) {
                        const familyMap = new Map<number, { id: number; familia_nome: string; speciesCount: number }>();
                        speciesForFamilies.forEach((s: any) => {
                            const fam = Array.isArray(s.familia) ? s.familia[0] : s.familia;
                            if (fam && fam.id) {
                                const existing = familyMap.get(fam.id);
                                if (existing) {
                                    existing.speciesCount++;
                                } else {
                                    familyMap.set(fam.id, {
                                        id: fam.id,
                                        familia_nome: fam.familia_nome || 'Sem nome',
                                        speciesCount: 1
                                    });
                                }
                            }
                        });
                        const allFamilies = Array.from(familyMap.values()).sort((a, b) => a.familia_nome.localeCompare(b.familia_nome));

                        // Client-side pagination for families
                        const paginatedFamilies = allFamilies.slice(start, end + 1);
                        console.log('[DEBUG] Famílias agregadas:', allFamilies.length, '| Página:', paginatedFamilies.length);
                        setLinkedFamilies(paginatedFamilies);
                        setTotalPages(Math.ceil(allFamilies.length / ITEMS_PER_PAGE) || 1);
                    }
                    break;
            }
        } catch (err) {
            console.error(`[DEBUG] ERRO GERAL ao buscar dados da aba ${tab}:`, err);
        } finally {
            setTabLoading(false);
        }
    };

    // ============ DERIVED DATA ============
    const speciesCount = useMemo(() => project?.especie?.[0]?.count || 0, [project]);

    const tabs = [
        { id: 'users' as TabType, label: 'Usuários', icon: Users, count: usersCount },
        { id: 'species' as TabType, label: 'Espécies', icon: Leaf, count: speciesCountTotal },
        { id: 'families' as TabType, label: 'Famílias', icon: TreeDeciduous, count: familiesCount },
    ];

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
                {/* ============ LEFT COLUMN (1/3) ============ */}
                <div className="lg:col-span-1 space-y-5">
                    {/* A) Cover Image */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="relative h-56 bg-gray-100">
                            {project.imagem_capa ? (
                                <img
                                    src={project.imagem_capa}
                                    alt={project.nome}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <MapPin size={64} />
                                </div>
                            )}
                            {project.tipo && (
                                <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm shadow-sm rounded-full text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                    {isInstituicao(project.tipo) ? <Building2 size={14} /> : <Trees size={14} />}
                                    {formatTipo(project.tipo)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* B) Statistics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Leaf size={18} className="text-emerald-600" />
                            Estatísticas
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 px-4 py-3 rounded-lg text-center">
                                <p className="text-2xl font-bold text-emerald-700">{speciesCount}</p>
                                <p className="text-xs text-emerald-600">Espécies</p>
                            </div>
                            <div className="bg-blue-50 px-4 py-3 rounded-lg text-center">
                                <p className="text-2xl font-bold text-blue-700">{linkedUsers.length}</p>
                                <p className="text-xs text-blue-600">Usuários</p>
                            </div>
                        </div>
                        {project.created_at && (
                            <div className="flex items-center gap-2 text-gray-500 text-sm pt-2 border-t border-gray-100">
                                <Calendar size={14} />
                                <span>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                        )}
                    </div>

                    {/* C) Description */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-900 mb-3">Descrição</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {project.descricao || 'Nenhuma descrição cadastrada para este projeto.'}
                        </p>
                        {project.latitude && project.longitude && (
                            <div className="flex items-center gap-2 text-gray-500 text-xs mt-4 pt-3 border-t border-gray-100">
                                <MapPin size={12} />
                                <span>Lat: {project.latitude?.toFixed(4)}, Lng: {project.longitude?.toFixed(4)}</span>
                            </div>
                        )}
                    </div>

                    {/* D) Action Buttons */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
                        <h3 className="font-semibold text-gray-900 mb-2">Ações</h3>
                        <button
                            onClick={handleGenerateReport}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <FileText size={16} />
                            Gerar Relatório
                        </button>
                        <button
                            onClick={handleEditProject}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            <Pencil size={16} />
                            Editar Projeto
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                            <Trash2 size={16} />
                            Excluir Projeto
                        </button>
                    </div>
                </div>

                {/* ============ RIGHT COLUMN (2/3) - TABS ============ */}
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
                                    {/* USERS TAB */}
                                    {activeTab === 'users' && (
                                        <div className="space-y-3">
                                            {linkedUsers.length === 0 ? (
                                                <div className="text-center py-12 text-gray-400">
                                                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                                                    <p>Nenhum usuário vinculado a este projeto.</p>
                                                </div>
                                            ) : (
                                                linkedUsers.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                                                            {user.avatar_url ? (
                                                                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {user.full_name || 'Sem nome'}
                                                            </p>
                                                            <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                                                <Mail size={12} />
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                                                            style={getRoleBadgeStyle(user.role)}
                                                        >
                                                            <Shield size={12} />
                                                            {user.role || 'Sem cargo'}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* SPECIES TAB */}
                                    {activeTab === 'species' && (
                                        <div className="space-y-3">
                                            {linkedSpecies.length === 0 ? (
                                                <div className="text-center py-12 text-gray-400">
                                                    <Leaf size={48} className="mx-auto mb-3 opacity-50" />
                                                    <p>Nenhuma espécie cadastrada neste projeto.</p>
                                                </div>
                                            ) : (
                                                linkedSpecies.map((species) => (
                                                    <div
                                                        key={species.id}
                                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {/* Cover Image or Placeholder */}
                                                            {species.imagem ? (
                                                                <img
                                                                    src={species.imagem}
                                                                    alt={species.nome_cientifico || 'Espécie'}
                                                                    className="w-12 h-12 rounded-lg object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                    <Leaf size={24} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-medium text-gray-900 italic">
                                                                    {species.nome_cientifico || 'Sem nome científico'}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {species.nome_popular || 'Nome popular não informado'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {species.familia && (
                                                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                                                                {(species.familia as any).familia_nome}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* FAMILIES TAB */}
                                    {activeTab === 'families' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {linkedFamilies.length === 0 ? (
                                                <div className="col-span-full text-center py-12 text-gray-400">
                                                    <TreeDeciduous size={48} className="mx-auto mb-3 opacity-50" />
                                                    <p>Nenhuma família botânica presente neste projeto.</p>
                                                </div>
                                            ) : (
                                                linkedFamilies.map((family) => (
                                                    <div
                                                        key={family.id}
                                                        onClick={() => openFamilyModal(family.id, family.familia_nome)}
                                                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                                                    >
                                                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                                                            <TreeDeciduous size={24} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-gray-900">{family.familia_nome}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {family.speciesCount} {family.speciesCount === 1 ? 'espécie' : 'espécies'}
                                                            </p>
                                                        </div>
                                                        <div className="text-gray-400 group-hover:text-purple-600 transition-colors">
                                                            <ArrowLeft size={16} className="rotate-180" />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
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
                                            ${currentPage === 1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <ArrowLeft size={16} />
                                        Anterior
                                    </button>
                                    <span className="text-sm text-gray-500">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                            ${currentPage === totalPages
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
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
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Excluir Projeto?</h3>
                                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Tem certeza que deseja excluir o projeto <strong>"{project?.nome}"</strong>?
                            Essa ação removerá os vínculos com usuários e espécies.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteProject}
                                disabled={deleteLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                                {deleteLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
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
                        onClick={handleSuccessClose}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
                        {/* Close Button */}
                        <button
                            onClick={handleSuccessClose}
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
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Projeto Excluído</h3>

                            <p className="text-gray-600 mb-8 leading-relaxed text-base">
                                O projeto <strong className="text-gray-900">"{project?.nome}"</strong> foi removido com sucesso do sistema.
                            </p>

                            {/* Action */}
                            <button
                                onClick={handleSuccessClose}
                                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-200"
                            >
                                Voltar para Projetos
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
