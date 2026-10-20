-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- ============================================================
-- Remove todas as policies antigas conflitantes do bucket fotos-das-colecoes
-- ============================================================
DROP POLICY IF EXISTS "Gestão Total Autenticada" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem excluir suas próprias fotos" ON storage.objects;
DROP POLICY IF EXISTS "User Delete Own 2" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload 2" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload nas suas pastas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública das imagens da coleção" ON storage.objects;
DROP POLICY IF EXISTS "Public Access 2" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer um pode visualizar fotos" ON storage.objects;
DROP POLICY IF EXISTS "Leitura Publica Geral" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias fotos" ON storage.objects;
DROP POLICY IF EXISTS "User Update Own 2" ON storage.objects;

-- ============================================================
-- Remove policy permissiva de DELETE no imagens_conteudo
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can delete content images" ON storage.objects;

-- ============================================================
-- Recria policies limpas para fotos-das-colecoes
-- ============================================================

-- SELECT: leitura pública (necessário para o app exibir as fotos)
CREATE POLICY "fotos_colecoes_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-das-colecoes');

-- INSERT: usuário autenticado só na própria pasta (uid/nome-do-arquivo)
CREATE POLICY "fotos_colecoes_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fotos-das-colecoes'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- UPDATE: usuário autenticado só na própria pasta
CREATE POLICY "fotos_colecoes_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fotos-das-colecoes'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- DELETE: usuário autenticado só na própria pasta
CREATE POLICY "fotos_colecoes_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fotos-das-colecoes'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- ============================================================
-- Recria DELETE de imagens_conteudo restrito a is_staff()
-- ============================================================
CREATE POLICY "imagens_conteudo_delete_staff"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'imagens_conteudo'
  AND (SELECT is_staff())
);
