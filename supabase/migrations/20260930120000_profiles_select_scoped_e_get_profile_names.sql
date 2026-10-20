-- Registro (20260930120000_profiles_select_scoped_e_get_profile_names): aplicado manualmente via SQL Editor em 2026. Idempotente, seguro para reaplicar.
CREATE OR REPLACE FUNCTION public.get_profile_names(p_ids uuid[])
 RETURNS TABLE(id uuid, full_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select p.id, p.full_name
  from public.profiles p
  where p.id = any(p_ids)
    and (select public.is_staff());
$function$;

DROP POLICY IF EXISTS profiles_select_scoped ON public.profiles;
CREATE POLICY profiles_select_scoped ON public.profiles
  FOR SELECT
  USING (
    (id = (SELECT auth.uid()))
    OR (SELECT is_global_taxonomist())
    OR (SELECT is_local_manager_of(profiles.local_id))
  );
