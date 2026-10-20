-- Registro historico: ja aplicado no banco (supabase_migrations.schema_migrations). Nao reexecutar em producao.
-- Fase 4 do plano de correção de segurança (F2)
-- Propaga escopo por local_id para além de profiles, e restringe conteúdo
-- taxonômico/educacional global a papéis globais (Curador Mestre, Coordenador
-- Científico, Taxonomista Sênior), conforme decisões de 29/08-03/09/2026.

-- ============================================================
-- 1. Funções auxiliares
-- ============================================================

-- Generaliza o padrão já usado em especie_delete_mixed/especie_local_delete_mixed:
-- níveis 1-3 (Curador Mestre, Coordenador Científico, Taxonomista Sênior) são
-- sempre globais; níveis 4-5 (Gestor de Acervo, Taxonomista de Campo) só passam
-- se o local_id do registro bater com o local_id do próprio perfil.
CREATE OR REPLACE FUNCTION public.is_local_staff_for(target_local_id bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND (
        role IN ('Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior')
        OR (
          role IN ('Gestor de Acervo', 'Taxonomista de Campo')
          AND local_id IS NOT NULL
          AND local_id = target_local_id
        )
      )
  );
$function$;

-- Papéis com permissão de editar taxonomia/conteúdo educacional GLOBAL
-- (familia, nomenclatura legada, conteúdo de órgãos botânicos).
-- Gestor de Acervo e Taxonomista de Campo NÃO entram aqui (decisão de
-- 03/09/2026) - só mexem no que é escopado ao próprio projeto.
CREATE OR REPLACE FUNCTION public.is_global_taxonomist()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior')
  );
$function$;

-- ============================================================
-- 2. especie - INSERT/UPDATE ganham escopo por local_id
--    (DELETE já estava correto desde a migration 004)
-- ============================================================

DROP POLICY IF EXISTS especie_insert_mixed ON public.especie;
CREATE POLICY especie_insert_mixed ON public.especie
  FOR INSERT
  WITH CHECK (
    is_local_staff_for(local_id)
    OR created_by = (SELECT auth.uid())
    OR created_by IS NULL
  );

DROP POLICY IF EXISTS especie_update_mixed ON public.especie;
CREATE POLICY especie_update_mixed ON public.especie
  FOR UPDATE
  USING (
    is_local_staff_for(local_id)
    OR created_by = (SELECT auth.uid())
  )
  WITH CHECK (
    is_local_staff_for(local_id)
    OR created_by = (SELECT auth.uid())
  );

-- ============================================================
-- 3. especie_local - INSERT/UPDATE ganham escopo por local_id
-- ============================================================

DROP POLICY IF EXISTS especie_local_insert_mixed ON public.especie_local;
CREATE POLICY especie_local_insert_mixed ON public.especie_local
  FOR INSERT
  WITH CHECK (
    is_local_staff_for(local_id)
    OR created_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS especie_local_update_mixed ON public.especie_local;
CREATE POLICY especie_local_update_mixed ON public.especie_local
  FOR UPDATE
  USING (
    is_local_staff_for(local_id)
    OR created_by = (SELECT auth.uid())
  )
  WITH CHECK (
    is_local_staff_for(local_id)
    OR created_by = (SELECT auth.uid())
  );

-- ============================================================
-- 4. imagens - INSERT/UPDATE/DELETE ganham escopo por local_id
--    (hoje era 100% global via is_staff())
-- ============================================================

DROP POLICY IF EXISTS imagens_insert_mixed ON public.imagens;
CREATE POLICY imagens_insert_mixed ON public.imagens
  FOR INSERT
  WITH CHECK (
    is_local_staff_for(local_id)
    OR criado_por = ((SELECT auth.uid())::text)
  );

DROP POLICY IF EXISTS imagens_update_mixed ON public.imagens;
CREATE POLICY imagens_update_mixed ON public.imagens
  FOR UPDATE
  USING (
    is_local_staff_for(local_id)
    OR criado_por = ((SELECT auth.uid())::text)
  )
  WITH CHECK (
    is_local_staff_for(local_id)
    OR criado_por = ((SELECT auth.uid())::text)
  );

DROP POLICY IF EXISTS imagens_delete_mixed ON public.imagens;
CREATE POLICY imagens_delete_mixed ON public.imagens
  FOR DELETE
  USING (
    is_local_staff_for(local_id)
    OR criado_por = ((SELECT auth.uid())::text)
  );

-- ============================================================
-- 5. familia / familia_nomenclatura_legado / conteudo_orgaos
--    Restringe a is_global_taxonomist() - Gestor de Acervo e
--    Taxonomista de Campo perdem acesso de escrita global.
-- ============================================================

DROP POLICY IF EXISTS familia_insert_staff ON public.familia;
CREATE POLICY familia_insert_staff ON public.familia
  FOR INSERT
  WITH CHECK (is_global_taxonomist());

DROP POLICY IF EXISTS familia_update_staff ON public.familia;
CREATE POLICY familia_update_staff ON public.familia
  FOR UPDATE
  USING (is_global_taxonomist())
  WITH CHECK (is_global_taxonomist());

DROP POLICY IF EXISTS familia_delete_admin ON public.familia;
CREATE POLICY familia_delete_admin ON public.familia
  FOR DELETE
  USING (is_global_taxonomist());

DROP POLICY IF EXISTS familia_legado_insert_auth ON public.familia_nomenclatura_legado;
CREATE POLICY familia_legado_insert_auth ON public.familia_nomenclatura_legado
  FOR INSERT
  WITH CHECK (is_global_taxonomist());

DROP POLICY IF EXISTS familia_legado_update_auth ON public.familia_nomenclatura_legado;
CREATE POLICY familia_legado_update_auth ON public.familia_nomenclatura_legado
  FOR UPDATE
  USING (is_global_taxonomist())
  WITH CHECK (is_global_taxonomist());

DROP POLICY IF EXISTS familia_legado_delete_auth ON public.familia_nomenclatura_legado;
CREATE POLICY familia_legado_delete_auth ON public.familia_nomenclatura_legado
  FOR DELETE
  USING (is_global_taxonomist());

DROP POLICY IF EXISTS conteudo_insert_staff ON public.conteudo_orgaos;
CREATE POLICY conteudo_insert_staff ON public.conteudo_orgaos
  FOR INSERT
  WITH CHECK (is_global_taxonomist());

DROP POLICY IF EXISTS conteudo_update_staff ON public.conteudo_orgaos;
CREATE POLICY conteudo_update_staff ON public.conteudo_orgaos
  FOR UPDATE
  USING (is_global_taxonomist())
  WITH CHECK (is_global_taxonomist());

DROP POLICY IF EXISTS conteudo_delete_staff ON public.conteudo_orgaos;
CREATE POLICY conteudo_delete_staff ON public.conteudo_orgaos
  FOR DELETE
  USING (is_global_taxonomist());

-- ============================================================
-- 6. locais - criar/apagar projeto vira exclusivo de admin global
--    (UPDATE não muda: is_staff() OR gestor_id = auth.uid())
-- ============================================================

DROP POLICY IF EXISTS locais_insert_staff ON public.locais;
CREATE POLICY locais_insert_staff ON public.locais
  FOR INSERT
  WITH CHECK (is_global_admin());

DROP POLICY IF EXISTS locais_delete_admin ON public.locais;
CREATE POLICY locais_delete_admin ON public.locais
  FOR DELETE
  USING (is_global_admin());

-- ============================================================
-- 7. audit_logs - SELECT vira exclusivo de admin global
--    (Gestor de Acervo/Taxonomista de Campo não têm tela de
--    atividades recentes hoje; INSERT continua para o trigger)
-- ============================================================

DROP POLICY IF EXISTS audit_logs_select_staff ON public.audit_logs;
CREATE POLICY audit_logs_select_staff ON public.audit_logs
  FOR SELECT
  USING (is_global_admin());

-- ============================================================
-- 8. is_admin() - fecha o F2 na origem, removendo 'Gestor de
--    Acervo' do bypass global. Único uso restante após esta
--    migration: admin_notifications (tabela sem UI/uso hoje).
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('Curador Mestre', 'Coordenador Científico')
  );
$function$;
