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

As políticas RLS utilizam funções auxiliares `is_staff()` e `is_admin()` com
`SECURITY DEFINER`, executando com privilégios do owner para evitar recursão.

**Padrão obrigatório do projeto:**
- Sempre `DROP POLICY IF EXISTS` antes de `CREATE POLICY`
- Nunca usar `FOR ALL` — separar em `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- Usar `(SELECT auth.uid())` em vez de `auth.uid()` diretamente (evita re-execução via initplan)

---

#### ⚠️ Bug Conhecido: Inconsistência de Roles nas Funções RLS

**Problema:** A coluna `profiles.role` armazena **nomes de exibição**
(ex: `'Curador Mestre'`, `'Gestor de Acervo'`), mas as funções `is_admin()` e
`is_staff()` originais checavam os identificadores técnicos em lowercase
(ex: `'super_admin'`, `'admin'`). Isso fazia com que as funções **sempre
retornassem false** para todos os usuários, bloqueando operações de escrita e
exclusão com erro 403.

**Causa raiz:** Divergência entre o schema técnico planejado e o que foi
efetivamente armazenado no banco durante o desenvolvimento inicial.

**Correção aplicada em `is_staff()`** (migration anterior): a função foi
atualizada para incluir os nomes de exibição:
```sql
role IN (
  'super_admin', 'admin', 'catalogador', 'curador', 'coordenador',
  'Curador Mestre', 'Coordenador Científico', 'Taxonomista Sênior'
)
```

**Pendência — `is_admin()`:** ainda usa apenas os identificadores técnicos
(`'super_admin'`, `'admin'`), continuando quebrada. A correção está pendente
na próxima migration (`003_fix_especie_local_delete.sql`), que também corrige
a policy de DELETE da tabela `especie_local` para usar `is_staff()`.

---

#### Regras de Exclusão e Escopo por `local_id` (pendência de implementação)

As regras de negócio para exclusão estão definidas (ver README), mas a RLS
atual **não valida o escopo por `local_id`**. Hoje a policy de DELETE de
`especie_local` usa apenas:
```sql
USING ( (SELECT is_admin()) OR (created_by = (SELECT auth.uid())) )
```

O que está incorreto por dois motivos:
1. `is_admin()` está quebrada (retorna sempre false)
2. Não valida se um `admin` com `local_id NOT NULL` (Gestor de Acervo) pertence
   ao mesmo projeto que o registro sendo deletado

**Implementação completa do escopo por `local_id` está planejada para a
migration `003_fix_especie_local_delete.sql`**, que deverá incluir:
- Correção de `is_admin()` para reconhecer nomes de exibição
- Policy de DELETE com validação de `local_id` para Gestores de Acervo
- Policy de DELETE restrita a `created_by` para Taxonomistas

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
| Coluna `especie_local_id` redundante em `imagens` | Confusão de FK | 🟡 Média |
| `persistSession: false` no Supabase Client | Sessões não persistem entre reloads | 🟢 Intencional |
| Repository Pattern incompleto | Nem todas as entidades têm repos | 🟢 Baixa |
| `any` em `institution.ts` (`supabase: any`) | Viola a regra de tipagem do projeto | 🟡 Média |
| `backfill-image-sizes` sem JWT | Exposição mínima | 🟡 Média | Edge Function deployada sem verify_jwt para uso imediato — reativar JWT ou desativar a função |

---

## 11. Sistema de Thumbnails para Imagens Botânicas

O sistema preserva a imagem original em resolução completa (dado científico) e gera versões otimizadas para exibição:

| Versão | Resolução | Qualidade | Campo DB | Tamanho médio real | Uso |
|--------|-----------|-----------|----------|--------------------|-----|
| Original | Câmera completa | Sem compressão | `url_imagem` | ~12 MB (variável) | Download científico, inspeção |
| Thumbnail | 1200px max width | JPEG 85% | `url_thumbnail` | ~0,7 MB | Modais e galeria |
| Micro | 300px max width | JPEG 70% | `url_micro` | ~0,05 MB | Ícones em tabelas e listagens |

A compressão é feita no frontend via Canvas API (`src/utils/imageCompressor.ts`) antes do upload. Os três arquivos são salvos no mesmo bucket, com thumbnails em subpasta `thumbs/` e micros em `micro/`.

Componentes de listagem usam fallback: `url_micro || url_thumbnail || url_imagem` para compatibilidade com imagens antigas.

### Tamanhos Reais em Disco (colunas na tabela `imagens`)

A tabela `imagens` armazena os tamanhos reais capturados no momento do upload:
```sql
tamanho_original  integer  -- bytes do arquivo original (File.size)
tamanho_thumbnail integer  -- bytes do thumbnail gerado
tamanho_micro     integer  -- bytes do micro gerado
tamanho_estimado  boolean  -- TRUE = backfill estimado, FALSE = dado real do upload
```

Registros anteriores à feature (03/04/2026) foram preenchidos via Edge Function
`backfill-image-sizes` com tamanhos reais do Supabase Storage.
Os novos uploads gravam os tamanhos automaticamente via `useSpeciesImages` e `useSpecimenImages`.

---

## 12. Otimizações de Performance do Painel Admin (Abril 2026)

1. **React.lazy + Suspense**: 13 páginas admin convertidas para lazy loading. Leaflet, TipTap, jsPDF e Framer Motion só carregam quando a rota é acessada.
2. **Remoção de backdrop-blur**: Substituído por fundos opacos em ~30 componentes para reduzir jank de GPU.
3. **transition-all → propriedades específicas**: Trocado por transition-colors, transition-[transform,colors,box-shadow] conforme o contexto em ~15 arquivos.
4. **Service Worker desabilitado em dev**: `devOptions: { enabled: false }` no vite.config.ts.
5. **Feedback de upload com etapas**: Modal mostra "Comprimindo..." → "Enviando..." → "Salvando..." com spinner, botões escondidos e modal bloqueado durante o processo.

---

## 13. Edge Functions

| Função | JWT | Propósito |
|---|---|---|
| `login-proxy` | ❌ | Proxy de autenticação por senha |
| `cleanup-user-storage` | ✅ | Limpeza de arquivos ao deletar usuário |
| `backfill-image-sizes` | ❌ | Backfill pontual de tamanhos reais via storage.list() — uso concluído em 03/04/2026 |

> ⚠️ `backfill-image-sizes` está sem JWT. Considerar reativar JWT ou desativar a função após uso.

---

## Como manter este documento

- Atualizar sempre que uma decisão arquitetural ou de negócio relevante for tomada
- Para decisões que substituem anteriores, marcar a antiga com `> ⚠️ Substituída: ver seção X`
- Pendências resolvidas devem ser removidas da tabela de dívidas técnicas e registradas aqui como decisão tomada

---

*Criado em: 29/03/2026 — Última atualização: 03/04/2026*
