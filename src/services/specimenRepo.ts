import { supabase } from '../lib/supabase';
import type { SpecimenFilters } from './types';
import type { Specimen } from '../types/domain';
import type { EspecieLocalInsert } from '../types/db';
import type { TablesInsert, TablesUpdate } from '../types/database.types';
import { deleteFolder, deleteImageVariants } from '../utils/storage';

export function unwrapJoin<T>(value: T | T[] | null): T | null {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

export const specimenRepo = {
    /**
     * List specimens using the 'especime' VIEW (Read Model)
     */
    async listSpecimens(filters: SpecimenFilters = {}) {
        let query = supabase
            .from('especie_local')
            .select(`
                *,
                especie:especie_id (
                    id,
                    nome_cientifico,
                    autor,
                    nome_popular,
                    familia:familia_id(id, familia_nome),
                    imagens(url_imagem, url_thumbnail)
                ),
                locais:local_id (
                    id,
                    nome,
                    latitude,
                    longitude,
                    institution_id
                ),
                imagens:imagens!imagens_especime_id_fkey(url_micro, url_thumbnail, url_imagem)
            `)
            .limit(1, { foreignTable: 'imagens' });

        if (filters.localId) {
            query = query.eq('local_id', Number(filters.localId));
        }

        if (filters.especieId) {
            query = query.eq('especie_id', filters.especieId);
        }

        if (filters.withCoordinates) {
            query = query.not('latitude', 'is', null).not('longitude', 'is', null);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Specimen[];
    },

    /**
     * Create a specimen (Writes to 'especie_local' TABLE)
     */
    async createSpecimen(payload: EspecieLocalInsert) {
        const { data, error } = await supabase
            .from('especie_local')
            .insert(payload as TablesInsert<'especie_local'>) // codigo_vs/tombo preenchidos por trigger no banco
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a specimen (Writes to 'especie_local' TABLE)
     */
    async updateSpecimen(id: number, payload: TablesUpdate<'especie_local'>) {
        const { data, error } = await supabase
            .from('especie_local')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a specimen
     */
    async deleteSpecimen(id: number) {
        // 1. Obter o local_id do espécime
        const { data: specimen, error: specimenError } = await supabase
            .from('especie_local')
            .select('id, local_id')
            .eq('id', id)
            .single();

        if (specimenError) throw specimenError;

        // 2. Buscar as 3 colunas de imagens do espécime
        const { data: images, error: imagesError } = await supabase
            .from('imagens')
            .select('url_imagem, url_thumbnail, url_micro')
            .eq('especime_id', id);

        if (imagesError) throw imagesError;

        // 3. Storage SEMPRE antes do banco; erro no storage interrompe a exclusão
        if (images && images.length > 0) {
            const urls = images.flatMap((img) => [img.url_imagem, img.url_thumbnail, img.url_micro]);
            await deleteImageVariants(urls);
        }

        if (specimen?.local_id) {
            await deleteFolder('arquivos-gerais', `locais/${specimen.local_id}/especimes/${id}`);
        }

        // 4. Deletar registros no banco
        const { error: imgDelError } = await supabase
            .from('imagens')
            .delete()
            .eq('especime_id', id);

        if (imgDelError) throw imgDelError;

        const { error: elDelError } = await supabase
            .from('especie_local')
            .delete()
            .eq('id', id);

        if (elDelError) throw elDelError;
    }
};

