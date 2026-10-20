-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
ALTER TABLE imagens
  ADD COLUMN IF NOT EXISTS tamanho_estimado boolean DEFAULT FALSE;

COMMENT ON COLUMN imagens.tamanho_estimado IS 'TRUE = tamanhos preenchidos por estimativa (registros anteriores à feature). FALSE = tamanhos reais capturados no upload.';
