import { supabase } from '../lib/supabase';
import { deleteFolder, deleteImageVariants } from '../utils/storage';

interface PendingCleanupItem {
  id: number;
  tipo: string;
  valor: string;
}

async function removerItens(itens: PendingCleanupItem[]): Promise<number> {
  let falhas = 0;

  for (const item of itens) {
    try {
      if (item.tipo === 'url') {
        await deleteImageVariants([item.valor]);
      } else if (item.tipo === 'pasta') {
        const slashIdx = item.valor.indexOf('/');
        if (slashIdx === -1) {
          throw new Error(`Formato de pasta inválido: ${item.valor}`);
        }
        const bucket = item.valor.slice(0, slashIdx);
        const prefixo = item.valor.slice(slashIdx + 1);
        await deleteFolder(bucket, prefixo);
      } else {
        throw new Error(`Tipo de limpeza desconhecido: ${item.tipo}`);
      }

      const { error } = await supabase
        .from('storage_limpeza_pendente')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
    } catch {
      falhas += 1;
    }
  }

  return falhas;
}

export async function limparStoragePendente(): Promise<{ removidos: number; falhas: number }> {
  const { data, error } = await supabase
    .from('storage_limpeza_pendente')
    .select('id, tipo, valor');

  if (error) throw error;

  const itens = data ?? [];
  const falhas = await removerItens(itens);
  return {
    removidos: itens.length - falhas,
    falhas,
  };
}

export const projectRepo = {
  limparStoragePendente,

  /**
   * Exclui um projeto de forma transacional no banco via RPC `excluir_projeto`
   * e remove os arquivos correspondentes do storage em seguida.
   * Exceção à regra "storage antes do banco": aqui a RPC grava antes as URLs/pastas
   * em `storage_limpeza_pendente`, permitindo nova tentativa caso o storage falhe.
   */
  async deleteProject(id: string | number): Promise<{ arquivosPendentes: number }> {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new Error('ID do projeto inválido');
    }

    try {
      await projectRepo.limparStoragePendente();
    } catch {
      // Falhas ao limpar pendências anteriores não interrompem a exclusão atual
    }

    const { data, error } = await supabase.rpc('excluir_projeto', { p_local_id: numericId });
    if (error) {
      if (error.code === '42501') {
        throw new Error('Sem permissão para excluir projetos.');
      }
      if (error.code === 'P0002') {
        throw new Error('Projeto não encontrado.');
      }
      throw new Error(error.message);
    }

    const itens: PendingCleanupItem[] = (data ?? []).map((row) => ({
      id: row.item_id,
      tipo: row.item_tipo,
      valor: row.item_valor,
    }));

    const arquivosPendentes = await removerItens(itens);
    return { arquivosPendentes };
  },
};
