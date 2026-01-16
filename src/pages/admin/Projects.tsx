/**
 * Projects Page - Refactored version using extracted hooks and components.
 * 
 * Original: 1037 lines
 * Refactored: ~250 lines
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/Dashboard/StatCard';
import { ProjectsGrid } from '../../components/Cards';
import { ProjectFormModal } from '../../components/Modals/ProjectFormModal';
import { ConfirmDeleteModal } from '../../components/Modals/ConfirmDeleteModal';
import { useProjects, useProjectActions } from '../../hooks';
import { MapPin, Crown, Search, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function Projects() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    // Data fetching hook
    const { projects, loading, stats, refetch } = useProjects();

    // Actions hook
    const actions = useProjectActions({
        profile: profile as any,
        onSuccess: refetch
    });

    // Filter projects by search
    const filteredProjects = projects.filter(p =>
        p.nome.toLowerCase().includes(search.toLowerCase())
    );

    // Access check
    if (!actions.isGlobalAdmin) {
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

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Toast */}
            {actions.toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-top duration-300 ${actions.toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {actions.toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {actions.toast.message}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Projetos</h1>
                <p className="text-gray-500">Locais e instituições vinculados.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                    title="Total de Projetos"
                    value={stats.total}
                    icon={MapPin}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Top Projeto (+ Espécies)"
                    value={loading ? "..." : (stats.topProject ? `${stats.topProject.name} (${stats.topProject.count})` : '-')}
                    icon={Crown}
                    color="amber"
                    loading={loading}
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar projeto..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => actions.setIsNewModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto"
                >
                    <Plus size={18} />
                    <span>Novo Projeto</span>
                </button>
            </div>

            {/* Projects Grid */}
            <ProjectsGrid
                projects={filteredProjects}
                loading={loading}
                onProjectClick={(project) => navigate(`/projects/${project.id}`)}
                onEdit={actions.handleEditProject}
                onDelete={actions.openDeleteModal}
                onGenerateReport={actions.handleGenerateReport}
            />

            {/* New Project Modal */}
            <ProjectFormModal
                isOpen={actions.isNewModalOpen}
                onClose={() => {
                    actions.setIsNewModalOpen(false);
                    actions.resetNewForm();
                }}
                onSubmit={actions.handleCreateProject}
                loading={actions.newProjectLoading}
                title="Novo Projeto"
                formData={actions.formData}
                setFormData={actions.setFormData}
                imagePreview={actions.imagePreview}
                onImageChange={actions.handleImageChange}
            />

            {/* Edit Project Modal */}
            <ProjectFormModal
                isOpen={actions.isEditModalOpen}
                onClose={actions.closeEditModal}
                onSubmit={actions.handleSaveEdit}
                loading={actions.editLoading}
                title="Editar Projeto"
                formData={actions.editFormData}
                setFormData={actions.setEditFormData}
                imagePreview={actions.editImagePreview}
                onImageChange={actions.handleEditImageChange}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={actions.isDeleteModalOpen}
                onClose={actions.closeDeleteModal}
                onConfirm={actions.confirmDelete}
                title="Excluir Projeto?"
                itemName={actions.projectToDelete?.nome || ''}
                loading={actions.deleteLoading}
            />
        </div>
    );
}
