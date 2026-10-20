-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Fase 7, Feature 3: retenção de 60 dias em audit_logs.
-- Roda um dia depois do job de relatórios (dia 05), no dia 06, com folga
-- suficiente: o relatório mensal só precisa do mês fechado mais recente
-- (no máximo ~35 dias de idade), bem dentro da janela de 60 dias.

CREATE OR REPLACE FUNCTION public.fn_limpar_audit_logs_antigos()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '60 days';
END;
$$;

COMMENT ON FUNCTION public.fn_limpar_audit_logs_antigos() IS
  'Fase 7: expira registros de audit_logs com mais de 60 dias. Agendado via pg_cron, roda um dia depois da geração de relatórios (dia 06) para garantir folga. Criado em 04/09/2026.';

SELECT cron.schedule(
  'limpar-audit-logs-60-dias',
  '0 4 6 * *',
  $$ SELECT public.fn_limpar_audit_logs_antigos(); $$
);
