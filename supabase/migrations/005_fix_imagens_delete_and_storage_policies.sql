-- ============================================================
-- Migration 005: Corrige DELETE da tabela imagens e consolida
-- policies de storage para arquivos-gerais
-- ============================================================

DROP POLICY IF EXISTS "imagens_delete_mixed" ON public.imagens;
CREATE POLICY "imagens_delete_mixed"
  ON public.imagens FOR DELETE TO authenticated
  USING ( (SELECT public.is_staff()) OR (criado_por = (SELECT auth.uid())::text) );

DROP POLICY IF EXISTS "Super Admin All Arquivos Gerais" ON storage.objects;
DROP POLICY IF EXISTS "Super Admin Delete Arquivos Gerais" ON storage.objects;
DROP POLICY IF EXISTS "Delete Staff Arquivos Gerais" ON storage.objects;
DROP POLICY IF EXISTS "Curadores apagam tudo em arquivos-gerais" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão segura por equipe" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_staff" ON storage.objects;
CREATE POLICY "storage_delete_arquivos_gerais"
  ON storage.objects FOR DELETE TO authenticated
  USING ( bucket_id = 'arquivos-gerais' AND (SELECT public.is_staff()) );

DROP POLICY IF EXISTS "Permitir leitura segura por equipe" ON storage.objects;
DROP POLICY IF EXISTS "Curadores veem tudo em arquivos-gerais" ON storage.objects;
DROP POLICY IF EXISTS "Leitura Publica Arquivos Gerais" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Visualizacao Publica" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_staff" ON storage.objects;
CREATE POLICY "storage_select_arquivos_gerais"
  ON storage.objects FOR SELECT TO authenticated
  USING ( bucket_id = 'arquivos-gerais' AND (SELECT public.is_staff()) );
