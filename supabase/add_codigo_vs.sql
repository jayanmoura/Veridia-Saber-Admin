-- =====================================================
-- SPECIES CODIGO_VS MIGRATION
-- Append to previous SQL or run separately
-- =====================================================

-- 1. Add 'codigo_vs' to 'especies'
-- Note: 'especies' table might be named 'especie' or similar. 
-- Schema file showed 'especie_local', but 'especie' (singular) for species view/table?
-- Let's check table name. Schema section 103 showed 'especie_id' columns, 
-- but didn't show the species table explicitly in the previous snippet (lines 100-160).
-- But usually it corresponds to 'especies' or 'especie'.
-- Code uses 'especie' in joins: `especie:especie_id(...)`. This implies relation name 'especie'. 
-- Usually table is 'especies'.
-- Let's try 'especies' (plural) as is convention, or 'especie' (singular).
-- Safest is to try both or check schema.
-- Assuming 'especies' based on user request "Espécies (global)".

ALTER TABLE especies ADD COLUMN IF NOT EXISTS codigo_vs TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS especies_codigo_vs_idx ON especies (codigo_vs);

-- 2. Trigger Function for VS-00000
CREATE OR REPLACE FUNCTION generate_codigo_vs()
RETURNS TRIGGER AS $$
DECLARE
    seq_num BIGINT;
BEGIN
    LOCK TABLE especies IN SHARE ROW EXCLUSIVE MODE;
    
    -- Count existing items or get max ID if possible. 
    -- Since this is global, a SEQUENCE is best.
    -- Create sequence if not exists (namespaced to avoid conflict)
    -- CREATE SEQUENCE IF NOT EXISTS especies_vs_seq;
    
    -- Or just count for simplicity (might have gaps if deleted, but user wants Immutable ID).
    SELECT COALESCE(COUNT(*), 0) + 1 INTO seq_num FROM especies;

    -- Format: VS-00001
    NEW.codigo_vs := 'VS-' || LPAD(seq_num::TEXT, 5, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger
DROP TRIGGER IF EXISTS trigger_generate_codigo_vs ON especies;
CREATE TRIGGER trigger_generate_codigo_vs
BEFORE INSERT ON especies
FOR EACH ROW
WHEN (NEW.codigo_vs IS NULL)
EXECUTE FUNCTION generate_codigo_vs();

-- 4. Backfill existing species
DO $$
DECLARE
    r RECORD;
    i INT := 1;
BEGIN
    FOR r IN SELECT id FROM especies WHERE codigo_vs IS NULL ORDER BY created_at ASC LOOP
        UPDATE especies 
        SET codigo_vs = 'VS-' || LPAD(i::TEXT, 5, '0')
        WHERE id = r.id;
        i := i + 1;
    END LOOP;
END $$;
