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
  - CI/CD pipeline: GitHub main branch auto-deploys to Vercel
  - Production URL with Convex connected (NEXT_PUBLIC_CONVEX_URL in Vercel env vars)
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

**vercel.json + .vercelignore committed, build verified locally, Vercel connected to GitHub with NEXT_PUBLIC_CONVEX_URL set for production CI/CD**

## Performance

- **Duration:** ~1 min automated (Task 1) + human Vercel dashboard setup
- **Started:** 2026-03-01T01:51:40Z
- **Completed:** 2026-03-01T01:52:16Z
- **Tasks:** 1 auto + 1 checkpoint (human-verify)
- **Files modified:** 2

## Accomplishments

- Created vercel.json with explicit Next.js framework config (no rootDirectory — set in dashboard)
- Created .vercelignore to exclude bu-agent/ Python backend and docs from Vercel bundles
- Verified production build locally: `npm run build` — "Compiled successfully", 4/4 static pages, no TypeScript errors
- Human verification checkpoint: Vercel project imported, NEXT_PUBLIC_CONVEX_URL added, production URL confirmed working

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

None during automated task. Human verification checkpoint required standard Vercel dashboard setup as planned.

## User Setup Required

**Vercel dashboard configuration required.** The human-verify checkpoint covers:
1. Import GitHub repo to Vercel (vercel.com/new → Import Git Repository → select repo → Root Directory = `/`)
2. Verify Framework Preset = Next.js
3. Add `NEXT_PUBLIC_CONVEX_URL` = `https://earnest-puffin-59.convex.cloud` in Project → Settings → Environment Variables (Production + Preview + Development)
4. Trigger deployment (Redeploy or `git push origin main`)
5. Verify production URL shows: dark background + "Connected. Houses in DB: 0" + styled indigo button

## Next Phase Readiness

- CI/CD pipeline established — every push to main auto-deploys during the hackathon
- Production URL available for judges to view live progress
- Convex connected in production via NEXT_PUBLIC_CONVEX_URL env var
- Phase 2 (Repair Intake) can proceed — pushes to main will auto-deploy

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
