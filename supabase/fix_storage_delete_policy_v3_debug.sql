-- Política DE DEPURAÇÃO (V3)
-- Objetivo: Remover temporariamente a verificação de cargos para confirmar se o problema é a leitura da tabela `profiles`.

-- 1. Remover policies anteriores
DROP POLICY IF EXISTS "Permitir exclusão de arquivos por equipe" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura de arquivos por equipe" ON storage.objects;

-- 2. Habilitar DELETE para QUALQUER usuário logado (apenas no bucket arquivos-gerais)
CREATE POLICY "Debug: Permitir delete geral"
ON storage.objects
FOR DELETE
TO authenticated
USING ( bucket_id = 'arquivos-gerais' );

-- 3. Habilitar SELECT para QUALQUER usuário logado
CREATE POLICY "Debug: Permitir select geral"
ON storage.objects
FOR SELECT
TO authenticated
USING ( bucket_id = 'arquivos-gerais' );
