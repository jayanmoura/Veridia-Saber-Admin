-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Fase 7, Feature 4: filtro por projeto na auditoria + painel de atividades
-- recentes do Gestor de Acervo. audit_logs não tinha local_id (achado da
-- Fase 4); em vez de fazer join caro por table_name+record_id depois,
-- populamos direto no trigger de auditoria (mais simples e barato de consultar).

ALTER TABLE public.audit_logs ADD COLUMN local_id BIGINT;

COMMENT ON COLUMN public.audit_logs.local_id IS
  'Fase 7: projeto/local associado a esta ação, populado automaticamente pelo trigger de auditoria. Para a tabela locais em si, é o próprio id da linha. Sem FK (log deve sobreviver mesmo se o projeto for depois excluído). Criado em 04/09/2026.';

-- Substitui o trigger genérico para também popular local_id
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
  v_local_id BIGINT;
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

  -- Para a tabela `locais` em si, o local_id do log é o próprio id da linha.
  -- Para as demais, usa a coluna local_id da linha quando ela existir
  -- (jsonb ->> retorna NULL silenciosamente se a coluna não existir na tabela).
  IF TG_TABLE_NAME = 'locais' THEN
    v_local_id := COALESCE((to_jsonb(NEW)->>'id')::bigint, (to_jsonb(OLD)->>'id')::bigint);
  ELSE
    v_local_id := COALESCE((to_jsonb(NEW)->>'local_id')::bigint, (to_jsonb(OLD)->>'local_id')::bigint);
  END IF;

  INSERT INTO public.audit_logs (user_id, action_type, table_name, record_id, old_data, new_data, action, local_id)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_record_id, v_old_data, v_new_data, TG_OP, v_local_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- RLS: mantém acesso total pra Curador Mestre/Coordenador Científico, e
-- adiciona visão escopada pro Gestor de Acervo/Taxonomista de Campo (só do
-- próprio projeto), reaproveitando is_local_staff_for já criada na Fase 4.
DROP POLICY IF EXISTS audit_logs_select_staff ON public.audit_logs;

CREATE POLICY audit_logs_select_staff
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_global_admin()
    OR (local_id IS NOT NULL AND public.is_local_staff_for(local_id))
  );
