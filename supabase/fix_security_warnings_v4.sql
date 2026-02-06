/*
  CORREÇÃO SEGURANÇA SUPABASE V4 (FINAL FIX)
  ------------------------------------------
  Este script resolve o aviso "RLS Policy Always True" na tabela beta_testers.
  
  AVISO IMPORTANTE:
  O aviso "Leaked Password Protection Disabled" NÃO pode ser corrigido via SQL.
  Você DEVE ir no Dashboard do Supabase -> Authentication -> Advanced -> Security
  e ativar "Enable Leaked Password Protection" manualmente.
*/

-- =============================================================================
-- CORREÇÃO: Tabela beta_testers (RLS Policy Always True)
-- =============================================================================

-- O aviso ocorria porque "WITH CHECK (true)" permitia que qualquer usuário logado
-- inserisse QUALQUER email na lista, inclusive de terceiros.
-- A correção restringe o INSERT para que o usuário só possa inserir seu próprio email.

ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beta_testers_insert_auth" ON public.beta_testers;

CREATE POLICY "beta_testers_insert_auth" ON public.beta_testers
FOR INSERT TO authenticated
WITH CHECK (
  -- Permite apenas se o email inserido for igual ao email do usuário logado
  email = (auth.jwt() ->> 'email')
);

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================
-- As demais correções já foram aplicadas no V2/V3.
-- Rode este script e depois ative a proteção de senhas no painel.
