# Technology Stack

**Analysis Date:** 2026-02-28

## Languages

**Primary (Backend — exists):**
- Python 3.12 - Backend agent orchestrator (`bu-agent/partsource/`)

**Primary (Frontend — planned, not yet created):**
- TypeScript - Next.js frontend (per `MEGAPLAN.md` and `docs/overview.md`)

## Runtime

**Backend:**
- Python 3.12 (specified in `README.md`: `uv venv --python 3.12`)
- Package manager: `uv` (no `requirements.txt` or `pyproject.toml` committed — dependencies installed ad-hoc)
- Lockfile: **missing** — no `requirements.txt`, `pyproject.toml`, or `uv.lock` found

**Frontend (planned):**
- Node.js (version not yet determined)
- Next.js (version not yet determined)

## Frameworks

**Backend (exists):**
- `browser-use` SDK — Web agent framework for spawning browser-based sub-agents
  - Imports: `Agent`, `BrowserProfile`, `ChatBrowserUse` from `browser_use`
  - Used in: `bu-agent/partsource/orchestrator.py`, `bu-agent/partsource/worker_subagent.py`
- `python-dotenv` — Environment variable loading from `.env`
  - Used in: `bu-agent/partsource/worker_subagent.py`, `bu-agent/tests/run_weather_fanout.py`

**Frontend (planned, not yet scaffolded):**
- Next.js — React framework for UI routes
- Convex — Reactive backend-as-a-service (database + real-time queries)

**Backend API (planned, not yet built):**
- FastAPI — REST API with SSE streaming (per `docs/implementation-plan.md`)

## Key Dependencies

**Existing (Python backend):**
- `browser-use` — Core agent SDK; wraps Playwright browsers with LLM steering
- `python-dotenv` — Loads `BROWSER_USE_API_KEY` and other env vars from `.env`
- Standard library: `asyncio`, `dataclasses`, `json`, `argparse`, `tempfile`

**Planned (Frontend — from MEGAPLAN.md):**
- Next.js — App router with routes: `/`, `/house/[id]`, `/ticket/[id]`, `/proof/[ticketId]`, `/approve/[token]`
- Convex client — Real-time reactive queries and mutations
- Zod — Schema validation (mentioned for triage JSON validation)

**Planned (Backend additions — from MEGAPLAN.md):**
- Convex — TypeScript backend with live reactivity (database + actions)
- AgentMail SDK — Email inbox API for RFQ outreach
- Laminar — Tracing/observability (P2 stretch)
- LLM provider SDK — OpenAI/Anthropic/Google for triage and BOM generation

## Configuration

**Environment:**
- `.env` file expected at `bu-agent/.env` (existence not confirmed — forbidden to read)
- Required env var: `BROWSER_USE_API_KEY` (checked in `bu-agent/tests/run_weather_fanout.py` line 109)
- Additional env vars will be needed for: Convex deployment URL, LLM API keys, AgentMail API key

**Build:**
- No build configuration files exist yet (no `tsconfig.json`, `next.config.js`, `tailwind.config.*`)
- No `package.json` at project root or in any subdirectory (outside `.claude/`)

## Platform Requirements

**Development:**
- Python 3.12+ with `uv` package manager
- Browser automation requires Playwright browsers (installed via `browser-use`)
- Node.js + npm/pnpm needed once frontend is scaffolded

**Production (planned):**
- Vercel — Frontend deployment (sponsor, per `SPONSORS.MD`)
- Convex — Backend database and serverless functions
- Browser Use cloud — Remote browser agent execution

## Current State Summary

The codebase is in **early backend-only** state. The `bu-agent/partsource/` package contains a working orchestrator that can fan out browser-use sub-agents in parallel (tested with a weather demo). **No frontend code exists yet.** The MEGAPLAN.md specifies Next.js + Convex as the frontend/backend stack, with multiple sponsor integrations planned.

**Frontend scaffolding is the immediate priority** — nothing has been created yet for the Next.js app, Convex schema, or any UI components.

---

*Stack analysis: 2026-02-28*
