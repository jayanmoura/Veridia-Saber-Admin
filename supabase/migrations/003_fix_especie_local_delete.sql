-- ============================================================
-- Migration 003: Corrige funções RLS e policy DELETE de especie_local
-- Problema: is_admin() e is_staff() usavam roles técnicos (lowercase)
-- mas profiles.role armazena nomes de exibição ('Curador Mestre' etc.)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('super_admin','admin','Curador Mestre','Coordenador Científico','Gestor de Acervo')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('super_admin','admin','catalogador','curador','coordenador',
                   'Curador Mestre','Coordenador Científico','Gestor de Acervo',
                   'Taxonomista Sênior','Taxonomista de Campo')
  );
$$;

CREATE OR REPLACE FUNCTION public.check_user_role_storage()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND role IN ('super_admin','admin','catalogador',
                 'Curador Mestre','Coordenador Científico',
                 'Gestor de Acervo','Taxonomista Sênior','Taxonomista de Campo')
  );
END;
$$;

DROP POLICY IF EXISTS "especie_local_delete_mixed" ON public.especie_local;
CREATE POLICY "especie_local_delete_mixed"
  ON public.especie_local FOR DELETE TO authenticated
  USING ( (SELECT public.is_staff()) OR (created_by = (SELECT auth.uid())) );
