import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../../components/Dashboard/StatCard';
import { PhotoGalleryModal } from '../../components/Modals/PhotoGalleryModal';
import {
    Leaf,
    Users,
    Camera,
    TreeDeciduous,
    Activity,
    Plus,
    Pencil,
    Eye,
    X,
    Loader2,
    CheckCircle
} from 'lucide-react';
import type { ProjectData, LocalStats, RecentLocalSpecies, LocalFamily } from '../../hooks';

interface LocalAdminViewProps {
    projectData: ProjectData | null;
    localStats: LocalStats;
    recentLocalSpecies: RecentLocalSpecies[];
    loadingRecentSpecies: boolean;
    localFamilies: LocalFamily[];
    loadingFamilies: boolean;
    fetchLocalFamilies: () => Promise<void>;
    loading: boolean;
    refetch: () => Promise<void>;
}

/**
 * Overview view for Gestor de Acervo (Local Admin).
 */
export function LocalAdminView({
    projectData,
    localStats,
    recentLocalSpecies,
    loadingRecentSpecies,
    localFamilies,
    loadingFamilies,
    fetchLocalFamilies,
    loading,
    refetch
}: LocalAdminViewProps) {
    const { profile } = useAuth();

    // Modal states
    const [isLocalFamiliesModalOpen, setIsLocalFamiliesModalOpen] = useState(false);
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

    // Edit project state
    const [editDescription, setEditDescription] = useState('');
    const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
    const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
    const [savingProject, setSavingProject] = useState(false);
    const [projectSaveSuccess, setProjectSaveSuccess] = useState(false);

    const openEditProjectModal = () => {
        setEditDescription(projectData?.descricao || '');
        setEditCoverPreview(projectData?.imagem_capa || null);
        setEditCoverFile(null);
        setProjectSaveSuccess(false);
        setIsEditProjectModalOpen(true);
    };

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditCoverPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProject = async () => {
        if (!profile?.local_id) return;

        setSavingProject(true);
        try {
            let newCoverUrl = projectData?.imagem_capa;

            if (editCoverFile) {
                const fileExt = editCoverFile.name.split('.').pop();
                const fileName = `locais/${profile.local_id}/capa/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('arquivos-gerais')
                    .upload(fileName, editCoverFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('arquivos-gerais')
                    .getPublicUrl(fileName);

                newCoverUrl = urlData.publicUrl;
            }

            const { error } = await supabase
                .from('locais')
                .update({
                    descricao: editDescription.trim() || null,
                    imagem_capa: newCoverUrl
                })
                .eq('id', profile.local_id);

            if (error) throw error;

            setProjectSaveSuccess(true);
            await refetch();

            setTimeout(() => {
                setIsEditProjectModalOpen(false);
                setProjectSaveSuccess(false);
            }, 2000);

        } catch (error: any) {
            console.error('Error saving project:', error);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSavingProject(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Hero Header with Project Identity */}
            <div
                className="relative rounded-2xl overflow-hidden shadow-lg"
                style={{
                    backgroundImage: projectData?.imagem_capa
                        ? `url(${projectData.imagem_capa})`
                        : 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '200px'
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                <div className="relative z-10 p-8 flex flex-col justify-end min-h-[200px]">
                    <div className="max-w-2xl">
                        {projectData?.tipo && (
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full mb-3 uppercase tracking-wider">
                                {projectData.tipo === 'instituicao' ? '🏛️ Instituição' : '🌳 Lugar Público'}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                            {projectData?.nome || 'Meu Projeto'}
                        </h1>
                        {projectData?.descricao && (
                            <p className="text-white/80 text-sm md:text-base line-clamp-2 max-w-xl">
                                {projectData.descricao}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Acervo Local" value={localStats.speciesCount} icon={Leaf} color="emerald" loading={loading} />
                <StatCard title="Membros da Equipe" value={localStats.teamCount} icon={Users} color="blue" loading={loading} />
                <StatCard title="Registros Fotográficos" value={localStats.imagesCount} icon={Camera} color="purple" loading={loading} onClick={() => setIsPhotoGalleryOpen(true)} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-emerald-600" />
                    Ações Rápidas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <NavLink to="/species" className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:shadow-md transition-all group">
                        <div className="p-3 bg-white rounded-full group-hover:scale-110 transition-transform">
                            <Plus className="text-emerald-600" size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800">Adicionar Espécie</h4>
                            <p className="text-xs text-gray-500">Vincular nova planta ao projeto</p>
                        </div>
                    </NavLink>

                    <button
                        onClick={() => { fetchLocalFamilies(); setIsLocalFamiliesModalOpen(true); }}
                        className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-xl hover:shadow-md transition-all group text-left"
                    >
                        <div className="p-3 bg-white rounded-full group-hover:scale-110 transition-transform">
                            <TreeDeciduous className="text-amber-600" size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800">Ver Famílias</h4>
                            <p className="text-xs text-gray-500">Famílias do seu acervo</p>
                        </div>
                    </button>

                    <button
                        onClick={openEditProjectModal}
                        className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:shadow-md transition-all group text-left"
                    >
                        <div className="p-3 bg-white rounded-full group-hover:scale-110 transition-transform">
                            <Pencil className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800">Editar Projeto</h4>
                            <p className="text-xs text-gray-500">Atualizar descrição e capa</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Recent Species Table */}
            {localStats.speciesCount > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Leaf size={20} className="text-emerald-600" />
                            Espécies Recentes no Acervo
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Últimas adições ao seu projeto</p>
                    </div>

                    {loadingRecentSpecies ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-emerald-600" size={32} />
                        </div>
                    ) : recentLocalSpecies.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {recentLocalSpecies.map((species) => (
                                <div key={species.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                        {species.imagem_url ? (
                                            <img src={species.imagem_url} alt={species.nome_cientifico} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Leaf size={20} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate italic">{species.nome_cientifico}</h4>
                                        {species.nome_popular && (
                                            <p className="text-sm text-gray-500 truncate">{species.nome_popular}</p>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-400 hidden sm:block">
                                        {new Date(species.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                    <NavLink to="/species" className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Ver detalhes">
                                        <Eye size={18} />
                                    </NavLink>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Leaf size={20} className="text-gray-300" />
                            </div>
                            <p className="text-gray-500 mb-4">Nenhuma espécie cadastrada neste projeto ainda.</p>
                            <NavLink to="/species" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                                <Plus size={16} />
                                Adicionar Espécie
                            </NavLink>
                        </div>
                    )}
                </div>
            )}

            {/* Welcome Message for Empty State */}
            {localStats.speciesCount === 0 && !loading && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-8 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Leaf size={32} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Bem-vindo ao seu Projeto!</h3>
                        <p className="text-gray-600 mb-6">
                            Seu acervo ainda está vazio. Comece adicionando a primeira espécie ao catálogo do seu projeto.
                        </p>
                        <NavLink to="/species" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm">
                            <Plus size={18} />
                            Adicionar Primeira Espécie
                        </NavLink>
                    </div>
                </div>
            )}

            {/* Local Families Modal */}
            {isLocalFamiliesModalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Famílias do Projeto</h3>
                            <button onClick={() => setIsLocalFamiliesModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {loadingFamilies ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                                </div>
                            ) : localFamilies.length > 0 ? (
                                <div className="space-y-2">
                                    {localFamilies.map((fam, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-emerald-50 rounded-lg transition-colors border border-gray-100 hover:border-emerald-100">
                                            <span className="font-medium text-gray-700">{fam.familia_nome}</span>
                                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                                                {fam.count} spp.
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Nenhuma família encontrada.</p>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Project Modal */}
            {isEditProjectModalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Editar Projeto</h3>
                            <button onClick={() => setIsEditProjectModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {projectSaveSuccess ? (
                            <div className="p-12 flex flex-col items-center justify-center animate-fade-in-up">
                                <div className="bg-emerald-100 p-4 rounded-full mb-4">
                                    <CheckCircle size={48} className="text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Sucesso!</h3>
                                <p className="text-gray-500 text-center">Os dados do projeto foram atualizados.</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Capa do Projeto</label>
                                        <div className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 transition-colors h-48 bg-gray-50">
                                            {editCoverPreview ? (
                                                <img src={editCoverPreview} alt="Capa" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                                    <Camera size={32} className="mb-2" />
                                                    <span className="text-sm">Clique para alterar a capa</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <p className="text-white font-medium flex items-center gap-2">
                                                    <Camera size={20} /> Alterar Capa
                                                </p>
                                            </div>
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleCoverFileChange} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Recomendado: 1200x400px (JPG, PNG)</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sobre o Projeto</label>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={4}
                                            placeholder="Descreva seu projeto, instituição ou local..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                    <button onClick={() => setIsEditProjectModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                                        Cancelar
                                    </button>
                                    <button onClick={handleSaveProject} disabled={savingProject} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-2 disabled:opacity-50">
                                        {savingProject ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            'Salvar Alterações'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}

            <PhotoGalleryModal
                isOpen={isPhotoGalleryOpen}
                onClose={() => setIsPhotoGalleryOpen(false)}
                localId={profile?.local_id || ''}
            />
        </div>
    );
}
