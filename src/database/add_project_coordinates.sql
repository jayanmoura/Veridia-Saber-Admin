-- Adicionar colunas de coordenadas na tabela locais (Projetos)
ALTER TABLE public.locais 
ADD COLUMN IF NOT EXISTS latitude numeric NULL,
ADD COLUMN IF NOT EXISTS longitude numeric NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.locais.latitude IS 'Latitude central do projeto para exibição no mapa';
COMMENT ON COLUMN public.locais.longitude IS 'Longitude central do projeto para exibição no mapa';
