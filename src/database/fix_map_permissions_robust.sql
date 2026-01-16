-- ==============================================================================
-- CORREÇÃO ROBUSTA DE PERMISSÕES (SECURITY DEFINER)
-- ==============================================================================
-- Problema: A política anterior falha se o usuário não tiver permissão para ler a tabela 'profiles' dentro da query de verificação.
-- Solução: Criar uma função "SECURITY DEFINER" que tem permissão total para checar o cargo do usuário.

-- 1. Cria função para verificar se é admin (roda com privilegios de superusuario)
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Importante: ignora RLS na tabela profiles durante a execução
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role IN ('Curador Mestre', 'Coordenador Científico')
  );
$$;

-- 2. Recriar a política na tabela plantas_da_colecao usando a nova função
DROP POLICY IF EXISTS "Admin vê todas as plantas" ON public.plantas_da_colecao;

CREATE POLICY "Admin vê todas as plantas"
ON public.plantas_da_colecao
FOR SELECT
USING (
  is_global_admin()
);

-- 3. Recriar a política na tabela profiles (Garantir que profiles seja legível também)
-- Permite que usuário leia seu próprio perfil E que admins leiam todos (necessário para os joins)
DROP POLICY IF EXISTS "Perfis visíveis para admins" ON public.profiles;

CREATE POLICY "Perfis visíveis para admins"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR is_global_admin()
);

-- 4. Política para a tabela 'familia' (caso ela tenha RLS e esteja bloqueando o join)
ALTER TABLE public.familia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Famílias visíveis para todos" ON public.familia;

CREATE POLICY "Famílias visíveis para todos"
ON public.familia
FOR SELECT
USING (true); -- Famílias são dados públicos do sistema
