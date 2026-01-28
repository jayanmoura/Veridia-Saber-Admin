-- =====================================================
-- FIX INSTITUTION_ID CONSISTENCY
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Step 1: Check if default institution exists
SELECT id, nome FROM institutions WHERE nome = 'Veridia Saber (Legado)';

-- Step 2: Create default institution if it doesn't exist
INSERT INTO institutions (nome, sigla)
VALUES ('Veridia Saber (Legado)', 'VSL')
ON CONFLICT DO NOTHING
RETURNING id, nome;

-- Step 3: Update ALL profiles without institution_id to use default
UPDATE profiles
SET institution_id = (
    SELECT id FROM institutions WHERE nome = 'Veridia Saber (Legado)' LIMIT 1
)
WHERE institution_id IS NULL;

-- Step 4: Update ALL locais without institution_id to use default
UPDATE locais
SET institution_id = (
    SELECT id FROM institutions WHERE nome = 'Veridia Saber (Legado)' LIMIT 1
)
WHERE institution_id IS NULL;

-- Step 5: Sync Gestor profiles with their project's institution_id
UPDATE profiles
SET institution_id = (
    SELECT l.institution_id 
    FROM locais l 
    WHERE l.id = profiles.local_id
)
WHERE role = 'Gestor de Acervo'
  AND local_id IS NOT NULL
  AND (
      institution_id IS NULL 
      OR institution_id != (SELECT l.institution_id FROM locais l WHERE l.id = profiles.local_id)
  );

-- Step 6: Verify the fix - all should show 0 in missing_institution
SELECT 
    'profiles' as table_name,
    COUNT(*) as total,
    COUNT(institution_id) as with_institution,
    COUNT(*) - COUNT(institution_id) as missing_institution
FROM profiles
UNION ALL
SELECT 
    'locais' as table_name,
    COUNT(*) as total,
    COUNT(institution_id) as with_institution,
    COUNT(*) - COUNT(institution_id) as missing_institution
FROM locais;

-- Step 7: Show the default institution ID (copy this for reference)
SELECT id as "DEFAULT_INSTITUTION_ID", nome FROM institutions WHERE nome = 'Veridia Saber (Legado)';
