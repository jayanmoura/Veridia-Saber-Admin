# PROJECT_STRUCTURE — Painel Admin Veridia Saber

> Estrutura completa do projeto administrativo do **Veridia Saber** — Sistema de gestão de herbário e catalogação de espécies botânicas.

> ⚠️ **Manutenção**: Este arquivo deve ser atualizado sempre que novos arquivos ou diretórios forem adicionados ao projeto.

*Gerado em: 29 de março de 2026*

---

## 📁 Raiz do Projeto

```
├── .env                          # Variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY)
├── .gitignore                    # Arquivos e diretórios ignorados pelo Git
├── index.html                    # Ponto de entrada HTML — carregado pelo Vite, monta o React via <div id="root">
├── package.json                  # Dependências, scripts (dev, build, preview, lint) e metadados do projeto
├── package-lock.json             # Lockfile do npm — garante reprodutibilidade das versões
├── vite.config.ts                # Configuração do Vite: plugin React, plugin PWA (VitePWA), servidor na porta 3000
├── tailwind.config.js            # Configuração do Tailwind CSS v4 — tema, extensões e purge paths
├── postcss.config.js             # Configuração do PostCSS — integração com Tailwind CSS
├── tsconfig.json                 # Config base do TypeScript — referencia tsconfig.app.json e tsconfig.node.json
├── tsconfig.app.json             # Config TypeScript para o código-fonte da aplicação (src/)
├── tsconfig.node.json            # Config TypeScript para arquivos de configuração Node.js (vite.config.ts)
├── eslint.config.js              # Configuração do ESLint com plugins react-hooks e react-refresh
├── README.md                     # Documentação principal: visão geral, instalação, RBAC e stack
├── SUPABASE_SCHEMA.md            # Schema completo do banco Supabase (tabelas, views, RLS, storage)
```

---

## 📁 /src — Código Fonte Principal

```
src/
├── main.tsx                      # Entry point — monta <App /> no DOM via ReactDOM.createRoot
├── App.tsx                       # Componente raiz — configura AuthProvider e seleciona router (public/admin)
├── App.css                       # Estilos globais complementares
├── index.css                     # Estilos base, reset CSS e imports do Tailwind
```

---

### 📁 /src/assets — Recursos Estáticos
```
src/assets/
├── icon.png                      # Ícone principal da aplicação
├── react.svg                     # Logo React (padrão do template Vite)
```

---

### 📁 /src/lib — Clientes e SDKs
```
src/lib/
├── supabase.ts                   # Instância do cliente Supabase (createClient com URL e anon key do .env)
```

---

### 📁 /src/config — Configurações da Aplicação
```
src/config/
├── institution.ts                # Configuração da instituição padrão — cache do institution_id com fallback para 'Veridia Saber (Legado)'
```

---

### 📁 /src/contexts — Contextos React
```
src/contexts/
├── AuthContext.tsx               # Contexto de autenticação — gerencia sessão, perfil do usuário e role via Supabase Auth
```

---

### 📁 /src/types — Definições de Tipos TypeScript
```
src/types/
├── auth.ts                       # Interfaces e tipos para autenticação, perfil de usuário e sistema de roles (RBAC)
```

---

### 📁 /src/routes — Configuração de Rotas
```
src/routes/
├── index.tsx                     # Definição de todas as rotas (React Router v7) — inclui publicRouter, adminRouter,
│                                 # PrivateRoute (bloqueia Consulente) e OnlyGlobalAdmin (restringe a Curador Mestre
│                                 # e Coordenador Científico)
```

---

### 📁 /src/hooks — Custom Hooks React

> Hooks de dados e ações que encapsulam a lógica de negócio e as chamadas ao Supabase.

```
src/hooks/
├── index.ts                      # Barrel export de todos os hooks
├── useFamilies.ts                # Busca, filtra e pagina famílias botânicas
├── useFamilyActions.ts           # Ações CRUD para famílias (criar, atualizar, excluir) com audit log
├── useFamilyLegacyNames.ts       # CRUD de nomes legados/sinônimos de famílias (nomenclatura pré-APG)
├── useOverviewStats.ts           # Estatísticas do dashboard — contagens de espécies, espécimes, famílias e projetos
├── useProjectActions.ts          # Ações CRUD para projetos — inclui gestão de gestor e membros
├── useProjectDetails.ts          # Dados completos de um projeto específico (espécies, espécimes, membros)
├── useProjects.ts                # Lista de projetos com filtro por role e local_id
├── useSpecies.ts                 # Busca, filtra e pagina espécies com join em família
├── useSpeciesActions.ts          # Ações CRUD para espécies — criar, atualizar, excluir com validação
├── useSpeciesForm.ts             # Lógica completa do formulário de espécies (validação, estado, submit)
├── useSpeciesImages.ts           # Upload, listagem e exclusão de imagens de espécies no Supabase Storage
├── useSpecimenImages.ts          # Upload, listagem e exclusão de imagens de espécimes no Supabase Storage
├── useSpecimens.ts               # Busca, filtra e pagina espécimes com join em espécie e local
```

---

### 📁 /src/services — Repositórios de Dados

> Camada de acesso a dados que abstrai as queries diretas ao Supabase.

```
src/services/
├── types.ts                      # Interfaces TypeScript mapeando as tabelas do banco (especie, familia, etc.)
├── speciesRepo.ts                # Repositório de espécies — queries de listagem, busca e CRUD
├── specimenRepo.ts               # Repositório de espécimes — queries de listagem, busca e CRUD
```

---

### 📁 /src/utils — Utilitários

```
src/utils/
├── csvGenerator.ts               # Geração de arquivos CSV para exportação de inventários e listagens
├── pdfGenerator.ts               # Geração de relatórios PDF — fichas técnicas, inventário geral, etiquetas de herbário
```

---

### 📁 /src/database — Scripts SQL de Migração

> Scripts SQL executados manualmente no Supabase SQL Editor para migrações incrementais.

```
src/database/
├── add_created_by_especie_local.sql      # Adiciona coluna created_by na tabela especie_local
├── add_label_fields.sql                  # Adiciona campos de etiquetas de herbário (determinador, coletor, etc.)
├── add_project_coordinates.sql           # Adiciona latitude e longitude à tabela locais
├── create_etiquetas_table.sql            # Cria a tabela etiquetas com conteudo_json e numero_tombo
├── fix_map_permissions.sql               # Correção de políticas RLS para leitura de dados do mapa
├── fix_map_permissions_robust.sql        # Versão robusta das permissões do mapa (fallback seguro)
├── fix_projects_update_policy.sql        # Política RLS de UPDATE para a tabela locais
```

---

### 📁 /src/pages — Páginas da Aplicação

#### Admin (Autenticado)

> Todas as páginas admin são protegidas por `PrivateRoute`, que exige autenticação e bloqueia Consulentes.

```
src/pages/admin/
├── Login.tsx                     # Tela de login com autenticação Supabase (email/senha + OAuth)
│                                 # 🔓 Pública
├── Overview.tsx                  # Dashboard principal com cards de estatísticas e visão por role
│                                 # 🔐 Role mínima: catalogador
├── Projects.tsx                  # Lista de projetos — filtrada automaticamente pelo escopo do usuário
│                                 # 🔐 Role mínima: catalogador
├── ProjectDetails.tsx            # Detalhes de um projeto (abas: espécies, espécimes, famílias, membros)
│                                 # 🔐 Role mínima: catalogador
├── Families.tsx                  # Gerenciamento de famílias botânicas — CRUD com nomes legados
│                                 # 🔐 Role mínima: catalogador
├── Species.tsx                   # Catálogo global de espécies — busca, filtros e paginação
│                                 # 🔐 Role mínima: catalogador
├── Specimens.tsx                 # Lista de espécimes/ocorrências georreferenciadas
│                                 # 🔐 Role mínima: catalogador
├── SpecimensInspection.tsx       # Inspeção detalhada de espécimes — validação e revisão de dados
│                                 # 🔐 Role mínima: super_admin ou admin (OnlyGlobalAdmin)
├── Users.tsx                     # Gestão de usuários — criação, edição de roles e vínculos
│                                 # 🔐 Role mínima: catalogador (CRUD restrito por role)
├── GlobalMap.tsx                 # Mapa global com todas as ocorrências georreferenciadas
│                                 # 🔐 Role mínima: catalogador
├── ProjectMap.tsx                # Mapa de um projeto específico com marcadores de espécimes
│                                 # 🔐 Role mínima: catalogador
├── EducationalContent.tsx        # Editor de conteúdo educativo por órgão botânico (TipTap)
│                                 # 🔐 Role mínima: catalogador
├── AuditLogs.tsx                 # Logs de auditoria — histórico de alterações no sistema
│                                 # 🔐 Role mínima: super_admin ou admin (OnlyGlobalAdmin)
```

#### Landing Page (Público)
```
src/pages/landingpage/
├── LandingPage.tsx               # Página inicial pública — apresentação do Veridia Saber
├── Disclaimer.tsx                # Aviso legal / Disclaimer
├── Privacy.tsx                   # Política de Privacidade
├── Terms.tsx                     # Termos de Uso
├── EmailConfirmed.tsx            # Página de confirmação de email pós-cadastro
```

---

### 📁 /src/components — Componentes React

#### Cards
> Componentes de card para exibição resumida de entidades.

```
src/components/Cards/
├── ProjectCard.tsx               # Card de projeto com imagem, nome, contagens e ações rápidas
├── index.ts                      # Barrel export
```

#### Dashboard
> Widgets e componentes visuais do dashboard/overview.

```
src/components/Dashboard/
├── StatCard.tsx                  # Card de estatística com ícone, valor numérico e label descritivo
```

#### Families
> Componentes específicos para a gestão de famílias botânicas.

```
src/components/Families/
├── FamilyLegacyNamesSection.tsx  # Seção de nomes legados/sinônimos — CRUD inline dentro do modal de família
```

#### Forms
> Componentes de formulário reutilizáveis em múltiplos contextos.

```
src/components/Forms/
├── ImageUploadZone.tsx           # Zona de upload de imagens com drag-and-drop, preview e progress bar
```

#### Layout
> Estrutura visual do painel administrativo (shell da aplicação).

```
src/components/Layout/
├── DashboardLayout.tsx           # Layout base do painel — sidebar colapsável + área de conteúdo com Outlet
├── Sidebar.tsx                   # Barra lateral de navegação — itens filtrados por role do usuário
```

#### Maps
> Componentes de visualização geográfica com Leaflet/React Leaflet.

```
src/components/Maps/
├── GlobalHeatmap.tsx             # Mapa de calor global com clusters de ocorrências via Leaflet
├── ProjectMapViz.tsx             # Visualização de mapa por projeto com marcadores individuais de espécimes
```

#### Overview (Visões do Dashboard por Role)
> Cada role tem uma visão personalizada do dashboard com dados e ações relevantes ao seu escopo.

```
src/components/Overview/
├── index.ts                      # Barrel export
├── GlobalAdminView.tsx           # Visão do Curador Mestre / Coordenador Científico — métricas globais
├── LocalAdminView.tsx            # Visão do Gestor de Acervo — métricas e ações do projeto local
├── SeniorView.tsx                # Visão do Taxonomista Sênior — foco em espécies e famílias globais
├── FieldTaxonomistView.tsx       # Visão do Taxonomista de Campo — foco em espécimes e coletas
├── CatalogerView.tsx             # Visão do Catalogador — visualização resumida de dados
```

#### ProjectDetails (Abas do Projeto)
> Componentes das abas da página de detalhes de um projeto.

```
src/components/ProjectDetails/
├── index.ts                      # Barrel export
├── ProjectHeader.tsx             # Cabeçalho do projeto — imagem, nome, descrição e ações (editar, excluir)
├── FamiliesTab.tsx               # Aba de famílias vinculadas ao projeto
├── SpeciesTab.tsx                # Aba de espécies do projeto com busca e ações
├── SpecimensTab.tsx              # Aba de espécimes/ocorrências do projeto com filtros
├── UsersTab.tsx                  # Aba de membros do projeto — adicionar/remover usuários
```

#### Tables
> Componentes de tabela de dados com ações inline (editar, excluir, visualizar).

```
src/components/Tables/
├── index.ts                      # Barrel export
├── FamilyTable.tsx               # Tabela de famílias com ordenação e ações de edição/exclusão
├── SpeciesTable.tsx              # Tabela de espécies com colunas de família, imagens e ações
```

#### Modals
> Modais de criação, edição, confirmação e visualização utilizados em todo o painel.

```
src/components/Modals/
├── AnalyticsModal.tsx            # Modal com gráficos e métricas de analytics do app mobile
├── BetaTestersModal.tsx          # Modal para adicionar, listar e gerenciar beta testers
├── ConfirmDeleteModal.tsx        # Modal genérico de confirmação de exclusão com texto customizável
├── FamilyModal.tsx               # Modal de criação/edição de família — inclui nomes legados
├── PendingCuratorshipModal.tsx   # Modal listando espécies pendentes de curadoria (sem imagem)
├── PhotoGalleryModal.tsx         # Galeria de fotos fullscreen com navegação e zoom
├── ProjectFormModal.tsx          # Modal de criação/edição de projeto — dados, gestor e coordenadas
├── SpeciesByFamilyModal.tsx      # Modal listando todas as espécies de uma família específica
├── SpeciesModal.tsx              # Modal principal de criação/edição de espécie — formulário completo
├── SpecimenModal.tsx             # Modal de criação/edição de espécime — coordenadas, coleta e fotos
├── SuccessModal.tsx              # Modal de sucesso genérico com animação e auto-dismiss
```

#### Componentes Avulsos
> Componentes independentes que não pertencem a nenhum grupo específico.

```
src/components/
├── RichTextEditor.tsx            # Editor rich text baseado em TipTap — formatação, headings e upload de imagens
│                                 # para o bucket imagens_conteudo, organizado por órgão botânico
├── InstallPWA.tsx                # Banner de instalação do PWA — detecta suporte e exibe prompt nativo
```

---

## 📁 /supabase — Scripts SQL do Supabase

> Scripts de políticas e correções executados no Supabase SQL Editor.

```
supabase/
├── beta_testers.sql                      # Criação da tabela beta_testers e políticas RLS
├── fix_storage_delete_policy.sql         # Política de DELETE no storage — v1
├── fix_storage_delete_policy_v2.sql      # Política de DELETE no storage — v2 com correções
├── fix_storage_delete_policy_v3_debug.sql # Política de DELETE no storage — v3 com debug logs
├── fix_storage_delete_policy_v4_secure.sql # Política de DELETE no storage — v4 versão final segura
```

---

## 📁 /public — Arquivos Públicos

```
public/
├── icon.png                      # Ícone principal da aplicação
├── pwa-192x192.png               # Ícone PWA 192×192px (obrigatório para manifest)
├── pwa-512x512.png               # Ícone PWA 512×512px (obrigatório para manifest)
├── jayan-moura.jpeg              # Foto do desenvolvedor (exibida na landing page)
├── Tela Inicial.png              # Screenshot da tela inicial (material promocional)
├── downloads/                    # Diretório para arquivos gerados (PDFs, CSVs) disponíveis para download
```

---

## 📁 /docs — Documentação

```
docs/
├── hierarquia_usuarios.csv       # CSV com a hierarquia completa de roles e permissões
├── mobile_legal/                 # Documentos legais para o app mobile
│   ├── PRIVACY.md                # Política de privacidade (mobile)
│   └── TERMS.md                  # Termos de uso (mobile)
```

---

## 📁 /Contratos — Contratos e Documentos Legais

> Pasta contendo contratos do projeto (não versionada detalhadamente aqui).

---

## 🔧 Tecnologias Principais

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19.2 | Biblioteca de UI |
| TypeScript | 5.9 | Tipagem estática |
| Vite | 7.2 | Build tool e dev server |
| Tailwind CSS | 4.1 | Estilização utilitária |
| Supabase JS | 2.89 | Backend (Auth, Database, Storage) |
| React Router DOM | 7.11 | Roteamento SPA |
| Leaflet / React Leaflet | 1.9 / 5.0 | Mapas interativos |
| TipTap | 3.20 | Editor de texto rico |
| jsPDF + AutoTable | 4.0 / 5.0 | Geração de PDFs |
| Framer Motion | 12.28 | Animações e transições |

---

## 🎯 Conceitos Importantes

### Espécie vs Espécime
- **Espécie** (`especie`): Dados taxonômicos globais — nome científico, família, classificação, guia de cultivo. Cadastrada uma única vez.
- **Espécime** (`especie_local`): Ocorrência georreferenciada — localização GPS, data de coleta, imagens, etiquetas. Vinculada a uma espécie e a um projeto.

### Sistema de Roles (RBAC)

| Role Técnica | Nome de Exibição | Escopo | Acesso ao Painel |
|---|---|---|---|
| `super_admin` | Curador Mestre | Global | ✅ Total |
| `admin` (`local_id = NULL`) | Coordenador Científico | Global | ✅ Total (exceto gestão de super admins) |
| `admin` (`local_id ≠ NULL`) | Gestor de Acervo | Local | ✅ Restrito ao projeto |
| `catalogador` (`local_id = NULL`) | Taxonomista Sênior | Global | ✅ Espécies e espécimes |
| `catalogador` (`local_id ≠ NULL`) | Taxonomista de Campo | Local | ✅ Espécimes do projeto |
| — | Consulente | Read-only | ❌ Bloqueado pelo PrivateRoute |

### Guards de Rota
- **`PrivateRoute`**: Exige autenticação e bloqueia role `Consulente` — protege todas as rotas do painel admin.
- **`OnlyGlobalAdmin`**: Restringe acesso a `Curador Mestre` e `Coordenador Científico` — protege AuditLogs, SpecimensInspection e mapa de projetos.
