-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Ajuste pós-diagnóstico da Fase 4: o fluxo de "desvincular espécie do
-- projeto" (Species.tsx) zera especie.local_id quando o último vínculo em
-- especie_local é removido. O WITH CHECK de especie_update_mixed rejeitava
-- essa transição para NULL quando o usuário não é o created_by original.
-- A permissão de tocar a linha já é garantida pelo USING (baseado no
-- local_id ATUAL do registro, antes do update) - este ajuste só libera o
-- destino específico "virar NULL" no WITH CHECK, sem abrir mais nenhuma
-- outra transição.

DROP POLICY IF EXISTS especie_update_mixed ON public.especie;
CREATE POLICY especie_update_mixed ON public.especie
  FOR UPDATE
  USING (
    is_local_staff_for(local_id)
    OR created_by = (SELECT auth.uid())
  )
  WITH CHECK (
    is_local_staff_for(local_id)
    OR created_by = (SELECT auth.uid())
    OR local_id IS NULL
  );
