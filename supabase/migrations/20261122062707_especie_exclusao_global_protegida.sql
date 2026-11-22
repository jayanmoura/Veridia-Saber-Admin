-- 20261122120100_especie_exclusao_global_protegida
-- Relatório de segurança de 22/11/2026, achado 3.
-- Papéis locais (Gestor de Acervo, Taxonomista de Campo) deixam de poder apagar a linha global
-- de especie. O desvínculo local do painel continua por UPDATE (especie_update_mixed).
-- O banco passa a impedir a exclusão de uma espécie que ainda tenha espécimes.

DROP POLICY IF EXISTS especie_delete_mixed ON public.especie;
CREATE POLICY especie_delete_mixed ON public.especie
  FOR DELETE TO authenticated
  USING (
    (public.get_user_role() = 'Curador Mestre')
    OR (public.get_user_role() = 'Coordenador Científico' AND public.get_user_local_id() IS NULL)
    OR (public.get_user_role() = 'Taxonomista Sênior' AND public.get_user_local_id() IS NULL
        AND created_by = (SELECT auth.uid()))
  );

-- Espécimes não são mais apagados em cascata junto com a espécie (o painel já trata o erro 23503).
ALTER TABLE public.especie_local DROP CONSTRAINT IF EXISTS fk_especie_local_cascade;
ALTER TABLE public.especie_local DROP CONSTRAINT IF EXISTS especie_local_especie_id_fkey;
ALTER TABLE public.especie_local
  ADD CONSTRAINT especie_local_especie_id_fkey
  FOREIGN KEY (especie_id) REFERENCES public.especie(id) ON DELETE RESTRICT;
