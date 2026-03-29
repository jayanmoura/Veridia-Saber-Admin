-- ============================================================
-- RLS POLICIES — Veridia Saber
-- Estado: produção
-- ============================================================


-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin', 'catalogador', 'curador', 'coordenador')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.check_user_role_storage()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'catalogador')
  );
END;
$$;

-- Correção de search_path para função interna do Supabase (se existir)
DO $$
DECLARE
    func_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = '_rls_rewrite_initplan'
    ) INTO func_exists;

    IF func_exists THEN
        EXECUTE 'ALTER FUNCTION public._rls_rewrite_initplan() SET search_path = pg_catalog, public';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '_rls_rewrite_initplan não encontrada ou não alterável: %', SQLERRM;
END $$;


-- ============================================================
-- TABELA: public.profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin Update Any Profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin pode ver todos profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem ver perfis" ON public.profiles;
DROP POLICY IF EXISTS "Hierarquia de Acesso" ON public.profiles;
DROP POLICY IF EXISTS "Hierarquia de Edição de Perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admin Update Team Members" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem ver tudo" ON public.profiles;
DROP POLICY IF EXISTS "Permitir Edicao" ON public.profiles;
DROP POLICY IF EXISTS "Leitura Publica Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir Edicao Próprio Perfil" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin Update Profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_mixed" ON public.profiles;

CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update_mixed"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ( id = (SELECT auth.uid()) OR (SELECT public.is_admin()) )
  WITH CHECK ( id = (SELECT auth.uid()) OR (SELECT public.is_admin()) );


-- ============================================================
-- TABELA: public.familia
-- ============================================================
ALTER TABLE public.familia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Escrita Staff Familias" ON public.familia;
DROP POLICY IF EXISTS "Leitura Publica Familia" ON public.familia;
DROP POLICY IF EXISTS "Permitir Leitura Familia" ON public.familia;
DROP POLICY IF EXISTS "Admin pode inserir familias" ON public.familia;
DROP POLICY IF EXISTS "Admin pode atualizar familias" ON public.familia;
DROP POLICY IF EXISTS "Admin pode deletar familias" ON public.familia;
DROP POLICY IF EXISTS "familia_select_public" ON public.familia;
DROP POLICY IF EXISTS "familia_insert_staff" ON public.familia;
DROP POLICY IF EXISTS "familia_update_staff" ON public.familia;
DROP POLICY IF EXISTS "familia_delete_admin" ON public.familia;

CREATE POLICY "familia_select_public"
  ON public.familia FOR SELECT
  USING (true);

CREATE POLICY "familia_insert_staff"
  ON public.familia FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT public.is_staff()) );

CREATE POLICY "familia_update_staff"
  ON public.familia FOR UPDATE
  TO authenticated
  USING ( (SELECT public.is_staff()) );

CREATE POLICY "familia_delete_admin"
  ON public.familia FOR DELETE
  TO authenticated
  USING ( (SELECT public.is_admin()) );


-- ============================================================
-- TABELA: public.familia_nomenclatura_legado
-- ============================================================
ALTER TABLE public.familia_nomenclatura_legado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "familia_legado_insert_auth" ON public.familia_nomenclatura_legado;
DROP POLICY IF EXISTS "familia_legado_update_auth" ON public.familia_nomenclatura_legado;
DROP POLICY IF EXISTS "familia_legado_delete_auth" ON public.familia_nomenclatura_legado;

CREATE POLICY "familia_legado_insert_staff"
  ON public.familia_nomenclatura_legado FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT public.is_staff()) );

CREATE POLICY "familia_legado_update_staff"
  ON public.familia_nomenclatura_legado FOR UPDATE
  TO authenticated
  USING ( (SELECT public.is_staff()) );

CREATE POLICY "familia_legado_delete_admin"
  ON public.familia_nomenclatura_legado FOR DELETE
  TO authenticated
  USING ( (SELECT public.is_admin()) );


-- ============================================================
-- TABELA: public.especie
-- ============================================================
ALTER TABLE public.especie ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Escrita Staff Especies" ON public.especie;
DROP POLICY IF EXISTS "Permitir Exclusao Especies" ON public.especie;
DROP POLICY IF EXISTS "Permitir contribuição de espécies (Crowdsourcing)" ON public.especie;
DROP POLICY IF EXISTS "Permitir contribuição de espécies" ON public.especie;
DROP POLICY IF EXISTS "Leitura Publica Especies" ON public.especie;
DROP POLICY IF EXISTS "Leitura Publica Especie" ON public.especie;
DROP POLICY IF EXISTS "Ver todas especies" ON public.especie;
DROP POLICY IF EXISTS "Ver todas as espécies" ON public.especie;
DROP POLICY IF EXISTS "especie_select_public" ON public.especie;
DROP POLICY IF EXISTS "especie_insert_mixed" ON public.especie;
DROP POLICY IF EXISTS "especie_update_mixed" ON public.especie;
DROP POLICY IF EXISTS "especie_delete_mixed" ON public.especie;

CREATE POLICY "especie_select_public"
  ON public.especie FOR SELECT
  USING (true);

CREATE POLICY "especie_insert_mixed"
  ON public.especie FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_staff())
    OR (created_by = (SELECT auth.uid()))
    OR (created_by IS NULL)
  );

CREATE POLICY "especie_update_mixed"
  ON public.especie FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_staff())
    OR (created_by = (SELECT auth.uid()))
  );

CREATE POLICY "especie_delete_mixed"
  ON public.especie FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (created_by = (SELECT auth.uid()))
  );


-- ============================================================
-- TABELA: public.especie_local
-- ============================================================
ALTER TABLE public.especie_local ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso Restrito por Projeto" ON public.especie_local;
DROP POLICY IF EXISTS "Admins Globais Acesso Total" ON public.especie_local;
DROP POLICY IF EXISTS "Escrita Staff Ocorrencias" ON public.especie_local;
DROP POLICY IF EXISTS "EspecieLocal_Isolation" ON public.especie_local;
DROP POLICY IF EXISTS "Gestores podem editar suas proprias ocorrencias" ON public.especie_local;
DROP POLICY IF EXISTS "Gestores podem editar dados do seu local" ON public.especie_local;
DROP POLICY IF EXISTS "Leitura Publica Ocorrencias" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_delete_auth" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_insert_auth" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_update_auth" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_select_public" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_insert_mixed" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_update_mixed" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_delete_mixed" ON public.especie_local;

CREATE POLICY "especie_local_select_public"
  ON public.especie_local FOR SELECT
  USING (true);

CREATE POLICY "especie_local_insert_mixed"
  ON public.especie_local FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_staff())
    OR (created_by = (SELECT auth.uid()))
  );

CREATE POLICY "especie_local_update_mixed"
  ON public.especie_local FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_staff())
    OR (created_by = (SELECT auth.uid()))
  );

CREATE POLICY "especie_local_delete_mixed"
  ON public.especie_local FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (created_by = (SELECT auth.uid()))
  );


-- ============================================================
-- TABELA: public.locais
-- ============================================================
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow delete for admins" ON public.locais;
DROP POLICY IF EXISTS "Allow delete for Curador and Coordenador" ON public.locais;
DROP POLICY IF EXISTS "Allow insert for admins" ON public.locais;
DROP POLICY IF EXISTS "Allow insert for Curador and Coordenador" ON public.locais;
DROP POLICY IF EXISTS "Allow update for admins" ON public.locais;
DROP POLICY IF EXISTS "Escrita Staff Locais" ON public.locais;
DROP POLICY IF EXISTS "Gestor pode editar seu local" ON public.locais;
DROP POLICY IF EXISTS "Gestor pode editar seu proprio local" ON public.locais;
DROP POLICY IF EXISTS "Global Admins can do anything" ON public.locais;
DROP POLICY IF EXISTS "Global Admins can update all projects" ON public.locais;
DROP POLICY IF EXISTS "Managers can update their own projects" ON public.locais;
DROP POLICY IF EXISTS "Permitir Update para Admins" ON public.locais;
DROP POLICY IF EXISTS "Leitura Publica Locais" ON public.locais;
DROP POLICY IF EXISTS "Locais_Isolation" ON public.locais;
DROP POLICY IF EXISTS "Super Admin Delete Locais" ON public.locais;
DROP POLICY IF EXISTS "locais_select_public" ON public.locais;
DROP POLICY IF EXISTS "locais_insert_staff" ON public.locais;
DROP POLICY IF EXISTS "locais_update_mixed" ON public.locais;
DROP POLICY IF EXISTS "locais_delete_admin" ON public.locais;

CREATE POLICY "locais_select_public"
  ON public.locais FOR SELECT
  USING (true);

CREATE POLICY "locais_insert_staff"
  ON public.locais FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT public.is_staff()) );

CREATE POLICY "locais_update_mixed"
  ON public.locais FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_staff())
    OR (gestor_id = (SELECT auth.uid()))
  );

CREATE POLICY "locais_delete_admin"
  ON public.locais FOR DELETE
  TO authenticated
  USING ( (SELECT public.is_admin()) );


-- ============================================================
-- TABELA: public.imagens
-- ============================================================
ALTER TABLE public.imagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin deleta imagens" ON public.imagens;
DROP POLICY IF EXISTS "Admin insere imagens" ON public.imagens;
DROP POLICY IF EXISTS "Imagens Select Policy" ON public.imagens;
DROP POLICY IF EXISTS "Imagens Update Policy" ON public.imagens;
DROP POLICY IF EXISTS "Imagens_Isolation" ON public.imagens;
DROP POLICY IF EXISTS "Leitura pública de imagens" ON public.imagens;
DROP POLICY IF EXISTS "imagens_select_public" ON public.imagens;
DROP POLICY IF EXISTS "imagens_insert_mixed" ON public.imagens;
DROP POLICY IF EXISTS "imagens_update_mixed" ON public.imagens;
DROP POLICY IF EXISTS "imagens_delete_mixed" ON public.imagens;

CREATE POLICY "imagens_select_public"
  ON public.imagens FOR SELECT
  USING (true);

CREATE POLICY "imagens_insert_mixed"
  ON public.imagens FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT public.is_staff())
    OR (criado_por = (SELECT auth.uid())::text)
  );

CREATE POLICY "imagens_update_mixed"
  ON public.imagens FOR UPDATE
  TO authenticated
  USING (
    (SELECT public.is_staff())
    OR (criado_por = (SELECT auth.uid())::text)
  );

CREATE POLICY "imagens_delete_mixed"
  ON public.imagens FOR DELETE
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (criado_por = (SELECT auth.uid())::text)
  );


-- ============================================================
-- TABELA: public.admin_notifications
-- ============================================================
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso Notificacoes Admin" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Envio de Notificação" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Leitura Notificação" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Atualizar Notificacao" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Atualizar Notificações" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Leitura para Staff Global" ON public.admin_notifications;
DROP POLICY IF EXISTS "User can update own notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "notif_select_mixed" ON public.admin_notifications;
DROP POLICY IF EXISTS "notif_insert_staff" ON public.admin_notifications;
DROP POLICY IF EXISTS "notif_update_mixed" ON public.admin_notifications;
DROP POLICY IF EXISTS "notif_delete_mixed" ON public.admin_notifications;

CREATE POLICY "notif_select_mixed"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING ( user_id = (SELECT auth.uid()) OR (SELECT public.is_staff()) );

CREATE POLICY "notif_insert_staff"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT public.is_staff()) );

CREATE POLICY "notif_update_mixed"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING ( user_id = (SELECT auth.uid()) OR (SELECT public.is_staff()) );

CREATE POLICY "notif_delete_mixed"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING ( user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()) );


-- ============================================================
-- TABELA: public.audit_logs
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso Logs Auditoria" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins veem logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Staff cria logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_staff" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_staff" ON public.audit_logs;

CREATE POLICY "audit_logs_select_staff"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING ( (SELECT public.is_staff()) );

CREATE POLICY "audit_logs_insert_staff"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT public.is_staff()) );


-- ============================================================
-- TABELA: public.conteudo_orgaos
-- ============================================================
ALTER TABLE public.conteudo_orgaos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin gerencia conteudo" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "Leitura publica conteudo" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "Permitir leitura pública para todos" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "conteudo_select_public" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "conteudo_write_staff" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "conteudo_insert_staff" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "conteudo_update_staff" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "conteudo_delete_staff" ON public.conteudo_orgaos;

CREATE POLICY "conteudo_select_public"
  ON public.conteudo_orgaos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "conteudo_insert_staff"
  ON public.conteudo_orgaos FOR INSERT
  TO authenticated
  WITH CHECK ( (SELECT public.is_staff()) );

CREATE POLICY "conteudo_update_staff"
  ON public.conteudo_orgaos FOR UPDATE
  TO authenticated
  USING ( (SELECT public.is_staff()) );

CREATE POLICY "conteudo_delete_staff"
  ON public.conteudo_orgaos FOR DELETE
  TO authenticated
  USING ( (SELECT public.is_staff()) );


-- ============================================================
-- TABELA: public.colecoes
-- ============================================================
ALTER TABLE public.colecoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Colecoes_Isolation" ON public.colecoes;
DROP POLICY IF EXISTS "Utilizadores podem gerir suas proprias colecoes" ON public.colecoes;
DROP POLICY IF EXISTS "Utilizadores podem gerir as suas próprias coleções" ON public.colecoes;
DROP POLICY IF EXISTS "colecoes_all_owner" ON public.colecoes;

CREATE POLICY "colecoes_all_owner"
  ON public.colecoes
  TO authenticated
  USING ( user_id = (SELECT auth.uid()) )
  WITH CHECK ( user_id = (SELECT auth.uid()) );


-- ============================================================
-- TABELA: public.plantas_da_colecao
-- ============================================================
ALTER TABLE public.plantas_da_colecao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PlantasCol_Isolation" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Admin vê todas as plantas" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Usuários veem suas plantas" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Usuários veem suas próprias plantas" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Utilizadores podem gerir suas proprias plantas" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Utilizadores podem gerir as suas próprias plantas da coleção" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "plantas_da_colecao_all_owner" ON public.plantas_da_colecao;

CREATE POLICY "plantas_da_colecao_all_owner"
  ON public.plantas_da_colecao
  TO authenticated
  USING ( user_id = (SELECT auth.uid()) )
  WITH CHECK ( user_id = (SELECT auth.uid()) );


-- ============================================================
-- TABELA: public.colecao_imagens
-- ============================================================
ALTER TABLE public.colecao_imagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "colecao_imagens_isolation" ON public.colecao_imagens;
DROP POLICY IF EXISTS "ColecaoImagens Owner" ON public.colecao_imagens;
DROP POLICY IF EXISTS "Utilizadores podem gerir as imagens das suas próprias plantas" ON public.colecao_imagens;
DROP POLICY IF EXISTS "colecao_imagens_all_owner" ON public.colecao_imagens;

CREATE POLICY "colecao_imagens_all_owner"
  ON public.colecao_imagens
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plantas_da_colecao p
      WHERE p.id = planta_colecao_id
      AND p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plantas_da_colecao p
      WHERE p.id = planta_colecao_id
      AND p.user_id = (SELECT auth.uid())
    )
  );


-- ============================================================
-- TABELA: public.analytics_events
-- ============================================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ler analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_select_admin" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_insert_user" ON public.analytics_events;

CREATE POLICY "analytics_select_admin"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING ( (SELECT public.is_staff()) );

CREATE POLICY "analytics_insert_user"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK ( user_id = (SELECT auth.uid()) );


-- ============================================================
-- TABELA: public.etiquetas
-- ============================================================
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert labels for their projects" ON public.etiquetas;
DROP POLICY IF EXISTS "Users can view labels from their projects" ON public.etiquetas;
DROP POLICY IF EXISTS "etiquetas_insert_owner" ON public.etiquetas;
DROP POLICY IF EXISTS "etiquetas_select_mixed" ON public.etiquetas;

CREATE POLICY "etiquetas_select_mixed"
  ON public.etiquetas FOR SELECT
  TO authenticated
  USING (
    gerado_por = (SELECT auth.uid())
    OR (SELECT public.is_staff())
  );

CREATE POLICY "etiquetas_insert_owner"
  ON public.etiquetas FOR INSERT
  TO authenticated
  WITH CHECK ( gerado_por = (SELECT auth.uid()) );


-- ============================================================
-- TABELA: public.beta_testers
-- ============================================================
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.beta_testers;
DROP POLICY IF EXISTS "Allow anonymous email check" ON public.beta_testers;
DROP POLICY IF EXISTS "Allow anonymous delete after download" ON public.beta_testers;
DROP POLICY IF EXISTS "beta_testers_insert_auth" ON public.beta_testers;
DROP POLICY IF EXISTS "beta_testers_select_active" ON public.beta_testers;
DROP POLICY IF EXISTS "beta_testers_delete_active" ON public.beta_testers;

CREATE POLICY "beta_testers_select_active"
  ON public.beta_testers FOR SELECT
  USING (is_active = true);

CREATE POLICY "beta_testers_insert_auth"
  ON public.beta_testers FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (SELECT auth.jwt() ->> 'email')
  );

CREATE POLICY "beta_testers_delete_active"
  ON public.beta_testers FOR DELETE
  USING (is_active = true);


-- ============================================================
-- STORAGE: storage.objects (bucket: arquivos-gerais)
-- ============================================================

DROP POLICY IF EXISTS "Debug: Permitir delete geral" ON storage.objects;
DROP POLICY IF EXISTS "Debug: Permitir select geral" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de arquivos por equipe" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura de arquivos por equipe" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão segura por equipe" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura segura por equipe" ON storage.objects;

CREATE POLICY "storage_select_staff"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'arquivos-gerais'
    AND public.check_user_role_storage() = true
  );

CREATE POLICY "storage_delete_staff"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'arquivos-gerais'
    AND public.check_user_role_storage() = true
  );
