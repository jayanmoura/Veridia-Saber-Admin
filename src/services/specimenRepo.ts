import { supabase } from '../lib/supabase';
import type { Specimen, SpecimenFilters } from './types';

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
                    imagens(url_imagem)
                ),
                locais:local_id (
                    id,
                    nome,
                    latitude,
                    longitude,
                    institution_id
                ),
                imagens:imagens!imagens_especime_id_fkey(url_imagem)
            `);

        if (filters.localId) {
            query = query.eq('local_id', filters.localId);
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
    async createSpecimen(payload: Partial<Specimen>) {
        const { data, error } = await supabase
            .from('especie_local')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a specimen (Writes to 'especie_local' TABLE)
     */
    async updateSpecimen(id: number, payload: Partial<Specimen>) {
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
        // 1. Get all images associated with this specimen from the database
        const { data: images } = await supabase
            .from('imagens')
            .select('url_imagem')
            .eq('especime_id', id);

        console.log('[DeleteSpecimen] Found images in DB:', images);

        if (images && images.length > 0) {
            try {
                // 2. Extract paths from URLs
                // URL format example: .../arquivos-gerais/locais/123/especimes/456/image.jpg
                const pathsToDelete = images
                    .map(img => {
                        const match = img.url_imagem.match(/\/arquivos-gerais\/(.+)$/);
                        return match ? match[1] : null;
                    })
                    .filter((path): path is string => path !== null);

                console.log('[DeleteSpecimen] Paths to delete:', pathsToDelete);

                if (pathsToDelete.length > 0) {
                    // 3. Delete files from storage
                    const { data: removeData, error: storageError } = await supabase.storage
                        .from('arquivos-gerais')
                        .remove(pathsToDelete);

                    if (storageError) {
                        console.error('[DeleteSpecimen] Error deleting files from storage:', storageError);
                    } else {
                        console.log('[DeleteSpecimen] Storage remove result:', removeData);
                    }
                } else {
                    console.warn('[DeleteSpecimen] No paths extracted from URLs. Regex might be failing.');
                }
            } catch (err) {
                console.error('[DeleteSpecimen] Error cleaning up storage:', err);
                // Continue to delete record even if storage cleanup fails
            }

            // 4. Delete image records from database (if not identifying as cascade)
            // It's good practice to ensure they are gone.
            await supabase
                .from('imagens')
                .delete()
                .eq('especime_id', id);
        }

        // 5. Delete the specimen record
        const { error } = await supabase
            .from('especie_local')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
