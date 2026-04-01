-- ============================================================
-- Migration 004: RLS DELETE com escopo por local_id
-- Funções STABLE cacheadas + policy granular por role
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_user_local_id()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
  SELECT local_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

DROP POLICY IF EXISTS "especie_local_delete_mixed" ON public.especie_local;
CREATE POLICY "especie_local_delete_mixed"
  ON public.especie_local FOR DELETE TO authenticated
  USING (
    get_user_role() = 'Curador Mestre'
    OR (get_user_role() = 'Coordenador Científico' AND get_user_local_id() IS NULL)
    OR (get_user_role() = 'Gestor de Acervo' AND get_user_local_id() = local_id)
    OR (get_user_role() = 'Taxonomista Sênior' AND get_user_local_id() IS NULL AND created_by = (SELECT auth.uid()))
    OR (get_user_role() = 'Taxonomista de Campo' AND get_user_local_id() = local_id AND created_by = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "especie_delete_mixed" ON public.especie;
CREATE POLICY "especie_delete_mixed"
  ON public.especie FOR DELETE TO authenticated
  USING (
    get_user_role() = 'Curador Mestre'
    OR (get_user_role() = 'Coordenador Científico' AND get_user_local_id() IS NULL)
    OR (get_user_role() = 'Gestor de Acervo' AND get_user_local_id() IS NOT NULL
        AND EXISTS (SELECT 1 FROM public.especie_local el WHERE el.especie_id = especie.id AND el.local_id = get_user_local_id()))
    OR (get_user_role() = 'Taxonomista Sênior' AND get_user_local_id() IS NULL AND created_by = (SELECT auth.uid()))
    OR (get_user_role() = 'Taxonomista de Campo' AND created_by = (SELECT auth.uid()) AND get_user_local_id() IS NOT NULL
        AND EXISTS (SELECT 1 FROM public.especie_local el WHERE el.especie_id = especie.id AND el.local_id = get_user_local_id()))
  );
