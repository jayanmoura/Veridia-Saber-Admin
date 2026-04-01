-- ============================================================
-- Migration 007: Corrige policy INSERT de beta_testers
-- Problema: bloqueava admins de cadastrar emails de terceiros
-- ============================================================

DROP POLICY IF EXISTS "beta_testers_insert_auth" ON public.beta_testers;
CREATE POLICY "beta_testers_insert_auth"
  ON public.beta_testers FOR INSERT TO authenticated
  WITH CHECK ( (SELECT public.is_staff()) );
