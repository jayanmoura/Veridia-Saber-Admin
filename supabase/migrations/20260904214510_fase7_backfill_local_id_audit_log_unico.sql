-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Backfill pontual: único registro de audit_logs criado antes da coluna
-- local_id existir (Feature 1, testes de especie_local_overrides).
UPDATE public.audit_logs
SET local_id = 41
WHERE id = 1169 AND table_name = 'especie_local_overrides' AND record_id = '1' AND local_id IS NULL;
