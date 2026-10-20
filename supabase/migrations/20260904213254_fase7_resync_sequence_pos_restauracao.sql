-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Fase 7, Feature 3 (dependência do botão Restaurar): previne dessincronização
-- de sequence quando um ID explícito é reinserido (ex.: restauração via
-- audit_logs.old_data em tabelas com IDENTITY BY DEFAULT). Sem isso, o
-- próximo INSERT normal do painel poderia colidir com o ID restaurado.

CREATE OR REPLACE FUNCTION public.fn_resync_sequence_apos_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  v_seq TEXT;
  v_max BIGINT;
BEGIN
  v_seq := pg_get_serial_sequence(TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, 'id');
  IF v_seq IS NOT NULL THEN
    EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I.%I', TG_TABLE_SCHEMA, TG_TABLE_NAME) INTO v_max;
    PERFORM setval(v_seq, GREATEST(v_max, 1), true);
  END IF;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.fn_resync_sequence_apos_insert() IS
  'Fase 7: mantém a sequence de id sincronizada mesmo após inserts com id explícito (ex.: restauração via botão Restaurar em AuditLogs.tsx). Criado em 04/09/2026.';

CREATE TRIGGER trg_resync_seq_especie_local
  AFTER INSERT ON public.especie_local
  FOR EACH ROW EXECUTE FUNCTION public.fn_resync_sequence_apos_insert();

CREATE TRIGGER trg_resync_seq_locais
  AFTER INSERT ON public.locais
  FOR EACH ROW EXECUTE FUNCTION public.fn_resync_sequence_apos_insert();
