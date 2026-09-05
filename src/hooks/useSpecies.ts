import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/authContext';

// ============ TYPES ============
import type { Species } from '../types/domain';

export interface FamilyOption {
    id: string;
    familia_nome: string;
}

export interface SpeciesStats {
    total: number;
    topGenus: { name: string; count: number } | null;
    missingImages: number;
}

export interface UseSpeciesOptions {
    page?: number;
    search?: string;
    familyId?: string;
    itemsPerPage?: number;
    enabled?: boolean;
}

export interface UseSpeciesReturn {
    species: Species[];
    families: FamilyOption[];
    loading: boolean;
    totalCount: number;
    stats: SpeciesStats;
    refetch: () => Promise<void>;
}

const DEFAULT_ITEMS_PER_PAGE = 20;

/**
 * @description Hook para buscar e gerenciar dados de espécies com paginação, filtros e cálculo de estatísticas (com controle de acesso baseado em role).
 *
 * @param {UseSpeciesOptions} [options] - Opções de paginação, busca e filtro por família.
 *
 * @returns {UseSpeciesReturn} Estado e funções para listagem de espécies:
 *   - `species` — lista de espécies carregadas
 *   - `families` — opções de famílias para filtro
 *   - `loading` — true enquanto a requisição principal está em andamento
 *   - `totalCount` — número total de espécies encontradas
 *   - `stats` — estatísticas gerais (total, top epíteto, imagens faltantes)
 *   - `refetch` — função para forçar o recarregamento dos dados
 *
 * @example
 * const { species, loading, totalCount, stats, refetch } = useSpecies({ page: 1, search: 'ficus' })
 */
export function useSpecies(options: UseSpeciesOptions = {}): UseSpeciesReturn {
    const { profile } = useAuth();
    const {
        page = 1,
        search = '',
        familyId = '',
        itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
        enabled = true
    } = options;

    const [species, setSpecies] = useState<Species[]>([]);
    const [families, setFamilies] = useState<FamilyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState<SpeciesStats>({
        total: 0,
        topGenus: null,
        missingImages: 0
    });

    // Calculate stats from global data (Top Genus) and global data (Missing Images)
    const calculateStats = useCallback((data: Species[], total: number, missingImagesGlobal: number, allNamesData?: any[]) => {
        const genusCounts: Record<string, number> = {};

        const dataToProcess = (allNamesData && allNamesData.length > 0) ? allNamesData : data;

        dataToProcess.forEach(s => {
            const parts = s.nome_cientifico?.trim().split(/\s+/) || [];
            if (parts.length >= 1) {
                let genus = parts[0].trim();
                if (genus) {
                    genus = genus.charAt(0).toUpperCase() + genus.slice(1).toLowerCase();
                    genusCounts[genus] = (genusCounts[genus] || 0) + 1;
                }
            }
        });

        let topGenus = null;
        let maxCount = 0;

        Object.entries(genusCounts).forEach(([name, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topGenus = { name, count };
            }
        });

        setStats({ total, missingImages: missingImagesGlobal, topGenus });
    }, []);

    // Fetch families for filter dropdown
    const fetchFamilies = useCallback(async () => {
        const { data } = await supabase
            .from('familia')
            .select('id, familia_nome')
            .order('familia_nome');
        if (data) setFamilies(data);
    }, []);

    // Main species fetch function
    const fetchSpecies = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        try {
            const from = (page - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const isGlobalAdmin = profile?.role === 'Curador Mestre' ||
                profile?.role === 'Coordenador Científico' ||
                profile?.role === 'Taxonomista Sênior';
            const userLocalId = profile?.local_id;

            let query;

            if (!isGlobalAdmin && userLocalId) {
                query = supabase
                    .from('especie')
                    .select(`
                        *,
                        familia (familia_nome),
                        imagens (url_imagem, url_thumbnail, local_id),
                        especie_local!inner (local_id, descricao_ocorrencia)
                    `, { count: 'exact' })
                    .eq('especie_local.local_id', userLocalId)
                    .order('nome_cientifico')
                    .range(from, to);
            } else {
                query = supabase
                    .from('especie')
                    .select(`
                        *,
                        familia (familia_nome),
                        imagens (url_imagem, url_thumbnail, local_id),
                        especie_local (local_id, descricao_ocorrencia)
                    `, { count: 'exact' })
                    .order('nome_cientifico')
                    .range(from, to);
            }

            if (search) {
                query = query.ilike('nome_cientifico', `%${search}%`);
            }

            if (familyId) {
                query = query.eq('familia_id', familyId);
            }


            // 2. Fetch species with images count (Global/Filtered)
            // We want to count how many species in total (matching filters) HAVE images, then subtract from totalCount.
            let countWithImages = 0;
            let imgQuery;

            if (!isGlobalAdmin && userLocalId) {
                // Local Admin: Filter by species in local AND images in local
                imgQuery = supabase
                    .from('especie')
                    .select('id, especie_local!inner(local_id), imagens!inner(local_id)', { count: 'exact', head: true })
                    .eq('especie_local.local_id', userLocalId)
                    .eq('imagens.local_id', userLocalId);
            } else {
                // Global Admin: Filter by existence of images
                imgQuery = supabase
                    .from('especie')
                    .select('id, imagens!inner(id)', { count: 'exact', head: true });
            }

            if (search) {
                imgQuery = imgQuery.ilike('nome_cientifico', `%${search}%`);
            }
            if (familyId) {
                imgQuery = imgQuery.eq('familia_id', familyId);
            }

            // 3. Fetch ALL species names to calculate Top Genus accurately across the database
            let allNamesQuery;
            if (!isGlobalAdmin && userLocalId) {
                allNamesQuery = supabase
                    .from('especie')
                    .select('nome_cientifico, especie_local!inner(local_id)')
                    .eq('especie_local.local_id', userLocalId);
            } else {
                allNamesQuery = supabase
                    .from('especie')
                    .select('nome_cientifico');
            }

            if (search) {
                allNamesQuery = allNamesQuery.ilike('nome_cientifico', `%${search}%`);
            }
            if (familyId) {
                allNamesQuery = allNamesQuery.eq('familia_id', familyId);
            }

            // execute parallel
            const [mainResult, imgResult, allNamesResult] = await Promise.all([query, imgQuery, allNamesQuery]);

            const { data, error, count } = mainResult;
            if (error) throw error;

            countWithImages = imgResult.count || 0;
            const globalMissingImages = (count || 0) - countWithImages;

            // Fetch overrides for local user context
            const overrideMap = new Map<string, string>();
            if (!isGlobalAdmin && userLocalId && data && data.length > 0) {
                const speciesIds = data.map((s: any) => s.id);
                const { data: overrides } = await supabase
                    .from('especie_local_overrides')
                    .select('especie_id, descricao_especie')
                    .in('especie_id', speciesIds)
                    .eq('local_id', userLocalId);

                if (overrides && overrides.length > 0) {
                    overrides.forEach((o: any) => {
                        if (o.descricao_especie !== null && o.descricao_especie !== undefined) {
                            overrideMap.set(o.especie_id, o.descricao_especie);
                        }
                    });
                }
            }

            // Filter images by local_id for non-global admins (View logic) and apply overrides
            const formattedData: Species[] = (data || []).map((item: any) => {
                let filteredImages = item.imagens || [];

                if (!isGlobalAdmin && userLocalId && filteredImages.length > 0) {
                    filteredImages = filteredImages.filter((img: any) =>
                        img.local_id === userLocalId || img.local_id === String(userLocalId) || img.local_id === null
                    );
                }

                const effectiveDescricao = overrideMap.get(item.id) ?? item.descricao_especie;

                return { ...item, descricao_especie: effectiveDescricao, imagens: filteredImages };
            });

            setSpecies(formattedData);
            setTotalCount(count || 0);
            calculateStats(formattedData, count || 0, globalMissingImages, allNamesResult.data || []);

        } catch (error) {
            console.error('Error fetching species:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, familyId, itemsPerPage, profile, enabled, calculateStats]);

    // Initial load
    useEffect(() => {
        fetchFamilies();
    }, [fetchFamilies]);

    // Refetch on dependencies change
    useEffect(() => {
        fetchSpecies();
    }, [fetchSpecies]);

    return {
        species,
        families,
        loading,
        totalCount,
        stats,
        refetch: fetchSpecies
    };
}
