-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Remove UPDATE e DELETE públicos da beta_testers
-- O fluxo de "queimar convite" passa a ser feito via service role no backend,
-- não diretamente pelo frontend anônimo
DROP POLICY IF EXISTS "Allow anonymous download update" ON public.beta_testers;
DROP POLICY IF EXISTS "Allow anonymous delete after download" ON public.beta_testers;

-- Mantém SELECT público restrito: retorna NADA se email não existir ou is_active = false
-- O frontend simplesmente recebe array vazio - sem mensagem de erro revelando existência
DROP POLICY IF EXISTS "beta_testers_select_public" ON public.beta_testers;

CREATE POLICY "beta_testers_select_active_only"
ON public.beta_testers FOR SELECT
TO anon, authenticated
USING (is_active = true);
