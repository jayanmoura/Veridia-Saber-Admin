-- ============================================================
-- Migration 008: Consolida policies de INSERT no storage
-- arquivos-gerais para usar is_staff()
-- ============================================================

DROP POLICY IF EXISTS "Upload Staff Arquivos Gerais" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Upload para Usuarios Logados" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem fazer upload de avatar" ON storage.objects;
CREATE POLICY "storage_insert_arquivos_gerais"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'arquivos-gerais' AND (SELECT public.is_staff()) );
