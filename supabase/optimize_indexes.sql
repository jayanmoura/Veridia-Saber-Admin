/*
  OTIMIZAÇÃO DE PERFORMANCE: ÍNDICES FALTANTES
  --------------------------------------------
  Este script resolve os avisos de "Unindexed foreign keys" (INFO).
  Adicionar índices em colunas de chave estrangeira melhora muito
  a performance de JOINs e filtros por relacionamento.

  OBS: Ignorei os avisos de "Unused Index" por enquanto. 
  É melhor ter um índice sobrando do que faltar um importante.
*/

-- 1. admin_notifications
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_local_id" ON public.admin_notifications (local_id);
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_sender_id" ON public.admin_notifications (sender_id); -- Assumindo que existe essa coluna baseada no log
CREATE INDEX IF NOT EXISTS "idx_admin_notifications_user_id" ON public.admin_notifications (user_id);

-- 2. audit_logs
-- O log indicou duas FKs para user_id, um índice resolve ambas.
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON public.audit_logs (user_id);

-- 3. colecao_imagens
CREATE INDEX IF NOT EXISTS "idx_colecao_imagens_planta_colecao_id" ON public.colecao_imagens (planta_colecao_id);

-- 4. colecoes
CREATE INDEX IF NOT EXISTS "idx_colecoes_institution_id" ON public.colecoes (institution_id);
CREATE INDEX IF NOT EXISTS "idx_colecoes_user_id" ON public.colecoes (user_id);

-- 5. especie
CREATE INDEX IF NOT EXISTS "idx_especie_created_by" ON public.especie (created_by);
CREATE INDEX IF NOT EXISTS "idx_especie_created_by_institution_id" ON public.especie (created_by_institution_id);
CREATE INDEX IF NOT EXISTS "idx_especie_familia_id" ON public.especie (familia_id);

-- 6. especie_local
CREATE INDEX IF NOT EXISTS "idx_especie_local_institution_id" ON public.especie_local (institution_id);

-- 7. etiquetas
CREATE INDEX IF NOT EXISTS "idx_etiquetas_especie_local_id" ON public.etiquetas (especie_local_id);
CREATE INDEX IF NOT EXISTS "idx_etiquetas_gerado_por" ON public.etiquetas (gerado_por);

-- 8. familia
CREATE INDEX IF NOT EXISTS "idx_familia_created_by" ON public.familia (created_by);
CREATE INDEX IF NOT EXISTS "idx_familia_institution_id" ON public.familia (created_by_institution_id);

-- 9. imagens
CREATE INDEX IF NOT EXISTS "idx_imagens_especime_id_fk" ON public.imagens (especime_id); -- O log chamou de fk_especie_cascade, mas geralmente liga a especime ou especie. Vou assumir o padrão.
CREATE INDEX IF NOT EXISTS "idx_imagens_institution_id" ON public.imagens (institution_id);
CREATE INDEX IF NOT EXISTS "idx_imagens_local_id" ON public.imagens (local_id);

-- 10. locais
CREATE INDEX IF NOT EXISTS "idx_locais_gestor_id" ON public.locais (gestor_id);
CREATE INDEX IF NOT EXISTS "idx_locais_institution_id" ON public.locais (institution_id);

-- 11. plantas_da_colecao
CREATE INDEX IF NOT EXISTS "idx_plantas_da_colecao_colecao_id" ON public.plantas_da_colecao (colecao_id);
CREATE INDEX IF NOT EXISTS "idx_plantas_da_colecao_familia_id" ON public.plantas_da_colecao (familia_id);
CREATE INDEX IF NOT EXISTS "idx_plantas_da_colecao_institution_id" ON public.plantas_da_colecao (institution_id);
CREATE INDEX IF NOT EXISTS "idx_plantas_da_colecao_user_id" ON public.plantas_da_colecao (user_id);

-- 12. profiles
CREATE INDEX IF NOT EXISTS "idx_profiles_institution_id" ON public.profiles (institution_id);
