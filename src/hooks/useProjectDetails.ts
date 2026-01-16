import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
    imagem?: string | null;
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

export type TabType = 'users' | 'species' | 'families';

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

    // Permissions
    isGlobalAdmin: boolean;
}

/**
 * Hook for managing ProjectDetails page state: project data, tabs, pagination, and modal.
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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

            // Count Species
            const { count: specCount } = await supabase
                .from('especie_local')
                .select('*', { count: 'exact', head: true })
                .eq('local_id', projectId);

            if (specCount !== null) setSpeciesCountTotal(specCount);

            // Count Families
            const { data: familyData } = await supabase
                .from('especie_local')
                .select('especie:especie_id(familia_id)')
                .eq('local_id', projectId);

            if (familyData) {
                const uniqueFamilyIds = new Set(
                    familyData
                        .map((item: any) => item.especie?.familia_id)
                        .filter((fid: any) => fid)
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
                case 'users':
                    const { data: usersData } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, role, avatar_url')
                        .eq('local_id', projectId)
                        .order('full_name')
                        .range(start, end);

                    setLinkedUsers(usersData || []);
                    setTotalPages(Math.ceil(usersCount / itemsPerPage) || 1);
                    break;

                case 'species':
                    const { data: speciesData } = await supabase
                        .from('especie_local')
                        .select(`
                            id,
                            especie:especie_id(
                                id, 
                                nome_cientifico, 
                                nome_popular, 
                                familia_id, 
                                familia:familia_id(id, familia_nome), 
                                imagens(url_imagem)
                            )
                        `)
                        .eq('local_id', projectId)
                        .range(start, end);

                    const normalizedSpecies: LinkedSpecies[] = (speciesData || []).map((item: any) => {
                        const s = item.especie;
                        if (!s) return null;

                        const familia = Array.isArray(s.familia) ? s.familia[0] : s.familia;
                        const imagem = s.imagens && s.imagens.length > 0 ? s.imagens[0]?.url_imagem : null;

                        return {
                            id: s.id,
                            nome_cientifico: s.nome_cientifico,
                            nome_popular: s.nome_popular,
                            familia_id: s.familia_id,
                            familia,
                            imagem
                        };
                    }).filter(Boolean) as LinkedSpecies[];

                    setLinkedSpecies(normalizedSpecies);
                    setTotalPages(Math.ceil(speciesCountTotal / itemsPerPage) || 1);
                    break;

                case 'families':
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
                        speciesForFamilies.forEach((item: any) => {
                            const s = item.especie;
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
        } catch (err) {
            console.error('Error fetching tab data:', err);
        } finally {
            setTabLoading(false);
        }
    }, [projectId, itemsPerPage, usersCount, speciesCountTotal]);

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
                const mapped = data.map((item: any) => item.especie);
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
    }, [activeTab, project]);

    // Page change
    useEffect(() => {
        if (projectId && project && currentPage > 0) {
            fetchTabData(activeTab, currentPage);
        }
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
        isGlobalAdmin
    };
}
