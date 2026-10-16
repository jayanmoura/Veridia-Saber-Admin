-- Registro de migration ja aplicada em producao.
ALTER POLICY locais_update_mixed ON public.locais
  USING (
    (SELECT public.is_local_staff_for(id))
    OR gestor_id = (SELECT auth.uid())
  );
DROP POLICY IF EXISTS audit_logs_insert_staff ON public.audit_logs;
