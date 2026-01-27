import { supabase } from '../lib/supabase';
import type { Species } from './types';

export const speciesRepo = {
    /**
     * List species with optional filtering
     */
    async listSpecies(filters: { search?: string, limit?: number } = {}) {
        let query = supabase
            .from('especie')
            .select(`
                id,
                nome_cientifico,
                nome_popular,
                familia:familia_id(id, familia_nome),
                imagens(url_imagem)
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

        // Map response to match Species type (Supabase might return arrays for joins)
        const mappedData = (data as any[]).map(item => ({
            ...item,
            familia: Array.isArray(item.familia) ? item.familia[0] : item.familia
        }));

        return mappedData as Species[];
    },

    /**
     * Get a single species by ID
     */
    async getSpeciesById(id: string) {
        const { data, error } = await supabase
            .from('especie')
            .select(`
                *,
                familia:familia_id(id, familia_nome),
                imagens(url_imagem)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        const mappedData = {
            ...data,
            familia: Array.isArray(data.familia) ? data.familia[0] : data.familia
        };

        return mappedData as Species;
    }
};
