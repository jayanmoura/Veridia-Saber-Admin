-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- ============================================================
-- Adicionar coluna url_thumbnail na tabela imagens
-- Para exibição otimizada em listagens (imagens comprimidas)
-- O original (url_imagem) é preservado para uso científico
-- ============================================================

ALTER TABLE public.imagens 
ADD COLUMN IF NOT EXISTS url_thumbnail text;

COMMENT ON COLUMN public.imagens.url_thumbnail IS 
'URL da versão redimensionada (max 1200px, JPEG 85%) para exibição em listagens. O campo url_imagem mantém o original em resolução completa para fins científicos.';
