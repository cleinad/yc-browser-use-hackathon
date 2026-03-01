---
phase: 01-project-scaffolding
plan: "02"
subsystem: infra
tags: [vercel, nextjs, deployment, ci-cd, convex]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 15 App Router with HeroUI + Convex — the app Vercel will build
provides:
  - vercel.json with framework=nextjs, installCommand, buildCommand, outputDirectory
  - .vercelignore excluding bu-agent/ Python backend from Vercel bundles
  - Verified production build (npm run build passes cleanly)
  - DEFERRED: Vercel dashboard import + NEXT_PUBLIC_CONVEX_URL env var setup (manual, to be done before Phase 2 pushes)
affects:
  - 02-repair-intake
  - 03-quote-engine
  - 04-swarm-panel
  - 05-proof-pack
  - 06-polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - vercel.json at repo root with no rootDirectory field (root dir configured in Vercel dashboard, not in config file)
    - .vercelignore excludes Python backend (bu-agent/) to keep Next.js builds fast
    - GitHub integration auto-deploy — push to main triggers Vercel build automatically

key-files:
  created:
    - vercel.json (Vercel project configuration — framework, install/build commands, output dir)
    - .vercelignore (excludes bu-agent/, docs/, Python files from Vercel bundle)
  modified: []

key-decisions:
  - "Do NOT add rootDirectory to vercel.json — set it in Vercel dashboard during project import to avoid config conflict"
  - "NEXT_PUBLIC_CONVEX_URL must be set in Vercel environment variables (Production + Preview + Development) for Convex to connect in production"

patterns-established:
  - "Vercel root directory = repo root (not bu-agent/) — Next.js app lives at the repo root, not in a subdirectory"
  - "GitHub push-to-main triggers Vercel auto-deploy — no manual deploy steps needed during hackathon"

requirements-completed: [SETUP-04]

# Metrics
duration: 1min (automated) + human Vercel setup
completed: 2026-02-28
---

# Phase 1 Plan 02: Vercel Deployment Configuration Summary

**vercel.json + .vercelignore committed, local build verified; Vercel dashboard setup deferred (manual step pending before Phase 2)**

## Performance

- **Duration:** ~1 min automated (Task 1); checkpoint skipped by user
- **Started:** 2026-03-01T01:51:40Z
- **Completed:** 2026-03-01T01:53:00Z
- **Tasks:** 1 auto + 1 checkpoint (skipped/deferred)
- **Files modified:** 2

## Accomplishments

- Created vercel.json with explicit Next.js framework config (no rootDirectory — set in dashboard)
- Created .vercelignore to exclude bu-agent/ Python backend and docs from Vercel bundles
- Verified production build locally: `npm run build` — "Compiled successfully", 4/4 static pages, no TypeScript errors
- Vercel dashboard setup (GitHub import + NEXT_PUBLIC_CONVEX_URL env var) deferred — user will complete manually

## Task Commits

Each task was committed atomically:

1. **Task 1: Create vercel.json and .vercelignore, verify production build locally** — `65929ee` (chore)

## Files Created/Modified

- `vercel.json` — Vercel project config: framework=nextjs, installCommand=npm install, buildCommand=npm run build, outputDirectory=.next
- `.vercelignore` — Excludes bu-agent/, docs/, MEGAPLAN.md, SPONSORS.MD, *.py, *.sh, requirements*.txt from Vercel deployment bundle

## Decisions Made

- **No `rootDirectory` in vercel.json**: The plan explicitly states "Do NOT add rootDirectory here — that is set in the Vercel dashboard during project import, not in vercel.json." This prevents conflicts with Vercel's project-level root directory setting.
- **NEXT_PUBLIC_CONVEX_URL in Vercel**: Must be set for Production, Preview, and Development environments in Vercel Settings → Environment Variables. Without this, production shows "Connecting to Convex..." instead of live data.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None during automated task. The human-verify checkpoint (Vercel dashboard setup) was skipped by the user — will be completed manually before or during Phase 2.

## User Setup Required

**Vercel dashboard setup is PENDING.** Complete these steps before pushing Phase 2 code:

1. Go to https://vercel.com/new → "Import Git Repository" → select `yc-browser-use-hackathon`
2. Set "Root Directory" to `/` (the repo root — CRITICAL, do not leave as auto-detected)
3. Verify "Framework Preset" = Next.js
4. Click "Deploy" (first deploy may fail without env var — that's OK)
5. Go to Project → Settings → Environment Variables → Add:
   - `NEXT_PUBLIC_CONVEX_URL` = `https://earnest-puffin-59.convex.cloud`
   - Set for: Production, Preview, and Development
6. Redeploy (or push a commit to main)
7. Verify production URL shows: dark background + "Connected. Houses in DB: 0" + styled indigo button
8. Confirm: Project Settings → Git → Production Branch = "main" (auto-deploy on push)

## Next Phase Readiness

- vercel.json and .vercelignore are committed — Vercel will pick up the correct config on import
- Local build passes cleanly — production build is known-good
- Phase 2 code can be written now; Vercel setup should be completed before the first Phase 2 push to main
- Once Vercel is connected, all subsequent pushes auto-deploy (no manual steps during the hackathon)

---
*Phase: 01-project-scaffolding*
*Completed: 2026-02-28*

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| vercel.json | FOUND |
| .vercelignore | FOUND |
| npm run build | PASSED (Compiled successfully) |
| commit 65929ee | FOUND |
