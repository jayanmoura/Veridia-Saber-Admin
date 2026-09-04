import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Interface matching the 'especime' VIEW
import type { Specimen } from '../types/domain';

export interface SpecimenFormData {
    local_id?: string; // Optional for global create
    institution_id?: string; // Add institution_id
    especie_id: string;
    latitude: string;
    longitude: string;
    detalhes_localizacao: string;
    descricao_ocorrencia: string;
    coletor: string;
    numero_coletor: string;
    determinador: string;
    data_determinacao: string;
}

const INITIAL_FORM: SpecimenFormData = {
    especie_id: '',
    latitude: '',
    longitude: '',
    detalhes_localizacao: '',
    descricao_ocorrencia: '',
    coletor: '',
    numero_coletor: '',
    determinador: '',
    data_determinacao: '',
};

interface UseSpecimensOptions {
    projectId?: string; // local_id
    enabled?: boolean;
}

/**
 * @description Hook para gerenciamento e busca de espécimes, operando operações atreladas especificamente a um projeto (local_id).
 *
 * @param {UseSpecimensOptions} options - Objeto de config
 * @param {string} [options.projectId] - Escopo base de projeto (obriga eq(local_id, projectId))
 * @param {boolean} [options.enabled] - Gate central para pausar query automático
 *
 * @returns {object} Controladores do espécime:
 *   - `specimens` — rows populadas da query view
 *   - `loading` — booleano fetch view
 *   - `error` — mensagens query
 *   - `refetch` — manual pull call
 *   - Form & Modais: `isModalOpen`, `setIsModalOpen`, `editingSpecimen`, `formData`
 *   - Handlers CRUD: `openNewModal`, `openEditModal`, `handleSave`, `handleDelete`
 *   - `actionLoading` — bool de wait de submit e deletes
 *
 * @example
 * const { specimens, handleSave, openNewModal } = useSpecimens({ projectId: '50', enabled: true })
 */
export function useSpecimens({ projectId, enabled = true }: UseSpecimensOptions) {
    const [specimens, setSpecimens] = useState<Specimen[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // CRUD States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecimen, setEditingSpecimen] = useState<Specimen | null>(null);
    const [formData, setFormData] = useState<SpecimenFormData>(INITIAL_FORM);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchSpecimens = useCallback(async () => {
        if (!enabled || !projectId) return;

        setLoading(true);
        try {
            // Read from the TABLE 'especie_local' to get new columns like tombo_codigo
            // We join with 'especie' to get scientific name if the view doesn't expose it directly as text yet
            // Wait, standard supa-query on view works too.
            // Let's assume we need to join especie manually for the name unless view has it.
            // The view definition in schema: id, especie_id, local_id...
            // So we fetch from view and join especie.

            const { data, error } = await supabase
                .from('especie_local')
                .select(`
                    *,
                    especie:especie_id(nome_cientifico, familia:familia_id(familia_nome)),
                    imagens:imagens!imagens_especime_id_fkey(url_micro, url_thumbnail, url_imagem)
                `)
                .eq('local_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted: Specimen[] = (data || []).map((item: any) => ({
                ...item,
                tombo_codigo: item.tombo_codigo, // Ensure it's mapped
                nome_cientifico: item.especie?.nome_cientifico,
                familia_nome: item.especie?.familia?.familia_nome,
                url_imagem: item.imagens?.[0]?.url_micro
                    || item.imagens?.[0]?.url_thumbnail
                    || item.imagens?.[0]?.url_imagem
            }));

            setSpecimens(formatted);
        } catch (err: any) {
            console.error('Error fetching specimens:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, enabled]);

    useEffect(() => {
        fetchSpecimens();
    }, [fetchSpecimens]);

    // Handle Form
    const resetForm = () => {
        setFormData(INITIAL_FORM);
        setEditingSpecimen(null);
    };

    const openNewModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (specimen: Specimen) => {
        setEditingSpecimen(specimen);
        setFormData({
            especie_id: specimen.especie_id,
            latitude: specimen.latitude?.toString() || '',
            longitude: specimen.longitude?.toString() || '',
            detalhes_localizacao: specimen.detalhes_localizacao || '',
            descricao_ocorrencia: specimen.descricao_ocorrencia || '',
            coletor: specimen.coletor || '',
            numero_coletor: specimen.numero_coletor || '',
            determinador: specimen.determinador || '',
            data_determinacao: specimen.data_determinacao || '',
        });
        setIsModalOpen(true);
    };

    const handleSave = async (profileId: string, institutionId: string): Promise<number | null> => {
        if (!projectId) return null;
        setActionLoading(true);
        try {
            const payload = {
                especie_id: formData.especie_id,
                local_id: Number(projectId),
                institution_id: institutionId,
                created_by: profileId,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                detalhes_localizacao: formData.detalhes_localizacao || null,
                descricao_ocorrencia: formData.descricao_ocorrencia || null,
                coletor: formData.coletor || null,
                numero_coletor: formData.numero_coletor || null,
                determinador: formData.determinador || null,
                data_determinacao: formData.data_determinacao || null,
            };

            let savedId: number | null = null;

            if (editingSpecimen) {
                // UPDATE table especie_local
                const { error } = await supabase
                    .from('especie_local')
                    .update(payload)
                    .eq('id', editingSpecimen.id);
                if (error) throw error;
                savedId = Number(editingSpecimen.id);
            } else {
                // INSERT into table especie_local
                const { data, error } = await supabase
                    .from('especie_local')
                    .insert(payload)
                    .select('id')
                    .single();
                if (error) throw error;
                savedId = data.id;
            }

            fetchSpecimens(); // Refresh list
            return savedId;
        } catch (err: any) {
            console.error('Error saving specimen:', err);
            // throw new Error(err.message || 'Erro ao salvar espécime.');
            return null;
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('especie_local')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchSpecimens();
        } catch (err: any) {
            console.error('Error deleting specimen:', err);
            // Optional: handle error state
        } finally {
            setActionLoading(false);
        }
    };

    return {
        specimens,
        loading,
        error,
        refetch: fetchSpecimens,
        // Modal & Form logic
        isModalOpen,
        setIsModalOpen,
        formData,
        setFormData,
        openNewModal,
        openEditModal,
        actionLoading,
        handleSave,
        handleDelete,
        editingSpecimen
    };
}
