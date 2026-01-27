import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateFamiliesReportWithChart, generateFamilyReportWithCharts } from '../utils/pdfGenerator';

interface Profile {
    id: string;
    role?: string;
    full_name?: string;
}

interface Family {
    id: string;
    familia_nome: string;
    imagem_referencia: string | null;
    quantidade_especies?: number;
}

interface UseFamilyActionsOptions {
    profile: Profile | null;
    onSuccess: () => void;
    onPendingRefetch?: () => void;
}

interface UseFamilyActionsReturn {
    // Loading states
    exportLoading: boolean;
    reportLoading: string | null;
    deleteLoading: string | null;
    approveLoading: string | null;

    // Delete modal
    isDeleteModalOpen: boolean;
    familyToDelete: Family | null;
    openDeleteModal: (family: Family) => void;
    closeDeleteModal: () => void;
    confirmDelete: () => Promise<void>;

    // Block modal (FK violation)
    showBlockModal: boolean;
    blockedFamilyName: string;
    closeBlockModal: () => void;

    // Success modal
    showSuccessModal: boolean;
    deletedFamilyName: string;
    closeSuccessModal: () => void;

    // Actions
    handleExportAll: () => Promise<void>;
    generateFamilyReport: (family: Family) => Promise<void>;
    handleApproveFamily: (pendingName: string) => Promise<void>;

    // Permissions
    isGlobalAdmin: boolean;
    canGenerateReports: boolean;
}

export function useFamilyActions({ profile, onSuccess, onPendingRefetch }: UseFamilyActionsOptions): UseFamilyActionsReturn {
    // Loading states
    const [exportLoading, setExportLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [approveLoading, setApproveLoading] = useState<string | null>(null);

    // Delete modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null);

    // Block modal
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockedFamilyName, setBlockedFamilyName] = useState('');

    // Success modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deletedFamilyName, setDeletedFamilyName] = useState('');

    // Permissions
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico' || profile?.role === 'Taxonomista Sênior';
    const canGenerateReports = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    const openDeleteModal = useCallback((family: Family) => {
        setFamilyToDelete(family);
        setIsDeleteModalOpen(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
        setFamilyToDelete(null);
    }, []);

    const closeBlockModal = useCallback(() => setShowBlockModal(false), []);
    const closeSuccessModal = useCallback(() => setShowSuccessModal(false), []);

    // Helper: Extract storage path from public URL
    const extractStoragePath = (publicUrl: string): string | null => {
        try {
            const match = publicUrl.match(/\/imagens-plantas\/(.+)$/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    // Export all families to PDF
    const handleExportAll = useCallback(async () => {
        setExportLoading(true);
        try {
            const { data: allFamilies, error } = await supabase
                .from('familia')
                .select('familia_nome, autoria_taxonomica, created_at, especie(count)')
                .order('familia_nome');

            if (error) throw error;

            const reportData = (allFamilies || []).map((f: any) => ({
                name: f.familia_nome,
                autoria_taxonomica: f.autoria_taxonomica,
                count: f.especie?.[0]?.count || 0,
                createdAt: f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : '-'
            }));

            generateFamiliesReportWithChart(reportData, 'relatorio_familias_geral.pdf', {
                userName: profile?.full_name || 'Sistema'
            });
        } catch (error) {
            console.error('Export error:', error);
            alert('Erro ao exportar relatório.');
        } finally {
            setExportLoading(false);
        }
    }, []);

    // Generate individual family report
    const generateFamilyReport = useCallback(async (family: Family) => {
        setReportLoading(family.id);
        try {
            const { data: species, error } = await supabase
                .from('especie')
                .select('nome_cientifico, nome_popular')
                .eq('familia_id', family.id)
                .order('nome_cientifico');

            if (error) throw error;

            // Fetch full family details
            const { data: fullFamily } = await supabase
                .from('familia')
                .select('*')
                .eq('id', family.id)
                .single();

            // Fetch legacy names
            const { data: legacyNames } = await supabase
                .from('familia_nomenclatura_legado')
                .select('*')
                .eq('familia_id', family.id)
                .order('nome_legado');

            if (error) throw error;

            const safeName = family.familia_nome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

            generateFamilyReportWithCharts(
                {
                    ...family,
                    autoria_taxonomica: fullFamily?.autoria_taxonomica,
                    fonte_referencia: fullFamily?.fonte_referencia,
                    link_referencia: fullFamily?.link_referencia,
                    created_at: fullFamily?.created_at,
                    created_by_name: fullFamily?.created_by_name
                },
                species || [],
                legacyNames || [],
                `relatorio_${safeName}.pdf`
            );
        } catch (error) {
            console.error('Report error:', error);
            alert('Erro ao gerar relatório.');
        } finally {
            setReportLoading(null);
        }
    }, []);

    // Delete family
    const confirmDelete = useCallback(async () => {
        if (!familyToDelete) return;

        const familyName = familyToDelete.familia_nome;
        setDeleteLoading(familyToDelete.id);
        closeDeleteModal();

        try {
            // Delete image from storage if exists
            if (familyToDelete.imagem_referencia) {
                const storagePath = extractStoragePath(familyToDelete.imagem_referencia);
                if (storagePath) {
                    await supabase.storage.from('imagens-plantas').remove([storagePath]);
                }
            }

            // Delete family
            const { error } = await supabase
                .from('familia')
                .delete()
                .eq('id', familyToDelete.id);

            if (error) {
                if (error.code === '23503') {
                    setBlockedFamilyName(familyName);
                    setShowBlockModal(true);
                    return;
                }
                throw error;
            }

            // Log action
            await supabase.from('audit_log').insert({
                action: 'DELETE_FAMILY',
                entity_type: 'familia',
                entity_id: familyToDelete.id,
                details: { familia_nome: familyName },
                user_id: profile?.id,
                user_name: profile?.full_name || 'Sistema'
            });

            setDeletedFamilyName(familyName);
            setShowSuccessModal(true);
            onSuccess();
        } catch (error: any) {
            console.error('Delete error:', error);
            if (error.code === '23503') {
                setBlockedFamilyName(familyName);
                setShowBlockModal(true);
            } else {
                alert(error.message || 'Erro ao excluir família.');
            }
        } finally {
            setDeleteLoading(null);
        }
    }, [familyToDelete, profile, closeDeleteModal, onSuccess]);

    // Approve pending family
    const handleApproveFamily = useCallback(async (pendingName: string) => {
        setApproveLoading(pendingName);
        try {
            // Check if already exists
            const { data: existing } = await supabase
                .from('familia')
                .select('id')
                .eq('familia_nome', pendingName)
                .maybeSingle();

            if (existing) {
                alert(`Família "${pendingName}" já existe no catálogo oficial.`);
                return;
            }

            // Create official family
            const { error: insertErr } = await supabase
                .from('familia')
                .insert({
                    familia_nome: pendingName,
                    created_by: profile?.id
                });

            if (insertErr) throw insertErr;

            // Delete from pending
            await supabase
                .from('pending_families')
                .delete()
                .eq('familia_nome', pendingName);

            alert(`Família "${pendingName}" aprovada com sucesso!`);
            onSuccess();
            onPendingRefetch?.();
        } catch (err: any) {
            console.error('Approve error:', err);
            alert('Erro ao aprovar família: ' + err.message);
        } finally {
            setApproveLoading(null);
        }
    }, [profile, onSuccess, onPendingRefetch]);

    return {
        exportLoading,
        reportLoading,
        deleteLoading,
        approveLoading,
        isDeleteModalOpen,
        familyToDelete,
        openDeleteModal,
        closeDeleteModal,
        confirmDelete,
        showBlockModal,
        blockedFamilyName,
        closeBlockModal,
        showSuccessModal,
        deletedFamilyName,
        closeSuccessModal,
        handleExportAll,
        generateFamilyReport,
        handleApproveFamily,
        isGlobalAdmin,
        canGenerateReports
    };
}
