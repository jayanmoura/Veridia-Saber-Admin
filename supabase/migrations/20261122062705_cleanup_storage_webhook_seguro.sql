-- 20261122120000_cleanup_storage_webhook_seguro
-- Relatório de segurança de 22/11/2026, achados 1 e 2.
-- Troca o webhook "cleanup-user-storage" (JWT service_role literal na definição do trigger)
-- por uma fila em private.storage_cleanup_jobs. O trigger envia só o job_id e um segredo
-- guardado no Vault, gerado dentro do banco. A Edge Function confere o segredo e o job no banco
-- antes de qualquer operação de Storage.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.storage_cleanup_jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'processando', 'concluido', 'falhou')),
  tentativas integer NOT NULL DEFAULT 0,
  arquivos_removidos integer,
  ultimo_erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE private.storage_cleanup_jobs FROM PUBLIC, anon, authenticated;

-- Segredo do webhook: gerado aqui, nunca sai do banco em texto.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cleanup_webhook_secret') THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'cleanup_webhook_secret',
      'Autentica o trigger de auth.users na Edge Function cleanup-user-storage'
    );
  END IF;
END $$;

-- Função do trigger: registra o job e chama a Edge Function só com o job_id.
CREATE OR REPLACE FUNCTION private.enqueue_storage_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_job_id bigint;
  v_secret text;
BEGIN
  INSERT INTO private.storage_cleanup_jobs (user_id) VALUES (OLD.id) RETURNING id INTO v_job_id;

  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cleanup_webhook_secret';
  IF v_secret IS NULL THEN
    UPDATE private.storage_cleanup_jobs
       SET status = 'falhou', ultimo_erro = 'segredo do webhook ausente', updated_at = now()
     WHERE id = v_job_id;
    RETURN OLD;
  END IF;

  PERFORM net.http_post(
    url := 'https://dyiwuocbpepvtrxqwfmm.supabase.co/functions/v1/cleanup-user-storage',
    body := jsonb_build_object('job_id', v_job_id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    timeout_milliseconds := 10000
  );
  RETURN OLD;
END $function$;
REVOKE EXECUTE ON FUNCTION private.enqueue_storage_cleanup() FROM PUBLIC, anon, authenticated;

-- Reenvio manual de um job que falhou (rodar no SQL Editor: SELECT private.reenviar_limpeza_storage(<id>);).
CREATE OR REPLACE FUNCTION private.reenviar_limpeza_storage(p_job_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_secret text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM private.storage_cleanup_jobs
     WHERE id = p_job_id AND status IN ('pendente', 'falhou') AND tentativas < 5
  ) THEN
    RAISE EXCEPTION 'Job % inexistente, concluído ou sem tentativas restantes.', p_job_id;
  END IF;
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cleanup_webhook_secret';
  RETURN net.http_post(
    url := 'https://dyiwuocbpepvtrxqwfmm.supabase.co/functions/v1/cleanup-user-storage',
    body := jsonb_build_object('job_id', p_job_id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    timeout_milliseconds := 10000
  );
END $function$;
REVOKE EXECUTE ON FUNCTION private.reenviar_limpeza_storage(bigint) FROM PUBLIC, anon, authenticated;

-- RPCs usadas pela Edge Function (somente service_role).
CREATE OR REPLACE FUNCTION public.storage_cleanup_claim(p_job_id bigint, p_secret text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_secret text;
  v_user uuid;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cleanup_webhook_secret';
  IF v_secret IS NULL OR p_secret IS NULL
     OR extensions.digest(p_secret, 'sha256') <> extensions.digest(v_secret, 'sha256') THEN
    RAISE EXCEPTION 'webhook nao autorizado' USING ERRCODE = '28000';
  END IF;

  UPDATE private.storage_cleanup_jobs
     SET status = 'processando', tentativas = tentativas + 1, updated_at = now()
   WHERE id = p_job_id AND status IN ('pendente', 'falhou') AND tentativas < 5
  RETURNING user_id INTO v_user;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'job inexistente ou ja processado' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_user;
END $function$;

CREATE OR REPLACE FUNCTION public.storage_cleanup_list_objects(p_job_id bigint)
 RETURNS SETOF text
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT o.name
    FROM storage.objects o
    JOIN private.storage_cleanup_jobs j ON j.id = p_job_id AND j.status = 'processando'
   WHERE o.bucket_id = 'fotos-das-colecoes'
     AND (o.name LIKE j.user_id::text || '/%' OR o.name LIKE 'capas/' || j.user_id::text || '/%')
   ORDER BY o.name;
$function$;

CREATE OR REPLACE FUNCTION public.storage_cleanup_finish(p_job_id bigint, p_ok boolean, p_removidos integer, p_erro text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  UPDATE private.storage_cleanup_jobs
     SET status = CASE WHEN p_ok THEN 'concluido' ELSE 'falhou' END,
         arquivos_removidos = p_removidos,
         ultimo_erro = left(p_erro, 500),
         updated_at = now()
   WHERE id = p_job_id AND status = 'processando';
$function$;

REVOKE EXECUTE ON FUNCTION public.storage_cleanup_claim(bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storage_cleanup_list_objects(bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.storage_cleanup_finish(bigint, boolean, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.storage_cleanup_claim(bigint, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.storage_cleanup_list_objects(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.storage_cleanup_finish(bigint, boolean, integer, text) TO service_role;

-- Troca do trigger: o antigo carregava o JWT literal.
DROP TRIGGER IF EXISTS "cleanup-user-storage" ON auth.users;
DROP TRIGGER IF EXISTS trg_auth_users_enqueue_storage_cleanup ON auth.users;
CREATE TRIGGER trg_auth_users_enqueue_storage_cleanup
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.enqueue_storage_cleanup();
