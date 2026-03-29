---
description: description: Carrega o contexto completo do Veridia Saber Admin para iniciar qualquer trabalho
---

# Workflow: Contextualização do Projeto

## Passos

### 1. Leia a estrutura do projeto
// turbo
```
view_file PROJECT_STRUCTURE Painel admin.md
```

### 2. Leia o schema do banco de dados
// turbo
```
view_file SUPABASE_SCHEMA.md
```

### 3. Leia o README
// turbo
```
view_file README.md
```

### 4. Liste os diretórios principais
// turbo
```
list_dir src
list_dir src/pages
list_dir src/components
list_dir supabase
```

---

## Contexto do Projeto

**Veridia Saber — Painel Administrativo**
Sistema B2B de gestão de coleções botânicas para herbários e jardins botânicos institucionais.

### Stack
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19 | Framework UI |
| TypeScript | — | Tipagem estática |
| Vite | — | Bundler e dev server |
| Tailwind CSS | v4 | Estilização utilitária |
| Supabase | — | Auth, Database, Storage |
| TipTap | v3 | Editor rich text no painel de conteúdo |
| React Router | — | Roteamento SPA |
| jszip + file-saver | — | Download em lote no modal de Arquivos |

### Conceitos de Domínio
| Conceito | Descrição |
|---|---|
| **Espécie** | Entidade taxonômica global: nome científico, família, classificação |
| **Espécime** | Ocorrência georreferenciada de uma espécie (tabela `especie_local`, alias view `especime`) |
| **Local** | Instituição ou jardim botânico gerenciado no sistema |
| **Conteúdo Educativo** | Textos por órgão botânico salvos como HTML para compatibilidade com o app mobile |

### Roles de Usuário (RBAC)
| Role Técnica | Nome de Exibição | Escopo |
|---|---|---|
| `super_admin` | Curador Mestre | Global — acesso total |
| `admin` (local_id = NULL) | Coordenador Científico | Global — sem auditoria |
| `admin` (local_id ≠ NULL) | Gestor de Acervo | Local — apenas seu local |
| `catalogador` (local_id = NULL) | Taxonomista Sênior | Global — leitura + contribuição |
| `catalogador` (local_id ≠ NULL) | Taxonomista de Campo | Local — coleta e registros |
| Consulente | Consulente | Read-only |

### Pendências Conhecidas
- `is_staff()` usa roles em lowercase (`'curador'`, `'super_admin'`), mas `profiles.role` armazena nomes de exibição — requer atualização da função