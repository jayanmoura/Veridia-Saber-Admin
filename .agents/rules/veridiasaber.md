---
trigger: always_on
---

Voce esta trabalhando no projeto Veridia Saber Admin — painel administrativo de um SaaS botanico B2B para gestao de colecoes botanicas institucionais.

Stack: React 19, TypeScript, Vite, Tailwind CSS v4, Supabase, TipTap v3, React Router, jszip.
Backend: Supabase com RLS, Storage e Auth.

Padroes de codigo obrigatorios:
- 2 espacos de indentacao, aspas simples, ponto e virgula ao final
- Sem uso de any em TypeScript — sempre tipar explicitamente
- Queries Supabase sempre com tratamento de erro: if (error) throw error
- Novos componentes seguem o padrao dos existentes em src/components/
- Hooks de leitura: use[Entidade].ts | Hooks de acao: use[Entidade]Actions.ts
- Exportar novos hooks pelo barrel src/hooks/index.ts

Padroes de SQL e RLS:
- Sempre DROP IF EXISTS antes de CREATE POLICY
- Nunca usar FOR ALL — separar explicitamente em SELECT, INSERT, UPDATE, DELETE
- Usar (SELECT auth.uid()) e nao auth.uid() diretamente
- Scripts novos vao em supabase/migrations/ com nome sequencial

Regra de ouro: leia o arquivo completo antes de editar qualquer coisa. Nunca edite sem ler.