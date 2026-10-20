-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Fase 7: correção de modelo. "Notas do Projeto" é dado de ESPÉCIE dentro de
-- um PROJETO (compartilhado entre todos os espécimes daquela espécie ali),
-- não dado de espécime individual. Por isso migra para especie_local_overrides
-- (que já tem UNIQUE(especie_id, local_id)) em vez de especie_local (tabela
-- de espécimes individuais, 1:N, sem unique composta de propósito).

ALTER TABLE public.especie_local_overrides
  ADD COLUMN notas_projeto TEXT;

COMMENT ON COLUMN public.especie_local_overrides.notas_projeto IS
  'Nota da espécie dentro deste projeto/local específico (ex: onde encontrar no parque), compartilhada entre todos os espécimes desta espécie neste projeto. Substitui o uso de especie_local.descricao_ocorrencia para este propósito. Criado em 04/09/2026.';
