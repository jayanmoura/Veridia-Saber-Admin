# Veridia Saber — Painel Administrativo

> Gestão centralizada do acervo botânico: espécies, espécimes georreferenciados, projetos de campo e controle de acesso por papéis (RBAC).

## Visão Geral

O Painel Administrativo da Veridia Saber é a interface de back-office do ecossistema Veridia Saber, voltada para curadores, coordenadores e taxonomistas que mantêm o catálogo botânico da plataforma. Ele permite cadastrar e editar espécies vegetais, registrar espécimes com coordenadas geográficas, gerenciar projetos de campo, produzir relatórios em PDF, publicar conteúdo educacional e administrar usuários com controle granular de permissões.

## Stack Tecnológica

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React | 19.2 | Biblioteca de UI |
| TypeScript | 5.9 | Tipagem estática |
| Vite | 7.2 | Build tool e dev server |
| Tailwind CSS | 4.1 | Estilização utilitária |
| Supabase JS | 2.89 | Cliente de backend, auth e storage |
| React Router DOM | 7.11 | Roteamento SPA |
| Leaflet / React Leaflet | 1.9 / 5.0 | Mapas interativos |
| TipTap | 3.20 | Editor de texto rico (conteúdo educacional) |
| jsPDF + AutoTable | 4.0 / 5.0 | Geração de relatórios PDF |
| Framer Motion | 12.28 | Animações e transições |
| Lucide React | 0.562 | Biblioteca de ícones |
| Vite Plugin PWA | 1.2 | Suporte a Progressive Web App |

## Pré-requisitos

- Node.js **18+**
- npm **9+** (ou yarn equivalente)
- Conta ativa no [Supabase](https://supabase.com) com projeto configurado
- Variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` definidas

## Instalação e Configuração

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd Veridia-Saber-Admin
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

4. Preencha o `.env` com as credenciais do seu projeto Supabase:
   ```env
   VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhb...sua_chave_anonima
   ```

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O painel estará disponível em `http://localhost:5173`.

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex: `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anônima (`anon key`) do projeto Supabase |

## Estrutura de Diretórios

```
src/
├── pages/             # Páginas da aplicação (Login, Overview, Species, Specimens, etc.)
│   ├── admin/         # Páginas do painel administrativo
│   └── landingpage/   # Páginas da landing page pública
├── components/        # Componentes reutilizáveis
│   ├── Cards/         # Cards de exibição de dados
│   ├── Dashboard/     # Widgets do dashboard
│   ├── Forms/         # Formulários compartilhados
│   ├── Layout/        # Sidebar, Header, estrutura visual
│   ├── Maps/          # Componentes de mapa (Leaflet)
│   ├── Modals/        # Modais (espécies, famílias, confirmação, etc.)
│   ├── Overview/      # Componentes da tela de visão geral
│   ├── ProjectDetails/# Detalhes de projetos
│   └── Tables/        # Tabelas de listagem
├── hooks/             # Custom hooks (useSpecies, useFamilies, useProjects, etc.)
├── contexts/          # Contextos React (AuthContext)
├── lib/               # Configuração do cliente Supabase
├── routes/            # Definição de rotas e guards de autenticação
├── services/          # Camada de serviços para chamadas ao backend
├── types/             # Interfaces e tipos TypeScript
├── config/            # Configurações da aplicação
├── database/          # Scripts e utilitários de banco de dados
└── utils/             # Utilitários (geração de PDF, formatação, etc.)
```

## Papéis de Usuário (RBAC)

O sistema utiliza controle de acesso baseado em papéis (Role-Based Access Control).
A combinação entre a coluna `role` e a presença ou ausência de `local_id` na tabela
de perfis determina o escopo de atuação do usuário.

> ⚠️ Os valores de `role` armazenados no banco são os **nomes de exibição**
> (ex: `'Curador Mestre'`), não os identificadores técnicos (ex: `'super_admin'`).
> As funções RLS `is_staff()` e `is_admin()` devem sempre refletir isso.

| Role Técnica | Nome de Exibição | Escopo | Permissões |
|---|---|---|---|
| `super_admin` | Curador Mestre | Global | Acesso total: CRUD de todos os dados, gestão de usuários, logs de auditoria |
| `admin` (`local_id = NULL`) | Coordenador Científico | Global | CRUD de todos os dados e projetos, sem gestão de super admins |
| `admin` (`local_id NOT NULL`) | Gestor de Acervo | Local (projeto) | CRUD restrito aos dados do projeto vinculado |
| `catalogador` (`local_id = NULL`) | Taxonomista Sênior | Global | Cadastro e edição de espécies e espécimes em qualquer projeto |
| `catalogador` (`local_id NOT NULL`) | Taxonomista de Campo | Local (projeto) | Cadastro e edição de espécies e espécimes no projeto vinculado |
| — | Consulente | Somente leitura | Visualização de espécies, espécimes e relatórios públicos |

> ⚠️ A coluna `local_id` referencia a tabela `locais` (projetos). Quando `NULL`,
> o usuário tem acesso global; quando preenchida, o acesso é restrito ao projeto
> correspondente.

### Regras de Exclusão (DELETE)

As permissões de exclusão de espécies e espécimes seguem o escopo de cada role.
A aplicação dessas regras no banco depende das políticas RLS nas tabelas `especie`
e `especie_local`.

| Role | Nome de Exibição | Exclui espécies? | Exclui espécimes? | Restrição |
|---|---|---|---|---|
| `super_admin` | Curador Mestre | ✅ Sim | ✅ Sim | Nenhuma — escopo global |
| `admin` (`local_id = NULL`) | Coordenador Científico | ✅ Sim | ✅ Sim | Apenas dados do banco global do Veridia Saber |
| `admin` (`local_id NOT NULL`) | Gestor de Acervo | ✅ Sim | ✅ Sim | Apenas dados do projeto vinculado (`local_id`) |
| `catalogador` (`local_id = NULL`) | Taxonomista Sênior | ✅ Próprias | ✅ Próprios | Somente registros que ele mesmo criou (`created_by`) |
| `catalogador` (`local_id NOT NULL`) | Taxonomista de Campo | ✅ Próprias | ✅ Próprios | Somente registros que ele mesmo criou (`created_by`), dentro do projeto vinculado |
| — | Consulente | ❌ Não | ❌ Não | Sem permissão de exclusão |

## Conceitos de Domínio

### Espécie

Tabela: `especies`

Registro taxonômico **global**. Contém os dados científicos da planta:

- Nome científico e popular
- Família e gênero botânico
- Classificação taxonômica completa (reino, filo, classe, ordem)
- Descrições morfológicas e guia de cultivo
- Conteúdo educacional em formato rich text

Uma espécie é cadastrada **uma única vez** no sistema, independentemente de quantos locais ela foi observada.

### Espécime

Tabela: `especie_local`

Ocorrência **georreferenciada** de uma espécie em um local específico. Representa o exemplar físico observado ou catalogado em campo:

- Coordenadas GPS (latitude e longitude)
- Dados fenológicos e estado de conservação
- Fotografias do exemplar in loco
- Vínculo obrigatório a um projeto (`local_id`)

Uma mesma espécie pode possuir múltiplos espécimes distribuídos por diferentes projetos.

### Relação entre Espécie e Espécime

```
┌──────────────┐       1:N       ┌──────────────────┐
│   Espécie    │────────────────▶│    Espécime       │
│  (especies)  │                 │  (especie_local)  │
│              │                 │                   │
│ Ipê-amarelo  │                 │ Parque A, -23.5°  │
│ H. albus     │                 │ Parque B, -22.1°  │
└──────────────┘                 └──────────────────┘
```

**Exemplo prático:** a espécie *Handroanthus albus* (Ipê-amarelo) é cadastrada uma vez. Cada indivíduo identificado em campo — com sua localização, estado de conservação e fotos — é registrado como um espécime vinculado a um projeto.

## Funcionalidades Principais

- **Catálogo de Espécies** — CRUD completo com busca, filtros por família e paginação
- **Gestão de Espécimes** — Cadastro georreferenciado com galeria de imagens
- **Mapas Interativos** — Visualização de espécimes no mapa via Leaflet
- **Projetos de Campo** — Administração de locais com detalhamento de acervo
- **Relatórios PDF** — Fichas técnicas individuais e relatórios gerais com gráficos
- **Conteúdo Educacional** — Editor rich text (TipTap) com upload de imagens por órgão vegetal
- **Logs de Auditoria** — Rastreamento de alterações realizadas no sistema
- **PWA** — Instalável como aplicativo em dispositivos móveis
- **Galeria de Fotos** — Visualização em pastas por espécie com seleção e download em lote (ZIP)
- **Inspeção de Espécimes** — Auditoria global de espécimes por projeto (somente leitura, Curador Mestre)
- **Análise de Storage** — Painel de uso real de imagens com tamanhos por versão e evolução mensal

## Documentação Adicional

| Documento | Conteúdo |
|---|---|
| [`SUPABASE_SCHEMA.md`](./SUPABASE_SCHEMA.md) | Schema completo do banco de dados (tabelas, RLS, triggers, functions) |
| [`PROJECT_STRUCTURE Painel admin.md`](./PROJECT_STRUCTURE%20Painel%20admin.md) | Mapa detalhado de todos os arquivos do projeto com descrições |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Decisões arquiteturais, pendências e dívidas técnicas |
| [`INFRA-VERIDIASABER.md`](./INFRA-VERIDIASABER.md) | Infraestrutura completa: Supabase, storage, Edge Functions, deploy e decisões técnicas |

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR |
| `npm run build` | Compila TypeScript e gera o bundle de produção |
| `npm run preview` | Serve localmente o bundle de produção para validação |
| `npm run lint` | Executa o ESLint em todo o projeto |
| `npm test`         | Vitest com UI interativa                              |
| `npm run test:run` | Vitest headless — obrigatório antes de cada git push  |

## Testes

### Unitários e de integração (Vitest)

```bash
npm run test:run   # headless — obrigatório antes de cada git push
npm test           # watch mode — manter aberto durante desenvolvimento
npx vitest run src/test/unit/NomeDoArquivo.test.ts  # arquivo específico
```

**115 testes passando em 7 arquivos:**

| Arquivo | Cobertura |
|---|---|
| `auth.types.test.ts` | Tipos, hierarquia de roles, helpers |
| `AuthContext.test.tsx` | Sessão, fetchProfile, onAuthStateChange |
| `guards.test.tsx` | PrivateRoute, OnlyGlobalAdmin |
| `Users.test.tsx` | RBAC na página de usuários |
| `speciesModal.test.tsx` | Upload de imagens, deleção, renderização |
| `useOverviewStats.test.ts` | Queries por role no dashboard |
| `Login.test.tsx` | Fluxo login-proxy, erros pt-BR, loading |

### E2E (Playwright) — pendente

Aguarda criação do projeto `VeridiaSaber-Staging` no Supabase (plano premium).
Nunca rodar testes E2E com CRUD contra o banco de produção.

---

Veridia Saber © 2026 — Projeto proprietário.
