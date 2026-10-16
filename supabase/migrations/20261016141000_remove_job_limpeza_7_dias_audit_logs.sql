-- Registro de migration ja aplicada em producao. Retencao oficial: 60 dias (job limpar-audit-logs-60-dias).
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'limpeza-logs-auditoria';
DROP FUNCTION IF EXISTS public.cleanup_old_audit_logs();
DROP FUNCTION IF EXISTS public.delete_old_logs();
