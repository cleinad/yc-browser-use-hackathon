# Architecture

**Analysis Date:** 2026-02-28

## Pattern Overview

**Overall:** Greenfield project -- Python backend exists, frontend does NOT exist yet and must be built from scratch.

**Key Characteristics:**
- Backend-only codebase today: Python browser-use agent orchestrator in `bu-agent/partsource/`
- Frontend planned as Next.js app (per MEGAPLAN.md) but no code exists yet
- Product is "ProcureSwarm" / "PartSource": AI-powered parts procurement via browser automation agents
- MEGAPLAN.md specifies Convex as the database/backend-as-a-service layer (not yet implemented)
- The existing Python backend handles browser-use agent orchestration only -- it is NOT a web API server yet

## Current Backend (Exists)

**Agent Orchestration Layer:**
- Purpose: Spawn and manage browser-use sub-agents that search retailer websites in parallel
- Location: `bu-agent/partsource/`
- Contains: Orchestrator, process-isolated worker, data models, status event system
- Key files:
  - `bu-agent/partsource/models.py` -- Pydantic-free dataclasses: `OrchestratorConfig`, `SubAgentJob`, `SubAgentResult`, `StatusEvent`
  - `bu-agent/partsource/orchestrator.py` -- `SubAgentOrchestrator` runs jobs in-process with asyncio semaphore
  - `bu-agent/partsource/process_orchestrator.py` -- `ProcessSubAgentOrchestrator` spawns each agent as a separate Python process for isolation
  - `bu-agent/partsource/worker_subagent.py` -- CLI entry point for isolated worker processes
- Pattern: Fan-out/fan-in with semaphore-based concurrency control, retry logic, and status event callbacks

**No API server exists.** The `docs/implementation-plan.md` proposes FastAPI endpoints (`POST /quote`, `GET /quote/{id}`, SSE stream) but none are implemented.

**No database exists.** MEGAPLAN.md specifies Convex tables (Houses, Tickets, BomItems, Runs, Artifacts, Threads, Events) but no schema or client code exists.

## Frontend (Does NOT Exist -- Must Be Built)

**Planned Stack (from MEGAPLAN.md):**
- Framework: Next.js
- Database/Backend: Convex (real-time queries, mutations, actions)
- Routing: App Router with these routes:
  - `/` -- House dashboard (grid of house cards with KPIs)
  - `/house/[id]` -- House detail with tabs: History timeline, Open Tickets, Settings
  - `/ticket/[id]` -- Ticket detail with BOM, swarm panel, quote table, proof pack
  - `/proof/[ticketId]` -- Judge-friendly proof pack view
  - `/approve/[token]` -- Approval gate page (P1)

**Planned Data Flow (P0 features):**

1. **House Dashboard** (`/`): `listHouses()` query -> render grid of house cards with open ticket count, last activity, spend
2. **House Detail** (`/house/[id]`): `getHouseDetail(houseId)` + `getHouseEvents(houseId)` -> tabs with timeline + tickets
3. **Problem Intake** (form on house page): User enters natural language problem -> `POST /api/triage` -> LLM returns structured triage JSON -> stored as Ticket
4. **BOM Generation**: `generateBom(ticketId)` action -> LLM produces Fix Pack items -> optional 2 clarifying questions -> stored as BomItems
5. **Quote Swarm**: `runQuotes(ticketId)` -> spawns browser-use agents per vendor per BOM item -> streams status updates -> stores Runs + Artifacts
6. **Bundle Optimization**: Aggregates quotes -> computes cheapest-total vs fastest-delivery strategies -> displays comparison table
7. **Proof Pack**: Displays screenshots, URLs, timestamps, extracted fields per vendor run

**State Management:**
- Convex provides real-time reactivity (queries auto-update when data changes)
- No additional client-side state management library is specified
- Swarm progress should stream via Convex real-time subscriptions or SSE

## Key Abstractions (Existing Backend)

**SubAgentJob:**
- Purpose: Defines a single browser-use task to execute
- Location: `bu-agent/partsource/models.py`
- Fields: `job_id`, `label`, `task` (natural language instruction), `metadata`

**SubAgentResult:**
- Purpose: Captures outcome of a single agent run
- Location: `bu-agent/partsource/models.py`
- Fields: `success`, `final_result`, `errors`, `duration_seconds`, timestamps, metadata

**StatusEvent:**
- Purpose: Progress notification during orchestration
- Location: `bu-agent/partsource/models.py`
- Types: `orchestrator_started`, `subagent_started`, `subagent_retrying`, `subagent_completed`, `subagent_failed`, `orchestrator_completed`
- Pattern: Callback-based (`StatusHandler` type alias)

**OrchestratorConfig:**
- Purpose: Tuning knobs for agent execution
- Location: `bu-agent/partsource/models.py`
- Fields: `max_subagents` (parallelism cap), `per_agent_timeout_sec`, `max_steps`, `retries`, `use_vision`, `headless`

## Entry Points

**Worker Process:**
- Location: `bu-agent/partsource/worker_subagent.py`
- Triggers: Spawned by `ProcessSubAgentOrchestrator` as `python -m partsource.worker_subagent`
- Responsibilities: Load job from JSON file, run single browser-use agent, write result to JSON file

**Test Script:**
- Location: `bu-agent/tests/run_weather_fanout.py`
- Triggers: Manual CLI execution
- Responsibilities: Demo/validation of parallel agent orchestration (weather lookup across cities)

**Frontend (planned, not built):**
- Location: TBD (likely project root or `frontend/` directory)
- Entry: Next.js App Router (`app/layout.tsx`, `app/page.tsx`)

## Error Handling

**Strategy:** Defensive -- never block the pipeline on a single failure

**Patterns:**
- Broad `except Exception` catches with error accumulation in `SubAgentResult.errors`
- Retry logic: configurable `retries` count per job, continues to next attempt on failure
- Timeout enforcement: `asyncio.wait_for()` with configurable per-agent timeout
- Process isolation: `ProcessSubAgentOrchestrator` kills hung worker processes after timeout + 30s grace
- Partial results: orchestrator completes even if individual agents fail
- Bootstrap failures: worker writes a failure result JSON even if job loading or agent creation fails

## Cross-Cutting Concerns

**Logging:** `print()` statements in test script; `StatusEvent` callback system in orchestrator (no structured logging framework)
**Validation:** Manual field checks in `load_job()` worker; no schema validation framework (Zod planned for frontend per MEGAPLAN.md)
**Authentication:** None implemented. MEGAPLAN.md mentions approval tokens but no auth system exists.
**Environment:** `.env` file loaded via `python-dotenv` in worker and test script. `BROWSER_USE_API_KEY` is the critical env var.

## Ticket Status State Machine (Planned)

Per MEGAPLAN.md, tickets follow this flow:
```
DRAFT -> BOM_READY -> QUOTING -> QUOTED -> PENDING_APPROVAL -> APPROVED -> ORDERING/RFQ_SENT -> DONE
```

This is not implemented anywhere yet.

---

*Architecture analysis: 2026-02-28*
