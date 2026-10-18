import { supabase } from '../lib/supabase';
import type { Species } from './types';
import { firstOrSelf } from '../types/db';

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
        const numericLocalId = filters.localId !== undefined && filters.localId !== null && String(filters.localId).trim() !== ''
            ? Number(filters.localId)
            : null;

        // Map response to match Species type (inferência Supabase)
        const mappedData: Species[] = (data ?? []).map(item => {
            const especieLocalFiltered = numericLocalId !== null && item.especie_local
                ? item.especie_local.filter(el => el.local_id !== null && el.local_id !== undefined && el.local_id === numericLocalId)
                : item.especie_local;

            return {
                ...item,
                familia: firstOrSelf(item.familia),
                especie_local: especieLocalFiltered
            };
        });

        return mappedData;
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
        const numericLocalId = localId !== undefined && localId !== null && String(localId).trim() !== ''
            ? Number(localId)
            : null;

        const especieLocalFiltered = numericLocalId !== null && data.especie_local
            ? data.especie_local.filter(el => el.local_id !== null && el.local_id !== undefined && el.local_id === numericLocalId)
            : data.especie_local;

        const mappedData: Species = {
            ...data,
            familia: firstOrSelf(data.familia),
            especie_local: especieLocalFiltered
        };

        return mappedData;
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
        return {
            ...data,
            familia: firstOrSelf(data.familia)
        };
    }
};

