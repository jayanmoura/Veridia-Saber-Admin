-- Política de Segurança (RLS) para permitir que Admins apaguem arquivos no Storage

-- 1. Habilitar a exclusão para usuários com cargos administrativos no bucket 'arquivos-gerais'
-- Verifique se a tabela 'profiles' está no schema 'public' como esperado.

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

-- NOTA: Se você tiver outros buckets que precisam da mesma regra, repita alterando o bucket_id.
-- Caso a política já exista com outro nome, você pode precisar excluí-la antes ou renomear esta.
