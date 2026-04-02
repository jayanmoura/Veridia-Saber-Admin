# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on port 3000
npm run build        # tsc + vite build
npm run lint         # ESLint
npm run test         # Vitest with UI
npm run test:run     # Vitest headless
```

To run a single test file: `npx vitest run src/test/unit/someFile.test.ts`

## Architecture

### Dual-Router SPA
`src/App.tsx` serves a landing page **or** admin panel from a single bundle, decided at runtime by hostname and pathname. The `publicRouter` covers public landing pages (`/`, `/politica`, `/termos`, etc.); the `adminRouter` covers all `/admin/*` routes wrapped in `DashboardLayout`.

### Authentication & RBAC
- `src/contexts/AuthContext.tsx` — manages Supabase session + fetches `profiles` row on login. **Note:** `persistSession: false` and `autoRefreshToken: false` are intentional — sessions do not survive page reloads.
- `src/types/auth.ts` — defines the 6 roles (`Curador Mestre`, `Coordenador Científico`, `Taxonomista Sênior`, `Gestor de Acervo`, `Taxonomista de Campo`, `Consulente`) with hierarchy helpers `getRoleLevel`, `canManage`, `getRoleConfig`.
- Roles have two axes: **what** (role name) and **scope** (`local_id` — global for levels 1–3, project-scoped for 4–5, read-only for 6).
- `src/routes/index.tsx` — `PrivateRoute` blocks unauthenticated users and `Consulente`; `OnlyGlobalAdmin` restricts to levels 1–2.

### Data Layer Pattern
Every entity follows a split-hook pattern:
- `use[Entity].ts` — read/fetch with role-aware filtering
- `use[Entity]Actions.ts` — create/update/delete mutations
- `src/services/[entity]Repo.ts` — raw Supabase queries

Hooks are barrel-exported from `src/hooks/index.ts`.

### Supabase Backend
No custom server. All backend logic lives in Supabase: Auth, PostgreSQL with RLS, Storage, and one Edge Function (`supabase/functions/login-proxy/`) for password-based login.

RLS uses `SECURITY DEFINER` helper functions (`is_staff()`, `is_admin()`) defined in migrations. **Known issue:** `is_admin()` was still broken as of the last migrations — check `docs/DECISIONS.md` for current status.

Migrations live in `supabase/migrations/` (numbered, formal) and loose `.sql` files in `supabase/` (manual/one-off). Apply formal migrations via Supabase CLI or the MCP Supabase tool.

### Key Domain Concepts
- **Species** (`especies`) — global taxonomic records, one per species
- **Specimens / `especie_local`** — georeferenced occurrences of a species, scoped to a `local_id`
- **Families** (`familias`) — botanical families grouping species
- **Projects** — field collection projects, each with a `local_id`
- `local_id` is the multitenancy key: non-global roles only see data where `local_id` matches their profile

### Features
- **Interactive maps** — Leaflet/React-Leaflet in `src/components/Maps/`
- **Rich text editor** — TipTap in `src/components/RichTextEditor.tsx` (educational content)
- **PDF/CSV reports** — client-side, jsPDF, organized in `src/utils/pdf/`
- **PWA** — vite-plugin-pwa, auto-update, 5 MB per-file cache limit
- **Image uploads** — Supabase Storage, drag-and-drop via `src/components/Forms/ImageUploadZone.tsx`

## Key Files
| Path | Purpose |
|------|---------|
| `src/App.tsx` | Entry: dual-router logic |
| `src/routes/index.tsx` | Route definitions + auth guards |
| `src/contexts/AuthContext.tsx` | Auth state, role checking |
| `src/types/auth.ts` | Role types, hierarchy helpers |
| `docs/DECISIONS.md` | Architectural decision record — read before changing core patterns |
| `SUPABASE_SCHEMA.md` | Full DB schema, RLS policies, triggers |

## Environment
Requires `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. See README.md for full setup.
