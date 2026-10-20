-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Corrige brecha de seguranca na policy de INSERT de "especie":
-- a WITH CHECK original incluia "OR (created_by IS NULL)", permitindo que
-- qualquer requisicao (inclusive anon, ja que a role estava como "public")
-- inserisse uma especie inteira sem passar por nenhum RBAC, bastando omitir
-- o campo created_by. Investigacao confirmou: nenhuma linha existente depende
-- disso, nenhum trigger preenche created_by automaticamente, e o unico fluxo
-- de codigo que envia created_by como null (SpeciesModalRefactored.tsx,
-- fallback profile?.id || null) e um bug de robustez do frontend, nao um
-- comportamento desejado.

DROP POLICY IF EXISTS "especie_insert_mixed" ON public.especie;

CREATE POLICY "especie_insert_mixed"
  ON public.especie FOR INSERT
  TO authenticated
  WITH CHECK (
    is_local_staff_for(local_id)
    OR (created_by = (SELECT auth.uid()))
  );

-- Restringe tambem a role do UPDATE para "authenticated" (estava "public"),
-- por consistencia com o DELETE (ja restrito a authenticated) e como
-- defesa em profundidade. A logica do USING/WITH CHECK nao muda: para anon
-- (auth.uid() sempre NULL) nenhuma das condicoes ja fechava, entao nao havia
-- exploracao pratica aqui, mas nao ha motivo pra manter a role mais aberta
-- do que o necessario.

DROP POLICY IF EXISTS "especie_update_mixed" ON public.especie;

CREATE POLICY "especie_update_mixed"
  ON public.especie FOR UPDATE
  TO authenticated
  USING (
    is_local_staff_for(local_id)
    OR (created_by = (SELECT auth.uid()))
  )
  WITH CHECK (
    is_local_staff_for(local_id)
    OR (created_by = (SELECT auth.uid()))
    OR (local_id IS NULL)
  );
