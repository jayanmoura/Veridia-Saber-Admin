import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateHerbariumLabels } from '../utils/pdfGenerator';

interface Profile {
    id: string;
    role?: string;
    full_name?: string;
    institution_id?: string;
}

interface Project {
    id: string;
    nome: string;
    descricao: string | null;
    imagem_capa: string | null;
    tipo: string | null;
}

interface ProjectFormData {
    nome: string;
    tipo: string;
    cidade: string;
    estado: string;
    latitude: string;
    longitude: string;
    descricao: string;
}

const INITIAL_FORM: ProjectFormData = {
    nome: '',
    tipo: '',
    cidade: '',
    estado: '',
    latitude: '',
    longitude: '',
    descricao: ''
};

interface UseProjectActionsOptions {
    profile: Profile | null;
    onSuccess: () => void;
}

interface UseProjectActionsReturn {
    // Toast
    toast: { message: string; type: 'success' | 'error' } | null;
    showToast: (message: string, type?: 'success' | 'error') => void;

    // New Project Modal
    isNewModalOpen: boolean;
    newProjectLoading: boolean;
    formData: ProjectFormData;
    imageFile: File | null;
    imagePreview: string | null;
    setIsNewModalOpen: (open: boolean) => void;
    setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleCreateProject: () => Promise<void>;
    resetNewForm: () => void;

    // Edit Project Modal
    isEditModalOpen: boolean;
    editLoading: boolean;
    editFormData: ProjectFormData;
    editImageFile: File | null;
    editImagePreview: string | null;
    selectedProject: Project | null;
    setEditFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
    handleEditProject: (project: Project) => void;
    handleEditImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSaveEdit: () => Promise<void>;
    closeEditModal: () => void;

    // Delete
    isDeleteModalOpen: boolean;
    deleteLoading: boolean;
    projectToDelete: Project | null;
    openDeleteModal: (project: Project) => void;
    closeDeleteModal: () => void;
    confirmDelete: () => Promise<void>;

    // Report
    reportLoading: string | null;
    handleGenerateReport: (project: Project) => Promise<void>;

    // Permissions
    isGlobalAdmin: boolean;
}

export function useProjectActions({ profile, onSuccess }: UseProjectActionsOptions): UseProjectActionsReturn {
    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // New Project Modal
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [newProjectLoading, setNewProjectLoading] = useState(false);
    const [formData, setFormData] = useState<ProjectFormData>(INITIAL_FORM);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Edit Project Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editFormData, setEditFormData] = useState<ProjectFormData>(INITIAL_FORM);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Delete
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Report
    const [reportLoading, setReportLoading] = useState<string | null>(null);

    // Permissions
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const uploadProjectImage = async (file: File, projectId: string): Promise<string | null> => {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `locais/${projectId}/capa/${Date.now()}_${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
            .from('arquivos-gerais')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        const { data } = supabase.storage.from('arquivos-gerais').getPublicUrl(filePath);
        return data.publicUrl;
    };

    // Image handlers
    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Por favor, selecione apenas arquivos de imagem.', 'error');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    }, [showToast]);

    const handleEditImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Por favor, selecione apenas arquivos de imagem.', 'error');
                return;
            }
            setEditImageFile(file);
            setEditImagePreview(URL.createObjectURL(file));
        }
    }, [showToast]);

    // Reset form
    const resetNewForm = useCallback(() => {
        setFormData(INITIAL_FORM);
        setImageFile(null);
        setImagePreview(null);
    }, []);

    // Create project
    const handleCreateProject = useCallback(async () => {
        if (!formData.nome.trim() || !formData.tipo) {
            showToast('Nome e tipo são obrigatórios.', 'error');
            return;
        }

        setNewProjectLoading(true);
        try {
            const { data: newProject, error: insertError } = await supabase
                .from('locais')
                .insert({
                    nome: formData.nome.trim(),
                    descricao: formData.descricao.trim() || null,
                    tipo: formData.tipo,
                    cidade: formData.cidade.trim() || null,
                    estado: formData.estado.trim() || null,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    institution_id: profile?.institution_id || null,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (imageFile && newProject) {
                const imageUrl = await uploadProjectImage(imageFile, newProject.id);
                if (imageUrl) {
                    await supabase.from('locais').update({ imagem_capa: imageUrl }).eq('id', newProject.id);
                }
            }

            showToast('Projeto criado com sucesso!');
            setIsNewModalOpen(false);
            resetNewForm();
            onSuccess();
        } catch (error: any) {
            console.error('Create project error:', error);
            showToast(error.message || 'Erro ao criar projeto.', 'error');
        } finally {
            setNewProjectLoading(false);
        }
    }, [formData, imageFile, profile, showToast, resetNewForm, onSuccess]);

    // Edit project
    const handleEditProject = useCallback((project: Project) => {
        setSelectedProject(project);
        setEditFormData({
            nome: project.nome,
            tipo: project.tipo || '',
            cidade: (project as any).cidade || '',
            estado: (project as any).estado || '',
            latitude: (project as any).latitude?.toString() || '',
            longitude: (project as any).longitude?.toString() || '',
            descricao: project.descricao || ''
        });
        setEditImagePreview(project.imagem_capa);
        setEditImageFile(null);
        setIsEditModalOpen(true);
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!selectedProject) return;

        setEditLoading(true);
        try {
            let imageUrl = selectedProject.imagem_capa;

            if (editImageFile) {
                const newUrl = await uploadProjectImage(editImageFile, selectedProject.id);
                if (newUrl) imageUrl = newUrl;
            }

            const { error } = await supabase
                .from('locais')
                .update({
                    nome: editFormData.nome.trim(),
                    descricao: editFormData.descricao.trim() || null,
                    tipo: editFormData.tipo,
                    cidade: editFormData.cidade.trim() || null,
                    estado: editFormData.estado.trim() || null,
                    latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
                    longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null,
                    imagem_capa: imageUrl
                })
                .eq('id', selectedProject.id);

            if (error) throw error;

            showToast('Projeto atualizado com sucesso!');
            setIsEditModalOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error('Edit error:', error);
            showToast(error.message || 'Erro ao atualizar projeto.', 'error');
        } finally {
            setEditLoading(false);
        }
    }, [selectedProject, editFormData, editImageFile, showToast, onSuccess]);

    const closeEditModal = useCallback(() => {
        setIsEditModalOpen(false);
        setSelectedProject(null);
        setEditImageFile(null);
        setEditImagePreview(null);
    }, []);

    // Delete project
    const openDeleteModal = useCallback((project: Project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!projectToDelete) return;

        setDeleteLoading(true);
        try {
            // Delete all files in project folder
            const nukeFolder = async (path: string): Promise<void> => {
                const { data: items } = await supabase.storage.from('arquivos-gerais').list(path);
                if (!items) return;

                for (const item of items) {
                    const fullPath = `${path}/${item.name}`;
                    if (item.metadata) {
                        await supabase.storage.from('arquivos-gerais').remove([fullPath]);
                    } else {
                        await nukeFolder(fullPath);
                    }
                }
            };

            await nukeFolder(`locais/${projectToDelete.id}`);

            // Delete database records
            await supabase.from('imagens').delete().eq('local_id', projectToDelete.id);

            // Get especie_local IDs for this project
            const { data: especieLocalData } = await supabase
                .from('especie_local')
                .select('id')
                .eq('local_id', projectToDelete.id);

            if (especieLocalData && especieLocalData.length > 0) {
                const ids = especieLocalData.map(d => d.id);
                await supabase.from('etiquetas').delete().in('especie_local_id', ids);
            }

            await supabase.from('especie_local').delete().eq('local_id', projectToDelete.id);
            await supabase.from('especie').update({ local_id: null }).eq('local_id', projectToDelete.id);

            const { error } = await supabase.from('locais').delete().eq('id', projectToDelete.id);
            if (error) throw error;

            showToast('Projeto excluído com sucesso!');
            closeDeleteModal();
            onSuccess();
        } catch (error: any) {
            console.error('Delete error:', error);
            showToast(error.message || 'Erro ao excluir projeto.', 'error');
        } finally {
            setDeleteLoading(false);
        }
    }, [projectToDelete, showToast, closeDeleteModal, onSuccess]);

    // Generate report
    const handleGenerateReport = useCallback(async (project: Project) => {
        setReportLoading(project.id);
        try {
            const { data } = await supabase
                .from('especie')
                .select('nome_cientifico, autor, familia(familia_nome), especie_local!inner(detalhes_localizacao, determinador)')
                .eq('especie_local.local_id', project.id);

            if (!data || data.length === 0) {
                showToast('Nenhuma espécie encontrada neste projeto.', 'error');
                return;
            }

            const labels = data.map((sp: any) => ({
                scientificName: sp.nome_cientifico,
                author: sp.autor,
                family: sp.familia?.familia_nome || 'INDETERMINADA',
                location: project.nome,
                collector: 'Veridia Saber',
                date: new Date().toLocaleDateString('pt-BR'),
                determinant: sp.especie_local?.[0]?.determinador || 'Sistema Veridia',
                notes: sp.especie_local?.[0]?.detalhes_localizacao || ''
            }));

            generateHerbariumLabels(labels, `Etiquetas_${project.nome.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Report error:', error);
            showToast('Erro ao gerar relatório.', 'error');
        } finally {
            setReportLoading(null);
        }
    }, [showToast]);

    return {
        toast,
        showToast,
        isNewModalOpen,
        newProjectLoading,
        formData,
        imageFile,
        imagePreview,
        setIsNewModalOpen,
        setFormData,
        handleImageChange,
        handleCreateProject,
        resetNewForm,
        isEditModalOpen,
        editLoading,
        editFormData,
        editImageFile,
        editImagePreview,
        selectedProject,
        setEditFormData,
        handleEditProject,
        handleEditImageChange,
        handleSaveEdit,
        closeEditModal,
        isDeleteModalOpen,
        deleteLoading,
        projectToDelete,
        openDeleteModal,
        closeDeleteModal,
        confirmDelete,
        reportLoading,
        handleGenerateReport,
        isGlobalAdmin
    };
}
