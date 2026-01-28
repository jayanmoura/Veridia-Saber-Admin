
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Search, Loader2, Plus, Edit2, Trash2, Tag, Filter, Leaf, FileText } from 'lucide-react';
import { specimenRepo } from '../../services/specimenRepo';
import type { Specimen } from '../../services/types';
import { generateHerbariumLabels } from '../../utils/pdf';
import { SpecimenModal } from '../../components/Modals/SpecimenModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { SpecimenFormData } from '../../hooks/useSpecimens';
import { ConfirmDeleteModal } from '../../components/Modals/ConfirmDeleteModal';

// Initial Form State
const INITIAL_FORM: SpecimenFormData = {
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
    morfologia: '',
    habitat_ecologia: ''
};

export default function Specimens() {
    const { profile } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [specimens, setSpecimens] = useState<Specimen[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get('search') || '');

    // Filter State
    const [projects, setProjects] = useState<{ id: number; nome: string }[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>(''); // '' = All
    const [canFilter, setCanFilter] = useState(false);

    // CRUD State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingSpecimen, setEditingSpecimen] = useState<Specimen | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [formData, setFormData] = useState<SpecimenFormData>(INITIAL_FORM);
    const [actionLoading, setActionLoading] = useState(false);
    const [labelLoading, setLabelLoading] = useState<number | null>(null);

    useEffect(() => {
        const init = async () => {
            if (!profile) return;
            setLoading(true);

            // Fetch Projects for filter (and lookups)
            const { data: locals } = await supabase
                .from('locais')
                .select('id, nome')
                .order('nome');

            setProjects(locals || []);

            // Determine Role-based Filter
            let initialFilter = '';

            // Roles allowed to see the filter dropdown
            const filterAllowed = ['Curador Mestre', 'Coordenador Científico'].includes(profile.role);
            setCanFilter(filterAllowed);

            if (filterAllowed) {
                // Curador/Coordenador sees all by default
                initialFilter = '';
            } else if (['Gestor de Acervo', 'Taxonomista de Campo'].includes(profile.role)) {
                // Restricted to own project
                if (profile.local_id) {
                    initialFilter = profile.local_id.toString();
                }
            } else if (profile.role === 'Taxonomista Sênior') {
                // "Veridia Saber" Scope
                const veridia = locals?.find(l => l.nome.toLowerCase().includes('veridia saber'));
                if (veridia) {
                    initialFilter = veridia.id.toString();
                }
            }

            setSelectedProject(initialFilter);
            setSelectedProject(initialFilter);
            await loadSpecimens(initialFilter);
            setLoading(false);

            // Check for action param to auto-open modal
            if (searchParams.get('action') === 'new') {
                openNewModal();
                // Clean up URL
                setSearchParams(prev => {
                    prev.delete('action');
                    return prev;
                }, { replace: true });
            }
        };

        init();
    }, [profile]);

    const loadSpecimens = async (localIdOverride?: string) => {
        const filterId = localIdOverride !== undefined ? localIdOverride : selectedProject;
        try {
            const data = await specimenRepo.listSpecimens({
                limit: 100,
                localId: filterId ? parseInt(filterId) : undefined,
                especieId: searchParams.get('especie_id') || undefined
            });
            setSpecimens(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        setSearchParams(prev => {
            if (value) prev.set('search', value);
            else prev.delete('search');
            return prev;
        }, { replace: true });
    };

    const handleProjectFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVal = e.target.value;
        setSelectedProject(newVal);
        loadSpecimens(newVal);
    };

    // Filter Logic (Client-side search, Repo handles project filter)
    const filtered = specimens.filter(s =>
        s.especie?.nome_cientifico.toLowerCase().includes(search.toLowerCase()) ||
        s.locais?.nome.toLowerCase().includes(search.toLowerCase()) ||
        s.coletor?.toLowerCase().includes(search.toLowerCase()) ||
        s.numero_coletor?.includes(search)
    );

    const handlePrintLabel = async (specimen: Specimen) => {
        setLabelLoading(specimen.id);
        try {
            // Format data for label generator
            const formatDate = (dateStr?: string | null) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '';

            const labelData = {
                scientificName: specimen.especie?.nome_cientifico || 'Sem Identificação',
                author: specimen.especie?.autor || undefined,
                family: specimen.especie?.familia?.familia_nome || 'INDETERMINADA',
                popularName: specimen.especie?.nome_popular || undefined,
                collector: specimen.coletor || 'Sem Coletor',
                collectorNumber: specimen.numero_coletor || undefined,
                date: formatDate(specimen.created_at),
                location: `${specimen.locais?.nome || 'Local Desconhecido'}`,
                notes: specimen.detalhes_localizacao || '',
                morphology: specimen.morfologia || undefined,
                habitat: specimen.habitat_ecologia || undefined,
                determinant: specimen.determinador || '',
                determinationDate: formatDate(specimen.data_determinacao),
                coordinates: (specimen.latitude && specimen.longitude)
                    ? `Lat: ${specimen.latitude} Long: ${specimen.longitude}`
                    : undefined,
                tomboNumber: specimen.tombo_codigo || specimen.id
            };

            generateHerbariumLabels([labelData], `Etiqueta_${specimen.id}.pdf`);
        } catch (error) {
            console.error('Error generating label:', error);
            alert('Erro ao gerar etiqueta');
        } finally {
            setLabelLoading(null);
        }
    };

    // NEW: Generate Project Report (PDF)
    const handleGenerateProjectReport = async () => {
        // Determine scope: Selected Project or User's Project or "Global"
        const targetProjectId = selectedProject ? parseInt(selectedProject) : (profile?.local_id || null);
        const targetProjectName = projects.find(p => p.id === targetProjectId)?.nome || 'Todos os Projetos';

        setActionLoading(true);
        try {
            // Fetch ALL matching specimens (no limit)
            const allData = await specimenRepo.listSpecimens({
                limit: 2000,
                localId: targetProjectId || undefined,
                especieId: searchParams.get('especie_id') || undefined
            });

            // Client-side filter if search is active
            const finalData = search ? allData.filter(s =>
                s.especie?.nome_cientifico.toLowerCase().includes(search.toLowerCase()) ||
                s.locais?.nome.toLowerCase().includes(search.toLowerCase()) ||
                s.coletor?.toLowerCase().includes(search.toLowerCase()) ||
                s.numero_coletor?.includes(search)
            ) : allData;

            if (finalData.length === 0) {
                alert('Nenhum dado encontrado para gerar o relatório.');
                return;
            }

            // Map to Report Data
            const reportData = finalData.map(s => ({
                id: s.id.toString(),
                tombo: s.tombo_codigo || s.id.toString(),
                especie_nome_cientifico: s.especie?.nome_cientifico || 'Indeterminada',
                familia_nome: s.especie?.familia?.familia_nome || 'Indeterminada',
                coletor_nome: s.coletor || 'Sem Coletor',
                data_coleta: s.created_at,
                coords_lat: s.latitude ? parseFloat(s.latitude as unknown as string) : undefined,
                coords_lng: s.longitude ? parseFloat(s.longitude as unknown as string) : undefined
            }));

            // Generate PDF
            const { generateProjectSpecimensReport } = await import('../../utils/pdf');
            generateProjectSpecimensReport(
                reportData,
                `Relatorio_Especimes_${targetProjectName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                {
                    projectName: targetProjectName,
                    isGlobalReport: !targetProjectId
                },
                {
                    userName: profile?.full_name,
                    userRole: profile?.role
                }
            );

        } catch (error) {
            console.error('Report error:', error);
            alert('Erro ao gerar relatório PDF.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handlers
    const openNewModal = () => {
        setEditingSpecimen(null);
        setFormData(INITIAL_FORM);
        setIsModalOpen(true);
    };

    const openEditModal = (specimen: Specimen) => {
        setEditingSpecimen(specimen);
        setFormData({
            local_id: specimen.local_id.toString(),
            institution_id: specimen.institution_id || specimen.locais?.institution_id || '',
            especie_id: specimen.especie_id,
            latitude: specimen.latitude?.toString() || '',
            longitude: specimen.longitude?.toString() || '',
            detalhes_localizacao: specimen.detalhes_localizacao || '',
            descricao_ocorrencia: specimen.descricao_ocorrencia || '',
            coletor: specimen.coletor || '',
            numero_coletor: specimen.numero_coletor || '',
            determinador: specimen.determinador || '',
            data_determinacao: specimen.data_determinacao || '',
            morfologia: specimen.morfologia || '',
            habitat_ecologia: specimen.habitat_ecologia || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.local_id || !formData.especie_id) return null; // Return null if invalid
        setActionLoading(true);

        try {
            const payload = {
                especie_id: formData.especie_id,
                local_id: parseInt(formData.local_id), // Cast to number
                // institution_id should ideally come from the selected Project or current user's org.
                // For now, let's use profile's institution_id or fallback.
                // A specimen belongs to the project's institution usually.
                institution_id: formData.institution_id || profile?.institution_id || null,
                created_by: profile?.id,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                detalhes_localizacao: formData.detalhes_localizacao || null,
                descricao_ocorrencia: formData.descricao_ocorrencia || null,
                coletor: formData.coletor || null,
                numero_coletor: formData.numero_coletor || null,
                determinador: formData.determinador || null,
                data_determinacao: formData.data_determinacao || null,
                morfologia: formData.morfologia || null,
                habitat_ecologia: formData.habitat_ecologia || null,
            };

            let savedId: number | null = null;

            if (editingSpecimen) {
                const updated = await specimenRepo.updateSpecimen(editingSpecimen.id, payload);
                savedId = updated?.id || editingSpecimen.id;
            } else {
                const created = await specimenRepo.createSpecimen(payload);
                savedId = created?.id || null;
            }

            // Don't close modal here, let Modal invoke verify and uploads.
            // But originally we closed it. Now we return ID.
            // The Modal 'onSave' prop will be called.
            // We need to keep the list refresh but maybe not close immediately if we want to show success or something?
            // Actually, the Modal handles the flow. It calls onSave, waits, then does uploads.
            // So we should return the ID here.

            loadSpecimens(); // Refresh list in background
            return savedId;
        } catch (error) {
            console.error('Error saving specimen:', error);
            // Optional: toast error
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setActionLoading(true);
        try {
            await specimenRepo.deleteSpecimen(deleteId);
            setDeleteId(null);
            setIsDeleteOpen(false); // Using confirm modal boolean if separate, or passing to component
            loadSpecimens();
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Espécimes</h1>
                    <p className="text-gray-500">Gerenciamento e catalogação do acervo</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateProjectReport}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                        title="Baixar Relatório PDF"
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                        <span className="hidden sm:inline">Relatório PDF</span>
                    </button>

                    <button
                        onClick={() => openNewModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Novo Espécime</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm md:flex md:items-center md:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por espécie, projeto ou coletor..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>

                {canFilter && (
                    <div className="relative mt-3 md:mt-0 md:w-64">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={selectedProject}
                                onChange={handleProjectFilterChange}
                                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white text-gray-700 cursor-pointer"
                            >
                                <option value="">Todos os Projetos</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                    <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500 font-medium">Nenhum espécime encontrado.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-gray-700 w-20">Foto</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Tombo</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Espécie</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Projeto (Local)</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Coletor</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700">Data</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700 text-center">Coords</th>
                                    <th className="px-6 py-3 font-semibold text-gray-700 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            {item.imagens && item.imagens.length > 0 ? (
                                                <img
                                                    src={item.imagens[0].url_imagem}
                                                    alt={item.especie?.nome_cientifico}
                                                    className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <Leaf size={18} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-500 font-bold text-xs">
                                            {item.tombo_codigo || `#${item.id}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="font-bold text-gray-900 italic">{item.especie?.nome_cientifico || 'Sem ID'}</p>
                                                    <p className="text-xs text-gray-500">{item.especie?.familia?.familia_nome}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {item.locais?.nome || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs">
                                                <span className="text-gray-900 font-medium">{item.coletor || '-'}</span>
                                                {item.numero_coletor && <span className="text-gray-500">Nº {item.numero_coletor}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.latitude && item.longitude ? (
                                                <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded cursor-help" title={`${item.latitude}, ${item.longitude} `}>
                                                    GPS OK
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handlePrintLabel(item)}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Gerar Etiqueta"
                                                    disabled={labelLoading === item.id}
                                                >
                                                    {labelLoading === item.id ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => { setDeleteId(item.id); setIsDeleteOpen(true); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <SpecimenModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                formData={formData}
                setFormData={setFormData}
                loading={actionLoading}
                isEdit={!!editingSpecimen}
                initialSpeciesName={editingSpecimen?.especie?.nome_cientifico} // Access via relation
                initialProjectName={editingSpecimen?.locais?.nome}
                specimenId={editingSpecimen?.id}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteOpen} // Use boolean derived from ID or separate state? Component usually takes boolean.
                onClose={() => { setIsDeleteOpen(false); setDeleteId(null); }}
                onConfirm={handleDelete}
                title="Excluir Espécime?"
                itemName={(() => {
                    const item = specimens.find(s => s.id === deleteId);
                    return item?.tombo_codigo ? `Tombo ${item.tombo_codigo}` : `Tombo #${deleteId}`;
                })()}
                loading={actionLoading}
            />
        </div>
    );
}
