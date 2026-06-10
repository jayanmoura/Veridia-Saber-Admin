---
description: Guia para alterações no banco de dados, RLS e storage do Supabase
---

# Workflow: Supabase — Banco, RLS e Storage

## Passos

### 1. Leia o schema atual
// turbo
```
view_file SUPABASE_SCHEMA.md
```

### 2. Verifique as migrations existentes
// turbo
```
list_dir supabase/migrations
```

### 3. Leia a migration mais recente
// turbo
Leia o último arquivo em `supabase/migrations/` para entender o estado atual das policies.

---

## Regras para Scripts SQL

### Estrutura obrigatória de qualquer script
```sql
-- ============================================================
-- [Descrição curta da alteração]
-- Tabela(s) afetada(s): [lista]
-- ============================================================

-- 1. Remover policies antigas (sempre com DROP IF EXISTS)
DROP POLICY IF EXISTS "nome_policy" ON public.tabela;

-- 2. Criar nova policy
CREATE POLICY "nome_descritivo" ON public.tabela
FOR [SELECT|INSERT|UPDATE|DELETE]
TO authenticated
USING ( (SELECT public.is_staff()) );
```

### Funções auxiliares de segurança
- `public.is_staff()` — roles: `super_admin`, `admin`, `catalogador`, `curador`, `coordenador`
- `public.is_admin()` — roles: `super_admin`, `admin`
- ⚠️ Problema conhecido: função usa lowercase, `profiles.role` pode ter nomes de exibição — confirmar antes de usar

### Padrões de RLS
- Sempre usar `(SELECT auth.uid())` em vez de `auth.uid()` diretamente (evita initplan)
- Políticas de leitura pública: `USING (true)` sem `TO authenticated`
- Nunca usar `FOR ALL` — separar explicitamente por operação (SELECT, INSERT, UPDATE, DELETE)
- Todo script vai para `supabase/migrations/` com nome sequencial: `00N_descricao.sql`
- Scripts de fix antigos (`fix_*.sql`) não devem ser commitados — usar `.gitignore`

### Storage
- Buckets existentes: `imagens_conteudo`, `fotos-das-colecoes`, `arquivos-gerais`, `imagens-plantas`
- Subfolders de `arquivos-gerais`: `Raiz`, `Caule`, `Folha`, `Flor`, `Fruto`, `Semente`, `Outros`
```

---

Esses 4 workflows cobrem praticamente todo o ciclo de trabalho no projeto. Para adicionar, é só criar os arquivos em `.agent/workflows/` com esses nomes:
```
.agent/workflows/
├── projeto.md          ← substitui o atual
├── nova-feature.md
├── bug.md
└── supabase.md