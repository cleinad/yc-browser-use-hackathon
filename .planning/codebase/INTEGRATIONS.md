# External Integrations

**Analysis Date:** 2026-02-28

## Current State

Only one integration is currently implemented: Browser Use SDK. All other integrations listed below are **planned per MEGAPLAN.md and SPONSORS.MD** and must be built as part of the frontend and backend work.

## APIs & External Services

**Browser Automation (exists):**
- Browser Use — Framework for building reliable web agents
  - SDK/Client: `browser-use` Python package (`Agent`, `BrowserProfile`, `ChatBrowserUse`)
  - Auth: `BROWSER_USE_API_KEY` env var
  - Used in: `bu-agent/partsource/orchestrator.py`, `bu-agent/partsource/worker_subagent.py`
  - Purpose: Spawns headless browser agents to search vendor websites, extract prices, take screenshots

**Email Infrastructure (planned — P0.8):**
- AgentMail — Email inbox API for AI agents (hackathon sponsor)
  - SDK/Client: AgentMail API (not yet installed)
  - Auth: AgentMail API key (env var TBD)
  - Purpose: Send RFQ emails to vendors when checkout is not possible; receive vendor replies
  - Also used for: Approval email flow (P1.1)

**LLM Providers (planned — P0.3, P0.4):**
- OpenAI / Anthropic / Google DeepMind — All are hackathon sponsors
  - Purpose: Triage natural language problem tickets into structured JSON (P0.3)
  - Purpose: Generate BOM (Bill of Materials) from diagnosis (P0.4)
  - Purpose: Bundle optimization reasoning (P0.6)
  - Auth: Provider-specific API keys (env vars TBD)
  - Note: `browser-use` SDK already uses an LLM internally via `ChatBrowserUse`

**Observability (planned — P2.3, stretch):**
- Laminar — Tracing, evals, and observability for AI agents (hackathon sponsor)
  - Purpose: Wrap each vendor run in a trace with inputs, steps, and outputs
  - Auth: Laminar API key (env var TBD)

## Data Storage

**Database (planned):**
- Convex — TypeScript reactive backend (hackathon sponsor)
  - Connection: Convex deployment URL (env var TBD, typically `NEXT_PUBLIC_CONVEX_URL`)
  - Client: Convex React client for frontend, Convex Node SDK for server actions
  - Tables planned (from `MEGAPLAN.md`):
    - `Houses` — Properties being managed
    - `Tickets` — Maintenance issues with status state machine
    - `BomItems` — Bill of Materials line items per ticket
    - `Runs` — Individual vendor search runs per BOM item
    - `Artifacts` — Screenshots, proofs, PDFs per run
    - `Threads` — Email/phone RFQ threads
    - `Events` — Append-only audit log for timeline

**File Storage:**
- Convex file storage (planned) — For screenshots, proof artifacts, PDFs
- Local filesystem currently used by `bu-agent` for temp job files and results

**Caching:**
- None currently; Convex provides real-time reactivity which serves as live state

## Authentication & Identity

**Auth Provider:**
- None planned for MVP/hackathon
- Approval flow (P1.1) uses signed token links, not full auth
- Multi-user permissions explicitly listed as P3 (do not build)

## Monitoring & Observability

**Error Tracking:**
- None currently
- Laminar planned for P2.3 (stretch)

**Logs:**
- Python `print()` statements for status events in backend (`bu-agent/tests/run_weather_fanout.py` line 98-102)
- StatusEvent dataclass provides structured event logging (`bu-agent/partsource/models.py` lines 7-14)
- Event types: `orchestrator_started`, `subagent_started`, `subagent_retrying`, `subagent_completed`, `subagent_failed`, `orchestrator_completed`

## CI/CD & Deployment

**Hosting (planned):**
- Vercel — Frontend deployment (hackathon sponsor, starter kit provided)
- Convex — Backend functions deployment

**CI Pipeline:**
- None configured

## Environment Configuration

**Required env vars (current):**
- `BROWSER_USE_API_KEY` — Browser Use SDK authentication

**Required env vars (planned, once integrations are built):**
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL (public, frontend)
- `CONVEX_DEPLOY_KEY` — Convex deployment key (secret, CI only)
- LLM API key(s) — One or more of: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`
- `AGENTMAIL_API_KEY` — AgentMail email API
- `LAMINAR_API_KEY` — Laminar observability (stretch)

**Secrets location:**
- `.env` file at `bu-agent/.env` for Python backend
- `.env.local` (planned) at frontend project root for Next.js

## Webhooks & Callbacks

**Incoming (planned):**
- `POST /api/approve?token=...` — Approval callback from emailed links (P1.1)
- AgentMail webhook for incoming vendor reply emails (P0.8)

**Outgoing (planned):**
- RFQ emails via AgentMail to vendor procurement contacts (P0.8)
- Approval request emails via AgentMail (P1.1)

## Vendor Websites (Browser Automation Targets)

These are not API integrations but web scraping targets for browser-use agents:

**Target Retailers (from `docs/overview.md`):**
- Home Depot (homedepot.com / homedepot.ca)
- Lowe's (lowes.com / lowes.ca)
- Amazon (amazon.com / amazon.ca)

**Additional planned (from `MEGAPLAN.md`):**
- Ferguson, Grainger, and 2-3 other curated vendors
- Total target: 6-8 vendors with tested recipes
- Each vendor has modes: `checkout` (cart placement) or `rfq` (email outreach)

## Hackathon Sponsor Integration Summary

The following sponsors from `SPONSORS.MD` are planned for integration:

| Sponsor | Category | Integration Status | Priority |
|---------|----------|-------------------|----------|
| Browser Use | Agent Builder | **Implemented** | P0 |
| Convex | Database | Planned | P0 |
| Vercel | Deployment | Planned | P0 |
| AgentMail | Agent Email | Planned | P0.8 |
| OpenAI/Anthropic/Google | LLM | Planned | P0.3 |
| Laminar | Observability | Planned | P2.3 |

Not planned for integration: Dedalus Labs, An, VibeFlow, MongoDB, Cubic, Superset, Supermemory, HUD, Daytona, AWS Bedrock, Minimax.

---

*Integration audit: 2026-02-28*
