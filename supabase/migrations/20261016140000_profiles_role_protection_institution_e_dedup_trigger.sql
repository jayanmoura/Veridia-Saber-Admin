-- Registro de migration ja aplicada em producao (rodada pelo SQL Editor).
CREATE OR REPLACE FUNCTION public.enforce_profile_role_protection()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  actor_id uuid := (SELECT auth.uid());
  editor_role text; editor_level int; target_old_level int; target_new_level int;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.local_id IS NOT DISTINCT FROM OLD.local_id
     AND NEW.institution_id IS NOT DISTINCT FROM OLD.institution_id THEN
    RETURN NEW;
  END IF;
  IF actor_id IS NULL THEN RETURN NEW; END IF;
  IF actor_id = OLD.id THEN
    RAISE EXCEPTION 'Não é permitido alterar sua própria role, local_id ou institution_id.';
  END IF;
  SELECT role INTO editor_role FROM public.profiles WHERE id = actor_id;
  editor_level      := public.get_role_level(editor_role);
  target_old_level  := public.get_role_level(OLD.role);
  target_new_level  := public.get_role_level(NEW.role);
  IF editor_level >= target_old_level THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar este usuário.';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role AND editor_level >= target_new_level THEN
    RAISE EXCEPTION 'Sem permissão para atribuir esta role.';
  END IF;
  IF NEW.institution_id IS DISTINCT FROM OLD.institution_id AND editor_level > 2 THEN
    IF NOT (
      NEW.local_id IS DISTINCT FROM OLD.local_id
      AND NEW.local_id IS NOT NULL
      AND NEW.institution_id IS NOT DISTINCT FROM (
        SELECT l.institution_id FROM public.locais l WHERE l.id = NEW.local_id)
    ) THEN
      RAISE EXCEPTION 'Sem permissão para alterar a instituição deste usuário.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_profiles_default_institution ON public.profiles;
DROP FUNCTION IF EXISTS public.set_default_institution_id();
