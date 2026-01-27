-- Política COMPLETA para permitir que Admins gerenciem arquivos no Storage
-- Bucket: arquivos-gerais

-- 1. DROP policies antigas para evitar conflitos/duplicidade
DROP POLICY IF EXISTS "Permitir exclusão de arquivos por equipe" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura de arquivos por equipe" ON storage.objects;

-- 2. Habilitar a LEITURA (SELECT) para Admins
-- (Necessário para que o comando remove() consiga "encontrar" o arquivo antes de deletar)
CREATE POLICY "Permitir leitura de arquivos por equipe"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'arquivos-gerais'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'catalogador')
  )
);

-- 3. Habilitar a EXCLUSÃO (DELETE) para Admins
CREATE POLICY "Permitir exclusão de arquivos por equipe"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'arquivos-gerais'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'admin', 'catalogador')
  )
);

-- 4. Opcional: Habilitar UPDATE (se você precisar mover/renomear)
-- CREATE POLICY "Permitir atualização de arquivos por equipe" ...
