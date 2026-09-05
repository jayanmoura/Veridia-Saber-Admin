import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/authContext';

// ============ TYPES ============
export interface ProjectDetails {
    id: string;
    nome: string;
    descricao: string | null;
    imagem_capa: string | null;
    tipo: string | null;
    created_at: string | null;
    latitude: number | null;
    longitude: number | null;
    especie?: { count: number }[];
}

export interface LinkedUser {
    id: string;
    full_name: string | null;
    email: string;
    role: string | null;
    avatar_url: string | null;
}

export interface LinkedSpecies {
    id: string;
    nome_cientifico: string | null;
    autor?: string | null;
    nome_popular: string | null;
    familia_id: number | null;
    familia?: { familia_nome: string } | null;
    imagem?: string | null;        // url_micro (preferencial para listagem)
    imagem_thumbnail?: string | null;
    imagem_original?: string | null;
    specimens?: {
        id: string | number;
        tombo_codigo: string | null;
        created_at: string | null;
        url_imagem: string | null;
    }[];
}

export interface LinkedFamily {
    id: number;
    familia_nome: string;
    speciesCount: number;
}

export interface ModalSpecies {
    id: string;
    nome_cientifico: string | null;
    nome_popular: string | null;
}

interface FamiliaRef {
    id: number;
    familia_nome: string;
}

interface ImageRow {
    url_micro: string | null;
    url_thumbnail: string | null;
    url_imagem: string | null;
}

interface EspecieFamiliaOnlyRef {
    familia_id: number | string | null;
}

interface FamilyCountRow {
    especie: EspecieFamiliaOnlyRef | EspecieFamiliaOnlyRef[] | null;
}

interface SpeciesJoinRow {
    id: string;
    nome_cientifico: string | null;
    nome_popular: string | null;
    familia_id: number | null;
    familia: FamiliaRef | FamiliaRef[] | null;
    imagens: ImageRow[] | null;
}

interface SpecimenSpeciesRow {
    id: string | number;
    created_at: string | null;
    tombo_codigo: string | null;
    imagens: ImageRow[] | null;
    especie: SpeciesJoinRow | SpeciesJoinRow[] | null;
}

interface FamilyOnlyEspecieRef {
    familia: FamiliaRef | FamiliaRef[] | null;
}

interface FamilyOnlyRow {
    especie: FamilyOnlyEspecieRef | FamilyOnlyEspecieRef[] | null;
}

interface FamilyModalRow {
    especie: ModalSpecies | ModalSpecies[] | null;
}

export type TabType = 'users' | 'species' | 'families' | 'specimens' | 'storage';

export interface StorageAnalysis {
    totalImages: number;
    withMicro: number;
    withThumbnail: number;
    withOriginalOnly: number;
    estimatedCount: number;
    byMonth: { month: string; count: number }[];
    estimatedSizeMB: {
        original: number;
        thumbnail: number;
        micro: number;
        total: number;
    };
}

export interface UseProjectDetailsOptions {
    projectId: string | undefined;
    itemsPerPage?: number;
}

export interface UseProjectDetailsReturn {
    // Project data
    project: ProjectDetails | null;
    loading: boolean;
    error: string | null;

    // Tab data
    activeTab: TabType;
    setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
    linkedUsers: LinkedUser[];
    linkedSpecies: LinkedSpecies[];
    linkedFamilies: LinkedFamily[];
    tabLoading: boolean;

    // Counts
    usersCount: number;
    speciesCountTotal: number;
    familiesCount: number;
    specimensCount: number;

    // Pagination
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;

    // Modal
    isModalOpen: boolean;
    selectedFamily: { id: number; name: string } | null;
    modalSpecies: ModalSpecies[];
    modalLoading: boolean;
    openFamilyModal: (familyId: number, familyName: string) => void;
    closeModal: () => void;

    // Actions
    refetch: () => void;

    // Storage
    storageAnalysis: StorageAnalysis | null;
    loadingStorage: boolean;
    fetchStorageAnalysis: () => void;

    // Permissions
    isGlobalAdmin: boolean;
}

/**
 * @description Hook isolado na página única de Projeto detalhado. Controla a visualização via abas e carrossel de estatísticas, dividindo responsabilidade com paginação custom.
 *
 * @param {UseProjectDetailsOptions} options - Options
 * @param {string | undefined} options.projectId - ID do local_id a detalhar
 * @param {number} [options.itemsPerPage] - Controla o chunk das consultas por aba (padrão 15)
 *
 * @returns {UseProjectDetailsReturn} Conjunto denso de view options:
 *   - `project` — dados mestres do local extraídos do DB
 *   - Abas e Listas: `activeTab`, `linkedUsers`, `linkedSpecies`, `linkedFamilies`, e controllers de Tab page load
 *   - Counters: `usersCount`, `speciesCountTotal`, `familiesCount`
 *   - Paginator: `currentPage`, `totalPages`
 *   - Handlers modais da família: `openFamilyModal` / `modalSpecies`
 *
 * @example
 * const { project, activeTab, setActiveTab, linkedUsers } = useProjectDetails({ projectId: '50' })
 */
export function useProjectDetails({ projectId, itemsPerPage = 15 }: UseProjectDetailsOptions): UseProjectDetailsReturn {
    const { profile } = useAuth();

    // Core States
    const [project, setProject] = useState<ProjectDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tab States
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
    const [linkedSpecies, setLinkedSpecies] = useState<LinkedSpecies[]>([]);
    const [linkedFamilies, setLinkedFamilies] = useState<LinkedFamily[]>([]);
    const [tabLoading, setTabLoading] = useState(false);

    // Counter States
    const [usersCount, setUsersCount] = useState(0);
    const [speciesCountTotal, setSpeciesCountTotal] = useState(0);
    const [familiesCount, setFamiliesCount] = useState(0);
    const [specimensCount, setSpecimensCount] = useState(0);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Storage Analysis States
    const [storageAnalysis, setStorageAnalysis] = useState<StorageAnalysis | null>(null);
    const [loadingStorage, setLoadingStorage] = useState(false);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState<{ id: number; name: string } | null>(null);
    const [modalSpecies, setModalSpecies] = useState<ModalSpecies[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Permission
    const isGlobalAdmin = profile?.role === 'Curador Mestre' || profile?.role === 'Coordenador Científico';

    // Fetch project details
    const fetchProjectDetails = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('locais')
                .select('*, especie:especie_local(count)')
                .eq('id', projectId)
                .single();

            if (fetchError) throw fetchError;
            setProject(data);
        } catch (err) {
            console.error('Error fetching project details:', err);
            setError('Não foi possível carregar os detalhes do projeto.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Fetch counts for tab badges
    const fetchCounts = useCallback(async () => {
        if (!projectId) return;

        try {
            // Count Users
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('local_id', projectId);

            if (userCount !== null) setUsersCount(userCount);

            // Count Species (unique especie_id occurrences used as "species linked")
            const { data: specData } = await supabase
                .from('especie_local')
                .select('especie_id')
                .eq('local_id', projectId);

            if (specData) {
                const uniqueSpeciesIds = new Set(specData.map(d => d.especie_id).filter(Boolean));
                setSpeciesCountTotal(uniqueSpeciesIds.size);
            }

            // Count Specimens (same table, same filter — kept separate for clarity)
            const { count: specimensCount } = await supabase
                .from('especie_local')
                .select('*', { count: 'exact', head: true })
                .eq('local_id', projectId);

            if (specimensCount !== null) setSpecimensCount(specimensCount);

            // Count Families
            const { data: familyData } = await supabase
                .from('especie_local')
                .select('especie:especie_id(familia_id)')
                .eq('local_id', projectId);

            if (familyData) {
                const uniqueFamilyIds = new Set(
                    (familyData as FamilyCountRow[])
                        .map((item) => {
                            const esp = Array.isArray(item.especie) ? item.especie[0] : item.especie;
                            return esp?.familia_id;
                        })
                        .filter((fid): fid is number | string => Boolean(fid))
                );
                setFamiliesCount(uniqueFamilyIds.size);
            }
        } catch (err) {
            console.error('Error fetching counts:', err);
        }
    }, [projectId]);

    // Fetch tab data
    const fetchTabData = useCallback(async (tab: TabType, page: number = 1) => {
        if (!projectId) return;
        setTabLoading(true);

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage - 1;

        try {
            switch (tab) {
                case 'users': {
                    const { data: usersData } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, role, avatar_url')
                        .eq('local_id', projectId)
                        .order('full_name')
                        .range(start, end);

                    setLinkedUsers(usersData || []);
                    setTotalPages(Math.ceil(usersCount / itemsPerPage) || 1);
                    break;
                }

                case 'species': {
                    const { data: speciesData } = await supabase
                        .from('especie_local')
                        .select(`
                            id,
                            created_at,
                            tombo_codigo,
                            imagens(url_micro, url_thumbnail, url_imagem),
                            especie:especie_id(
                                id,
                                nome_cientifico,
                                nome_popular,
                                familia_id,
                                familia:familia_id(id, familia_nome),
                                imagens(url_micro, url_thumbnail, url_imagem)
                            )
                        `)
                        .eq('local_id', projectId);

                    const speciesMap = new Map<string, LinkedSpecies>();

                    ((speciesData || []) as SpecimenSpeciesRow[]).forEach((item) => {
                        const s = Array.isArray(item.especie) ? item.especie[0] : item.especie;
                        if (!s || !s.id) return;

                        const imgEspecie = s.imagens?.[0];
                        const imgEspecime = item.imagens?.[0];
                        const imgSource = imgEspecime || imgEspecie;

                        const specimenInfo = {
                            id: item.id,
                            tombo_codigo: item.tombo_codigo || null,
                            created_at: item.created_at,
                            url_imagem: imgSource?.url_micro || imgSource?.url_thumbnail || imgSource?.url_imagem || null
                        };

                        if (speciesMap.has(s.id)) {
                            speciesMap.get(s.id)!.specimens!.push(specimenInfo);
                        } else {
                            const familia = Array.isArray(s.familia) ? s.familia[0] : s.familia;
                            speciesMap.set(s.id, {
                                id: s.id,
                                nome_cientifico: s.nome_cientifico,
                                nome_popular: s.nome_popular,
                                familia_id: s.familia_id,
                                familia,
                                imagem: imgEspecie?.url_micro || null,
                                imagem_thumbnail: imgEspecie?.url_thumbnail || null,
                                imagem_original: imgEspecie?.url_imagem || null,
                                specimens: [specimenInfo]
                            });
                        }
                    });

                    const uniqueSpeciesArray = Array.from(speciesMap.values()).sort((a, b) =>
                        (a.nome_cientifico || '').localeCompare(b.nome_cientifico || '')
                    );

                    setLinkedSpecies(uniqueSpeciesArray.slice(start, end + 1));
                    setTotalPages(Math.ceil(uniqueSpeciesArray.length / itemsPerPage) || 1);
                    break;
                }

                case 'families': {
                    const { data: speciesForFamilies } = await supabase
                        .from('especie_local')
                        .select(`
                            especie:especie_id(
                                familia:familia_id(id, familia_nome)
                            )
                        `)
                        .eq('local_id', projectId);

                    if (speciesForFamilies) {
                        const familyMap = new Map<number, { id: number; familia_nome: string; speciesCount: number }>();
                        (speciesForFamilies as FamilyOnlyRow[]).forEach((item) => {
                            const s = Array.isArray(item.especie) ? item.especie[0] : item.especie;
                            if (!s) return;

                            const fam = Array.isArray(s.familia) ? s.familia[0] : s.familia;
                            if (fam && fam.id) {
                                const existing = familyMap.get(fam.id);
                                if (existing) {
                                    existing.speciesCount++;
                                } else {
                                    familyMap.set(fam.id, {
                                        id: fam.id,
                                        familia_nome: fam.familia_nome || 'Sem nome',
                                        speciesCount: 1
                                    });
                                }
                            }
                        });
                        const allFamilies = Array.from(familyMap.values()).sort((a, b) => a.familia_nome.localeCompare(b.familia_nome));
                        const paginatedFamilies = allFamilies.slice(start, end + 1);
                        setLinkedFamilies(paginatedFamilies);
                        setTotalPages(Math.ceil(allFamilies.length / itemsPerPage) || 1);
                    }
                    break;
                }

                case 'specimens':
                case 'storage':
                    // Handled by their own hook/component
                    setTabLoading(false);
                    setTotalPages(1);
                    break;
            }
        } catch (err) {
            console.error('Error fetching tab data:', err);
        } finally {
            setTabLoading(false);
        }
    }, [projectId, itemsPerPage, usersCount]);

    // Fetch storage analysis
    const fetchStorageAnalysis = useCallback(async () => {
        if (!projectId) return;
        setLoadingStorage(true);
        try {
            const { data } = await supabase
                .from('imagens')
                .select('tamanho_original, tamanho_thumbnail, tamanho_micro, tamanho_estimado, created_at')
                .eq('local_id', projectId);

            if (!data) return;

            const totalImages = data.length;
            const withMicro = data.filter(img => img.tamanho_micro).length;
            const withThumbnail = data.filter(img => img.tamanho_thumbnail).length;
            const withOriginalOnly = data.filter(img => !img.tamanho_micro && !img.tamanho_thumbnail).length;
            const estimatedCount = data.filter(img => img.tamanho_estimado).length;

            const sumBytes = (field: 'tamanho_original' | 'tamanho_thumbnail' | 'tamanho_micro') =>
                data.reduce((acc, img) => acc + (img[field] || 0), 0);

            const toMB = (bytes: number) => bytes / (1024 * 1024);

            const estimatedSizeMB = {
                original: toMB(sumBytes('tamanho_original')),
                thumbnail: toMB(sumBytes('tamanho_thumbnail')),
                micro: toMB(sumBytes('tamanho_micro')),
                total: toMB(
                    sumBytes('tamanho_original') +
                    sumBytes('tamanho_thumbnail') +
                    sumBytes('tamanho_micro')
                ),
            };

            const monthMap: Record<string, number> = {};
            data.forEach(img => {
                const month = img.created_at?.slice(0, 7);
                if (month) monthMap[month] = (monthMap[month] || 0) + 1;
            });
            const byMonth = Object.entries(monthMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, count]) => ({ month, count }));

            setStorageAnalysis({
                totalImages,
                withMicro,
                withThumbnail,
                withOriginalOnly,
                estimatedCount,
                byMonth,
                estimatedSizeMB,
            });
        } finally {
            setLoadingStorage(false);
        }
    }, [projectId]);

    // Open family modal
    const openFamilyModal = useCallback(async (familyId: number, familyName: string) => {
        setSelectedFamily({ id: familyId, name: familyName });
        setIsModalOpen(true);
        setModalLoading(true);
        setModalSpecies([]);

        try {
            const { data } = await supabase
                .from('especie_local')
                .select('especie!inner(id, nome_cientifico, nome_popular, familia_id)')
                .eq('local_id', projectId)
                .eq('especie.familia_id', familyId)
                .order('nome_cientifico', { foreignTable: 'especie' });

            if (data) {
                const mapped = (data as FamilyModalRow[])
                    .map((item) => (Array.isArray(item.especie) ? item.especie[0] : item.especie))
                    .filter((esp): esp is ModalSpecies => esp !== null && esp !== undefined);
                setModalSpecies(mapped);
            }
        } catch (err) {
            console.error('Error loading family species:', err);
        } finally {
            setModalLoading(false);
        }
    }, [projectId]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedFamily(null);
        setModalSpecies([]);
    }, []);

    const refetch = useCallback(() => {
        fetchProjectDetails();
        fetchCounts();
    }, [fetchProjectDetails, fetchCounts]);

    // Initial load
    useEffect(() => {
        if (projectId && isGlobalAdmin) {
            fetchProjectDetails();
            fetchCounts();
        }
    }, [projectId, isGlobalAdmin, fetchProjectDetails, fetchCounts]);

    // Tab change
    useEffect(() => {
        if (projectId && project) {
            setCurrentPage(1);
            fetchTabData(activeTab, 1);
        }
        // fetchTabData/projectId excluídos intencionalmente: adicioná-los
        // causaria corrida com o efeito de "Page change" (ambos disparariam
        // ao trocar de aba, um buscando a página antiga). Este efeito já
        // reage a `activeTab`/`project`, que é o gatilho correto.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, project]);

    // Page change
    useEffect(() => {
        if (projectId && project && currentPage > 0) {
            fetchTabData(activeTab, currentPage);
        }
        // activeTab/fetchTabData/project/projectId excluídos intencionalmente:
        // este efeito deve reagir SÓ à mudança de página (`currentPage`).
        // Incluir `activeTab` aqui faria este efeito também disparar na troca
        // de aba, competindo com o efeito de "Tab change" acima e buscando a
        // página errada (currentPage ainda não resetado para 1 nesse render).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    return {
        project,
        loading,
        error,
        activeTab,
        setActiveTab,
        linkedUsers,
        linkedSpecies,
        linkedFamilies,
        tabLoading,
        usersCount,
        speciesCountTotal,
        familiesCount,
        specimensCount,
        currentPage,
        setCurrentPage,
        totalPages,
        isModalOpen,
        selectedFamily,
        modalSpecies,
        modalLoading,
        openFamilyModal,
        closeModal,
        refetch,
        storageAnalysis,
        loadingStorage,
        fetchStorageAnalysis,
        isGlobalAdmin
    };
}
