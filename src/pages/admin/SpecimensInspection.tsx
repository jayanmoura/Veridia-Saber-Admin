/**
 * SpecimensInspection - Read-only inspection page for specimens by project.
 * Only accessible by Curador Mestre and Coordenador Científico.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Loader2,
    Eye,
    AlertTriangle,
    ImageOff,
    FileText,
    ChevronDown,
    X,
    MapPin,
    Calendar,
    User
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
    id: string;
    nome: string;
    tipo: string | null;
    cidade: string | null;
    estado: string | null;
}

interface Specimen {
    id: string;
    local_id: string;
    especie_id: string;
    latitude: number | null;
    longitude: number | null;
    detalhes_localizacao: string | null;
    descricao_ocorrencia: string | null;
    coletor: string | null;
    numero_coletor: string | null;
    determinador: string | null;
    data_determinacao: string | null;
    created_at: string;
    especie?: {
        nome_cientifico: string;
        nome_popular: string | null;
        familia?: {
            familia_nome: string;
        };
    };
    imagens?: { id: string; url_imagem: string }[];
    imageCount?: number;
}

interface SpecimenDetailModalProps {
    specimen: Specimen | null;
    isOpen: boolean;
    onClose: () => void;
}

function SpecimenDetailModal({ specimen, isOpen, onClose }: SpecimenDetailModalProps) {
    const [images, setImages] = useState<{ id: string; url_imagem: string; creditos: string | null }[]>([]);
    const [loadingImages, setLoadingImages] = useState(false);

    useEffect(() => {
        if (specimen && isOpen) {
            loadImages();
        }
    }, [specimen, isOpen]);

    const loadImages = async () => {
        if (!specimen) return;
        setLoadingImages(true);
        try {
            const { data } = await supabase
                .from('imagens')
                .select('id, url_imagem, creditos')
                .eq('especime_id', specimen.id);
            setImages(data || []);
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            setLoadingImages(false);
        }
    };

    if (!isOpen || !specimen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {specimen.especie?.nome_cientifico || 'Espécime sem espécie'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            ID: {specimen.id.slice(0, 8)}... • {specimen.especie?.familia?.familia_nome || 'Sem família'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="text-gray-400 mt-0.5" size={18} />
                            <div>
                                <p className="text-xs text-gray-500">Localização</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {specimen.detalhes_localizacao || 'Não informada'}
                                </p>
                                {specimen.latitude && specimen.longitude && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {specimen.latitude.toFixed(6)}, {specimen.longitude.toFixed(6)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <User className="text-gray-400 mt-0.5" size={18} />
                            <div>
                                <p className="text-xs text-gray-500">Coletor</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {specimen.coletor || 'Não informado'}
                                    {specimen.numero_coletor && ` (${specimen.numero_coletor})`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <User className="text-gray-400 mt-0.5" size={18} />
                            <div>
                                <p className="text-xs text-gray-500">Determinador</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {specimen.determinador || 'Não informado'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="text-gray-400 mt-0.5" size={18} />
                            <div>
                                <p className="text-xs text-gray-500">Data de Determinação</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {specimen.data_determinacao
                                        ? new Date(specimen.data_determinacao).toLocaleDateString('pt-BR')
                                        : 'Não informada'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {specimen.descricao_ocorrencia && (
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-2">Descrição da Ocorrência</p>
                            <p className="text-sm text-gray-700">{specimen.descricao_ocorrencia}</p>
                        </div>
                    )}

                    {/* Images */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            Imagens do Espécime
                            <span className="text-xs font-normal text-gray-400">({images.length})</span>
                        </h3>
                        {loadingImages ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin text-amber-500" size={24} />
                            </div>
                        ) : images.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl">
                                <ImageOff className="text-gray-300 mb-2" size={32} />
                                <p className="text-sm text-gray-400">Nenhuma imagem cadastrada</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {images.map(img => (
                                    <div key={img.id} className="relative group">
                                        <img
                                            src={img.url_imagem}
                                            alt="Espécime"
                                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                        />
                                        {img.creditos && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg truncate">
                                                {img.creditos}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">
                        Visualização apenas leitura • Registrado em {new Date(specimen.created_at).toLocaleDateString('pt-BR')}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Report Modal Component
interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    specimens: Specimen[];
    userName: string;
    userRole: string;
}

function ReportModal({ isOpen, onClose, projectName, specimens, userName, userRole }: ReportModalProps) {
    const [format, setFormat] = useState<'pdf' | 'csv' | 'both'>('pdf');
    const [includeImageUrls, setIncludeImageUrls] = useState(false);
    const [imageFilter, setImageFilter] = useState<'all' | 'with' | 'without'>('all');
    const [generating, setGenerating] = useState(false);

    const filteredSpecimens = specimens.filter(s => {
        if (imageFilter === 'all') return true;
        if (imageFilter === 'with') return (s.imageCount || 0) > 0;
        return (s.imageCount || 0) === 0;
    });

    const stats = {
        total: filteredSpecimens.length,
        withImages: filteredSpecimens.filter(s => (s.imageCount || 0) > 0).length,
        withoutImages: filteredSpecimens.filter(s => (s.imageCount || 0) === 0).length,
        distinctSpecies: new Set(filteredSpecimens.map(s => s.especie_id)).size
    };

    const generateCSV = () => {
        const headers = ['Espécime ID', 'Espécie ID', 'Nome Científico', 'Família', 'Coletor', 'Determinador', 'Localização', 'Latitude', 'Longitude', 'Possui Imagens', 'Qtd Imagens'];
        if (includeImageUrls) headers.push('URLs das Imagens');

        const rows = filteredSpecimens.map(s => {
            const row = [
                s.id,
                s.especie_id,
                s.especie?.nome_cientifico || '',
                s.especie?.familia?.familia_nome || '',
                s.coletor || '',
                s.determinador || '',
                s.detalhes_localizacao || '',
                s.latitude?.toString() || '',
                s.longitude?.toString() || '',
                (s.imageCount || 0) > 0 ? 'Sim' : 'Não',
                (s.imageCount || 0).toString()
            ];
            return row;
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const slug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        link.download = `relatorio-especimes-${slug}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const generatePDF = async () => {
        // Dynamic import to avoid loading jsPDF if not needed
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const today = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        // Cover Page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(6, 78, 59);
        doc.text('Relatório de Espécimes', pageWidth / 2, 60, { align: 'center' });

        doc.setFontSize(16);
        doc.setTextColor(107, 114, 128);
        doc.text(projectName, pageWidth / 2, 75, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Gerado em: ${today}`, pageWidth / 2, 90, { align: 'center' });
        doc.text(`Emitido por: ${userName} (${userRole})`, pageWidth / 2, 98, { align: 'center' });

        // Stats
        let y = 120;
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo', 20, y);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total de Espécimes: ${stats.total}`, 20, y); y += 7;
        doc.text(`Com Imagens: ${stats.withImages}`, 20, y); y += 7;
        doc.text(`Sem Imagens: ${stats.withoutImages}`, 20, y); y += 7;
        doc.text(`Espécies Distintas: ${stats.distinctSpecies}`, 20, y); y += 15;

        // Table
        doc.addPage();

        const tableData = filteredSpecimens.map((s, i) => [
            (i + 1).toString(),
            s.especie?.nome_cientifico || 'N/I',
            s.especie?.familia?.familia_nome || '-',
            s.coletor || '-',
            (s.imageCount || 0).toString()
        ]);

        autoTable(doc, {
            startY: 20,
            head: [['#', 'Espécie', 'Família', 'Coletor', 'Imagens']],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [6, 78, 59], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            margin: { left: 14, right: 14 },
        });

        // Footer on all pages
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text('Veridia Saber - Documento Confidencial', 14, pageHeight - 10);
            doc.text(`Pág. ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }

        const slug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        doc.save(`relatorio-especimes-${slug}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            if (format === 'pdf' || format === 'both') {
                await generatePDF();
            }
            if (format === 'csv' || format === 'both') {
                generateCSV();
            }
            onClose();
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Erro ao gerar relatório. Tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="text-amber-600" size={24} />
                        Emitir Relatório
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {projectName} • {specimens.length} espécimes
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Format */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
                        <div className="flex gap-3">
                            {(['pdf', 'csv', 'both'] as const).map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setFormat(opt)}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${format === opt
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
                                        }`}
                                >
                                    {opt === 'pdf' ? 'PDF' : opt === 'csv' ? 'CSV' : 'Ambos'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Imagens</label>
                        <select
                            value={imageFilter}
                            onChange={(e) => setImageFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                            <option value="all">Todos os espécimes</option>
                            <option value="with">Somente com imagens</option>
                            <option value="without">Somente sem imagens</option>
                        </select>
                    </div>

                    {/* CSV Options */}
                    {(format === 'csv' || format === 'both') && (
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeImageUrls}
                                    onChange={(e) => setIncludeImageUrls(e.target.checked)}
                                    className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                                />
                                <span className="text-sm text-gray-700">Incluir URLs das imagens no CSV</span>
                            </label>
                        </div>
                    )}

                    {/* Stats Preview */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-2">Prévia do relatório:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-gray-600">Espécimes: <strong>{stats.total}</strong></span>
                            <span className="text-gray-600">Com imagens: <strong>{stats.withImages}</strong></span>
                            <span className="text-gray-600">Sem imagens: <strong>{stats.withoutImages}</strong></span>
                            <span className="text-gray-600">Espécies: <strong>{stats.distinctSpecies}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={generating}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || stats.total === 0}
                        className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <FileText size={18} />
                                Gerar Relatório
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SpecimensInspection() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // RBAC Check
    const isAuthorized = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [specimens, setSpecimens] = useState<Specimen[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'with-images' | 'without-images'>('all');

    // Modal states
    const [selectedSpecimen, setSelectedSpecimen] = useState<Specimen | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Load projects on mount
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoadingProjects(true);
        try {
            const { data, error } = await supabase
                .from('locais')
                .select('id, nome, tipo, cidade, estado')
                .order('nome');

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const loadSpecimens = useCallback(async (projectId: string) => {
        if (!projectId) return;

        setLoading(true);
        try {
            // Load specimens with species info
            const { data: specimenData, error } = await supabase
                .from('especie_local')
                .select(`
                    id,
                    local_id,
                    especie_id,
                    latitude,
                    longitude,
                    detalhes_localizacao,
                    descricao_ocorrencia,
                    coletor,
                    numero_coletor,
                    determinador,
                    data_determinacao,
                    created_at,
                    especie:especie_id (
                        nome_cientifico,
                        nome_popular,
                        familia:familia_id (familia_nome)
                    )
                `)
                .eq('local_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get image counts for each specimen
            const specimenIds = (specimenData || []).map(s => s.id);

            if (specimenIds.length > 0) {
                const { data: imageCounts } = await supabase
                    .from('imagens')
                    .select('especime_id')
                    .in('especime_id', specimenIds);

                const countMap = new Map<string, number>();
                (imageCounts || []).forEach(img => {
                    const current = countMap.get(img.especime_id) || 0;
                    countMap.set(img.especime_id, current + 1);
                });

                const specimensWithCounts = (specimenData || []).map(s => {
                    // Handle Supabase returning arrays for single relations
                    const especieRaw = s.especie as unknown;
                    const especie = Array.isArray(especieRaw) ? especieRaw[0] : especieRaw;
                    const familiaRaw = especie?.familia as unknown;
                    const familia = Array.isArray(familiaRaw) ? familiaRaw[0] : familiaRaw;

                    return {
                        ...s,
                        especie: especie ? {
                            nome_cientifico: especie.nome_cientifico,
                            nome_popular: especie.nome_popular,
                            familia: familia ? { familia_nome: familia.familia_nome } : undefined
                        } : undefined,
                        imageCount: countMap.get(s.id) || 0
                    };
                });

                setSpecimens(specimensWithCounts as Specimen[]);
            } else {
                setSpecimens([]);
            }
        } catch (error) {
            console.error('Error loading specimens:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleProjectChange = (projectId: string) => {
        setSelectedProject(projectId);
        if (projectId) {
            loadSpecimens(projectId);
        } else {
            setSpecimens([]);
        }
    };

    const openDetailModal = (specimen: Specimen) => {
        setSelectedSpecimen(specimen);
        setIsDetailModalOpen(true);
    };

    // Filter specimens
    const filteredSpecimens = specimens.filter(s => {
        // Search filter
        const searchLower = search.toLowerCase();
        const matchesSearch = !search ||
            s.especie?.nome_cientifico?.toLowerCase().includes(searchLower) ||
            s.especie?.nome_popular?.toLowerCase().includes(searchLower) ||
            s.coletor?.toLowerCase().includes(searchLower) ||
            s.detalhes_localizacao?.toLowerCase().includes(searchLower);

        // Image filter
        const matchesImageFilter =
            filter === 'all' ||
            (filter === 'with-images' && (s.imageCount || 0) > 0) ||
            (filter === 'without-images' && (s.imageCount || 0) === 0);

        return matchesSearch && matchesImageFilter;
    });

    // Stats
    const totalSpecimens = specimens.length;
    const withImages = specimens.filter(s => (s.imageCount || 0) > 0).length;
    const withoutImages = totalSpecimens - withImages;
    const distinctSpecies = new Set(specimens.map(s => s.especie_id)).size;

    // Access denied
    if (!isAuthorized) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <AlertTriangle className="text-red-500" size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
                <p className="text-gray-500 max-w-md">
                    Esta área é restrita para Curadores Mestres e Coordenadores Científicos.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Voltar para Início
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Eye className="text-amber-500" size={28} />
                        Inspeção de Espécimes
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Visualize e audite espécimes por projeto (somente leitura)
                    </p>
                </div>
            </div>

            {/* Project Selector + Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Project Select */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selecione um Projeto
                        </label>
                        <div className="relative">
                            <select
                                value={selectedProject}
                                onChange={(e) => handleProjectChange(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none appearance-none bg-white pr-10"
                                disabled={loadingProjects}
                            >
                                <option value="">
                                    {loadingProjects ? 'Carregando projetos...' : '-- Selecionar Projeto --'}
                                </option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nome} {p.cidade && `(${p.cidade}/${p.estado})`}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar Espécimes
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Nome científico, coletor, localização..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                disabled={!selectedProject}
                            />
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="lg:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Imagens
                        </label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none appearance-none bg-white"
                            disabled={!selectedProject}
                        >
                            <option value="all">Todos</option>
                            <option value="with-images">Com imagens</option>
                            <option value="without-images">Sem imagens</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {selectedProject && !loading && specimens.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-500">Total de Espécimes</p>
                        <p className="text-2xl font-bold text-gray-900">{totalSpecimens}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-500">Com Imagens</p>
                        <p className="text-2xl font-bold text-emerald-600">{withImages}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-500">Sem Imagens</p>
                        <p className="text-2xl font-bold text-amber-600">{withoutImages}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-500">Espécies Distintas</p>
                        <p className="text-2xl font-bold text-blue-600">{distinctSpecies}</p>
                    </div>
                </div>
            )}

            {/* Report Button */}
            {selectedProject && specimens.length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium shadow-sm"
                    >
                        <FileText size={18} />
                        Emitir Relatório
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {!selectedProject ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <MapPin size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">Selecione um projeto</p>
                        <p className="text-sm">Escolha um projeto acima para visualizar os espécimes</p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                    </div>
                ) : filteredSpecimens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <AlertTriangle size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhum espécime encontrado</p>
                        <p className="text-sm">
                            {search || filter !== 'all'
                                ? 'Tente ajustar os filtros de busca'
                                : 'Este projeto ainda não possui espécimes cadastrados'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Espécie</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Família</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Coletor</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Localização</th>
                                    <th className="text-center px-6 py-4 font-semibold text-gray-700">Imagens</th>
                                    <th className="text-center px-6 py-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-center px-6 py-4 font-semibold text-gray-700">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSpecimens.map((specimen, index) => (
                                    <tr
                                        key={specimen.id}
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-amber-50/50 transition-colors`}
                                    >
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900 italic">
                                                {specimen.especie?.nome_cientifico || 'Sem identificação'}
                                            </p>
                                            {specimen.especie?.nome_popular && (
                                                <p className="text-xs text-gray-500">{specimen.especie.nome_popular}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {specimen.especie?.familia?.familia_nome || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {specimen.coletor || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                                            {specimen.detalhes_localizacao || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${(specimen.imageCount || 0) > 0
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {specimen.imageCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(specimen.imageCount || 0) === 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                    <ImageOff size={12} />
                                                    Sem imagem
                                                </span>
                                            ) : !specimen.determinador ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    <AlertTriangle size={12} />
                                                    Sem determinador
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                    OK
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => openDetailModal(specimen)}
                                                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                title="Ver Detalhes"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <SpecimenDetailModal
                specimen={selectedSpecimen}
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedSpecimen(null);
                }}
            />

            {/* Report Modal */}
            {isReportModalOpen && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    projectName={projects.find(p => p.id === selectedProject)?.nome || ''}
                    specimens={specimens}
                    userName={profile?.full_name || 'Usuário'}
                    userRole={profile?.role || ''}
                />
            )}
        </div>
    );
}
