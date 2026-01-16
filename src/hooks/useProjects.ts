import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============ TYPES ============
export interface Project {
    id: string;
    nome: string;
    descricao: string | null;
    imagem_capa: string | null;
    tipo: string | null;
    cidade?: string | null;
    estado?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    especie?: { count: number }[];
    quantidade_especies: number;
}

export interface ProjectStats {
    total: number;
    topProject: { name: string; count: number } | null;
}

export interface UseProjectsOptions {
    enabled?: boolean;
}

export interface UseProjectsReturn {
    projects: Project[];
    loading: boolean;
    stats: ProjectStats;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing project data.
 */
export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
    const { enabled = true } = options;

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ProjectStats>({
        total: 0,
        topProject: null
    });

    // Calculate stats from fetched data
    const calculateStats = useCallback((data: Project[]) => {
        let topProject: ProjectStats['topProject'] = null;
        let maxCount = 0;

        data.forEach(p => {
            const count = p.especie?.[0]?.count || p.quantidade_especies || 0;
            if (count > maxCount) {
                maxCount = count;
                topProject = { name: p.nome, count };
            }
        });

        setStats({ total: data.length, topProject });
    }, []);

    // Main fetch function
    const fetchProjects = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('locais')
                .select('*, especie:especie_local(count)')
                .order('nome');

            if (error) throw error;

            const formattedData: Project[] = (data || []).map((item: any) => ({
                ...item,
                quantidade_especies: item.especie?.[0]?.count || 0
            }));

            setProjects(formattedData);
            calculateStats(formattedData);

        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    }, [enabled, calculateStats]);

    // Initial load
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return {
        projects,
        loading,
        stats,
        refetch: fetchProjects
    };
}
