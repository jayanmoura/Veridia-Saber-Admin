-- 20261122120400_exclusao_projeto_transacional
-- Relatório de segurança de 22/11/2026, achado 7 e "Exclusão de projeto no banco" (itens 1.11 e B1).
-- (a) downgrade_users_on_project_delete: papel 'leitor' (inexistente) vira 'Consulente'; sai o ramo super_admin.
--     Papéis globais só perdem o vínculo, mantendo o papel.
-- (b) RPC excluir_projeto: toda a parte relacional numa transação só. As URLs dos arquivos ficam
--     registradas em storage_limpeza_pendente antes, para o cliente remover depois e poder repetir.

CREATE OR REPLACE FUNCTION public.downgrade_users_on_project_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  UPDATE public.profiles
     SET local_id = NULL,
         role = CASE
                  WHEN role IN ('Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior') THEN role
                  ELSE 'Consulente'
                END
   WHERE local_id = OLD.id;
  RETURN OLD;
END $function$;
REVOKE EXECUTE ON FUNCTION public.downgrade_users_on_project_delete() FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.storage_limpeza_pendente (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('url', 'pasta')),
  valor text NOT NULL,
  origem text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.storage_limpeza_pendente IS
  'Arquivos do storage self-hosted a remover após uma exclusão relacional (tipo url: URL completa; tipo pasta: bucket/prefixo).';
ALTER TABLE public.storage_limpeza_pendente ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.storage_limpeza_pendente FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.storage_limpeza_pendente TO authenticated;

DROP POLICY IF EXISTS storage_limpeza_pendente_select_admin ON public.storage_limpeza_pendente;
CREATE POLICY storage_limpeza_pendente_select_admin ON public.storage_limpeza_pendente
  FOR SELECT TO authenticated USING ((SELECT public.is_global_admin()));
DROP POLICY IF EXISTS storage_limpeza_pendente_delete_admin ON public.storage_limpeza_pendente;
CREATE POLICY storage_limpeza_pendente_delete_admin ON public.storage_limpeza_pendente
  FOR DELETE TO authenticated USING ((SELECT public.is_global_admin()));

CREATE OR REPLACE FUNCTION public.excluir_projeto(p_local_id bigint)
 RETURNS TABLE (item_id bigint, item_tipo text, item_valor text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_origem text := 'excluir_projeto:' || p_local_id;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT public.is_global_admin() THEN
    RAISE EXCEPTION 'Sem permissão para excluir projetos.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.locais l WHERE l.id = p_local_id) THEN
    RAISE EXCEPTION 'Projeto não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  -- 1. Relação dos arquivos a remover (fica salva mesmo que o cliente caia depois).
  INSERT INTO public.storage_limpeza_pendente (tipo, valor, origem)
  SELECT DISTINCT 'url', u.url, v_origem
    FROM public.imagens i
    CROSS JOIN LATERAL unnest(ARRAY[i.url_imagem, i.url_thumbnail, i.url_micro]) AS u(url)
   WHERE (i.local_id = p_local_id
          OR i.especime_id IN (SELECT el.id FROM public.especie_local el WHERE el.local_id = p_local_id))
     AND u.url IS NOT NULL AND u.url <> '';
  INSERT INTO public.storage_limpeza_pendente (tipo, valor, origem)
  VALUES ('pasta', 'arquivos-gerais/locais/' || p_local_id, v_origem);

  -- 2. Parte relacional, tudo ou nada.
  DELETE FROM public.imagens i
   WHERE i.local_id = p_local_id
      OR i.especime_id IN (SELECT el.id FROM public.especie_local el WHERE el.local_id = p_local_id);
  DELETE FROM public.especie_local el WHERE el.local_id = p_local_id;
  UPDATE public.especie e SET local_id = NULL WHERE e.local_id = p_local_id;
  UPDATE public.profiles p
     SET local_id = NULL,
         role = CASE
                  WHEN p.role IN ('Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior') THEN p.role
                  ELSE 'Consulente'
                END
   WHERE p.local_id = p_local_id;
  DELETE FROM public.locais l WHERE l.id = p_local_id;

  RETURN QUERY
    SELECT s.id, s.tipo, s.valor FROM public.storage_limpeza_pendente s WHERE s.origem = v_origem ORDER BY s.id;
END $function$;
REVOKE EXECUTE ON FUNCTION public.excluir_projeto(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.excluir_projeto(bigint) TO authenticated;
