-- 20261122120300_analytics_e_auditoria_privacidade
-- Relatório de segurança de 22/11/2026, achado 5 (fecha também os itens 1.6 e 1.9 do PENDENCIAS).
-- (a) Eventos brutos de analytics: só administração global (antes is_staff(), que inclui papéis locais).
-- (b) Histórico de profiles deixa de guardar e-mail (registros novos e os já existentes).
-- (c) fk_audit_logs_user passa de CASCADE para SET NULL: apagar um perfil não apaga a auditoria.
--     O nome é mantido porque os joins embutidos do PostgREST dependem dele.

DROP POLICY IF EXISTS analytics_select_admin ON public.analytics_events;
CREATE POLICY analytics_select_admin ON public.analytics_events
  FOR SELECT TO authenticated
  USING ((SELECT public.is_global_admin()));

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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

  -- Dados pessoais que o histórico não precisa guardar.
  IF TG_TABLE_NAME = 'profiles' THEN
    v_old_data := v_old_data - 'email';
    v_new_data := v_new_data - 'email';
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
$function$;

UPDATE public.audit_logs
   SET old_data = old_data - 'email',
       new_data = new_data - 'email'
 WHERE table_name = 'profiles'
   AND (old_data ? 'email' OR new_data ? 'email');

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_user;
ALTER TABLE public.audit_logs
  ADD CONSTRAINT fk_audit_logs_user
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
