/*
  CORREÇÃO SEGURANÇA SUPABASE V3 (FINAL CLEANUP)
  ----------------------------------------------
  Este script foca na remoção cirúrgica das políticas que persistiram (nomes exatos do log de erros)
  e aplica correções para tabelas que não estavam no script V2.
*/

-- =============================================================================
-- 1. REMOÇÃO DE POLÍTICAS PERSISTENTES (Cleanup)
-- =============================================================================

-- Tabela: public.colecoes
DROP POLICY IF EXISTS "Utilizadores podem gerir as suas próprias coleções" ON public.colecoes;

-- Tabela: public.plantas_da_colecao
DROP POLICY IF EXISTS "Usuários veem suas próprias plantas" ON public.plantas_da_colecao;
DROP POLICY IF EXISTS "Utilizadores podem gerir as suas próprias plantas da coleção" ON public.plantas_da_colecao;

-- Tabela: public.colecao_imagens
DROP POLICY IF EXISTS "Utilizadores podem gerir as imagens das suas próprias plantas" ON public.colecao_imagens;

-- Tabela: public.profiles
DROP POLICY IF EXISTS "Hierarquia de Edição de Perfis" ON public.profiles;
DROP POLICY IF EXISTS "Admin Update Team Members" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem ver tudo" ON public.profiles;
DROP POLICY IF EXISTS "Permitir Edicao" ON public.profiles;

-- Tabela: public.locais
DROP POLICY IF EXISTS "Allow delete for Curador and Coordenador" ON public.locais;
DROP POLICY IF EXISTS "Allow insert for Curador and Coordenador" ON public.locais;
DROP POLICY IF EXISTS "Gestor pode editar seu proprio local" ON public.locais;
DROP POLICY IF EXISTS "Global Admins can update all projects" ON public.locais;
DROP POLICY IF EXISTS "Managers can update their own projects" ON public.locais;
DROP POLICY IF EXISTS "Permitir Update para Admins" ON public.locais;

-- Tabela: public.especie_local
DROP POLICY IF EXISTS "Gestores podem editar dados do seu local" ON public.especie_local;

-- Tabela: public.admin_notifications
DROP POLICY IF EXISTS "Permitir Atualizar Notificações" ON public.admin_notifications;
DROP POLICY IF EXISTS "Permitir Leitura para Staff Global" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.admin_notifications;

-- Tabela: public.especie
DROP POLICY IF EXISTS "Leitura Publica Especie" ON public.especie;
DROP POLICY IF EXISTS "Ver todas as espécies" ON public.especie;
-- DROP POLICY IF EXISTS "Escrita Staff Especies" ON public.especie; -- Já tentado na v2, garantindo

-- Tabela: public.imagens
DROP POLICY IF EXISTS "Leitura pública de imagens" ON public.imagens;

-- Tabela: public.conteudo_orgaos
DROP POLICY IF EXISTS "Permitir leitura pública para todos" ON public.conteudo_orgaos;


-- =============================================================================
-- 2. NOVAS TABELAS / CORREÇÕES (Fix InitPlans)
-- =============================================================================

-- Tabela: public.beta_testers
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.beta_testers;
-- Nova política otimizada
CREATE POLICY "beta_testers_insert_auth" ON public.beta_testers 
FOR INSERT TO authenticated 
WITH CHECK (true); -- Ou restrinja se necessário, mas o erro era initplan

-- Tabela: public.analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins podem ler analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.analytics_events;

CREATE POLICY "analytics_select_admin" ON public.analytics_events 
FOR SELECT TO authenticated 
USING ( (SELECT public.is_staff()) );

CREATE POLICY "analytics_insert_user" ON public.analytics_events 
FOR INSERT TO authenticated 
WITH CHECK ( user_id = (SELECT auth.uid()) );

-- Tabela: public.etiquetas
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert labels for their projects" ON public.etiquetas;
DROP POLICY IF EXISTS "Users can view labels from their projects" ON public.etiquetas;

-- INSERT: Permite se o usuário gerou a etiqueta
CREATE POLICY "etiquetas_insert_owner" ON public.etiquetas 
FOR INSERT TO authenticated 
WITH CHECK ( gerado_por = (SELECT auth.uid()) );

-- SELECT: Permite se for dono OU staff
CREATE POLICY "etiquetas_select_mixed" ON public.etiquetas 
FOR SELECT TO authenticated 
USING ( 
  gerado_por = (SELECT auth.uid()) OR (SELECT public.is_staff()) 
);


-- =============================================================================
-- 3. REFORÇO DAS POLÍTICAS UNIFICADAS (Garantia)
-- =============================================================================
-- Como rodamos a V2, as novas políticas "_mixed" já devem existir.
-- Não precisamos recriá-las a menos que tenham sumido.
-- O cleanup acima deve resolver os conflitos de "Multiple Permissive Policies".

-- Apenas garantir que as tabelas "esquecidas" na v2 tenham policies para DELETE/UPDATE se necessário
-- (Assumindo que analytics/etiquetas/beta_testers são append-only ou pouco editadas pelo user)
