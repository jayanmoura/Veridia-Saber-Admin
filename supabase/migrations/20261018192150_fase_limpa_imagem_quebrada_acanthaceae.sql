-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
UPDATE familia
SET imagem_referencia = NULL, imagem_thumbnail = NULL, imagem_micro = NULL
WHERE id = 'efab46dc-c9a8-4cac-a6be-130aa293d167'
  AND imagem_referencia = 'https://storage.veridiasaber.com.br/imagens-plantas/familias/1769450915461_kbeu6g.jpeg';
