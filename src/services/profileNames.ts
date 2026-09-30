import { supabase } from '../lib/supabase';

/**
 * Busca nomes de perfis em lote para exibição amigável no painel administrativo.
 * Usa a função RPC get_profile_names (SECURITY DEFINER) para contornar restrições de escopo.
 * Trata erros de rede sem quebrar a renderização dos mapas.
 */
export async function fetchProfileNames(ids: string[]): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();

  // Remove vazios e duplicados
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id && id.trim()))));
  if (uniqueIds.length === 0) {
    return nameMap;
  }

  // Processa em lotes de 100 IDs
  const chunkSize = 100;
  for (let i = 0; i < uniqueIds.length; i += chunkSize) {
    const chunk = uniqueIds.slice(i, i + chunkSize);

    try {
      const { data, error } = await supabase.rpc('get_profile_names', { p_ids: chunk });

      if (error) {
        console.warn('Não foi possível carregar nomes de perfis (restrição RLS ou erro de rede).');
      } else if (data) {
        const rows = data as Array<{ id: string; full_name: string | null }>;
        for (const profile of rows) {
          if (profile.id && profile.full_name) {
            nameMap.set(profile.id, profile.full_name);
          }
        }
      }
    } catch {
      console.warn('Erro inesperado ao consultar nomes de perfis para o mapa.');
    }
  }

  return nameMap;
}
