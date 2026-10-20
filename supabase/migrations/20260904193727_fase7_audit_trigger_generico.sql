-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Fase 7, Feature 2 (pré-requisito): auditoria estava completamente quebrada
-- (0 de 23 ações de CRUD gravavam em audit_logs; a única tentativa existente
-- gravava em tabela errada 'audit_log' com colunas incompatíveis).
-- Solução: trigger genérico de banco, anexado às tabelas auditáveis,
-- em vez de inserts manuais espalhados pelo frontend.

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_catalog'
AS $$
DECLARE
  v_record_id TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := (to_jsonb(OLD)->>'id');
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_record_id := (to_jsonb(NEW)->>'id');
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  ELSE
    v_record_id := (to_jsonb(NEW)->>'id');
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, record_id, old_data, new_data, action)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_record_id, v_old_data, v_new_data, TG_OP);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.fn_audit_trigger() IS
  'Fase 7: trigger genérico de auditoria, substitui inserts manuais quebrados/ausentes no frontend. Criado em 04/09/2026.';

CREATE TRIGGER trg_audit_especie AFTER INSERT OR UPDATE OR DELETE ON public.especie
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_especie_local AFTER INSERT OR UPDATE OR DELETE ON public.especie_local
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_especie_local_overrides AFTER INSERT OR UPDATE OR DELETE ON public.especie_local_overrides
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_familia AFTER INSERT OR UPDATE OR DELETE ON public.familia
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_familia_nomenclatura_legado AFTER INSERT OR UPDATE OR DELETE ON public.familia_nomenclatura_legado
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_locais AFTER INSERT OR UPDATE OR DELETE ON public.locais
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_imagens AFTER INSERT OR UPDATE OR DELETE ON public.imagens
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_conteudo_orgaos AFTER INSERT OR UPDATE OR DELETE ON public.conteudo_orgaos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
