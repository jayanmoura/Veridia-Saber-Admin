-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- profiles estava com SELECT aberto para anon (qualquer pessoa sem login)
-- Restringe para: usuário vê o próprio perfil, staff vê todos
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

CREATE POLICY "profiles_select_own_or_staff"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT is_staff())
);
