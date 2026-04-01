-- ============================================================
-- Migration 009: Consolidação geral das policies de storage
-- Remove duplicatas e policies com roles técnicos hardcoded
-- ============================================================

DROP POLICY IF EXISTS "Modificar Usuario Logado" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode deletar plantas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Delecao para Autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode enviar plantas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Upload para Autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Upload Staff Catalogo" ON storage.objects;
DROP POLICY IF EXISTS "Upload Usuario Logado" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Publico Imagens Plantas" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Publico Total" ON storage.objects;
DROP POLICY IF EXISTS "Leitura Publica Catalogo" ON storage.objects;
DROP POLICY IF EXISTS "Visualização pública de plantas" ON storage.objects;
DROP POLICY IF EXISTS "Admin pode alterar plantas" ON storage.objects;
DROP POLICY IF EXISTS "Gestao Staff Catalogo" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Edicao para Autenticados" ON storage.objects;

CREATE POLICY "imagens_plantas_select_public"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'imagens-plantas' );

CREATE POLICY "imagens_plantas_insert_staff"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'imagens-plantas' AND (SELECT public.is_staff()) );

CREATE POLICY "imagens_plantas_update_staff"
  ON storage.objects FOR UPDATE TO authenticated
  USING ( bucket_id = 'imagens-plantas' AND (SELECT public.is_staff()) );

CREATE POLICY "imagens_plantas_delete_staff"
  ON storage.objects FOR DELETE TO authenticated
  USING ( bucket_id = 'imagens-plantas' AND (SELECT public.is_staff()) );

DROP POLICY IF EXISTS "Gestao Staff Arquivos Gerais" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Update do Próprio Arquivo" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem atualizar seu avatar" ON storage.objects;
CREATE POLICY "storage_update_arquivos_gerais"
  ON storage.objects FOR UPDATE TO authenticated
  USING ( bucket_id = 'arquivos-gerais' AND (SELECT public.is_staff()) );
