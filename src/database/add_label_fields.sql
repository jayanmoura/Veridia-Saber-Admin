-- Add 'autor' to especie table
ALTER TABLE public.especie 
ADD COLUMN IF NOT EXISTS autor text;

-- Add label specific fields to especie_local table
ALTER TABLE public.especie_local
ADD COLUMN IF NOT EXISTS determinador text,
ADD COLUMN IF NOT EXISTS data_determinacao date,
ADD COLUMN IF NOT EXISTS coletor text,
ADD COLUMN IF NOT EXISTS numero_coletor text,
ADD COLUMN IF NOT EXISTS morfologia text,
ADD COLUMN IF NOT EXISTS habitat_ecologia text;

-- Comment on columns for clarity
COMMENT ON COLUMN public.especie.autor IS 'Autor do táxon (ex: L.)';
COMMENT ON COLUMN public.especie_local.determinador IS 'Nome de quem determinou a espécie';
COMMENT ON COLUMN public.especie_local.data_determinacao IS 'Data da determinação';
COMMENT ON COLUMN public.especie_local.coletor IS 'Nome do coletor principal';
COMMENT ON COLUMN public.especie_local.numero_coletor IS 'Número do coletor associado à planta';
COMMENT ON COLUMN public.especie_local.morfologia IS 'Descrição morfológica (cor, textura, altura, etc)';
COMMENT ON COLUMN public.especie_local.habitat_ecologia IS 'Descrição do habitat e ecologia';
