-- ============================================================
-- MIGRAÇÃO 011: Leitura pública anônima — Portal Botânico
-- ============================================================
--
-- Objetivo: Garantir que o role `anon` (usuários sem sessão)
-- consiga fazer SELECT nas tabelas públicas do portal
-- veridiasaber.com.br sem precisar de autenticação.
--
-- Contexto: A migration 001_rls_policies.sql já criou policies
-- *_select_public com USING (true), que por padrão valem para
-- todos os roles incluindo `anon`. Esta migration adiciona
-- policies explícitas TO anon como reforço de segurança e
-- documentação de intenção, para o caso de o banco de produção
-- estar em estado divergente das migrations anteriores.
--
-- Idempotente: seguro reexecutar — DROP IF EXISTS antes de cada CREATE.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- TABELA: public.familia
-- (dados taxonômicos públicos — nomes, descrições, imagens)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "allow_anon_select_familia" ON public.familia;

CREATE POLICY "allow_anon_select_familia"
  ON public.familia
  FOR SELECT
  TO anon
  USING (true);


-- ────────────────────────────────────────────────────────────
-- TABELA: public.especie
-- (catálogo de espécies botânicas — leitura pública)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "allow_anon_select_especie" ON public.especie;

CREATE POLICY "allow_anon_select_especie"
  ON public.especie
  FOR SELECT
  TO anon
  USING (true);


-- ────────────────────────────────────────────────────────────
-- TABELA: public.especie_local
-- (ocorrências georreferenciadas — pins no mapa público)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "allow_anon_select_especie_local" ON public.especie_local;

CREATE POLICY "allow_anon_select_especie_local"
  ON public.especie_local
  FOR SELECT
  TO anon
  USING (true);


-- ────────────────────────────────────────────────────────────
-- TABELA: public.locais
-- (projetos e jardins botânicos — aba Projetos do mapa)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "allow_anon_select_locais" ON public.locais;

CREATE POLICY "allow_anon_select_locais"
  ON public.locais
  FOR SELECT
  TO anon
  USING (true);


-- ────────────────────────────────────────────────────────────
-- TABELA: public.imagens
-- (fotos das espécies exibidas nas páginas de detalhe)
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "allow_anon_select_imagens" ON public.imagens;

CREATE POLICY "allow_anon_select_imagens"
  ON public.imagens
  FOR SELECT
  TO anon
  USING (true);
