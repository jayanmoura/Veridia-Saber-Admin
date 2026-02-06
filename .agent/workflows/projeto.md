---
description: Leitura inicial do projeto Painel Admin Veridia Saber para contextualização
---

# Workflow: Contextualização do Projeto

Este workflow carrega o contexto completo do projeto **Painel Admin Veridia Saber** para iniciar os trabalhos.

## Passos

### 1. Leia a estrutura do projeto
// turbo
Leia o arquivo `PROJECT_STRUCTURE Painel admin.md` na raiz do projeto para entender a arquitetura completa.

```
view_file u:\Projetos\Painel-admin-veridiasaber\PROJECT_STRUCTURE Painel admin.md
```

### 2. Leia o schema do banco de dados
// turbo
Leia o arquivo `SUPABASE_SCHEMA.md` para entender as tabelas, relacionamentos e views do Supabase.

```
view_file u:\Projetos\Painel-admin-veridiasaber\SUPABASE_SCHEMA.md
```

### 3. Leia o README do projeto
// turbo
Leia o `README.md` para ter uma visão geral das funcionalidades e scripts disponíveis.

```
view_file u:\Projetos\Painel-admin-veridiasaber\README.md
```

### 4. Verifique o checklist de refatoração
// turbo
Leia o `REFACTORING_CHECKLIST.md` para ver pendências de refatoração.

```
view_file u:\Projetos\Painel-admin-veridiasaber\REFACTORING_CHECKLIST.md
```

### 5. Liste a estrutura atual do projeto
// turbo
Liste os diretórios principais para ter uma visão atual do projeto.

```
list_dir u:\Projetos\Painel-admin-veridiasaber
list_dir u:\Projetos\Painel-admin-veridiasaber\src
```

---

## 📋 Resumo do Projeto

**Veridia Saber - Painel Administrativo**

Sistema de gestão de herbário e catalogação de espécies botânicas, desenvolvido com:
- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS** para estilização
- **Supabase** como backend (Auth, Database, Storage)
- **Leaflet** para mapas interativos
- **jsPDF** para geração de relatórios

### Conceitos Importantes

| Conceito | Descrição |
|----------|-----------|
| **Espécie** | Dados taxonômicos globais (gênero, nome científico, classificação) |
| **Espécime** | Ocorrência específica (localização, data de coleta, imagens, etiquetas) |

### Roles de Usuário

1. **Global Admin** (super_admin) - Curador Mestre
2. **Local Admin** (admin) - Coordenador Científico / Gestor de Acervo
3. **Taxonomista Sênior** (catalogador, local_id = NULL)
4. **Taxonomista de Campo** (catalogador, local_id ≠ NULL)
5. **Consulente** - Apenas visualização

---

## ✅ Após executar este workflow

A IA estará preparada para:
- Implementar novas funcionalidades
- Corrigir bugs no código existente
- Refatorar componentes
- Criar novos componentes seguindo o padrão do projeto
- Trabalhar com o banco de dados Supabase
- Gerar relatórios PDF
