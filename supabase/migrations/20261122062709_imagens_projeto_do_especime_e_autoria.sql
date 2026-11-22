-- 20261122120200_imagens_projeto_do_especime_e_autoria
-- Relatório de segurança de 22/11/2026, achado 6.
-- (a) A imagem de espécime herda o projeto do espécime e é recusada se vier com outro projeto.
--     A RLS de imagens confere a linha já corrigida pelo trigger.
-- (b) especie_local.created_by passa a ser definido no servidor e não pode ser trocado por outro autor.

CREATE OR REPLACE FUNCTION public.trg_imagens_local_do_especime()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_local bigint;
BEGIN
  IF NEW.especime_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT el.local_id INTO v_local FROM public.especie_local el WHERE el.id = NEW.especime_id;
  IF v_local IS NULL THEN
    RETURN NEW; -- espécime inexistente: a FK recusa
  END IF;
  IF NEW.local_id IS NULL THEN
    NEW.local_id := v_local;
  ELSIF NEW.local_id <> v_local THEN
    RAISE EXCEPTION 'A imagem e o espécime pertencem a projetos diferentes.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $function$;
REVOKE EXECUTE ON FUNCTION public.trg_imagens_local_do_especime() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_imagens_local_do_especime ON public.imagens;
CREATE TRIGGER trg_imagens_local_do_especime
  BEFORE INSERT OR UPDATE OF especime_id, local_id ON public.imagens
  FOR EACH ROW EXECUTE FUNCTION public.trg_imagens_local_do_especime();

-- Se um espécime mudar de projeto, as imagens dele acompanham.
CREATE OR REPLACE FUNCTION public.trg_especie_local_propaga_local_imagens()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  UPDATE public.imagens
     SET local_id = NEW.local_id
   WHERE especime_id = NEW.id
     AND local_id IS DISTINCT FROM NEW.local_id;
  RETURN NEW;
END $function$;
REVOKE EXECUTE ON FUNCTION public.trg_especie_local_propaga_local_imagens() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_especie_local_propaga_local_imagens ON public.especie_local;
CREATE TRIGGER trg_especie_local_propaga_local_imagens
  AFTER UPDATE OF local_id ON public.especie_local
  FOR EACH ROW
  WHEN (OLD.local_id IS DISTINCT FROM NEW.local_id)
  EXECUTE FUNCTION public.trg_especie_local_propaga_local_imagens();

-- Autoria definida no servidor quando há sessão.
CREATE OR REPLACE FUNCTION public.trg_set_created_by_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NOT NULL THEN
    NEW.created_by := v_uid;
  END IF;
  RETURN NEW;
END $function$;
REVOKE EXECUTE ON FUNCTION public.trg_set_created_by_auth() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_especie_local_set_created_by ON public.especie_local;
CREATE TRIGGER trg_especie_local_set_created_by
  BEFORE INSERT ON public.especie_local
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_created_by_auth();

-- Mesma proteção já usada em especie e familia: autoria só pode virar NULL (exclusão de conta).
DROP TRIGGER IF EXISTS tr_protect_author_especie_local ON public.especie_local;
CREATE TRIGGER tr_protect_author_especie_local
  BEFORE UPDATE ON public.especie_local
  FOR EACH ROW EXECUTE FUNCTION public.prevent_author_change();
