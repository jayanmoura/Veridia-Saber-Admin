-- ============================================================
-- MIGRAÇÃO 010: Adicionar colunas de resoluções de imagem na tabela familia
-- ============================================================
--
-- Objetivo: Alinhar a tabela familia ao sistema de 3 resoluções
-- usado nas tabelas imagens (url_micro, url_thumbnail, url_imagem).
--
-- Após esta migração, novos uploads de capa de família
-- armazenarão também as versões otimizadas geradas client-side.
-- ============================================================

ALTER TABLE public.familia
    ADD COLUMN IF NOT EXISTS imagem_thumbnail text,
    ADD COLUMN IF NOT EXISTS imagem_micro     text;

COMMENT ON COLUMN public.familia.imagem_thumbnail IS
    'URL da versão redimensionada (max 1200px, JPEG 85%) para exibição em modais e galeria.';

COMMENT ON COLUMN public.familia.imagem_micro IS
    'URL do micro-thumbnail (max 300px, JPEG 70%) para exibição em tabelas e listagens compactas.';
