# PROJECT_STRUCTURE - Painel Admin Veridia Saber

> Estrutura completa do projeto administrativa do **Veridia Saber** - Sistema de gestão de herbário e catalogação de espécies botânicas.

---

## 📁 Raiz do Projeto

```
├── .env                          # Variáveis de ambiente (Supabase URL e keys)
├── .gitignore                    # Arquivos ignorados pelo Git
├── index.html                    # Ponto de entrada HTML do Vite
├── package.json                  # Dependências e scripts do projeto
├── package-lock.json             # Lock do npm
├── vite.config.ts                # Configuração do bundler Vite
├── tailwind.config.js            # Configuração do TailwindCSS
├── postcss.config.js             # Configuração do PostCSS
├── tsconfig.json                 # Config base do TypeScript
├── tsconfig.app.json             # Config TypeScript para a aplicação
├── tsconfig.node.json            # Config TypeScript para Node.js
├── eslint.config.js              # Configuração do ESLint
├── README.md                     # Documentação principal do projeto
├── SUPABASE_SCHEMA.md            # Documentação do schema do banco Supabase
├── REFACTORING_CHECKLIST.md      # Checklist de refatoração pendente
├── pdf.md                        # Template/conteúdo para geração de PDF
```

---

## 📁 /src - Código Fonte Principal

```
src/
├── main.tsx                      # Entry point React - monta o App no DOM
├── App.tsx                       # Componente raiz - configuração de rotas e providers
├── App.css                       # Estilos globais do App
├── index.css                     # Estilos base e imports do Tailwind
```

---

### 📁 /src/assets - Recursos Estáticos
```
src/assets/
├── icon.png                      # Ícone da aplicação
├── react.svg                     # Logo React (padrão Vite)
```

---

### 📁 /src/lib - Bibliotecas/Clients
```
src/lib/
├── supabase.ts                   # Cliente Supabase inicializado (conexão com o banco)
```

---

### 📁 /src/contexts - Contextos React
```
src/contexts/
├── AuthContext.tsx               # Contexto de autenticação - gerencia sessão do usuário
```

---

### 📁 /src/types - Definições de Tipos
```
src/types/
├── auth.ts                       # Tipos relacionados à autenticação e roles de usuário
```

---

### 📁 /src/routes - Configuração de Rotas
```
src/routes/
├── index.tsx                     # Definição de todas as rotas da aplicação (React Router)
```

---

### 📁 /src/hooks - Custom Hooks React
```
src/hooks/
├── index.ts                      # Barrel export de todos os hooks
├── useFamilies.ts                # Busca e gerencia dados de famílias botânicas
├── useFamilyActions.ts           # Ações CRUD para famílias (create, update, delete)
├── useFamilyLegacyNames.ts       # Gerencia nomes legados/sinônimos de famílias
├── useOverviewStats.ts           # Estatísticas do dashboard (contagens, métricas)
├── useProjectActions.ts          # Ações CRUD para projetos
├── useProjectDetails.ts          # Dados detalhados de um projeto específico
├── useProjects.ts                # Lista de projetos do usuário
├── useSpecies.ts                 # Busca e gerencia espécies botânicas
├── useSpeciesActions.ts          # Ações CRUD para espécies
├── useSpeciesForm.ts             # Lógica do formulário de espécies
├── useSpeciesImages.ts           # Upload/gerenciamento de imagens de espécies
├── useSpecimenImages.ts          # Upload/gerenciamento de imagens de espécimes
├── useSpecimens.ts               # Busca e gerencia espécimes (ocorrências)
```

---

### 📁 /src/services - Repositórios de Dados
```
src/services/
├── types.ts                      # Interfaces dos dados das tabelas
├── speciesRepo.ts                # Repositório de acesso a dados de espécies
├── specimenRepo.ts               # Repositório de acesso a dados de espécimes
```

---

### 📁 /src/utils - Utilitários
```
src/utils/
├── csvGenerator.ts               # Gera arquivos CSV para exportação de dados
├── pdfGenerator.ts               # Gera relatórios PDF (inventário, etiquetas, etc.)
```

---

### 📁 /src/database - Scripts SQL
```
src/database/
├── add_created_by_especie_local.sql      # Adiciona campo created_by na tabela
├── add_label_fields.sql                  # Campos para etiquetas de herbário
├── add_project_coordinates.sql           # Coordenadas geográficas do projeto
├── create_etiquetas_table.sql            # Tabela de etiquetas de herbário
├── fix_map_permissions.sql               # Correção de permissões do mapa
├── fix_map_permissions_robust.sql        # Versão robusta das permissões do mapa
├── fix_projects_update_policy.sql        # Política de atualização de projetos
```

---

### 📁 /src/pages - Páginas da Aplicação

#### Admin (Logado)
```
src/pages/admin/
├── Login.tsx                     # Tela de login com autenticação Supabase
├── Overview.tsx                  # Dashboard principal com estatísticas
├── Projects.tsx                  # Lista de projetos do usuário
├── ProjectDetails.tsx            # Detalhes de um projeto (abas, espécies, espécimes)
├── Families.tsx                  # Gerenciamento de famílias botânicas
├── Species.tsx                   # Catálogo global de espécies
├── Specimens.tsx                 # Lista de espécimes/ocorrências
├── Users.tsx                     # Gestão de usuários e permissões
├── GlobalMap.tsx                 # Mapa global com todas as ocorrências
├── ProjectMap.tsx                # Mapa de um projeto específico
├── EducationalContent.tsx        # Conteúdos educativos para o app mobile
├── AuditLogs.tsx                 # Logs de auditoria do sistema
```

#### Landing Page (Público)
```
src/pages/landingpage/
├── LandingPage.tsx               # Página inicial pública do sistema
├── Disclaimer.tsx                # Aviso legal / Disclaimer
├── Privacy.tsx                   # Política de Privacidade
├── Terms.tsx                     # Termos de Uso
├── EmailConfirmed.tsx            # Página de confirmação de email
```

---

### 📁 /src/components - Componentes React

#### Cards
```
src/components/Cards/
├── ProjectCard.tsx               # Card de visualização de projeto
├── index.ts                      # Barrel export
```

#### Dashboard
```
src/components/Dashboard/
├── StatCard.tsx                  # Card de estatística (número + label)
```

#### Families
```
src/components/Families/
├── FamilyLegacyNamesSection.tsx  # Seção de nomes legados de uma família
```

#### Forms
```
src/components/Forms/
├── ImageUploadZone.tsx           # Componente de upload de imagens com drag-and-drop
```

#### Layout
```
src/components/Layout/
├── DashboardLayout.tsx           # Layout base do painel admin (sidebar + content)
├── Sidebar.tsx                   # Barra lateral de navegação
```

#### Maps
```
src/components/Maps/
├── GlobalHeatmap.tsx             # Mapa de calor global com Leaflet
├── ProjectMapViz.tsx             # Visualização de mapa por projeto
```

#### Overview (Dashboard Views por Role)
```
src/components/Overview/
├── index.ts                      # Barrel export
├── GlobalAdminView.tsx           # Visão do Admin Global
├── LocalAdminView.tsx            # Visão do Admin Local (coordenador de projeto)
├── SeniorView.tsx                # Visão do Taxonomista Sênior
├── FieldTaxonomistView.tsx       # Visão do Taxonomista de Campo
├── CatalogerView.tsx             # Visão do Catalogador
```

#### ProjectDetails (Abas do Projeto)
```
src/components/ProjectDetails/
├── index.ts                      # Barrel export
├── ProjectHeader.tsx             # Cabeçalho com info do projeto e ações
├── FamiliesTab.tsx               # Aba de famílias do projeto
├── SpeciesTab.tsx                # Aba de espécies vinculadas ao projeto
├── SpecimensTab.tsx              # Aba de espécimes/ocorrências do projeto
├── UsersTab.tsx                  # Aba de usuários membros do projeto
```

#### Tables
```
src/components/Tables/
├── index.ts                      # Barrel export
├── FamilyTable.tsx               # Tabela de famílias com ações
├── SpeciesTable.tsx              # Tabela de espécies com ações
```

#### Modals
```
src/components/Modals/
├── AnalyticsModal.tsx            # Modal com gráficos e analytics do projeto
├── BetaTestersModal.tsx          # Modal para gerenciar beta testers
├── ConfirmDeleteModal.tsx        # Modal de confirmação de exclusão
├── FamilyModal.tsx               # Modal para criar/editar família
├── PendingCuratorshipModal.tsx   # Modal de pendências de curadoria
├── PhotoGalleryModal.tsx         # Galeria de fotos fullscreen
├── ProjectFormModal.tsx          # Modal para criar/editar projeto
├── SpeciesByFamilyModal.tsx      # Modal listando espécies de uma família
├── SpeciesModal.tsx              # Modal principal de criação/edição de espécie
├── SpecimenModal.tsx             # Modal de criação/edição de espécime
├── SuccessModal.tsx              # Modal de sucesso genérico
```

#### Outros
```
src/components/
├── InstallPWA.tsx                # Banner de instalação do PWA
```

---

## 📁 /supabase - Scripts SQL do Supabase

```
supabase/
├── beta_testers.sql                      # Tabela e políticas de beta testers
├── fix_storage_delete_policy.sql         # Política de delete no storage
├── fix_storage_delete_policy_v2.sql      # V2 da política de delete
├── fix_storage_delete_policy_v3_debug.sql # V3 com debug
├── fix_storage_delete_policy_v4_secure.sql # V4 versão segura final
```

---

## 📁 /public - Arquivos Públicos

```
public/
├── icon.png                      # Ícone principal
├── pwa-192x192.png               # Ícone PWA 192px
├── pwa-512x512.png               # Ícone PWA 512px
├── jayan-moura.jpeg              # Foto do desenvolvedor
├── Tela Inicial.png              # Screenshot da tela inicial
├── downloads/                    # Pasta para downloads gerados
```

---

## 📁 /docs - Documentação

```
docs/
├── hierarquia_usuarios.csv       # CSV com hierarquia de roles de usuários
├── mobile_legal/                 # Documentos legais para o app mobile
│   ├── PRIVACY.md                # Política de privacidade (mobile)
│   └── TERMS.md                  # Termos de uso (mobile)
```

---

## 📁 /Contratos - Contratos e Documentos Legais

> Pasta contendo contratos do projeto (não versionada detalhadamente aqui)

---

## 🔧 Tecnologias Principais

| Tecnologia       | Uso                                      |
|------------------|------------------------------------------|
| **React 18**     | Framework UI                             |
| **TypeScript**   | Tipagem estática                         |
| **Vite**         | Bundler e dev server                     |
| **TailwindCSS**  | Estilização utilitária                   |
| **Supabase**     | Backend (Auth, Database, Storage)        |
| **React Router** | Roteamento SPA                           |
| **Leaflet**      | Mapas interativos                        |
| **jsPDF**        | Geração de PDFs                          |
| **Framer Motion**| Animações                                |

---

## 🎯 Conceitos Importantes

### Espécie vs Espécime
- **Espécie (Species)**: Dados taxonômicos globais (gênero, nome científico, classificação)
- **Espécime (Specimen)**: Ocorrência específica (localização, data de coleta, imagens, etiquetas)

### Roles de Usuário (RBAC)
1. **Global Admin**: Acesso total ao sistema
2. **Local Admin**: Coordenador de projeto
3. **Taxonomista Sênior**: Pode criar/editar famílias e espécies
4. **Taxonomista de Campo**: Coleta e registra espécimes
5. **Catalogador**: Visualização básica

---

*Gerado automaticamente em: Janeiro 2026*
