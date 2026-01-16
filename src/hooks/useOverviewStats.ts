import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============ TYPES ============
export interface AuditLog {
    id: number;
    created_at: string;
    action_type: string;
    table_name: string;
    user_id: string;
    profiles?: { full_name: string } | { full_name: string }[];
}

export interface RecentSpecies {
    type: 'especie';
    id: string;
    nome_cientifico: string;
    created_at: string;
    local_id: string | null;
    familia_id: string | null;
    familia?: { familia_nome: string }[] | { familia_nome: string } | null;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

export interface RecentFamily {
    type: 'familia';
    id: string;
    familia_nome: string;
    created_at: string;
    created_by?: string | null;
    creator?: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

export type RecentWorkItem = RecentSpecies | RecentFamily;

export interface RecentLocalSpecies {
    id: string;
    nome_cientifico: string;
    nome_popular: string | null;
    created_at: string;
    imagem_url: string | null;
}

export interface LocalFamily {
    familia_nome: string;
    count: number;
}

export interface ProjectData {
    nome: string;
    tipo: string;
    descricao: string | null;
    imagem_capa: string | null;
}

export interface GlobalStats {
    families: number;
    species: number;
    projects: number;
    users: number;
    seniorContributions: number;
    seniorPending: number;
}

export interface LocalStats {
    speciesCount: number;
    teamCount: number;
    imagesCount: number;
}

export interface UseOverviewStatsReturn {
    // Role checks
    isGlobalAdmin: boolean;
    isLocalAdmin: boolean;
    isSenior: boolean;
    isFieldTaxonomist: boolean;
    isCataloger: boolean;

    // Global stats
    stats: GlobalStats;
    recentLogs: AuditLog[];

    // Senior stats
    recentWork: RecentWorkItem[];
    pendingSpecies: any[];

    // Local stats
    projectData: ProjectData | null;
    localStats: LocalStats;
    recentLocalSpecies: RecentLocalSpecies[];
    loadingRecentSpecies: boolean;

    // Local families
    localFamilies: LocalFamily[];
    loadingFamilies: boolean;
    fetchLocalFamilies: () => Promise<void>;

    // Loading
    loading: boolean;

    // Refetch
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing Overview page statistics based on user role.
 */
export function useOverviewStats(): UseOverviewStatsReturn {
    const { profile } = useAuth();

    // Role checks
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';
    const isLocalAdmin = profile?.role === 'Gestor de Acervo';
    const isSenior = profile?.role === 'Taxonomista Sênior';
    const isFieldTaxonomist = profile?.role === 'Taxonomista de Campo';
    const isCataloger = profile?.role === 'Consulente';

    // Global stats
    const [stats, setStats] = useState<GlobalStats>({
        families: 0,
        species: 0,
        projects: 0,
        users: 0,
        seniorContributions: 0,
        seniorPending: 0
    });
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

    // Senior stats
    const [recentWork, setRecentWork] = useState<RecentWorkItem[]>([]);
    const [pendingSpecies, setPendingSpecies] = useState<any[]>([]);

    // Local stats
    const [projectData, setProjectData] = useState<ProjectData | null>(null);
    const [localStats, setLocalStats] = useState<LocalStats>({
        speciesCount: 0,
        teamCount: 0,
        imagesCount: 0
    });
    const [recentLocalSpecies, setRecentLocalSpecies] = useState<RecentLocalSpecies[]>([]);
    const [loadingRecentSpecies, setLoadingRecentSpecies] = useState(false);

    // Local families
    const [localFamilies, setLocalFamilies] = useState<LocalFamily[]>([]);
    const [loadingFamilies, setLoadingFamilies] = useState(false);

    // Loading
    const [loading, setLoading] = useState(true);

    // Fetch global admin stats
    const fetchGlobalStats = useCallback(async () => {
        const [families, species, projects, users, logs] = await Promise.all([
            supabase.from('familia').select('*', { count: 'exact', head: true }),
            supabase.from('especie').select('*', { count: 'exact', head: true }),
            supabase.from('locais').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('audit_logs')
                .select('id, created_at, action_type, table_name, user_id, profiles:user_id(full_name)')
                .order('created_at', { ascending: false })
                .limit(5)
        ]);

        setStats(prev => ({
            ...prev,
            families: families.count || 0,
            species: species.count || 0,
            projects: projects.count || 0,
            users: users.count || 0,
        }));

        if (logs.data) {
            setRecentLogs(logs.data);
        }
    }, []);

    // Fetch senior taxonomist stats
    const fetchSeniorStats = useCallback(async () => {
        if (!profile?.id) return;

        const [mySpeciesCount, myFamiliesCount] = await Promise.all([
            supabase.from('especie').select('*', { count: 'exact', head: true }).eq('created_by', profile.id),
            supabase.from('familia').select('*', { count: 'exact', head: true }).eq('created_by', profile.id)
        ]);

        const myCount = (mySpeciesCount.count || 0) + (myFamiliesCount.count || 0);

        const { count: globalCount } = await supabase.from('especie').select('*', { count: 'exact', head: true });

        const { data: globalSpecies } = await supabase
            .from('especie')
            .select('id, nome_cientifico, descricao_especie, imagens(id), familia(familia_nome)')
            .is('local_id', null);

        let pendingCount = 0;
        if (globalSpecies) {
            const pending = globalSpecies.filter(sp => {
                const hasNoDesc = !sp.descricao_especie || sp.descricao_especie.trim() === '';
                const hasNoImg = !sp.imagens || sp.imagens.length === 0;
                return hasNoDesc || hasNoImg;
            });
            pendingCount = pending.length;
            setPendingSpecies(pending);
        }

        setStats(prev => ({
            ...prev,
            seniorContributions: myCount || 0,
            species: globalCount || 0,
            seniorPending: pendingCount
        }));

        // Fetch recent work
        const [recentSpecies, recentFamilies] = await Promise.all([
            supabase
                .from('especie')
                .select('id, nome_cientifico, created_at, local_id, familia_id, familia:familia_id(familia_nome), created_by, creator:profiles(full_name, email)')
                .is('local_id', null)
                .order('created_at', { ascending: false })
                .limit(10),
            supabase
                .from('familia')
                .select('id, familia_nome, created_at, created_by, creator:profiles(full_name, email)')
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        const speciesItems: RecentSpecies[] = (recentSpecies.data || []).map(item => ({ ...item, type: 'especie' as const }));
        const familyItems: RecentFamily[] = (recentFamilies.data || []).map(item => ({ ...item, type: 'familia' as const }));

        const combined: RecentWorkItem[] = [...speciesItems, ...familyItems]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        setRecentWork(combined);
    }, [profile?.id]);

    // Fetch local admin stats
    const fetchLocalStats = useCallback(async () => {
        if (!profile?.local_id) return;

        const { data: project } = await supabase
            .from('locais')
            .select('nome, tipo, descricao, imagem_capa')
            .eq('id', profile.local_id)
            .single();

        if (project) setProjectData(project);

        const [speciesCount, teamCount, imagesCount] = await Promise.all([
            supabase.from('especie_local').select('*', { count: 'exact', head: true }).eq('local_id', profile.local_id),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('local_id', profile.local_id),
            supabase.from('imagens').select('*', { count: 'exact', head: true }).eq('local_id', profile.local_id)
        ]);

        setLocalStats({
            speciesCount: speciesCount.count || 0,
            teamCount: teamCount.count || 0,
            imagesCount: imagesCount.count || 0
        });

        setStats(prev => ({ ...prev, species: speciesCount.count || 0 }));

        // Fetch recent local species
        setLoadingRecentSpecies(true);
        try {
            const { data: recentData } = await supabase
                .from('especie_local')
                .select(`created_at, especie:especie_id(id, nome_cientifico, nome_popular, imagens(url_imagem))`)
                .eq('local_id', profile.local_id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentData) {
                const mapped = recentData
                    .filter((item: any) => item.especie)
                    .map((item: any) => ({
                        id: item.especie.id,
                        nome_cientifico: item.especie.nome_cientifico,
                        nome_popular: item.especie.nome_popular || null,
                        created_at: item.created_at,
                        imagem_url: item.especie.imagens?.[0]?.url_imagem || null
                    }));
                setRecentLocalSpecies(mapped);
            }
        } finally {
            setLoadingRecentSpecies(false);
        }
    }, [profile?.local_id]);

    // Fetch personal stats (Cataloger)
    const fetchPersonalStats = useCallback(async () => {
        if (!profile?.id) return;

        const { count: mySpeciesCount } = await supabase
            .from('especie')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', profile.id);

        const { data: mySpecies } = await supabase
            .from('especie')
            .select('family_id')
            .eq('created_by', profile.id);

        const uniqueFamilies = new Set(mySpecies?.map(s => s.family_id).filter(Boolean)).size;

        setStats(prev => ({ ...prev, species: mySpeciesCount || 0, families: uniqueFamilies }));
    }, [profile?.id]);

    // Fetch local families
    const fetchLocalFamilies = useCallback(async () => {
        if (!profile?.local_id) return;

        setLoadingFamilies(true);
        try {
            const { data } = await supabase
                .from('especie_local')
                .select('especie:especie_id(familia:familia_id(familia_nome))')
                .eq('local_id', profile.local_id);

            if (data) {
                const familyCount: { [key: string]: number } = {};
                data.forEach((item: any) => {
                    const familyName = item.especie?.familia?.familia_nome;
                    if (familyName) {
                        familyCount[familyName] = (familyCount[familyName] || 0) + 1;
                    }
                });

                const families = Object.entries(familyCount)
                    .map(([familia_nome, count]) => ({ familia_nome, count }))
                    .sort((a, b) => b.count - a.count);

                setLocalFamilies(families);
            }
        } finally {
            setLoadingFamilies(false);
        }
    }, [profile?.local_id]);

    // Main fetch function
    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            if (isGlobalAdmin) {
                await fetchGlobalStats();
            } else if (isLocalAdmin) {
                await fetchLocalStats();
            } else if (isSenior || isFieldTaxonomist) {
                await fetchSeniorStats(); // Reuse same logic for field taxonomist
            } else if (isCataloger) {
                await fetchPersonalStats();
            }
        } finally {
            setLoading(false);
        }
    }, [isGlobalAdmin, isLocalAdmin, isSenior, isFieldTaxonomist, isCataloger, fetchGlobalStats, fetchLocalStats, fetchSeniorStats, fetchPersonalStats]);

    // Initial load
    useEffect(() => {
        if (profile) fetchStats();
    }, [profile, fetchStats]);

    return {
        isGlobalAdmin,
        isLocalAdmin,
        isSenior,
        isFieldTaxonomist,
        isCataloger,
        stats,
        recentLogs,
        recentWork,
        pendingSpecies,
        projectData,
        localStats,
        recentLocalSpecies,
        loadingRecentSpecies,
        localFamilies,
        loadingFamilies,
        fetchLocalFamilies,
        loading,
        refetch: fetchStats
    };
}
