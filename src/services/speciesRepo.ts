import { supabase } from '../lib/supabase';
import type { Species } from './types';

interface SpeciesRawRow extends Omit<Species, 'familia'> {
  familia?: { id?: string | number; familia_nome: string } | { id?: string | number; familia_nome: string }[] | null;
}

export interface SpecimenThumbnail {
  id: string;
  url_imagem: string;
  url_thumbnail: string | null;
  url_micro: string | null;
}

export const speciesRepo = {
    /**
     * List species with optional filtering
     */
    async listSpecies(filters: { search?: string; limit?: number; localId?: string | number | null } = {}) {
        let query = supabase
            .from('especie')
            .select(`
                id,
                nome_cientifico,
                nome_popular,
                familia:familia_id(id, familia_nome),
                imagens(url_imagem, url_thumbnail, url_micro),
                especie_local(
                    local_id,
                    imagens(url_micro, url_thumbnail, url_imagem)
                )
            `)
            .order('nome_cientifico');

        if (filters.search) {
            query = query.ilike('nome_cientifico', `%${filters.search}%`);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Contexto de local: quando filters.localId estiver preenchido, filtramos no front-end
        // para considerar apenas espécimes daquele local (o filtro no join aninhado do PostgREST
        // excluiria a espécie caso ela não tivesse espécimes no local em questão).
        const targetLocalId = filters.localId !== undefined && filters.localId !== null && String(filters.localId).trim() !== ''
            ? String(filters.localId)
            : null;

        // Map response to match Species type (Supabase might return arrays for joins)
        const mappedData = (data as unknown as SpeciesRawRow[]).map(item => {
            const especieLocalFiltered = targetLocalId && item.especie_local
                ? item.especie_local.filter(el => el.local_id !== null && el.local_id !== undefined && String(el.local_id) === targetLocalId)
                : item.especie_local;

            return {
                ...item,
                familia: Array.isArray(item.familia) ? item.familia[0] : item.familia,
                especie_local: especieLocalFiltered
            };
        });

        return mappedData as Species[];
    },

    /**
     * Get a single species by ID
     */
    async getSpeciesById(id: string, localId?: string | number | null) {
        const { data, error } = await supabase
            .from('especie')
            .select(`
                *,
                familia:familia_id(id, familia_nome),
                imagens(url_imagem, url_thumbnail, url_micro),
                especie_local(
                    local_id,
                    imagens(url_micro, url_thumbnail, url_imagem)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Contexto de local: filtrar espécimes do local se especificado
        const targetLocalId = localId !== undefined && localId !== null && String(localId).trim() !== ''
            ? String(localId)
            : null;

        const rawItem = data as unknown as SpeciesRawRow;
        const especieLocalFiltered = targetLocalId && rawItem.especie_local
            ? rawItem.especie_local.filter(el => el.local_id !== null && el.local_id !== undefined && String(el.local_id) === targetLocalId)
            : rawItem.especie_local;

        const mappedData = {
            ...data,
            familia: Array.isArray(data.familia) ? data.familia[0] : data.familia,
            especie_local: especieLocalFiltered
        };

        return mappedData as Species;
    },

    /**
     * Get specimen images (Tipo B) for a specific species within a local/project.
     */
    async getSpecimenThumbnailsBySpeciesAndLocal(
        speciesId: string,
        localId: string | number
    ): Promise<SpecimenThumbnail[]> {
        try {
            const numericLocalId = typeof localId === 'string' ? parseInt(localId, 10) : localId;
            const { data: specimens, error: specError } = await supabase
                .from('especie_local')
                .select('id')
                .eq('especie_id', speciesId)
                .eq('local_id', numericLocalId);

            if (specError) throw specError;
            if (!specimens || specimens.length === 0) return [];

            const specimenIds = specimens.map((s) => s.id);
            const { data: images, error: imgError } = await supabase
                .from('imagens')
                .select('id, url_imagem, url_thumbnail, url_micro')
                .in('especime_id', specimenIds)
                .not('especime_id', 'is', null);

            if (imgError) throw imgError;
            return (images || []) as SpecimenThumbnail[];
        } catch (err) {
            console.warn('Erro ao carregar miniaturas dos espécimes no local:', err);
            return [];
        }
    },

    /**
     * Get full species data for editing in modals
     */
    async getFullSpeciesForEdit(id: string): Promise<Species> {
        const { data, error } = await supabase
            .from('especie')
            .select('*, familia(familia_nome), imagens(url_imagem, local_id)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Species;
    }
};

