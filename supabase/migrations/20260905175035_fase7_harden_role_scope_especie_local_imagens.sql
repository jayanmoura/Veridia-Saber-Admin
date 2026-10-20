-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Padronizacao de role (public -> authenticated) em especie_local e imagens,
-- por consistencia com especie_insert_mixed/especie_update_mixed (corrigidas
-- na mesma sessao) e com especie_delete_mixed/especie_local_delete_mixed
-- (ja eram authenticated). Nao muda logica de USING/WITH CHECK: confirmado
-- que is_local_staff_for() ja retorna false para anon (auth.uid() e sempre
-- NULL para anon, e nao existe profile com id NULL), entao essas policies
-- nunca foram exploraveis por anon na pratica -- e so higiene/defesa em
-- profundidade, nao correcao de vulnerabilidade ativa.

DROP POLICY IF EXISTS "especie_local_insert_mixed" ON public.especie_local;
CREATE POLICY "especie_local_insert_mixed"
  ON public.especie_local FOR INSERT
  TO authenticated
  WITH CHECK (
    is_local_staff_for(local_id)
    OR (created_by = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "especie_local_update_mixed" ON public.especie_local;
CREATE POLICY "especie_local_update_mixed"
  ON public.especie_local FOR UPDATE
  TO authenticated
  USING (
    is_local_staff_for(local_id)
    OR (created_by = (SELECT auth.uid()))
  )
  WITH CHECK (
    is_local_staff_for(local_id)
    OR (created_by = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "imagens_insert_mixed" ON public.imagens;
CREATE POLICY "imagens_insert_mixed"
  ON public.imagens FOR INSERT
  TO authenticated
  WITH CHECK (
    is_local_staff_for(local_id)
    OR (criado_por = ((SELECT auth.uid()))::text)
  );

DROP POLICY IF EXISTS "imagens_update_mixed" ON public.imagens;
CREATE POLICY "imagens_update_mixed"
  ON public.imagens FOR UPDATE
  TO authenticated
  USING (
    is_local_staff_for(local_id)
    OR (criado_por = ((SELECT auth.uid()))::text)
  )
  WITH CHECK (
    is_local_staff_for(local_id)
    OR (criado_por = ((SELECT auth.uid()))::text)
  );

DROP POLICY IF EXISTS "imagens_delete_mixed" ON public.imagens;
CREATE POLICY "imagens_delete_mixed"
  ON public.imagens FOR DELETE
  TO authenticated
  USING (
    is_local_staff_for(local_id)
    OR (criado_por = ((SELECT auth.uid()))::text)
  );
