---
description: Guia para implementar uma nova funcionalidade no painel admin
---

# Workflow: Nova Feature

## Passos

### 1. Contextualize no projeto
// turbo
```
view_file PROJECT_STRUCTURE Painel admin.md
view_file SUPABASE_SCHEMA.md
```

### 2. Identifique os arquivos relevantes para a feature
// turbo
Liste os componentes, hooks e páginas relacionados à área onde a feature será implementada.
```
list_dir src/pages
list_dir src/components
list_dir src/hooks
```

### 3. Verifique padrões existentes
// turbo
Antes de criar qualquer arquivo novo, leia um componente similar já existente para seguir o mesmo padrão de estrutura, nomenclatura e imports.

---

## Regras de Implementação

### Estrutura de componentes
- Componentes de página ficam em `src/pages/admin/`
- Componentes reutilizáveis ficam em `src/components/[Dominio]/`
- Lógica de leitura de dados fica em hooks em `src/hooks/use[Entidade].ts`
- Lógica de ações (CRUD) fica em `src/hooks/use[Entidade]Actions.ts`
- Sempre exportar pelo barrel `src/hooks/index.ts`

### Padrões de código
- Todo componente em TypeScript com tipos explícitos — sem `any`
- Classes Tailwind CSS v4 — não usar CSS customizado desnecessariamente
- Queries Supabase sempre com tratamento de erro explícito (`if (error) throw error`)
- Funções assíncronas sempre com `try/catch` e feedback visual ao usuário (toast ou estado de loading)
- Nomes em português para variáveis de domínio botânico, inglês para lógica técnica

### Supabase
- Usar o client de `src/lib/supabase.ts`
- Verificar RLS antes de assumir que uma query vai funcionar
- Operações de storage seguem o padrão de bucket + subfolder por tipo (ex: `arquivos-gerais/Folha/`)

### Indentação e formatação
- 2 espaços de indentação
- Aspas simples em TypeScript/TSX
- Ponto e vírgula ao final das declarações
- Seguir configuração do ESLint do projeto (`eslint.config.js`)