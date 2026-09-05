import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface FamilyLegacyName {
    id: string;
    familia_id: string;
    nome_legado: string;
    tipo: 'sinonimo' | 'nome_historico' | 'nome_alternativo';
    fonte: string | null;
    observacao: string | null;
    created_at: string;
}

interface UseFamilyLegacyNamesReturn {
    legacyNames: FamilyLegacyName[];
    loading: boolean;
    error: string | null;
    addLegacyName: (data: Omit<FamilyLegacyName, 'id' | 'created_at' | 'familia_id'>) => Promise<void>;
    updateLegacyName: (id: string, data: Partial<Omit<FamilyLegacyName, 'id' | 'created_at' | 'familia_id'>>) => Promise<void>;
    removeLegacyName: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

/**
 * @description Hook responsável pelo CRUD de nomenclaturas históricas/legadas (sinônimos) vinculadas a uma família em específico.
 *
 * @param {string | undefined} familiaId - ID canônico da família para o qual buscar/salvar as nomenclaturas.
 *
 * @returns {UseFamilyLegacyNamesReturn} Retorna os nomes e métodos manipuladores:
 *   - `legacyNames` — arrays dos sinônimos ativos
 *   - `loading` / `error` — estados da tabela
 *   - `addLegacyName`, `updateLegacyName`, `removeLegacyName` — mutadores diretos com validação custom unique
 *
 * @example
 * const { legacyNames, addLegacyName } = useFamilyLegacyNames('uuid-familia')
 */
export function useFamilyLegacyNames(familiaId: string | undefined): UseFamilyLegacyNamesReturn {
    const [legacyNames, setLegacyNames] = useState<FamilyLegacyName[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLegacyNames = useCallback(async () => {
        if (!familiaId) return;

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('familia_nomenclatura_legado')
                .select('*')
                .eq('familia_id', familiaId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLegacyNames(data || []);
        } catch (err) {
            console.error('Error fetching legacy names:', err);
            const error = err as { message?: string };
            setError(error.message || 'Erro ao carregar nomenclaturas legadas.');
        } finally {
            setLoading(false);
        }
    }, [familiaId]);

    useEffect(() => {
        if (familiaId) {
            fetchLegacyNames();
        } else {
            setLegacyNames([]);
        }
    }, [familiaId, fetchLegacyNames]);

    const addLegacyName = async (data: Omit<FamilyLegacyName, 'id' | 'created_at' | 'familia_id'>) => {
        if (!familiaId) return;

        const normalizedName = data.nome_legado.trim();
        if (!normalizedName) {
            throw new Error("O nome legado é obrigatório.");
        }

        // Local duplicate check (case-insensitive)
        const exists = legacyNames.some(
            item => item.nome_legado.trim().toLowerCase() === normalizedName.toLowerCase()
        );
        if (exists) {
            throw new Error("Esse nome legado já está cadastrado para esta família.");
        }

        try {
            const { error } = await supabase
                .from('familia_nomenclatura_legado')
                .insert([{
                    ...data,
                    nome_legado: normalizedName,
                    familia_id: familiaId
                }]);

            if (error) {
                // Postgrest Error 23505: unique_violation
                if (error.code === '23505') {
                    throw new Error("Esse nome legado já está cadastrado para esta família.");
                }
                throw error;
            }
            await fetchLegacyNames();
        } catch (err) {
            console.error('Error adding legacy name:', err);
            throw err;
        }
    };

    const updateLegacyName = async (id: string, data: Partial<Omit<FamilyLegacyName, 'id' | 'created_at' | 'familia_id'>>) => {
        const normalizedName = data.nome_legado?.trim();

        // Validation for name update
        if (data.nome_legado !== undefined) {
            if (!normalizedName) {
                throw new Error("O nome legado não pode ser vazio.");
            }

            // Check duplicate ignoring self
            const exists = legacyNames.some(
                item => item.id !== id &&
                    item.nome_legado.trim().toLowerCase() === normalizedName.toLowerCase()
            );
            if (exists) {
                throw new Error("Esse nome legado já está cadastrado para esta família.");
            }
        }

        const updates = { ...data };
        if (updates.nome_legado) {
            updates.nome_legado = normalizedName;
        }

        try {
            const { error } = await supabase
                .from('familia_nomenclatura_legado')
                .update(updates)
                .eq('id', id);

            if (error) {
                if (error.code === '23505') {
                    throw new Error("Esse nome legado já está cadastrado para esta família.");
                }
                throw error;
            }
            await fetchLegacyNames();
        } catch (err) {
            console.error('Error updating legacy name:', err);
            throw err;
        }
    };

    const removeLegacyName = async (id: string) => {
        try {
            const { error } = await supabase
                .from('familia_nomenclatura_legado')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchLegacyNames();
        } catch (err) {
            console.error('Error removing legacy name:', err);
            throw err;
        }
    };

    return {
        legacyNames,
        loading,
        error,
        addLegacyName,
        updateLegacyName,
        removeLegacyName,
        refetch: fetchLegacyNames
    };
}
