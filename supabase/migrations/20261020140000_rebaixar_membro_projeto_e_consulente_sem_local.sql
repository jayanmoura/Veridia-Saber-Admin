-- Registro (20261020140000_rebaixar_membro_projeto_e_consulente_sem_local): aplicado manualmente via SQL Editor em 2026. Idempotente, seguro para reaplicar.
CREATE OR REPLACE FUNCTION public.rebaixar_membro_projeto(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_actor_role text; v_actor_local bigint; v_target record;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Não autenticado.'; END IF;
  IF v_actor = p_user_id THEN RAISE EXCEPTION 'Não é permitido rebaixar a si mesmo.'; END IF;
  SELECT role, local_id INTO v_actor_role, v_actor_local FROM public.profiles WHERE id = v_actor;
  SELECT id, role, local_id INTO v_target FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuário não encontrado.'; END IF;
  IF v_actor_role = 'Gestor de Acervo' THEN
    IF v_actor_local IS NULL OR v_target.local_id IS DISTINCT FROM v_actor_local THEN
      RAISE EXCEPTION 'Este usuário não pertence ao seu projeto.';
    END IF;
  ELSIF v_actor_role NOT IN ('Curador Mestre', 'Coordenador Científico') THEN
    RAISE EXCEPTION 'Sem permissão para rebaixar usuários.';
  END IF;
  IF public.get_role_level(v_actor_role) >= public.get_role_level(v_target.role) THEN
    RAISE EXCEPTION 'Sem permissão para gerenciar este usuário.';
  END IF;
  UPDATE public.profiles SET role = 'Consulente', local_id = NULL WHERE id = p_user_id;
END $function$;

REVOKE EXECUTE ON FUNCTION public.rebaixar_membro_projeto(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rebaixar_membro_projeto(uuid) TO authenticated;

UPDATE public.profiles SET local_id = NULL WHERE role = 'Consulente' AND local_id IS NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_consulente_sem_local;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_consulente_sem_local CHECK (role <> 'Consulente' OR local_id IS NULL);
