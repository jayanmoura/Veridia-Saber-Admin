-- =====================================================
-- HUMAN READABLE IDS MIGRATION
-- Execute this in Supabase SQL Editor
-- =====================================================

-- 1. Add 'sigla' to 'locais' (Projects/Locations)
ALTER TABLE locais ADD COLUMN IF NOT EXISTS sigla TEXT;

-- Create unique index for sigla (case insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS locais_sigla_idx ON locais (UPPER(sigla));

-- Update existing locais with a default sigla based on name if null
-- Simple heuristic: First letters of words, uppercase
UPDATE locais 
SET sigla = UPPER(REGEXP_REPLACE(nome, '[^a-zA-Z\s]', '', 'g')) 
WHERE sigla IS NULL;
-- (Note: You might need to manually fix duplicates after this if the heuristic isn't unique enough)

-- Make sigla NOT NULL after backfilling
-- ALTER TABLE locais ALTER COLUMN sigla SET NOT NULL;


-- 2. Add 'tombo_codigo' to 'especie_local' (Specimens)
ALTER TABLE especie_local ADD COLUMN IF NOT EXISTS tombo_codigo TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS especie_local_tombo_codigo_idx ON especie_local (tombo_codigo);

-- 3. Create Trigger Function to generate Tombo
-- Format: SIGLA-00000 (Sequential number per project)
CREATE OR REPLACE FUNCTION generate_tombo_codigo()
RETURNS TRIGGER AS $$
DECLARE
    project_sigla TEXT;
    seq_num BIGINT;
BEGIN
    -- Get the project sigla
    SELECT sigla INTO project_sigla FROM locais WHERE id = NEW.local_id;
    
    -- Fallback if no sigla (should not happen if sigla is enforced)
    IF project_sigla IS NULL THEN
        RAISE EXCEPTION 'Project (local_id %) has no sigla defined. Cannot generate tombo.', NEW.local_id;
    END IF;

    -- Calculate sequence number for this project
    -- This is a simple count+1 approach. For high concurrency, a sequence table is better,
    -- but for this use case, counting existing items for this project is likely sufficient start.
    -- Or we can use a per-project sequence if we create them dynamically.
    -- Let's use specific sequences if possible, or MAX + 1.
    -- MAX+1 is prone to race conditions but easiest to implement without dynamic sequences.
    
    LOCK TABLE especie_local IN SHARE ROW EXCLUSIVE MODE; -- Prevent concurrent inserts for seq generation safety

    SELECT COALESCE(COUNT(*), 0) + 1 INTO seq_num
    FROM especie_local
    WHERE local_id = NEW.local_id;

    -- Format: SIGLA-00001
    NEW.tombo_codigo := project_sigla || '-' || LPAD(seq_num::TEXT, 5, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Trigger
DROP TRIGGER IF EXISTS trigger_generate_tombo ON especie_local;
CREATE TRIGGER trigger_generate_tombo
BEFORE INSERT ON especie_local
FOR EACH ROW
WHEN (NEW.tombo_codigo IS NULL)
EXECUTE FUNCTION generate_tombo_codigo();

-- 5. Backfill existing specimens
-- This might fail if duplicates or missing siglas. Run with caution.
DO $$
DECLARE
    r RECORD;
    project_sigla TEXT;
    i INT;
BEGIN
    FOR r IN SELECT DISTINCT local_id FROM especie_local WHERE tombo_codigo IS NULL LOOP
        SELECT sigla INTO project_sigla FROM locais WHERE id = r.local_id;
        
        IF project_sigla IS NOT NULL THEN
            i := 1;
            -- Update each specimen in this project sequentially
            FOR r IN SELECT id FROM especie_local WHERE local_id = r.local_id AND tombo_codigo IS NULL ORDER BY created_at ASC LOOP
                UPDATE especie_local 
                SET tombo_codigo = project_sigla || '-' || LPAD(i::TEXT, 5, '0')
                WHERE id = r.id;
                i := i + 1;
            END LOOP;
        END IF;
    END LOOP;
END $$;
