-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
DROP POLICY IF EXISTS "Allow anonymous email check" ON public.beta_testers;
