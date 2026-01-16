-- ==============================================================================
-- CORREÇÃO DE PERMISSÕES (RLS) PARA O MAPA GLOBAL
-- ==============================================================================
-- Problema: O mapa aparece vazio ("0 coletas") mesmo com dados no banco.
-- Causa provável: As políticas de segurança (RLS) impedem que o admin veja dados de outros usuários.
-- Solução: Criar uma política permitindo que 'Curador Mestre' e 'Coordenador Científico' vejam tudo.

-- 1. Política para 'plantas_da_colecao'
DROP POLICY IF EXISTS "Admin vê todas as plantas" ON public.plantas_da_colecao;

CREATE POLICY "Admin vê todas as plantas"
ON public.plantas_da_colecao
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('Curador Mestre', 'Coordenador Científico')
  )
);

-- 2. Garantir que autenticação esteja ativa na tabela
ALTER TABLE public.plantas_da_colecao ENABLE ROW LEVEL SECURITY;

-- 3. (Opcional) Política para Taxonomistas verem suas próprias plantas (já deve existir, mas reforçando)
DROP POLICY IF EXISTS "Usuários veem suas próprias plantas" ON public.plantas_da_colecao;

CREATE POLICY "Usuários veem suas próprias plantas"
ON public.plantas_da_colecao
FOR SELECT
USING (
  auth.uid() = user_id
);
