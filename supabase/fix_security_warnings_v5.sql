/*
  CORREÇÃO SEGURANÇA SUPABASE V5 (PERFORMANCE & OVERLAP FIX)
  ----------------------------------------------------------
  Este script resolve os 2 últimos avisos restantes:
  1. auth_rls_initplan (beta_testers): Otimiza a verificação de email.
  2. multiple_permissive_policies (conteudo_orgaos): Remove sobreposição de SELECT.
*/

-- =============================================================================
-- 1. CORREÇÃO DE INITPLAN: public.beta_testers
-- =============================================================================
-- PROBLEMA: auth.jwt() sendo reavaliado linha a linha.
-- SOLUÇÃO: Envolver em (SELECT ...) para o Postgres cachear o resultado (InitPlan).

DROP POLICY IF EXISTS "beta_testers_insert_auth" ON public.beta_testers;

CREATE POLICY "beta_testers_insert_auth" ON public.beta_testers
FOR INSERT TO authenticated
WITH CHECK (
  -- O uso de (SELECT ...) força a execução única por query
  email = (SELECT auth.jwt() ->> 'email')
);


-- =============================================================================
-- 2. CORREÇÃO DE OVERLAP: public.conteudo_orgaos
-- =============================================================================
-- PROBLEMA: Haviam duas políticas permitindo SELECT para staff (uma pública e uma de escrita que incluía SELECT via "ALL").
-- SOLUÇÃO: Separar explicitamente a leitura (Pública) da escrita (Staff), sem usar "FOR ALL".

-- Remove políticas antigas que causavam colisão
DROP POLICY IF EXISTS "conteudo_select_public" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "conteudo_write_staff" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "Permitir leitura pública para todos" ON public.conteudo_orgaos;

-- A. Política de Leitura (SELECT) - Única fonte de verdade para leitura
CREATE POLICY "conteudo_select_public" ON public.conteudo_orgaos
FOR SELECT
TO public -- Inclui anon e authenticated
USING (true);

-- B. Políticas de Escrita (Staff) - Separadas para não colidir com SELECT
-- INSERT
CREATE POLICY "conteudo_insert_staff" ON public.conteudo_orgaos
FOR INSERT
TO authenticated
WITH CHECK ( (SELECT public.is_staff()) );

-- UPDATE
CREATE POLICY "conteudo_update_staff" ON public.conteudo_orgaos
FOR UPDATE
TO authenticated
USING ( (SELECT public.is_staff()) );

-- DELETE
CREATE POLICY "conteudo_delete_staff" ON public.conteudo_orgaos
FOR DELETE
TO authenticated
USING ( (SELECT public.is_staff()) );
