/*
  CORREÇÃO ABRANGENTE DE SEGURANÇA E PERFORMANCE DO SUPABASE (V2.1 - FIX)
  -----------------------------------------------------------------------
  Este script resolve os avisos críticos e corrige o erro de sintaxe anterior.
  
  Melhorias:
  1. auth_rls_initplan: Otimiza chamadas de auth usando (select auth.uid()).
  2. multiple_permissive_policies: Consolida múltiplas políticas em uma única por ação.
  3. function_search_path_mutable: Correção robusta via bloco DO para _rls_rewrite_initplan.
  
  Autoria: Antigravity Agent
  Data: 2026-05-XX
*/

-- -----------------------------------------------------------------------------
-- 1. CORREÇÃO DE HELPER FUNCTIONS E SEARCH PATH
-- -----------------------------------------------------------------------------

-- Correção SEGURA do search_path (sem erro de sintaxe)
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
    RAISE NOTICE 'Não foi possível alterar _rls_rewrite_initplan: %', SQLERRM;
END $$;

-- Funções auxiliares OTIMIZADAS (STABLE)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (select auth.uid())
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
    WHERE id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. CONSOLIDAÇÃO DE POLÍTICAS (CLEANUP & FIX)
-- -----------------------------------------------------------------------------

-- =============================================================================
-- TABELA: public.familia
-- =============================================================================
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

CREATE POLICY "familia_select_public" ON public.familia FOR SELECT USING (true);
CREATE POLICY "familia_insert_staff" ON public.familia FOR INSERT TO authenticated WITH CHECK ( (SELECT public.is_staff()) );
CREATE POLICY "familia_update_staff" ON public.familia FOR UPDATE TO authenticated USING ( (SELECT public.is_staff()) );
CREATE POLICY "familia_delete_admin" ON public.familia FOR DELETE TO authenticated USING ( (SELECT public.is_admin()) );

-- =============================================================================
-- TABELA: public.especie
-- =============================================================================
ALTER TABLE public.especie ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Escrita Staff Especies" ON public.especie;
DROP POLICY IF EXISTS "Permitir Exclusao Especies" ON public.especie;
DROP POLICY IF EXISTS "Permitir contribuição de espécies (Crowdsourcing)" ON public.especie;
DROP POLICY IF EXISTS "Permitir contribuição de espécies" ON public.especie;
DROP POLICY IF EXISTS "Leitura Publica Especies" ON public.especie;
DROP POLICY IF EXISTS "Ver todas especies" ON public.especie;
DROP POLICY IF EXISTS "especie_select_public" ON public.especie;
DROP POLICY IF EXISTS "especie_insert_mixed" ON public.especie;
DROP POLICY IF EXISTS "especie_update_mixed" ON public.especie;
DROP POLICY IF EXISTS "especie_delete_mixed" ON public.especie;

CREATE POLICY "especie_select_public" ON public.especie FOR SELECT USING (true);

-- Insert: Staff ou Crowdsourcing
CREATE POLICY "especie_insert_mixed" ON public.especie FOR INSERT TO authenticated 
WITH CHECK (
  (SELECT public.is_staff()) OR (created_by = (SELECT auth.uid())) OR (created_by IS NULL)
);

-- Update: Staff ou Dono
CREATE POLICY "especie_update_mixed" ON public.especie FOR UPDATE TO authenticated 
USING (
  (SELECT public.is_staff()) OR (created_by = (SELECT auth.uid()))
);

-- Delete: Admin ou Dono
CREATE POLICY "especie_delete_mixed" ON public.especie FOR DELETE TO authenticated 
USING (
  (SELECT public.is_admin()) OR (created_by = (SELECT auth.uid()))
);

-- =============================================================================
-- TABELA: public.especie_local
-- =============================================================================
ALTER TABLE public.especie_local ENABLE ROW LEVEL SECURITY;

-- Limpeza
DROP POLICY IF EXISTS "Acesso Restrito por Projeto" ON public.especie_local;
DROP POLICY IF EXISTS "Admins Globais Acesso Total" ON public.especie_local;
DROP POLICY IF EXISTS "Escrita Staff Ocorrencias" ON public.especie_local;
DROP POLICY IF EXISTS "EspecieLocal_Isolation" ON public.especie_local;
DROP POLICY IF EXISTS "Gestores podem editar suas proprias ocorrencias" ON public.especie_local;
DROP POLICY IF EXISTS "Leitura Publica Ocorrencias" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_delete_auth" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_insert_auth" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_select_public" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_update_auth" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_insert_mixed" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_update_mixed" ON public.especie_local;
DROP POLICY IF EXISTS "especie_local_delete_mixed" ON public.especie_local;

CREATE POLICY "especie_local_select_public" ON public.especie_local FOR SELECT USING (true);

CREATE POLICY "especie_local_insert_mixed" ON public.especie_local FOR INSERT TO authenticated 
WITH CHECK (
  (SELECT public.is_staff()) OR (created_by = (SELECT auth.uid()))
);

CREATE POLICY "especie_local_update_mixed" ON public.especie_local FOR UPDATE TO authenticated 
USING (
  (SELECT public.is_staff()) OR (created_by = (SELECT auth.uid()))
);

CREATE POLICY "especie_local_delete_mixed" ON public.especie_local FOR DELETE TO authenticated 
USING (
  (SELECT public.is_admin()) OR (created_by = (SELECT auth.uid()))
);

-- =============================================================================
-- TABELA: public.locais
-- =============================================================================
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow delete for admins" ON public.locais;
DROP POLICY IF EXISTS "Allow insert for admins" ON public.locais;
DROP POLICY IF EXISTS "Allow update for admins" ON public.locais;
DROP POLICY IF EXISTS "Escrita Staff Locais" ON public.locais;
DROP POLICY IF EXISTS "Gestor pode editar seu local" ON public.locais;
DROP POLICY IF EXISTS "Global Admins can do anything" ON public.locais;
DROP POLICY IF EXISTS "Leitura Publica Locais" ON public.locais;
DROP POLICY IF EXISTS "Locais_Isolation" ON public.locais;
DROP POLICY IF EXISTS "Super Admin Delete Locais" ON public.locais;
DROP POLICY IF EXISTS "locais_select_public" ON public.locais;
DROP POLICY IF EXISTS "locais_insert_staff" ON public.locais;
DROP POLICY IF EXISTS "locais_update_mixed" ON public.locais;
DROP POLICY IF EXISTS "locais_delete_admin" ON public.locais;

CREATE POLICY "locais_select_public" ON public.locais FOR SELECT USING (true);
CREATE POLICY "locais_insert_staff" ON public.locais FOR INSERT TO authenticated WITH CHECK ( (SELECT public.is_staff()) );
CREATE POLICY "locais_update_mixed" ON public.locais FOR UPDATE TO authenticated USING ( (SELECT public.is_staff()) OR (gestor_id = (SELECT auth.uid())) );
CREATE POLICY "locais_delete_admin" ON public.locais FOR DELETE TO authenticated USING ( (SELECT public.is_admin()) );

-- =============================================================================
-- TABELA: public.imagens
-- =============================================================================
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

CREATE POLICY "imagens_select_public" ON public.imagens FOR SELECT USING (true);

-- Nota: convertido auth.uid() para text para comparar com criado_por (text)
CREATE POLICY "imagens_insert_mixed" ON public.imagens FOR INSERT TO authenticated 
WITH CHECK (
  (SELECT public.is_staff()) OR (criado_por = (SELECT auth.uid())::text)
);

CREATE POLICY "imagens_update_mixed" ON public.imagens FOR UPDATE TO authenticated 
USING (
  (SELECT public.is_staff()) OR (criado_por = (SELECT auth.uid())::text)
);

CREATE POLICY "imagens_delete_mixed" ON public.imagens FOR DELETE TO authenticated 
USING (
  (SELECT public.is_admin()) OR (criado_por = (SELECT auth.uid())::text)
);

-- =============================================================================
-- TABELA: public.colecoes
-- =============================================================================
ALTER TABLE public.colecoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Colecoes_Isolation" ON public.colecoes;
DROP POLICY IF EXISTS "Utilizadores podem gerir suas proprias colecoes" ON public.colecoes;
DROP POLICY IF EXISTS "colecoes_all_owner" ON public.colecoes;

CREATE POLICY "colecoes_all_owner" ON public.colecoes
TO authenticated
USING ( user_id = (SELECT auth.uid()) )
WITH CHECK ( user_id = (SELECT auth.uid()) );

-- =============================================================================
-- TABELA: public.plantas_da_colecao
-- =============================================================================
ALTER TABLE public.plantas_da_colecao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PlantasCol_Isolation" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Admin vê todas as plantas" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Usuários veem suas plantas" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Utilizadores podem gerir suas proprias plantas" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "plantas_da_colecao_all_owner" ON public.plantas_da_colecao;

CREATE POLICY "plantas_da_colecao_all_owner" ON public.plantas_da_colecao
TO authenticated
USING ( user_id = (SELECT auth.uid()) )
WITH CHECK ( user_id = (SELECT auth.uid()) );

-- =============================================================================
-- TABELA: public.colecao_imagens
-- =============================================================================
ALTER TABLE public.colecao_imagens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "colecao_imagens_isolation" ON public.colecao_imagens; 
DROP POLICY IF EXISTS "ColecaoImagens Owner" ON public.colecao_imagens;
DROP POLICY IF EXISTS "colecao_imagens_all_owner" ON public.colecao_imagens;

CREATE POLICY "colecao_imagens_all_owner" ON public.colecao_imagens
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

-- =============================================================================
-- TABELA: public.audit_logs
-- =============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Logs Auditoria" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins veem logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Staff cria logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_staff" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_staff" ON public.audit_logs;

CREATE POLICY "audit_logs_select_staff" ON public.audit_logs FOR SELECT TO authenticated USING ( (SELECT public.is_staff()) );
CREATE POLICY "audit_logs_insert_staff" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK ( (SELECT public.is_staff()) );

-- =============================================================================
-- TABELA: public.admin_notifications
-- =============================================================================
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso Notificacoes Admin" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Envio de Notificação" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Leitura Notificação" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Atualizar Notificacao" ON public.admin_notifications;
DROP POLICY IF EXISTS "User can update own notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "notif_select_mixed" ON public.admin_notifications;
DROP POLICY IF EXISTS "notif_insert_staff" ON public.admin_notifications;
DROP POLICY IF EXISTS "notif_update_mixed" ON public.admin_notifications;
DROP POLICY IF EXISTS "notif_delete_mixed" ON public.admin_notifications;

CREATE POLICY "notif_select_mixed" ON public.admin_notifications FOR SELECT 
TO authenticated USING ( user_id = (SELECT auth.uid()) OR (SELECT public.is_staff()) );

CREATE POLICY "notif_insert_staff" ON public.admin_notifications FOR INSERT 
TO authenticated WITH CHECK ( (SELECT public.is_staff()) );

CREATE POLICY "notif_update_mixed" ON public.admin_notifications FOR UPDATE 
TO authenticated USING ( user_id = (SELECT auth.uid()) OR (SELECT public.is_staff()) );

CREATE POLICY "notif_delete_mixed" ON public.admin_notifications FOR DELETE 
TO authenticated USING ( user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()) );

-- =============================================================================
-- TABELA: public.profiles
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Dropar políticas antigas
DROP POLICY IF EXISTS "Admin Update Any Profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin pode ver todos profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem ver perfis" ON public.profiles;
DROP POLICY IF EXISTS "Hierarquia de Acesso" ON public.profiles;
DROP POLICY IF EXISTS "Leitura Publica Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir Edicao Próprio Perfil" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin Update Profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_mixed" ON public.profiles;

CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_mixed" ON public.profiles FOR UPDATE TO authenticated 
USING ( id = (SELECT auth.uid()) OR (SELECT public.is_admin()) )
WITH CHECK ( id = (SELECT auth.uid()) OR (SELECT public.is_admin()) );

-- =============================================================================
-- TABELA: public.conteudo_orgaos
-- =============================================================================
ALTER TABLE public.conteudo_orgaos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin gerencia conteudo" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "Leitura publica conteudo" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "Permitir leitura pública para todos" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "conteudo_select_public" ON public.conteudo_orgaos;
DROP POLICY IF EXISTS "conteudo_write_staff" ON public.conteudo_orgaos;

CREATE POLICY "conteudo_select_public" ON public.conteudo_orgaos FOR SELECT USING (true);
CREATE POLICY "conteudo_write_staff" ON public.conteudo_orgaos FOR ALL TO authenticated 
USING ( (SELECT public.is_staff()) ) WITH CHECK ( (SELECT public.is_staff()) );
