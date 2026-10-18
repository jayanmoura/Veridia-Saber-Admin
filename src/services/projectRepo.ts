import { supabase } from '../lib/supabase';
import { deleteFolder, deleteImageVariants } from '../utils/storage';

export const projectRepo = {
  /**
   * Exclui um projeto completamente (Storage + Banco).
   * Regra de produto: Storage SEMPRE antes do banco; se o storage falhar, não apaga nada no banco.
   */
  async deleteProject(id: string | number): Promise<void> {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new Error('ID do projeto inválido');
    }

    // 1. Storage ANTES do banco
    // Busca URLs de imagens associadas ao local para apagar variantes
    const { data: projectImages, error: imgFetchError } = await supabase
      .from('imagens')
      .select('url_imagem, url_thumbnail, url_micro')
      .eq('local_id', numericId);

    if (imgFetchError) throw imgFetchError;

    if (projectImages && projectImages.length > 0) {
      const urls = projectImages.flatMap((img) => [img.url_imagem, img.url_thumbnail, img.url_micro]);
      await deleteImageVariants(urls);
    }

    // Apaga toda a pasta do projeto no bucket arquivos-gerais
    await deleteFolder('arquivos-gerais', `locais/${numericId}`);

    // 2. Banco de dados (somente após sucesso no storage)
    // Deleta registros na tabela imagens vinculados ao local
    const { error: imgDelError } = await supabase
      .from('imagens')
      .delete()
      .eq('local_id', numericId);
    if (imgDelError) throw imgDelError;

    // Deleta espécimes (especie_local) do local
    const { error: elError } = await supabase
      .from('especie_local')
      .delete()
      .eq('local_id', numericId);
    if (elError) throw new Error(`Não foi possível excluir espécimes: ${elError.message}`);

    // Desvincula espécies do projeto
    const { error: espError } = await supabase
      .from('especie')
      .update({ local_id: null })
      .eq('local_id', numericId);
    if (espError) throw espError;

    // Desvincula usuários do projeto e rebaixa para Consulente
    const { error: profError } = await supabase
      .from('profiles')
      .update({
        local_id: null,
        role: 'Consulente',
      })
      .eq('local_id', numericId);
    if (profError) throw profError;

    // Deleta o registro em locais
    const { error: delLocalError } = await supabase
      .from('locais')
      .delete()
      .eq('id', numericId);
    if (delLocalError) throw new Error(`Não foi possível excluir o projeto: ${delLocalError.message}`);

    // Verifica se realmente foi deletado
    const { data: stillExists, error: checkError } = await supabase
      .from('locais')
      .select('id')
      .eq('id', numericId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (stillExists) {
      throw new Error('Não foi possível excluir o projeto. Verifique suas permissões.');
    }
  },
};
