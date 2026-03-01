# Phase 1: Project Scaffolding - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the base Next.js 15 App Router project at the repository root with: HeroUI as the component library, Convex client connected (real-time subscriptions working), and deployed to Vercel. This phase does NOT build user-facing features — it wires up the stack and locks in visual identity so every subsequent phase can build on a consistent foundation.

</domain>

<decisions>
## Implementation Decisions

### Component Library
- Use **HeroUI** (`npx heroui-cli@latest init`) as the sole component library — NOT shadcn/ui
- HeroUI only — no shadcn/ui alongside it. Single source of truth for components.
- Use HeroUI components consistently throughout all phases

### Visual Theme
- Primary color: **Blue / Indigo** — professional, trustworthy, SaaS-standard
- Status chip colors are **semantic**: DONE=green, FAILED=red, RUNNING=amber/yellow, QUEUED=gray, RFQ_REQUIRED=orange
- Visual density: **Dense / data-rich** — compact cards, tight spacing (Linear/Vercel/Supabase style)
- Configure HeroUI theme with blue/indigo primary, semantic status colors locked in at init

### Dark / Light Mode
- **Dark mode only** — set as the default, no runtime toggle
- No theme toggle button needed in Phase 6 either
- CSS variables and HeroUI theme config should only define the dark theme

### Typography
- **Inter** for all text — body, headings, UI labels
- No separate display font; use Inter weight variation (font-bold / font-semibold) for heading hierarchy
- Load via `next/font/google` (optimized font loading)

### Convex Setup
- **Owner:** This developer owns the Convex deployment
- Run `npx convex dev` to create the deployment
- Connect via `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` env vars
- Phase 1 success verification: `useQuery(api.houses.list)` returns `[]` — empty array is enough to confirm wire-up
- No seed data needed for Phase 1 verification

### Environment Variables
- **Pattern:** Vercel env vars dashboard for production + `.env.local` for local dev
- `.env.local` should NOT be committed (already in .gitignore)
- Set `NEXT_PUBLIC_CONVEX_URL` in Vercel dashboard for the production deployment

### Vercel Deployment
- Push to `main` branch triggers auto-deploy
- Connect the GitHub repo to the Vercel project
- Project root is the Next.js app root (not a subdirectory)

### Claude's Discretion
- Exact HeroUI theme configuration values (base color shades, border radius)
- Next.js project structure (folder layout within `app/`, `components/`, etc.)
- Convex schema structure for the initial `houses` table (backend owner will expand it)
- Tailwind config details
- ESLint / prettier configuration

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield frontend. The Python backend (`bu-agent/proquote/`) has no frontend assets.

### Established Patterns
- Project root is the target for the Next.js app (confirmed in STATE.md decisions)
- Backend lives in `bu-agent/` — Next.js app should coexist at repo root, not nested inside `bu-agent/`
- Environment pattern: `.env` files used in backend; frontend follows Next.js convention with `.env.local`

### Integration Points
- Convex API will be the data layer — frontend queries `api.houses.*`, `api.tickets.*`, etc.
- Backend owner manages Convex schema; frontend just consumes it
- No REST API calls in Phase 1 — Convex client setup only
- Vercel project connects to the GitHub repo for CI/CD

</code_context>

<specifics>
## Specific Ideas

- HeroUI was specifically requested: `npx heroui-cli@latest init` — use it well and consistently
- Dense data dashboard aesthetic (think Linear, Vercel dashboard, Supabase)
- Judges will see this in dark mode — lean into that with the color scheme

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-project-scaffolding*
*Context gathered: 2026-02-28*
