import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/authContext';
import { pickSpeciesThumbnail } from '../utils/speciesThumbnail';
import { fetchProfileNames } from '../services/profileNames';
import type {
    CreatorRef,
    EspecieLocalRow,
    EspecieRow,
    FamiliaRow,
    FamilyRef
} from '../types/db';
import type { PendingItem } from '../components/Modals/PendingCuratorshipModal';

// ============ TYPES ============
export interface AuditLog {
    id: number;
    created_at: string;
    action_type: string;
    table_name: string;
    user_id: string | null;
    profiles?: { full_name: string | null } | { full_name: string | null }[] | null;
}

export interface RecentSpecies {
    type: 'especie';
    id: EspecieRow['id'];
    nome_cientifico: EspecieRow['nome_cientifico'];
    created_at: EspecieRow['created_at'];
    local_id: EspecieRow['local_id'] | string | null;
    familia_id: EspecieRow['familia_id'];
    familia?: FamilyRef | FamilyRef[] | null;
    created_by?: EspecieRow['created_by'];
    created_by_name?: EspecieRow['created_by_name'];
    creator?: CreatorRef;
}

export interface RecentFamily {
    type: 'familia';
    id: FamiliaRow['id'];
    familia_nome: FamiliaRow['familia_nome'];
    created_at: FamiliaRow['created_at'];
    created_by?: FamiliaRow['created_by'];
    created_by_name?: FamiliaRow['created_by_name'];
    creator?: CreatorRef;
}

export type RecentWorkItem = RecentSpecies | RecentFamily;

export interface RecentLocalSpecies {
    id: string;
    nome_cientifico: EspecieRow['nome_cientifico'];
    nome_popular: EspecieRow['nome_popular'];
    created_at: EspecieLocalRow['created_at'];
    imagem_url: string | null;       // url_micro (preferencial)
    imagem_thumbnail: string | null; // url_thumbnail (fallback)
    imagem_original: string | null;  // url_imagem (fallback final)
}

export interface LocalFamily {
    familia_nome: FamiliaRow['familia_nome'];
    count: number;
}

export interface ProjectData {
    nome: string;
    tipo: string | null;
    descricao: string | null;
    imagem_capa: string | null;
}

export interface GlobalStats {
    families: number;
    species: number;
    specimens?: number;
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

const RECENT_SPECIES_SELECT =
    'id, nome_cientifico, created_at, local_id, familia_id, familia:familia_id(familia_nome), created_by, created_by_name';

async function resolveCreatorNames<T extends { created_by?: string | null; created_by_name?: string | null }>(
    items: T[]
): Promise<Map<string, string>> {
    const missingUserIds = Array.from(new Set(
        items
            .filter(item => !item.created_by_name && Boolean(item.created_by))
            .map(item => item.created_by as string)
    ));

    return missingUserIds.length > 0
        ? await fetchProfileNames(missingUserIds)
        : new Map<string, string>();
}

function withResolvedCreator<T extends { created_by?: string | null; created_by_name?: string | null }>(
    item: T,
    nameMap: Map<string, string>
): T & { created_by_name: string | null; creator: CreatorRef } {
    const resolvedName = item.created_by_name || (item.created_by ? nameMap.get(item.created_by) : null) || null;
    return {
        ...item,
        created_by_name: resolvedName,
        creator: resolvedName ? { full_name: resolvedName } : null
    };
}

export interface UseOverviewStatsReturn {
    // Role checks
    isGlobalAdmin: boolean;
    isLocalAdmin: boolean;
    isSenior: boolean;
    isFieldTaxonomist: boolean;

    // Global stats
    stats: GlobalStats;
    recentLogs: AuditLog[];

    // Senior stats
    recentWork: RecentWorkItem[];
    pendingSpecies: PendingItem[];

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
 * @description Hook central do dashboard (Overview) que muda drasticamente a query e retorno baseado na Hierarchy Role do usuário.
 *
 * @returns {UseOverviewStatsReturn} Permissões computadas e blocos de dados de dashboard:
 *   - Roles: `isGlobalAdmin`, `isLocalAdmin`, `isSenior`, `isFieldTaxonomist`
 *   - Stats: `stats` gerais/projetos
 *   - Senior/Global: `recentLogs` e `recentWork`
 *   - Específicos Locais: `projectData`, `localStats`, `recentLocalSpecies`
 *
 * @example
 * const { stats, recentWork, isGlobalAdmin } = useOverviewStats()
 */
export function useOverviewStats(): UseOverviewStatsReturn {
    const { profile } = useAuth();

    // Role checks
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';
    const isLocalAdmin = profile?.role === 'Gestor de Acervo';
    const isSenior = profile?.role === 'Taxonomista Sênior';
    const isFieldTaxonomist = profile?.role === 'Taxonomista de Campo';

    // Global stats
    const [stats, setStats] = useState<GlobalStats>({
        families: 0,
        species: 0,
        specimens: 0,
        projects: 0,
        users: 0,
        seniorContributions: 0,
        seniorPending: 0
    });
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);

    // Senior stats
    const [recentWork, setRecentWork] = useState<RecentWorkItem[]>([]);
    const [pendingSpecies, setPendingSpecies] = useState<PendingItem[]>([]);

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
            const rawPending = globalSpecies.filter(sp => {
                const hasNoDesc = !sp.descricao_especie || sp.descricao_especie.trim() === '';
                const hasNoImg = !sp.imagens || sp.imagens.length === 0;
                return hasNoDesc || hasNoImg;
            });
            pendingCount = rawPending.length;
            const mappedPending: PendingItem[] = rawPending.map(sp => ({
                id: String(sp.id),
                nome_cientifico: String(sp.nome_cientifico),
                descricao_especie: sp.descricao_especie,
                imagens: sp.imagens,
                familia: Array.isArray(sp.familia) ? sp.familia[0] : sp.familia,
            }));
            setPendingSpecies(mappedPending);
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
                .select(RECENT_SPECIES_SELECT)
                .is('local_id', null)
                .order('created_at', { ascending: false })
                .limit(10),
            supabase
                .from('familia')
                .select('id, familia_nome, created_at, created_by, created_by_name')
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        const rawSpecies = (recentSpecies.data || []).map(item => ({ ...item, type: 'especie' as const }));
        const rawFamilies = (recentFamilies.data || []).map(item => ({ ...item, type: 'familia' as const }));

        const nameMap = await resolveCreatorNames([...rawSpecies, ...rawFamilies]);

        const speciesItems: RecentSpecies[] = rawSpecies.map(item => withResolvedCreator(item, nameMap));
        const familyItems: RecentFamily[] = rawFamilies.map(item => withResolvedCreator(item, nameMap));

        const combined: RecentWorkItem[] = [...speciesItems, ...familyItems]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        setRecentWork(combined);
    }, [profile?.id]);

    // Fetch field taxonomist stats (scoped to profile.local_id)
    const fetchFieldStats = useCallback(async () => {
        if (!profile?.id || !profile?.local_id) {
            setStats({
                families: 0,
                species: 0,
                specimens: 0,
                projects: 0,
                users: 0,
                seniorContributions: 0,
                seniorPending: 0
            });
            setRecentWork([]);
            setPendingSpecies([]);
            return;
        }

        const numericLocalId = Number(profile.local_id);

        const [
            localSpeciesCount,
            localSpecimensCount,
            mySpeciesCount,
            mySpecimensCount,
            recentSpecies
        ] = await Promise.all([
            supabase
                .from('especie')
                .select('*', { count: 'exact', head: true })
                .eq('local_id', numericLocalId),
            supabase
                .from('especie_local')
                .select('*', { count: 'exact', head: true })
                .eq('local_id', numericLocalId),
            supabase
                .from('especie')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', profile.id)
                .eq('local_id', numericLocalId),
            supabase
                .from('especie_local')
                .select('*', { count: 'exact', head: true })
                .eq('created_by', profile.id)
                .eq('local_id', numericLocalId),
            supabase
                .from('especie')
                .select(RECENT_SPECIES_SELECT)
                .eq('created_by', profile.id)
                .eq('local_id', numericLocalId)
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        const myContributions = (mySpeciesCount.count || 0) + (mySpecimensCount.count || 0);

        setPendingSpecies([]);
        setStats(prev => ({
            ...prev,
            species: localSpeciesCount.count || 0,
            specimens: localSpecimensCount.count || 0,
            seniorContributions: myContributions,
            seniorPending: 0
        }));

        const rawSpecies = (recentSpecies.data || []).map(item => ({ ...item, type: 'especie' as const }));
        const nameMap = await resolveCreatorNames(rawSpecies);
        const speciesItems: RecentSpecies[] = rawSpecies.map(item => withResolvedCreator(item, nameMap));

        setRecentWork(speciesItems);
    }, [profile?.id, profile?.local_id]);

    // Fetch local admin stats
    const fetchLocalStats = useCallback(async () => {
        if (!profile?.local_id) return;
        const numericLocalId = Number(profile.local_id);

        const { data: project } = await supabase
            .from('locais')
            .select('nome, tipo, descricao, imagem_capa')
            .eq('id', numericLocalId)
            .single();

        if (project) setProjectData(project);

        const [speciesCount, teamCount, imagesCount] = await Promise.all([
            supabase.from('especie_local').select('*', { count: 'exact', head: true }).eq('local_id', numericLocalId),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('local_id', numericLocalId),
            supabase.from('imagens').select('*', { count: 'exact', head: true }).eq('local_id', numericLocalId)
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
                .select(`id, created_at, especie:especie_id(id, nome_cientifico, nome_popular, imagens(url_imagem, url_thumbnail, url_micro)), imagens!especime_id(url_imagem, url_thumbnail, url_micro)`)
                .eq('local_id', numericLocalId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentData) {
                const mapped = (recentData as Array<{
                    id: string | number;
                    created_at: string;
                    especie: {
                        nome_cientifico: string;
                        nome_popular?: string | null;
                        imagens?: { url_imagem?: string; url_thumbnail?: string; url_micro?: string }[] | null;
                    } | {
                        nome_cientifico: string;
                        nome_popular?: string | null;
                        imagens?: { url_imagem?: string; url_thumbnail?: string; url_micro?: string }[] | null;
                    }[] | null;
                    imagens: { url_micro?: string; url_thumbnail?: string; url_imagem?: string }[] | null;
                }>)
                    .filter(item => item.especie)
                    .map(item => {
                        const esp = Array.isArray(item.especie) ? item.especie[0] : item.especie;
                        const thumbResult = pickSpeciesThumbnail({
                            specimenImages: item.imagens,
                            speciesImages: esp?.imagens,
                        });
                        return {
                            id: String(item.id),
                            nome_cientifico: esp?.nome_cientifico || '',
                            nome_popular: esp?.nome_popular || null,
                            created_at: String(item.created_at),
                            imagem_url: thumbResult?.thumb || null,
                            imagem_thumbnail: thumbResult?.thumb || null,
                            imagem_original: thumbResult?.full || null,
                        };
                    });
                setRecentLocalSpecies(mapped);
            }
        } finally {
            setLoadingRecentSpecies(false);
        }
    }, [profile?.local_id]);

    // Fetch local families
    const fetchLocalFamilies = useCallback(async () => {
        if (!profile?.local_id) return;

        setLoadingFamilies(true);
        try {
            const { data } = await supabase
                .from('especie_local')
                .select('especie:especie_id(familia:familia_id(familia_nome))')
                .eq('local_id', Number(profile.local_id));

            if (data) {
                const familyCount: { [key: string]: number } = {};
                (data as Array<{
                    especie?: { familia?: { familia_nome?: string } | { familia_nome?: string }[] | null } | { familia?: { familia_nome?: string } | { familia_nome?: string }[] | null }[] | null;
                }>).forEach(item => {
                    const esp = Array.isArray(item.especie) ? item.especie[0] : item.especie;
                    const fam = Array.isArray(esp?.familia) ? esp?.familia[0] : esp?.familia;
                    const familyName = fam?.familia_nome;
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
            } else if (isSenior) {
                await fetchSeniorStats();
            } else if (isFieldTaxonomist) {
                await fetchFieldStats();
            }
        } finally {
            setLoading(false);
        }
    }, [isGlobalAdmin, isLocalAdmin, isSenior, isFieldTaxonomist, fetchGlobalStats, fetchLocalStats, fetchSeniorStats, fetchFieldStats]);

    // Initial load
    useEffect(() => {
        if (profile) fetchStats();
    }, [profile, fetchStats]);

    return {
        isGlobalAdmin,
        isLocalAdmin,
        isSenior,
        isFieldTaxonomist,
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
