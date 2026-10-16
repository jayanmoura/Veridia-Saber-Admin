-- Registro de migration ja aplicada em producao (versao consolidada).
-- As funcoes sem uso (add_team_member, remove_team_member, update_team_member_role,
-- delete_user_total, delete_especie_secure, limpar_arquivos_orfaos, listar_arquivos_orfaos,
-- cleanup_old_audit_logs) tambem tiveram EXECUTE revogado aqui, mas foram dropadas em migrations
-- posteriores, por isso nao aparecem neste arquivo.
REVOKE ALL ON FUNCTION public.enforce_profile_role_protection() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_audit_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_resync_sequence_apos_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_institution() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unlink_storage_files_before_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_gerar_relatorios_periodicos() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_limpar_audit_logs_antigos() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.buscar_botanica(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.buscar_botanica(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_institution_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_local_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_global_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_global_taxonomist() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_local_manager_of(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_local_staff_for(bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;

ALTER FUNCTION public.get_role_level(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_especie_local_overrides_updated_at() SET search_path = pg_catalog, public;
