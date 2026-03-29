# Decisões Arquiteturais — Veridia Saber Admin

> Análise completa de todas as decisões arquiteturais do projeto, com justificativas e impactos.

---

## 1. Arquitetura Geral

### SPA com Dual-Router (Landing Page + Admin Panel)

O `App.tsx` implementa uma lógica de **detecção de domínio em runtime** para servir duas experiências completamente distintas a partir do mesmo bundle:

- **Landing Page pública** → `publicRouter` (sem `AuthProvider`)
- **Painel administrativo** → `adminRouter` (envolto em `AuthProvider`)

A decisão é feita por hostname (`veridiasaber.com.br` → landing, `localhost` → admin), com suporte a OAuth callbacks e rotas `/admin/*` para redirecionamento híbrido.

> **Implicação**: Ambos os routers são compilados no mesmo bundle. Isso simplifica o deploy (um único artefato), mas todo o código do admin é carregado mesmo na landing page.

---

### Backend-as-a-Service com Supabase

O projeto **não possui backend próprio**. Toda a lógica de dados, autenticação, storage e segurança é delegada ao Supabase:

| Componente | Responsabilidade |
|---|---|
| **Supabase Auth** | Autenticação (email/senha + OAuth) |
| **Supabase Database** | PostgreSQL com RLS |
| **Supabase Storage** | Upload de imagens (4 buckets públicos) |
| **Supabase Edge Functions** | Operações privilegiadas (ex: criação de usuários) |

O cliente Supabase é instanciado com `persistSession: false` e `autoRefreshToken: false`, o que significa que **a sessão não é persistida no localStorage** e o token não é renovado automaticamente.

> **Implicação**: Cada refresh da página exige re-autenticação via `getSession()`. Isso é uma decisão de segurança (evita sessões fantasma) mas pode causar logouts inesperados.

---

### PWA (Progressive Web App)

O Vite está configurado com `vite-plugin-pwa` em modo `autoUpdate`, com service worker habilitado inclusive em desenvolvimento. O cache máximo por arquivo é 5MB.

> **Implicação**: O painel admin é instalável como app nativo em mobile/desktop. O componente `InstallPWA.tsx` detecta suporte e exibe o prompt.

---

## 2. Sistema de Autenticação e Autorização (RBAC)

### Dual-Layer de Roles: Frontend vs Backend

O sistema de roles opera em **duas camadas independentes com nomenclaturas diferentes**, o que é uma das decisões mais importantes (e problemáticas) do projeto:

| Camada | Valores usados | Exemplo |
|---|---|---|
| **Frontend** (`types/auth.ts`) | Nomes de exibição | `'Curador Mestre'`, `'Coordenador Científico'` |
| **Backend** (RLS functions) | Valores técnicos | `'super_admin'`, `'admin'` |

A **view `user_roles_display`** faz a tradução entre os dois mundos no banco. Porém, a coluna `profiles.role` tem default `'Consulente'` (nome de exibição), enquanto as funções RLS (`is_staff()`, `is_admin()`) comparam com valores técnicos.

> ⚠️ **Pendência conhecida**: Existe uma desincronização documentada no `SUPABASE_SCHEMA.md`. Se um usuário for criado sem role explícita, as políticas RLS podem não reconhecê-lo.

---

### RBAC Composto: `role` + `local_id`

A autorização não depende apenas da role, mas da **combinação `role` + `local_id`**:

- `local_id = NULL` → escopo **global**
- `local_id NOT NULL` → escopo **local** (restrito ao projeto)

Isso cria 6 papéis efetivos a partir de apenas 3 valores de role (`super_admin`, `admin`, `catalogador`):

```
super_admin                    → Curador Mestre (global)
admin + local_id = NULL        → Coordenador Científico (global)
admin + local_id NOT NULL      → Gestor de Acervo (local)
catalogador + local_id = NULL  → Taxonomista Sênior (global)
catalogador + local_id NOT NULL→ Taxonomista de Campo (local)
sem role                       → Consulente (read-only)
```

---

### Hierarquia Numérica de Roles

O arquivo `types/auth.ts` define uma hierarquia numérica com constante `ROLES_CONFIG`:
- Nível 1 (maior): Curador Mestre
- Nível 6 (menor): Consulente

Helpers como `canManage()`, `hasMinLevel()` e `getRoleLevel()` permitem verificações declarativas de permissão no frontend.

---

### Guards de Rota (2 níveis)

- **`PrivateRoute`**: Exige sessão ativa e bloqueia `Consulente`
- **`OnlyGlobalAdmin`**: Restringe a `Curador Mestre` e `Coordenador Científico`

> Estes guards comparam com **nomes de exibição** (`'Curador Mestre'`), não valores técnicos.

---

## 3. Modelo de Dados

### Espécie vs Espécime (1:N)

A distinção entre registro taxonômico global (espécie) e ocorrência georreferenciada (espécime) é o conceito de domínio central:

- `especie` → cadastro único do taxon
- `especie_local` → ocorrência física vinculada a um projeto (`local_id`)

A **view `especime`** é um alias semântico de `especie_local` para separar conceitualmente os dois.

---

### Multitenancy via `institution_id`

A tabela `institutions` serve como raiz para multitenancy. Entidades como `especie`, `especie_local`, `locais`, `colecoes` e `imagens` possuem FK para `institutions.id`.

O arquivo `config/institution.ts` implementa um **cache de institution_id** com fallback para `'Veridia Saber (Legado)'` — indicando que o multitenancy é embrionário e atualmente opera como single-tenant com preparação para expansão.

---

### Imagens com Constraint Exclusiva

A tabela `imagens` usa um **CHECK constraint** para garantir que cada imagem pertence a exatamente uma entidade:

```sql
(especie_id IS NOT NULL AND especime_id IS NULL)
OR (especie_id IS NULL AND especime_id IS NOT NULL)
```

> ⚠️ **Pendência**: Existe redundância entre `especie_local_id` e `especime_id` (ambas com FK para `especie_local`). Apenas `especime_id` deveria existir.

---

### Conteúdo Educacional por Órgão Botânico

A tabela `conteudo_orgaos` organiza conteúdo rich text (TipTap) por órgão vegetal (Raiz, Caule, Folha, Flor, Fruto, Semente), com campo `ordem` para sequenciamento.

---

## 4. Arquitetura Frontend

### Padrão de Hooks: Leitura vs Ação

O projeto separa os hooks em dois tipos:

| Tipo | Convenção | Exemplo |
|---|---|---|
| **Leitura** | `use[Entidade].ts` | `useSpecies.ts`, `useFamilies.ts` |
| **Ação** | `use[Entidade]Actions.ts` | `useSpeciesActions.ts`, `useFamilyActions.ts` |

Todos são exportados via barrel em `hooks/index.ts`.

---

### Camada de Serviços (Repository Pattern)

O diretório `services/` implementa um **Repository Pattern simplificado**:

- `speciesRepo.ts` → queries de espécies
- `specimenRepo.ts` → queries de espécimes
- `types.ts` → interfaces que mapeiam tabelas do banco

Isso separa queries Supabase dos hooks, embora nem todas as entidades tenham repositórios (famílias e projetos acessam Supabase diretamente dos hooks).

---

### Refatoração: Páginas < 500 linhas

Esta refatoração foi concluída em janeiro de 2026. Os resultados foram reduções de 58% a 93% no tamanho das páginas principais. A estratégia foi extrair:

- Lógica de estado → hooks
- Formulários → componentes de formulário
- Tabelas → componentes de tabela
- Modais → componentes de modal
- Visões por role → componentes Overview específicos

---

### Dashboard por Role (Strategy Pattern)

A tela `Overview.tsx` renderiza **visões diferentes por role**, implementando um padrão semelhante ao Strategy:

- `GlobalAdminView.tsx` → Curador Mestre / Coordenador Científico
- `LocalAdminView.tsx` → Gestor de Acervo
- `SeniorView.tsx` → Taxonomista Sênior
- `FieldTaxonomistView.tsx` → Taxonomista de Campo
- `CatalogerView.tsx` → Catalogador genérico

---

## 5. Segurança (Backend)

### RLS com Funções SECURITY DEFINER

As políticas RLS utilizam funções auxiliares `is_staff()` e `is_admin()` com `SECURITY DEFINER`, o que significa que executam com privilégios do owner (não do caller), evitando recursão em policies.

Padrão obrigatório do projeto:
- Sempre `DROP POLICY IF EXISTS` antes de `CREATE POLICY`
- Nunca usar `FOR ALL` — separar em `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- Usar `(SELECT auth.uid())` ao invés de `auth.uid()` diretamente (evita re-execução)

---

### Storage: 4 Buckets Públicos

Todos os buckets são **públicos** (acessíveis para leitura sem autenticação):

| Bucket | Conteúdo |
|---|---|
| `imagens-plantas` | Fotos de espécies do catálogo |
| `imagens_conteudo` | Imagens do editor TipTap |
| `fotos-das-colecoes` | Fotos do app mobile |
| `arquivos-gerais` | Arquivos por órgão botânico |

> **Decisão**: Leitura pública simplifica a exibição de imagens no app mobile sem necessidade de tokens. O upload é protegido por RLS.

---

## 6. Geração de Relatórios (Client-Side)

A geração de PDFs e CSVs é feita **inteiramente no frontend** via:

- `jsPDF` + `jspdf-autotable` → fichas técnicas, inventários, etiquetas de herbário
- `csvGenerator.ts` → exportação de inventários

> **Decisão**: Evita a necessidade de server-side rendering para relatórios. Funciona offline como PWA. A desvantagem é o consumo de memória do browser para grandes datasets.

---

## 7. Migrações de Banco

### Dual-Track de Migrações

O projeto mantém scripts SQL em **dois locais diferentes**:

| Local | Propósito |
|---|---|
| `supabase/migrations/` | Migrações formais com numeração sequencial (`001_`, `002_`) |
| `src/database/` | Scripts avulsos executados manualmente no SQL Editor |

> **Implicação**: Não há um runner de migrações automatizado. Os scripts são aplicados manualmente no Supabase Dashboard.

---

## 8. Stack Tecnológica

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

---

## 9. Decisões de Negócio e Infraestrutura

### Landing Page Self-Hosted em Raspberry Pi

A landing page pública (veridiasaber.com.br) é servida a partir de um **Raspberry Pi doméstico** em vez de um serviço de hosting pago.

**Motivação:** o projeto está em fase pré-receita e toda economia de infraestrutura é válida enquanto não há parceiros institucionais ativos.

**Implicações:**
- Custo zero de hosting para a landing page
- Uptime depende da conexão doméstica — não adequado para o painel admin ou API
- O painel admin e o Supabase continuam em infraestrutura confiável; apenas a vitrine pública assume esse risco

---

### Posicionamento como Ferramenta de Botânica Sistemática

O produto é apresentado institucionalmente como uma **ferramenta de botânica sistemática**, não como um software ou sistema de gestão.

**Motivação:** herbários, jardins botânicos e universidades respondem melhor a propostas alinhadas ao vocabulário do domínio científico. A palavra "software" cria distância; "ferramenta de catalogação sistemática" cria identificação.

**Implicações:**
- Todo material de outreach (apresentações, emails, conversas) usa linguagem botânica como framing primário
- O desenvolvimento técnico é secundário na comunicação externa — o foco é o problema científico que o produto resolve
- Essa decisão influencia inclusive os nomes de roles no sistema: "Curador Mestre", "Taxonomista de Campo", "Coordenador Científico" — não "Admin", "Editor", "Viewer"

---

## 10. Pendências e Dívidas Técnicas

| Pendência | Impacto | Severidade |
|---|---|---|
| Desincronização `is_staff()` vs `profiles.role` | RLS pode não reconhecer staff | 🔴 Alta |
| Coluna `especie_local_id` redundante em `imagens` | Confusão de FK | 🟡 Média |
| Roles `curador`/`coordenador` em `is_staff()` | Resquícios de nomenclatura anterior | 🟡 Média |
| `persistSession: false` no Supabase Client | Sessões não persistem entre reloads | 🟢 Intencional |
| Repository Pattern incompleto | Nem todas as entidades têm repos | 🟢 Baixa |
| `any` em `institution.ts` (`supabase: any`) | Viola a regra de tipagem do projeto | 🟡 Média |

---

## Como manter este documento

- Atualizar sempre que uma decisão arquitetural ou de negócio relevante for tomada
- Para decisões que substituem anteriores, marcar a antiga com `> ⚠️ Substituída: ver seção X`
- Pendências resolvidas devem ser removidas da tabela de dívidas técnicas e registradas aqui como decisão tomada

---

*Data de criação do documento: 29/03/2026*
