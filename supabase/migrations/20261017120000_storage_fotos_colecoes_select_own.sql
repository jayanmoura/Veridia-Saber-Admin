-- Registro (20261017120000_storage_fotos_colecoes_select_own): aplicado manualmente via SQL Editor em 2026. Idempotente, seguro para reaplicar.
DROP POLICY IF EXISTS fotos_colecoes_select_own ON storage.objects;
CREATE POLICY fotos_colecoes_select_own ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'fotos-das-colecoes'
    AND (storage.foldername(name))[1] = ((SELECT auth.uid()))::text
  );
