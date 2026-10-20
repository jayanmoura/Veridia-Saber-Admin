-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
ALTER TABLE imagens
  ADD COLUMN IF NOT EXISTS tamanho_original  integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tamanho_thumbnail integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tamanho_micro     integer DEFAULT NULL;

COMMENT ON COLUMN imagens.tamanho_original  IS 'Tamanho em bytes do arquivo original (File.size antes do upload)';
COMMENT ON COLUMN imagens.tamanho_thumbnail IS 'Tamanho em bytes do thumbnail 1200px JPEG 85%';
COMMENT ON COLUMN imagens.tamanho_micro     IS 'Tamanho em bytes do micro 300px JPEG 70%';
