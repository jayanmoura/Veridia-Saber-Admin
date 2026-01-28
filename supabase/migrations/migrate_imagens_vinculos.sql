-- ============================================================
-- MIGRAÇÃO: Reorganização de Vínculos de Imagens
-- ============================================================
-- 
-- OBJETIVO:
-- - Imagens de ESPÉCIE: apenas especie_id preenchido
-- - Imagens de ESPÉCIME: apenas especime_id preenchido  
-- - especie_local_id é LEGADO e não deve ser usado
--
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Recomenda-se fazer BACKUP antes de executar.
-- ============================================================

-- ============================================================
-- PASSO 1: Diagnóstico inicial
-- ============================================================

-- Verificar quantidade de registros por tipo de vínculo
SELECT 
    'especie_id only' as tipo,
    COUNT(*) as total
FROM public.imagens 
WHERE especie_id IS NOT NULL 
  AND especime_id IS NULL 
  AND especie_local_id IS NULL

UNION ALL

SELECT 
    'especime_id only' as tipo,
    COUNT(*) as total
FROM public.imagens 
WHERE especime_id IS NOT NULL 
  AND especie_id IS NULL

UNION ALL

SELECT 
    'especie_local_id (legado)' as tipo,
    COUNT(*) as total
FROM public.imagens 
WHERE especie_local_id IS NOT NULL

UNION ALL

SELECT 
    'ambos (sujeira)' as tipo,
    COUNT(*) as total
FROM public.imagens 
WHERE especie_id IS NOT NULL 
  AND especime_id IS NOT NULL;


-- ============================================================
-- PASSO 2: Migrar dados legado de especie_local_id para especime_id
-- ============================================================

-- Esta migração copia o valor de especie_local_id para especime_id
-- apenas em registros onde especime_id ainda está nulo

UPDATE public.imagens
SET especime_id = especie_local_id
WHERE especime_id IS NULL 
  AND especie_local_id IS NOT NULL;

-- Verificar quantos registros foram migrados
SELECT 'Registros migrados de especie_local_id para especime_id' as acao,
       COUNT(*) as total
FROM public.imagens
WHERE especime_id = especie_local_id;


-- ============================================================
-- PASSO 3: Limpar registros com ambos preenchidos (sujeira)
-- ============================================================

-- Se houver registros com AMBOS especie_id e especime_id preenchidos,
-- provavelmente é sujeira. Revisar manualmente antes de executar.

-- Listar registros problemáticos (executar primeiro para revisar)
SELECT id, especie_id, especime_id, url_imagem 
FROM public.imagens 
WHERE especie_id IS NOT NULL 
  AND especime_id IS NOT NULL
LIMIT 20;

-- DESCOMENTE ABAIXO apenas após revisar os registros acima
-- Este UPDATE assume que, se especime_id estiver preenchido, é imagem de espécime
-- UPDATE public.imagens
-- SET especie_id = NULL
-- WHERE especie_id IS NOT NULL 
--   AND especime_id IS NOT NULL;


-- ============================================================
-- PASSO 4: Limpar coluna especie_local_id (opcional)
-- ============================================================

-- Após migração bem-sucedida, zerar a coluna legado
-- UPDATE public.imagens SET especie_local_id = NULL WHERE especie_local_id IS NOT NULL;


-- ============================================================
-- PASSO 5: Adicionar CHECK constraint (RECOMENDADO)
-- ============================================================

-- Esta constraint impede que novos registros tenham sujeira:
-- - especie_id preenchido com especime_id nulo, OU
-- - especime_id preenchido com especie_id nulo

-- DESCOMENTE para adicionar a constraint:
-- ALTER TABLE public.imagens
-- ADD CONSTRAINT imagens_vinculo_exclusivo
-- CHECK (
--     (especie_id IS NOT NULL AND especime_id IS NULL)
--     OR
--     (especie_id IS NULL AND especime_id IS NOT NULL)
--     OR
--     (especie_id IS NULL AND especime_id IS NULL)  -- permite registros órfãos temporários
-- );


-- ============================================================
-- PASSO 6: Drop da coluna legado (FUTURO)
-- ============================================================

-- Executar apenas quando tiver certeza absoluta de que a coluna não é mais usada
-- ALTER TABLE public.imagens DROP COLUMN especie_local_id;


-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

SELECT 
    'especie_id only' as tipo,
    COUNT(*) as total
FROM public.imagens 
WHERE especie_id IS NOT NULL 
  AND especime_id IS NULL

UNION ALL

SELECT 
    'especime_id only' as tipo,
    COUNT(*) as total
FROM public.imagens 
WHERE especime_id IS NOT NULL 
  AND especie_id IS NULL

UNION ALL

SELECT 
    'especie_local_id restante' as tipo,
    COUNT(*) as total
FROM public.imagens 
WHERE especie_local_id IS NOT NULL

UNION ALL

SELECT 
    'Total geral' as tipo,
    COUNT(*) as total
FROM public.imagens;
