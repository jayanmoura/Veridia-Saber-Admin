-- ============================================================
-- FIX: Políticas RLS e constraints para locais (projetos)
-- ============================================================
-- 
-- PROBLEMAS:
-- 1. O RLS está bloqueando DELETE e INSERT mesmo para admins
-- 2. institution_id é NOT NULL mas admins globais podem não ter um
-- 
-- Execute no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PASSO 1: Permitir NULL em institution_id
-- ============================================================

ALTER TABLE public.locais 
ALTER COLUMN institution_id DROP NOT NULL;

-- ============================================================
-- PASSO 2: Ver as políticas atuais
-- ============================================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'locais';

-- ============================================================
-- PASSO 3: POLÍTICA DE DELETE para Curador Mestre e Coordenador Científico
-- ============================================================

CREATE POLICY "Allow delete for Curador and Coordenador"
ON public.locais
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Curador Mestre', 'Coordenador Científico')
    )
);

-- ============================================================
-- PASSO 4: POLÍTICA DE INSERT para Curador Mestre e Coordenador Científico
-- ============================================================

CREATE POLICY "Allow insert for Curador and Coordenador"
ON public.locais
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Curador Mestre', 'Coordenador Científico')
    )
);

-- ============================================================
-- VERIFICAÇÃO: Liste as políticas após criação
-- ============================================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'locais';
