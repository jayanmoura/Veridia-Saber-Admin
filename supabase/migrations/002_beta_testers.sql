-- ============================================================
-- BETA TESTERS — Veridia Saber
-- Estado: produção
-- ============================================================

-- Tabela de beta testers
CREATE TABLE IF NOT EXISTS public.beta_testers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON public.beta_testers(email);

-- RLS
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer um pode verificar se o email está na lista (somente ativos)
DROP POLICY IF EXISTS "beta_testers_select_active" ON public.beta_testers;
CREATE POLICY "beta_testers_select_active"
  ON public.beta_testers FOR SELECT
  USING (is_active = true);

-- INSERT: apenas o próprio usuário pode registrar seu email
DROP POLICY IF EXISTS "beta_testers_insert_auth" ON public.beta_testers;
CREATE POLICY "beta_testers_insert_auth"
  ON public.beta_testers FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (SELECT auth.jwt() ->> 'email')
  );

-- DELETE: permite remoção de registros ativos (pós-download)
DROP POLICY IF EXISTS "beta_testers_delete_active" ON public.beta_testers;
CREATE POLICY "beta_testers_delete_active"
  ON public.beta_testers FOR DELETE
  USING (is_active = true);
