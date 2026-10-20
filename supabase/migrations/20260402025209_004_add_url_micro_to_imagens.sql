-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- ============================================================
-- Adicionar coluna url_micro na tabela imagens
-- Micro-thumbnail (300px, JPEG 70%) para listagens em tabela
-- ============================================================

ALTER TABLE public.imagens 
ADD COLUMN IF NOT EXISTS url_micro text;

COMMENT ON COLUMN public.imagens.url_micro IS 
'URL do micro-thumbnail (max 300px, JPEG 70%) para exibição em tabelas e listagens compactas. url_thumbnail (1200px) para modais, url_imagem para inspeção científica.';
