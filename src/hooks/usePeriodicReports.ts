import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PeriodicReport } from '../types/domain';

export interface UsePeriodicReportsOptions {
  enabled?: boolean;
}

export interface UsePeriodicReportsReturn {
  reports: PeriodicReport[];
  years: number[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * @description Hook de leitura para consultar a tabela de relatórios periódicos de atividade (relatorios_periodicos).
 */
export function usePeriodicReports(options: UsePeriodicReportsOptions = {}): UsePeriodicReportsReturn {
  const { enabled = true } = options;

  const [reports, setReports] = useState<PeriodicReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('relatorios_periodicos')
        .select('id, tipo, ano, periodo_inicio, periodo_fim, periodo_label, dados, gerado_em')
        .order('ano', { ascending: false })
        .order('periodo_inicio', { ascending: true });

      if (supabaseError) throw supabaseError;

      setReports((data as PeriodicReport[]) || []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Erro ao consultar relatórios periódicos:', err);
      setError(e.message || 'Erro ao carregar relatórios periódicos.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Nível 1: lista de ANOS que têm pelo menos um registro em relatorios_periodicos (ordenado descrescente)
  const years = Array.from(new Set(reports.map((r) => r.ano))).sort((a, b) => b - a);

  return {
    reports,
    years,
    loading,
    error,
    refetch: fetchReports,
  };
}
