-- =============================================
-- BETA TESTERS TABLE
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Criar tabela para beta testers
CREATE TABLE IF NOT EXISTS beta_testers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Criar índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON beta_testers(email);

-- Habilitar RLS (Row Level Security)
ALTER TABLE beta_testers ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura anônima (necessário para verificar email)
CREATE POLICY "Allow anonymous email check" ON beta_testers
    FOR SELECT
    USING (is_active = true);

-- Política para permitir delete anônimo (apagar email após download)
CREATE POLICY "Allow anonymous delete after download" ON beta_testers
    FOR DELETE
    USING (is_active = true);

-- =============================================
-- INSERIR BETA TESTERS (EXEMPLOS)
-- Adicione os emails dos seus beta testers aqui
-- =============================================

-- INSERT INTO beta_testers (email, name) VALUES
--     ('teste@exemplo.com', 'Usuário Teste'),
--     ('seu-email@gmail.com', 'Seu Nome');

-- =============================================
-- COMANDOS ÚTEIS
-- =============================================

-- Ver todos os beta testers:
-- SELECT * FROM beta_testers ORDER BY added_at DESC;

-- Adicionar novo beta tester:
-- INSERT INTO beta_testers (email, name) VALUES ('novo@email.com', 'Nome');

-- Desativar um beta tester:
-- UPDATE beta_testers SET is_active = false WHERE email = 'email@exemplo.com';

-- Ver quem já baixou:
-- SELECT email, name, downloaded_at FROM beta_testers WHERE downloaded_at IS NOT NULL;
