import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateSingleSpeciesReport, generateHerbariumLabels, generateSpeciesReport } from '../utils/pdf';
import { getRoleLevel } from '../types/auth';

interface Profile {
    id: string;
    role?: string;
    local_id?: string;
    full_name?: string;
    institution_id?: string;
}

interface Species {
    id: string;
    nome_cientifico: string;
    autor?: string | null;
    nome_popular: string | null;
    familia?: { familia_nome: string };
    locais?: { nome: string; tipo?: string };
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
 * Hook for species PDF generation, export, and label actions.
 */
export function useSpeciesActions({ profile, search, selectedFamily }: UseSpeciesActionsOptions): UseSpeciesActionsReturn {
    const [exportLoading, setExportLoading] = useState(false);
    const [singleReportLoading, setSingleReportLoading] = useState<string | null>(null);
    const [genLabelsLoading, setGenLabelsLoading] = useState(false);
    const [singleLabelLoading, setSingleLabelLoading] = useState<string | null>(null);

    const myLevel = getRoleLevel(profile?.role as any);
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
                    alert('Você não possui um projeto vinculado para exportar.');
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
                alert('Nenhuma espécie encontrada para exportar.');
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
        } catch (error: any) {
            console.error('Export error:', error);
            alert(error.message || 'Erro ao exportar relatório.');
        } finally {
            setExportLoading(false);
        }
    }, [isGlobalAdmin, profile]);

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
                alert('Espécie não encontrada.');
                return;
            }

            let localDetails = {};
            if (profile?.local_id) {
                const { data: localData } = await supabase
                    .from('especie_local')
                    .select('descricao_ocorrencia, detalhes_localizacao, latitude, longitude')
                    .eq('especie_id', speciesId)
                    .eq('local_id', profile.local_id)
                    .maybeSingle();

                if (localData) localDetails = localData;
            }

            const safeName = speciesData.nome_cientifico.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

            await generateSingleSpeciesReport(
                { ...speciesData, ...localDetails },
                `ficha_${safeName}.pdf`,
                { userName: profile?.full_name, userRole: profile?.role }
            );
        } catch (error: any) {
            console.error('Single report error:', error);
            alert(error.message || 'Erro ao gerar ficha técnica.');
        } finally {
            setSingleReportLoading(null);
        }
    }, [profile]);

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
                alert('Nenhuma espécie encontrada para gerar etiquetas.');
                return;
            }

            const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : undefined;

            const labels = data.map((sp: any) => {
                const details = Array.isArray(sp.especie_local) ? sp.especie_local[0] : sp.especie_local;
                return {
                    scientificName: sp.nome_cientifico || 'Sem Identificação',
                    author: sp.autor || undefined,
                    family: sp.familia?.familia_nome || 'INDETERMINADA',
                    popularName: sp.nome_popular,
                    collector: details?.coletor || sp.locais?.nome || 'Veridia Saber',
                    collectorNumber: details?.numero_coletor,
                    date: formatDate(details?.created_at) || new Date(sp.created_at).toLocaleDateString('pt-BR'),
                    location: sp.locais ? `${sp.locais.nome} (${sp.locais.tipo || 'Local'})` : 'Local não informado',
                    notes: details?.detalhes_localizacao || '',
                    morphology: details?.morfologia,
                    habitat: details?.habitat_ecologia,
                    determinant: details?.determinador || 'Sistema Veridia',
                    determinationDate: formatDate(details?.data_determinacao),
                    tomboNumber: details?.tombo_codigo || details?.id
                };
            });

            generateHerbariumLabels(labels, 'Etiquetas_Arborizacao.pdf');

            // Persist labels
            if (profile?.id) {
                const persistenceData = data
                    .map((sp: any) => {
                        const details = Array.isArray(sp.especie_local) ? sp.especie_local[0] : sp.especie_local;
                        if (!details?.id) return null;
                        const labelSnapshot = labels.find((l: any) => l.tomboNumber === details.id);
                        return {
                            especie_local_id: details.id,
                            gerado_por: profile.id,
                            conteudo_json: labelSnapshot,
                            numero_tombo: details.id
                        };
                    })
                    .filter((item: any) => item !== null);

                if (persistenceData.length > 0) {
                    await supabase.from('etiquetas').insert(persistenceData);
                }
            }
        } catch (error: any) {
            console.error('Label gen error:', error);
            alert('Erro ao gerar etiquetas.');
        } finally {
            setGenLabelsLoading(false);
        }
    }, [isGlobalAdmin, profile, search, selectedFamily]);

    // Generate single herbarium label
    const handleGenerateSingleLabel = useCallback(async (species: Species) => {
        setSingleLabelLoading(species.id);
        try {
            const userLocalId = profile?.local_id;

            let query = supabase
                .from('especie_local')
                .select(`
                    id, tombo_codigo, detalhes_localizacao, created_at,
                    determinador, data_determinacao,
                    coletor, numero_coletor, morfologia, habitat_ecologia
                `)
                .eq('especie_id', species.id);

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
        } catch (error: any) {
            console.error('Single label error:', error);
            alert('Erro ao gerar etiqueta.');
        } finally {
            setSingleLabelLoading(null);
        }
    }, [profile]);

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
