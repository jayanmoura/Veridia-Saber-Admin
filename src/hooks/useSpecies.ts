import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============ TYPES ============
export interface Species {
    id: string;
    nome_cientifico: string;
    autor?: string | null;
    nome_popular: string | null;
    familia_id: string;
    familia?: { familia_nome: string };
    imagens?: { url_imagem: string; local_id?: string | number | null }[];
    created_at?: string | null;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

export interface FamilyOption {
    id: string;
    familia_nome: string;
}

export interface SpeciesStats {
    total: number;
    topEpithet: { name: string; count: number } | null;
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
 * Hook for fetching and managing species data with pagination and filtering.
 * Handles role-based access control for local vs global admins.
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
        topEpithet: null,
        missingImages: 0
    });

    // Calculate stats from current page data
    const calculateStats = useCallback((data: Species[], total: number) => {
        const missingImages = data.filter(s => !s.imagens || s.imagens.length === 0).length;
        const epithetCounts: Record<string, number> = {};

        data.forEach(s => {
            const parts = s.nome_cientifico?.trim().split(' ') || [];
            if (parts.length >= 2) {
                const epithet = parts[1].toLowerCase().replace(/[^a-z]/g, '');
                if (epithet) {
                    epithetCounts[epithet] = (epithetCounts[epithet] || 0) + 1;
                }
            }
        });

        let topEpithet = null;
        let maxCount = 0;

        Object.entries(epithetCounts).forEach(([name, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topEpithet = { name, count };
            }
        });

        setStats({ total, missingImages, topEpithet });
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
                        imagens (url_imagem, local_id),
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
                        imagens (url_imagem, local_id),
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

            const { data, error, count } = await query;

            if (error) throw error;

            // Filter images by local_id for non-global admins
            const formattedData: Species[] = (data || []).map((item: any) => {
                let filteredImages = item.imagens || [];

                if (!isGlobalAdmin && userLocalId && filteredImages.length > 0) {
                    filteredImages = filteredImages.filter((img: any) =>
                        img.local_id === userLocalId || img.local_id === String(userLocalId)
                    );
                }

                return { ...item, imagens: filteredImages };
            });

            setSpecies(formattedData);
            setTotalCount(count || 0);
            calculateStats(formattedData, count || 0);

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
