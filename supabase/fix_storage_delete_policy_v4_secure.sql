-- Política SEGURA (V4) - "The Right Way"
-- Resolve o problema de permissão usando uma função de segurança (SECURITY DEFINER)
-- Isso permite checar o cargo do usuário sem ser bloqueado pelas políticas da tabela profiles.

-- 1. Criar Função Auxiliar Segura
CREATE OR REPLACE FUNCTION public.check_user_role_storage()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões de superusuário do banco
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'catalogador')
  );
END;
$$;

-- 2. Limpar políticas anteriores
DROP POLICY IF EXISTS "Debug: Permitir delete geral" ON storage.objects;
DROP POLICY IF EXISTS "Debug: Permitir select geral" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de arquivos por equipe" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura de arquivos por equipe" ON storage.objects;

-- 3. Habilitar DELETE seguro
CREATE POLICY "Permitir exclusão segura por equipe"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'arquivos-gerais'
  AND public.check_user_role_storage() = true
);

-- 4. Habilitar SELECT seguro (necessário para encontrar o arquivo antes de apagar)
CREATE POLICY "Permitir leitura segura por equipe"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'arquivos-gerais'
  AND public.check_user_role_storage() = true
);
