-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Remove aliases legados (super_admin, admin) que não existem mais em profiles.role
-- Mantém apenas os nomes de exibição reais do RBAC atual
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN (
        'Curador Mestre',
        'Coordenador Científico',
        'Gestor de Acervo'
      )
  );
$$;
