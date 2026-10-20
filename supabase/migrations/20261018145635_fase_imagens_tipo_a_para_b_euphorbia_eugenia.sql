-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
UPDATE imagens SET especime_id = 120, especie_id = NULL
WHERE id = 'bc489ff8-4051-40b4-b44e-6421f4f1cee5'
  AND especie_id = '6e479b8a-acc8-4ac6-b566-57eafe9e84ac' AND especime_id IS NULL;

UPDATE imagens SET especime_id = 112, especie_id = NULL
WHERE id = 'd6545376-c6b2-413f-9030-03307c0302f9'
  AND especie_id = 'a3fc1d52-91ee-4107-b48e-4807de684738' AND especime_id IS NULL;
