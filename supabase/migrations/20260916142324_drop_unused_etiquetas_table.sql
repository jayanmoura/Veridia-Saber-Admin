-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Tabela etiquetas: descontinuada (confirmado pelo usuário). 0 linhas em produção.
-- Nenhum INSERT/SELECT em admin, site público ou app mobile (a única referência era
-- um DELETE em cascata no admin, que está sendo removido do código junto com esta migration).
DROP TABLE IF EXISTS public.etiquetas;
