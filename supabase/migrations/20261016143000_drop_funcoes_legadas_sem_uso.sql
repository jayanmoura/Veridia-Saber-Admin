-- Registro de migration ja aplicada em producao.
DROP FUNCTION IF EXISTS public.add_team_member(text, text);
DROP FUNCTION IF EXISTS public.add_team_member(text, text, uuid);
DROP FUNCTION IF EXISTS public.remove_team_member(uuid);
DROP FUNCTION IF EXISTS public.update_team_member_role(uuid, text);
DROP FUNCTION IF EXISTS public.delete_user_total(uuid);
DROP FUNCTION IF EXISTS public.delete_especie_secure(text);
DROP FUNCTION IF EXISTS public.limpar_arquivos_orfaos(boolean);
DROP FUNCTION IF EXISTS public.listar_arquivos_orfaos();
DROP FUNCTION IF EXISTS public.can_manage_catalog();
DROP FUNCTION IF EXISTS public.can_manage_image(uuid);
DROP FUNCTION IF EXISTS public.check_user_role(text[]);
DROP FUNCTION IF EXISTS public.check_user_role_storage();
DROP FUNCTION IF EXISTS public.get_my_inst_id();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin_or_manager();
DROP FUNCTION IF EXISTS public.get_role_weight(text);
DROP FUNCTION IF EXISTS public.validate_role_context();
DROP FUNCTION IF EXISTS public.vincular_todas_plantas_sem_familia_id();
