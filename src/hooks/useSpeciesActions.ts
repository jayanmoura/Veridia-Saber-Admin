import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateSingleSpeciesReport, generateHerbariumLabels, generateSpeciesReport } from '../utils/pdf';
import { getRoleLevel, type UserRole } from '../types/auth';
import { useToast } from './useToast';
import type { Species } from '../types/domain';

interface Profile {
    id: string;
    role?: string;
    local_id?: string;
    full_name?: string;
    institution_id?: string;
}

interface UseSpeciesActionsOptions {
    profile: Profile | null;
    search?: string;
    selectedFamily?: string;
}

interface UseSpeciesActionsReturn {
    // Loading states
    exportLoading: boolean;
    singleReportLoading: string | null;
    genLabelsLoading: boolean;
    singleLabelLoading: string | null;

    // Permissions
    isGlobalAdmin: boolean;
    canGenerateReports: boolean;

    // Actions
    handleExportSpecies: () => Promise<void>;
    handleGenerateSingleReport: (speciesId: string) => Promise<void>;
    handleGenerateLabels: () => Promise<void>;
    handleGenerateSingleLabel: (species: Species) => Promise<void>;
}

/**
 * @description Hook que isola ações de negócio de espécies, como geração de PDFs de relatórios e etiquetas de herbário.
 *
 * @param {UseSpeciesActionsOptions} options - Parâmetros que definem o contexto da ação
 * @param {Profile | null} [options.profile] - Perfil do usuário logado contendo role e local
 * @param {string} [options.search] - Termo de busca usado para filtro global
 * @param {string} [options.selectedFamily] - ID da família atual do filtro
 *
 * @returns {UseSpeciesActionsReturn} Funções e loaders de exportação e permissões:
 *   - `exportLoading` — true durante o download do PDF geral
 *   - `singleReportLoading` — ID da espécie carregando a ficha
 *   - `genLabelsLoading` — true exportando bulk labels
 *   - `singleLabelLoading` — ID gerando label singular
 *   - `isGlobalAdmin` — flag de acesso admin amplo
 *   - `canGenerateReports` — flag de permissão de relatórios
 *   - `handleExportSpecies` — start export massivo
 *   - `handleGenerateSingleReport` — start export único PDF
 *   - `handleGenerateLabels` — gerador massivo etiquetas
 *   - `handleGenerateSingleLabel` — formato folha singular
 *
 * @example
 * const { handleExportSpecies, exportLoading } = useSpeciesActions({ profile, search })
 */
export function useSpeciesActions({ profile, search, selectedFamily }: UseSpeciesActionsOptions): UseSpeciesActionsReturn {
    const [exportLoading, setExportLoading] = useState(false);
    const [singleReportLoading, setSingleReportLoading] = useState<string | null>(null);
    const [genLabelsLoading, setGenLabelsLoading] = useState(false);
    const [singleLabelLoading, setSingleLabelLoading] = useState<string | null>(null);

        const myLevel = getRoleLevel(profile?.role as UserRole);
    const { showToast } = useToast();
    const isGlobalAdmin = myLevel <= 3;
    const canGenerateReports = myLevel === 1 || myLevel === 2 || myLevel === 4;

    // Export species to PDF
    const handleExportSpecies = useCallback(async () => {
        setExportLoading(true);
        try {
            let speciesData;
            let projectName: string | undefined;

            if (isGlobalAdmin) {
                const { data, error } = await supabase
                    .from('especie')
                    .select('nome_cientifico, nome_popular, familia(familia_nome), locais(nome)')
                    .order('nome_cientifico');

                if (error) throw error;
                speciesData = data || [];
            } else {
                                if (!profile?.local_id) {
                    showToast('Você não possui um projeto vinculado para exportar.', 'warning');
                    return;
                }

                const { data: projectData } = await supabase
                    .from('locais')
                    .select('nome')
                    .eq('id', profile.local_id)
                    .single();

                projectName = projectData?.nome;

                const { data, error } = await supabase
                    .from('especie')
                    .select('nome_cientifico, nome_popular, familia(familia_nome)')
                    .eq('local_id', profile.local_id)
                    .order('nome_cientifico');

                if (error) throw error;
                speciesData = data || [];
            }

                        if (speciesData.length === 0) {
                showToast('Nenhuma espécie encontrada para exportar.', 'warning');
                return;
            }

            const fileName = isGlobalAdmin
                ? 'relatorio_especies_geral.pdf'
                : `relatorio_especies_${(projectName || 'projeto').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;

                        generateSpeciesReport(speciesData, fileName, {
                isGlobalReport: isGlobalAdmin,
                projectName
            }, {
                userName: profile?.full_name,
                userRole: profile?.role,
            });
                } catch (error: unknown) {
            console.error('Export error:', error);
            showToast(error instanceof Error ? error.message : 'Erro ao exportar relatório.', 'error');
        } finally {
            setExportLoading(false);
        }
    }, [isGlobalAdmin, profile, showToast]);

    // Generate single species report (Ficha Técnica)
    const handleGenerateSingleReport = useCallback(async (speciesId: string) => {
        setSingleReportLoading(speciesId);
        try {
            const { data: speciesData, error } = await supabase
                .from('especie')
                .select(`
                    id, nome_cientifico, nome_popular, descricao_especie,
                    cuidados_luz, cuidados_agua, cuidados_temperatura,
                    cuidados_substrato, cuidados_nutrientes,
                    familia(familia_nome), locais(nome), imagens(url_imagem)
                `)
                .eq('id', speciesId)
                .single();

            if (error) throw error;
                        if (!speciesData) {
                showToast('Espécie não encontrada.', 'warning');
                return;
            }

            let localDetails = {};
            if (profile?.local_id) {
                const [localRes, overrideRes] = await Promise.all([
                    supabase
                        .from('especie_local')
                        .select('descricao_ocorrencia, detalhes_localizacao, latitude, longitude')
                        .eq('especie_id', speciesId)
                        .eq('local_id', profile.local_id)
                        .maybeSingle(),
                    supabase
                        .from('especie_local_overrides')
                        .select('descricao_especie')
                        .eq('especie_id', speciesId)
                        .eq('local_id', profile.local_id)
                        .maybeSingle(),
                ]);

                if (localRes.data) localDetails = localRes.data;
                if (overrideRes.data?.descricao_especie) {
                    speciesData.descricao_especie = overrideRes.data.descricao_especie;
                }
            }

            const safeName = speciesData.nome_cientifico.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

            await generateSingleSpeciesReport(
                { ...speciesData, ...localDetails },
                `ficha_${safeName}.pdf`,
                { userName: profile?.full_name, userRole: profile?.role }
            );
                } catch (error: unknown) {
            console.error('Single report error:', error);
            showToast(error instanceof Error ? error.message : 'Erro ao gerar ficha técnica.', 'error');
        } finally {
            setSingleReportLoading(null);
        }
    }, [profile, showToast]);

    // Generate bulk herbarium labels
    const handleGenerateLabels = useCallback(async () => {
        setGenLabelsLoading(true);
        try {
            const userLocalId = profile?.local_id;
            let query;

            if (!isGlobalAdmin && userLocalId) {
                query = supabase
                    .from('especie')
                    .select(`
                        nome_cientifico, autor, nome_popular, created_at,
                        familia(familia_nome),
                        especie_local!inner (
                            id, tombo_codigo, detalhes_localizacao, local_id,
                            determinador, data_determinacao,
                            coletor, numero_coletor, morfologia, habitat_ecologia
                        ),
                        locais:local_id(nome, tipo)
                    `)
                    .eq('especie_local.local_id', userLocalId)
                    .order('nome_cientifico');
            } else {
                query = supabase
                    .from('especie')
                    .select(`
                        nome_cientifico, autor, nome_popular, created_at,
                        familia(familia_nome), locais:local_id(nome, tipo)
                    `)
                    .order('nome_cientifico');
            }

            if (search) query = query.ilike('nome_cientifico', `%${search}%`);
            if (selectedFamily) query = query.eq('familia_id', selectedFamily);

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Nenhuma espécie encontrada para gerar etiquetas.', 'warning');
                return;
            }

            const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : undefined;

            const labels = (data as Array<{
                nome_cientifico?: string | null;
                autor?: string | null;
                nome_popular?: string | null;
                created_at?: string;
                familia?: { familia_nome?: string } | { familia_nome?: string }[] | null;
                locais?: { nome?: string; tipo?: string } | { nome?: string; tipo?: string }[] | null;
                especie_local?: { 
                    id?: string; tombo_codigo?: string; detalhes_localizacao?: string; determinador?: string; data_determinacao?: string; coletor?: string; numero_coletor?: string; morfologia?: string; habitat_ecologia?: string; created_at?: string;
                } | { 
                    id?: string; tombo_codigo?: string; detalhes_localizacao?: string; determinador?: string; data_determinacao?: string; coletor?: string; numero_coletor?: string; morfologia?: string; habitat_ecologia?: string; created_at?: string;
                }[] | null;
            }>).map(sp => {
                const details = Array.isArray(sp.especie_local) ? sp.especie_local[0] : sp.especie_local;
                const fam = Array.isArray(sp.familia) ? sp.familia[0] : sp.familia;
                const loc = Array.isArray(sp.locais) ? sp.locais[0] : sp.locais;
                return {
                    scientificName: sp.nome_cientifico || 'Sem Identificação',
                    author: sp.autor || undefined,
                    family: fam?.familia_nome || 'INDETERMINADA',
                    popularName: sp.nome_popular || undefined,
                    collector: details?.coletor || loc?.nome || 'Veridia Saber',
                    collectorNumber: details?.numero_coletor || undefined,
                    date: formatDate(details?.created_at) || formatDate(sp.created_at) || new Date().toLocaleDateString('pt-BR'),
                    location: loc ? `${loc.nome} (${loc.tipo || 'Local'})` : 'Local não informado',
                    notes: details?.detalhes_localizacao || '',
                    morphology: details?.morfologia || undefined,
                    habitat: details?.habitat_ecologia || undefined,
                    determinant: details?.determinador || 'Sistema Veridia',
                    determinationDate: formatDate(details?.data_determinacao) || undefined,
                    tomboNumber: details?.tombo_codigo || details?.id || undefined
                };
            });

            generateHerbariumLabels(labels, 'Etiquetas_Arborizacao.pdf');

            // Persist labels
            if (profile?.id) {
                const persistenceData = (data as Array<{ especie_local?: { id?: string } | { id?: string }[] | null }>).map(sp => {
                        const details = Array.isArray(sp.especie_local) ? sp.especie_local[0] : sp.especie_local;
                        if (!details?.id) return null;
                        const labelSnapshot = labels.find(l => l.tomboNumber === details.id);
                        return {
                            especie_local_id: details.id,
                            gerado_por: profile.id,
                            conteudo_json: labelSnapshot,
                            numero_tombo: details.id
                        };
                    })
                    .filter((item: unknown) => item !== null);

                if (persistenceData.length > 0) {
                    await supabase.from('etiquetas').insert(persistenceData);
                }
            }
                } catch (error: unknown) {
            console.error('Label gen error:', error);
            showToast('Erro ao gerar etiquetas.', 'error');
        } finally {
            setGenLabelsLoading(false);
        }
    }, [isGlobalAdmin, profile, search, selectedFamily, showToast]);

    // Generate single herbarium label
    const handleGenerateSingleLabel = useCallback(async (species: Species) => {
        setSingleLabelLoading(species.id!);
        try {
            const userLocalId = profile?.local_id;

            let query = supabase
                .from('especie_local')
                .select(`
                    id, tombo_codigo, detalhes_localizacao, created_at,
                    determinador, data_determinacao,
                    coletor, numero_coletor, morfologia, habitat_ecologia
                `)
                .eq('especie_id', species.id!);

            if (userLocalId) query = query.eq('local_id', userLocalId);

            const { data: detailsList } = await query;
            const details = detailsList && detailsList.length > 0 ? detailsList[0] : null;

            const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : undefined;

            const label = {
                scientificName: species.nome_cientifico || 'Sem Identificação',
                author: species.autor || undefined,
                family: species.familia?.familia_nome || 'INDETERMINADA',
                popularName: species.nome_popular || undefined,
                collector: details?.coletor || 'Veridia Saber',
                collectorNumber: details?.numero_coletor,
                date: formatDate(details?.created_at) || new Date().toLocaleDateString('pt-BR'),
                location: species.locais?.nome || 'Local do Projeto',
                notes: details?.detalhes_localizacao || '',
                morphology: details?.morfologia,
                habitat: details?.habitat_ecologia,
                determinant: details?.determinador || 'Sistema Veridia',
                determinationDate: formatDate(details?.data_determinacao),
                tomboNumber: details?.tombo_codigo || details?.id
            };

            generateHerbariumLabels([label], `Etiqueta_${(species.nome_cientifico || 'especie').replace(/\s+/g, '_')}.pdf`);

            // Persist label
            if (profile?.id && details?.id) {
                await supabase.from('etiquetas').insert({
                    especie_local_id: details.id,
                    gerado_por: profile.id,
                    conteudo_json: label,
                    numero_tombo: details.id
                });
            }
                } catch (error: unknown) {
            console.error('Single label error:', error);
            showToast('Erro ao gerar etiqueta.', 'error');
        } finally {
            setSingleLabelLoading(null);
        }
    }, [profile, showToast]);

    return {
        exportLoading,
        singleReportLoading,
        genLabelsLoading,
        singleLabelLoading,
        isGlobalAdmin,
        canGenerateReports,
        handleExportSpecies,
        handleGenerateSingleReport,
        handleGenerateLabels,
        handleGenerateSingleLabel
    };
}
