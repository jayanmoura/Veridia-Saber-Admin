import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { generateSingleSpeciesReport, generateSpeciesReport } from '../utils/pdf';
import { getRoleLevel, type UserRole } from '../types/auth';
import { useToast } from './useToast';

interface Profile {
    id: string;
    role?: string;
    local_id?: string | number | null;
    full_name?: string;
    institution_id?: string | null;
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

    // Permissions
    isGlobalAdmin: boolean;
    canGenerateReports: boolean;

    // Actions
    handleExportSpecies: () => Promise<void>;
    handleGenerateSingleReport: (speciesId: string) => Promise<void>;
}

/**
 * @description Hook que isola ações de negócio de espécies, como geração de PDFs de relatórios.
 *
 * @param {UseSpeciesActionsOptions} options - Parâmetros que definem o contexto da ação
 * @param {Profile | null} [options.profile] - Perfil do usuário logado contendo role e local
 * @param {string} [options.search] - Termo de busca usado para filtro global
 * @param {string} [options.selectedFamily] - ID da família atual do filtro
 *
 * @returns {UseSpeciesActionsReturn} Funções e loaders de exportação e permissões:
 *   - `exportLoading` — true durante o download do PDF geral
 *   - `singleReportLoading` — ID da espécie carregando a ficha
 *   - `isGlobalAdmin` — flag de acesso admin amplo
 *   - `canGenerateReports` — flag de permissão de relatórios
 *   - `handleExportSpecies` — start export massivo
 *   - `handleGenerateSingleReport` — start export único PDF
 *
 * @example
 * const { handleExportSpecies, exportLoading } = useSpeciesActions({ profile, search })
 */
export function useSpeciesActions({ profile }: UseSpeciesActionsOptions): UseSpeciesActionsReturn {
    const [exportLoading, setExportLoading] = useState(false);
    const [singleReportLoading, setSingleReportLoading] = useState<string | null>(null);

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

    return {
        exportLoading,
        singleReportLoading,
        isGlobalAdmin,
        canGenerateReports,
        handleExportSpecies,
        handleGenerateSingleReport
    };
}
