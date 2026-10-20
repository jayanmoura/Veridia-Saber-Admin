-- Registro (20261020120000_revoke_anon_select_tabelas_internas): aplicado manualmente via SQL Editor em 2026. Idempotente, seguro para reaplicar.
REVOKE SELECT ON TABLE public.analytics_events, public.audit_logs, public.colecao_imagens, public.colecoes, public.institutions, public.plantas_da_colecao, public.relatorios_periodicos FROM PUBLIC, anon;
REVOKE SELECT ON TABLE public.analytics_daily_active_users, public.analytics_events_summary, public.user_roles_display, public.locais_estatisticas, public.view_pendentes_oficial FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_agregar_audit_logs(timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_somar_dados_relatorios(bigint[]) FROM PUBLIC, anon;
