# Graph Report - Veridia-Saber-Admin  (2026-05-23)

## Corpus Check
- 174 files · ~157,093 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1084 nodes · 1644 edges · 84 communities (76 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7e5c9f1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 73|Community 73]]

## God Nodes (most connected - your core abstractions)
1. `supabase` - 56 edges
2. `useAuth()` - 50 edges
3. `📊 Tabelas` - 20 edges
4. `Hooks` - 16 edges
5. `Componentes` - 16 edges
6. `Páginas` - 16 edges
7. `Utilitários` - 16 edges
8. `Testes` - 15 edges
9. `Decisões Arquiteturais — Veridia Saber Admin` - 15 edges
10. `Footer()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `SpeciesModalRefactored()` --calls--> `useSpeciesImages()`  [INFERRED]
  src/components/Modals/SpeciesModal/SpeciesModalRefactored.tsx → src/hooks/useSpeciesImages.ts
- `GlobalAdminView()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/Overview/GlobalAdminView.tsx → src/contexts/AuthContext.tsx
- `LocalAdminView()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/Overview/LocalAdminView.tsx → src/contexts/AuthContext.tsx
- `Specimens()` --calls--> `useAuth()`  [EXTRACTED]
  src/pages/admin/Specimens.tsx → src/contexts/AuthContext.tsx
- `AuthConsumer()` --calls--> `useAuth()`  [EXTRACTED]
  src/test/unit/AuthContext.test.tsx → src/contexts/AuthContext.tsx

## Communities (84 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (34): additionalURLs, addRoute(), cacheMatchIgnoreParams(), _cacheNameDetails, cacheNames, cacheWillUpdate(), canConstructResponseFromBodyStream(), cleanURL (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (44): 10. Pendências e Dívidas Técnicas, 11. Sistema de Thumbnails para Imagens Botânicas, 12. Otimizações de Performance do Painel Admin (Abril 2026), 13. Edge Functions, 1. Arquitetura Geral, 2. Sistema de Autenticação e Autorização (RBAC), 3. Modelo de Dados, 4. Arquitetura Frontend (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (42): Admin (Autenticado), code:block1 (├── .env                          # Variáveis de ambiente (V), code:block10 (src/services/), code:block11 (src/utils/), code:block12 (src/database/), code:block13 (src/pages/admin/), code:block14 (src/pages/landingpage/), code:block2 (src/) (+34 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (42): admin_notifications, analytics_daily_active_users, analytics_events, analytics_events_summary, audit_logs, beta_testers, code:sql (SELECT date(created_at) AS date,), code:sql (SELECT event_type,) (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (28): COLORS, addFooter(), addHeader(), drawHorizontalBarChart(), extractFirst(), extractGenusAndEpithet(), getBase64FromUrl(), getLogoBase64() (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (19): AuditLog, ContentItem, ORGAOS, PASTAS_ARQUIVOS, RichTextEditorProps, AuthContext, AuthContextType, FamilyOption (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (26): ExistingImage, UploadOptions, useSpeciesImages(), UseSpeciesImagesOptions, UseSpeciesImagesReturn, ExistingImage, UploadOptions, UseSpecimenImagesReturn (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (27): code:bash (git clone <url-do-repositorio>), code:bash (npm install), code:bash (cp .env.example .env), code:env (VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co), code:bash (npm run dev), code:block6 (src/), code:block7 (┌──────────────┐       1:N       ┌──────────────────┐), code:bash (npm run test:run   # headless — obrigatório antes de cada gi) (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (18): INITIAL_FORM, Specimens(), useSpecimenImages(), INITIAL_FORM, Specimen, SpecimenFormData, useSpecimens(), UseSpecimensOptions (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (14): Family, Species, StatCard(), StatCardProps, ConfirmDeleteModal(), ConfirmDeleteModalProps, ProjectFormData, ProjectFormModal() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (18): ProjectDetailsPage(), LinkedFamily, LinkedSpecies, LinkedUser, ModalSpecies, ProjectDetails, StorageAnalysis, TabType (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (12): createProjectCenterIcon(), ProjectData, ProjectMap(), SpeciesLocation, TaxonomistData, PlantLocation, ProjectCluster, speciesRepo (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (23): Cards, code:block15 (src/components/Cards/), code:block16 (src/components/Dashboard/), code:block17 (src/components/Families/), code:block18 (src/components/Forms/), code:block19 (src/components/Layout/), code:block20 (src/components/Maps/), code:block21 (src/components/Overview/) (+15 more)

### Community 13 - "Community 13"
Cohesion: 0.23
Nodes (4): PrecacheStrategy, StrategyHandler, toRequest(), initializePDFLogo()

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (16): GLOBAL_ROLES, isGlobalRole(), Profile, Project, Users(), UserStats, canManage(), getRoleConfig() (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (12): SpeciesPage(), Project, ReportModalProps, Specimen, SpecimenDetailModalProps, SpecimensInspection(), useAuth(), useSpecies() (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (15): Overview(), AuditLog, GlobalStats, LocalFamily, LocalStats, ProjectData, RecentFamily, RecentLocalSpecies (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (7): Footer(), Navbar(), LocalItem, iconePorOrgao, TopicoItem, ConteudoOrgaoItem, iconePorOrgao

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (14): Projects(), getDefaultInstitutionId(), INITIAL_FORM, Profile, Project, ProjectFormData, useProjectActions(), UseProjectActionsOptions (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (14): adminRouter, publicRouter, CatalogoEspecies, CatalogoFamilias, CriadorPage, DetalhesEspecie, DetalhesEspecimeLocal, DetalhesFamilia (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (5): AboutVeridia(), AppCTA(), HeroSection(), BetaDownloadModalProps, SECTIONS

### Community 21 - "Community 21"
Cohesion: 0.16
Nodes (3): createCacheKey(), PrecacheController, waitUntil()

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (16): `AuditLogs.tsx`, `Disclaimer.tsx`, `EducationalContent.tsx`, `Families.tsx`, `LandingPage.tsx`, `Login.tsx`, Páginas, `Privacy.tsx` (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (16): `AnalyticsModal.tsx`, Componentes, `ConfirmDeleteModal.tsx`, `FamilyModal.tsx`, `FieldTaxonomistView.tsx`, `GlobalAdminView.tsx`, `GlobalHeatmap.tsx`, `LocalAdminView.tsx` (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (16): Hooks, `index.ts`, `useAuth()`, `useFamilies.ts`, `useFamilyActions.ts`, `useOverviewStats.test.ts`, `useOverviewStats.ts`, `useProjectActions.ts` (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (16): `addFooter()`, `addHeader()`, `compressForListing()`, `compressImage()`, `constants.ts`, `core.ts`, `drawHorizontalBarChart()`, `familyReport.ts` (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (14): AuditLogs, EducationalContent, Families, GlobalMap, Login, Overview, ProjectDetails, ProjectMap (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (11): AnalyticsModal(), AnalyticsModalProps, DailyActiveUser, PeriodFilter, PlatformDistribution, RecentEvent, BetaTester, BetaTestersModal() (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (9): Family, FamilyModal(), FamilyModalProps, PendingCuratorshipModal(), PendingCuratorshipModalProps, PendingItem, SpeciesModal(), FieldTaxonomistViewProps (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (11): ExistingImage, ImageUploadZone(), ImageUploadZoneProps, FamilyOption, LabelDataTab(), LabelDataTabProps, LocalData, Species (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.19
Nodes (4): getFriendlyURL(), getOrCreateDefaultRouter(), Router, Strategy

### Community 31 - "Community 31"
Cohesion: 0.13
Nodes (15): `auth.types.test.ts`, `AuthConsumer()`, `AuthContext.test.tsx`, `guards.test.tsx`, `Login.test.tsx`, `mockSupabase`, `mockSupabaseResponse()`, `renderEditModal()` (+7 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (12): Families(), Family, FamilyStats, PendingFamily, useFamilies(), UseFamiliesOptions, UseFamiliesReturn, Family (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (3): LegalPageLayout(), LegalPageLayoutProps, AccordionItemProps

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (8): AuthProvider(), methodOverrides, mockSupabase, resetSupabaseMocks(), AuthConsumer(), cb, mockProfile, mockSession

### Community 35 - "Community 35"
Cohesion: 0.15
Nodes (12): `App.tsx`, `AuthContext.tsx`, `AuthProvider()`, Configuração, Contextos, `getDefaultInstitutionId()`, Graph Index — Veridia Saber Admin, `index.ts` (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (11): Architecture, Authentication & RBAC, code:bash (npm run dev          # Dev server on port 3000), Commands, Data Layer Pattern, Dual-Router SPA, Environment, Features (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (11): Arquivos alterados, Arquivos alterados, Como usar este arquivo, Decisões tomadas, Decisões tomadas, O que foi feito, O que foi feito, Pendências abertas (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.26
Nodes (5): SkeletonCard(), SpeciesCard(), SpeciesCardProps, SpeciesItem, FamilyOption

### Community 39 - "Community 39"
Cohesion: 0.2
Nodes (11): mockSupabaseResponse(), setupEmptyMocks(), disabledRoles, habilitados, mockUseAuth, option, optionCurador, renderEditModal() (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (6): MapBoundsUpdater(), Props, SpeciesDetails, SpeciesImage, FamilyDetails, SpeciesListItem

### Community 41 - "Community 41"
Cohesion: 0.2
Nodes (8): EspecieLocalRow, EspecieRow, FamiliaRow, FamiliesSection(), LocalPin, LocalRow, MapControllerProps, SpecimenPin

### Community 42 - "Community 42"
Cohesion: 0.27
Nodes (5): InstallPWA(), DashboardLayout(), MENU_ITEMS, MenuItem, Sidebar()

### Community 43 - "Community 43"
Cohesion: 0.27
Nodes (5): hasMethod(), isOneOf(), isType(), normalizeHandler(), Route

### Community 44 - "Community 44"
Cohesion: 0.2
Nodes (10): `auth.ts`, `canManage()`, `getRoleConfig()`, `getRoleLevel()`, `hasMinLevel()`, `ROLES_CONFIG`, `ROLES_LIST`, Tipos (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (8): FamilyOption, INITIAL_FORM_DATA, INITIAL_LOCAL_DATA, LocalData, LocalOption, Species, UseSpeciesFormOptions, UseSpeciesFormReturn

### Community 46 - "Community 46"
Cohesion: 0.31
Nodes (4): FamilyCard(), FamilyCardProps, FamilyItem, FamilyCardSkeleton()

### Community 47 - "Community 47"
Cohesion: 0.32
Nodes (6): formatTipo(), isInstituicao(), ProjectCard(), ProjectCardProps, ProjectItem, ProjectsGridProps

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (8): Serviços/Libs, `Species`, `speciesRepo.ts`, `Specimen`, `SpecimenFilters`, `specimenRepo.ts`, `supabase.ts`, `types.ts`

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (7): 1. Informações que Coletamos, 2. Como Usamos Seus Dados, 3. Compartilhamento de Dados, 4. Seus Direitos (LGPD), 5. Coleta de Dados e Analytics, 6. Contato, Política de Privacidade

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (3): OnlyGlobalAdmin(), PrivateRoute(), mockUseAuth

### Community 51 - "Community 51"
Cohesion: 0.43
Nodes (5): FamilyLegacyNamesSection(), FamilyLegacyNamesSectionProps, FamilyLegacyName, useFamilyLegacyNames(), UseFamilyLegacyNamesReturn

### Community 52 - "Community 52"
Cohesion: 0.29
Nodes (4): btn, cb, mockNavigate, mockSession

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (4): LinkedUser, UsersTabProps, ROLES_CONFIG, UserRole

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (6): 1. Uso do Aplicativo, 2. Isenção de Responsabilidade, 3. Propriedade Intelectual, 4. Conteúdo do Usuário, 5. Alterações nos Termos, Termos de Uso

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (4): FamilyOption, LocalOption, Species, SpeciesDataTabProps

### Community 56 - "Community 56"
Cohesion: 0.47
Nodes (5): formatTipo(), isInstituicao(), ProjectDetails, ProjectHeader(), ProjectHeaderProps

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (4): EspecieDetails, EspecimeDetails, ImagemDetails, LocalDetails

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (4): EspecieItem, EspecimeItem, ImagemItem, LocalDetails

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (3): GalleryImage, ImageGalleryProps, LightboxPortalProps

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (5): Profile, Species, useSpeciesActions(), UseSpeciesActionsOptions, UseSpeciesActionsReturn

### Community 61 - "Community 61"
Cohesion: 0.4
Nodes (5): exports, registry, require(), singleRequire(), specialDeps

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (6): `adminRouter`, `index.tsx`, `OnlyGlobalAdmin()`, `PrivateRoute()`, `publicRouter`, Rotas

### Community 63 - "Community 63"
Cohesion: 0.4
Nodes (3): isArray(), isArrayOfClass(), NavigationRoute

## Knowledge Gaps
- **515 isolated node(s):** `corsHeaders`, `supabaseClient`, `CatalogoEspecies`, `DetalhesEspecie`, `CatalogoFamilias` (+510 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initializePDFLogo()` connect `Community 13` to `Community 8`, `Community 4`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `supabase` connect `Community 5` to `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 27`, `Community 28`, `Community 29`, `Community 32`, `Community 38`, `Community 40`, `Community 41`, `Community 42`, `Community 45`, `Community 46`, `Community 51`, `Community 52`, `Community 57`, `Community 58`, `Community 60`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 15` to `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 14`, `Community 16`, `Community 18`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 32`, `Community 34`, `Community 39`, `Community 42`, `Community 45`, `Community 50`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `corsHeaders`, `supabaseClient`, `CatalogoEspecies` to the rest of the system?**
  _515 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._