-- =====================================================
-- SQL para adicionar campo created_by na tabela especie_local
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna created_by na tabela especie_local
ALTER TABLE especie_local 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_especie_local_created_by 
ON especie_local(created_by);

-- 3. (Opcional) Atualizar registros existentes com o created_by da espécie pai
-- CUIDADO: Execute apenas se quiser preencher registros antigos
-- UPDATE especie_local el
-- SET created_by = e.created_by
-- FROM especie e
-- WHERE el.especie_id = e.id AND el.created_by IS NULL;

-- 4. Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'especie_local' AND column_name = 'created_by';
