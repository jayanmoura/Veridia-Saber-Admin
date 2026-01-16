import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============ TYPES ============
export interface Family {
    id: string;
    familia_nome: string;
    imagem_referencia: string | null;
    especie?: { count: number }[];
    quantidade_especies: number;
    created_at?: string | null;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

export interface PendingFamily {
    name: string;
    count: number;
    examples: string[];
}

export interface FamilyStats {
    total: number;
    richest: { name: string; count: number } | null;
    missingImages: number;
}

export interface UseFamiliesOptions {
    page?: number;
    search?: string;
    itemsPerPage?: number;
    enabled?: boolean;
}

export interface UseFamiliesReturn {
    families: Family[];
    loading: boolean;
    totalCount: number;
    stats: FamilyStats;
    pendingFamilies: PendingFamily[];
    pendingLoading: boolean;
    refetch: () => Promise<void>;
    refetchPending: () => Promise<void>;
}

const DEFAULT_ITEMS_PER_PAGE = 20;

/**
 * Hook for fetching and managing family data with pagination and filtering.
 * Also handles pending families (unregistered family names from plant collection).
 */
export function useFamilies(options: UseFamiliesOptions = {}): UseFamiliesReturn {
    const {
        page = 1,
        search = '',
        itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
        enabled = true
    } = options;

    const [families, setFamilies] = useState<Family[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState<FamilyStats>({
        total: 0,
        richest: null,
        missingImages: 0
    });

    const [pendingFamilies, setPendingFamilies] = useState<PendingFamily[]>([]);
    const [pendingLoading, setPendingLoading] = useState(false);

    // Calculate stats from current page data
    const calculateStats = useCallback((data: Family[], total: number) => {
        const missingImages = data.filter(f => !f.imagem_referencia).length;

        let richest: FamilyStats['richest'] = null;
        let maxCount = 0;

        data.forEach(f => {
            const count = f.especie?.[0]?.count || f.quantidade_especies || 0;
            if (count > maxCount) {
                maxCount = count;
                richest = { name: f.familia_nome, count };
            }
        });

        setStats({ total, richest, missingImages });
    }, []);

    // Main families fetch function
    const fetchFamilies = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        try {
            const from = (page - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase
                .from('familia')
                .select('*, especie(count), creator:profiles(full_name, email)', { count: 'exact' })
                .order('familia_nome')
                .range(from, to);

            if (search) {
                query = query.ilike('familia_nome', `%${search}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            const formattedData: Family[] = (data || []).map((item: any) => ({
                ...item,
                quantidade_especies: item.especie?.[0]?.count || 0
            }));

            setFamilies(formattedData);
            setTotalCount(count || 0);
            calculateStats(formattedData, count || 0);

        } catch (error) {
            console.error('Error fetching families:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, itemsPerPage, enabled, calculateStats]);

    // Fetch pending families (unregistered names)
    const fetchPendingFamilies = useCallback(async () => {
        setPendingLoading(true);
        try {
            const { data, error } = await supabase
                .from('plantas_da_colecao')
                .select('familia_custom, especie')
                .is('familia_id', null)
                .neq('familia_custom', null);

            if (error) throw error;

            if (data) {
                const groups: Record<string, { count: number; examples: Set<string> }> = {};

                data.forEach(item => {
                    if (!item.familia_custom) return;
                    const name = item.familia_custom.trim();
                    if (!name) return;

                    if (!groups[name]) groups[name] = { count: 0, examples: new Set() };
                    groups[name].count++;
                    if (item.especie) groups[name].examples.add(item.especie);
                });

                const list = Object.entries(groups)
                    .map(([name, val]) => ({
                        name,
                        count: val.count,
                        examples: Array.from(val.examples).slice(0, 3)
                    }))
                    .sort((a, b) => b.count - a.count);

                setPendingFamilies(list);
            }
        } catch (error) {
            console.error('Error fetching pending families:', error);
        } finally {
            setPendingLoading(false);
        }
    }, []);

    // Initial load and refetch on dependencies change
    useEffect(() => {
        fetchFamilies();
    }, [fetchFamilies]);

    useEffect(() => {
        fetchPendingFamilies();
    }, [fetchPendingFamilies]);

    return {
        families,
        loading,
        totalCount,
        stats,
        pendingFamilies,
        pendingLoading,
        refetch: fetchFamilies,
        refetchPending: fetchPendingFamilies
    };
}
