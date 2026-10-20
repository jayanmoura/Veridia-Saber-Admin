-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Remove a constraint UNIQUE (especie_id, local_id) que impede múltiplos espécimes
-- da mesma espécie num mesmo projeto - comportamento incorreto segundo o domínio.
-- Um jardim botânico pode ter N indivíduos da mesma espécie em locais diferentes.
ALTER TABLE especie_local
DROP CONSTRAINT IF EXISTS especie_local_especie_id_local_id_key;
