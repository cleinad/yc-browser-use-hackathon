# Codebase Structure

**Analysis Date:** 2026-02-28

## Directory Layout

```
yc-browser-use-hackathon/
├── bu-agent/                    # Python backend: browser-use agent orchestration
│   ├── proquote/              # Core orchestration package
│   │   ├── __init__.py          # Package exports
│   │   ├── models.py            # Data models (dataclasses)
│   │   ├── orchestrator.py      # In-process async orchestrator
│   │   ├── process_orchestrator.py  # Process-isolated orchestrator
│   │   └── worker_subagent.py   # CLI worker for isolated agent execution
│   └── tests/                   # Test/demo scripts
│       └── run_weather_fanout.py  # Parallel weather agent demo
├── docs/                        # Project documentation
│   ├── overview.md              # Product overview and architecture diagram
│   └── implementation-plan.md   # Proposed backend implementation plan
├── .gitignore                   # Git ignore rules
├── MEGAPLAN.md                  # Full PRD with P0-P3 features, data model, team split
├── README.md                    # Setup instructions (Python venv only)
└── SPONSORS.MD                  # Sponsor information
```

## Directory Purposes

**`bu-agent/proquote/`:**
- Purpose: Core Python package for browser-use agent orchestration
- Contains: Dataclass models, two orchestrator implementations (in-process and process-isolated), worker CLI
- Key files: `models.py` (all data types), `orchestrator.py` (primary orchestrator), `process_orchestrator.py` (isolated variant)

**`bu-agent/tests/`:**
- Purpose: Demo and validation scripts
- Contains: Weather fanout test that exercises the orchestrator with real browser-use agents

**`docs/`:**
- Purpose: Product and technical documentation
- Contains: Product overview with architecture diagrams, proposed implementation plan with data contracts

## Key File Locations

**Entry Points:**
- `bu-agent/proquote/worker_subagent.py`: Worker process entry point (run via `python -m proquote.worker_subagent`)
- `bu-agent/tests/run_weather_fanout.py`: Demo/test entry point

**Configuration:**
- `.gitignore`: Git ignore rules (Python-focused)
- `.env` (not committed): Environment variables including `BROWSER_USE_API_KEY`

**Core Logic:**
- `bu-agent/proquote/models.py`: All data models (`SubAgentJob`, `SubAgentResult`, `StatusEvent`, `OrchestratorConfig`)
- `bu-agent/proquote/orchestrator.py`: `BrowserUseSubAgent` (adapter) + `SubAgentOrchestrator` (fan-out coordinator)
- `bu-agent/proquote/process_orchestrator.py`: `ProcessSubAgentOrchestrator` (spawns isolated worker processes)

**Documentation:**
- `MEGAPLAN.md`: Authoritative PRD -- defines all P0-P3 features, data model, routes, team responsibilities
- `docs/overview.md`: Product concept and architecture overview
- `docs/implementation-plan.md`: Proposed backend layout, data contracts, API endpoints, testing plan

## Naming Conventions

**Files:**
- Python: `snake_case.py` (e.g., `worker_subagent.py`, `process_orchestrator.py`)
- Documentation: `UPPERCASE.md` for top-level docs, `lowercase.md` for subdirectory docs

**Directories:**
- `snake_case` for Python packages (e.g., `proquote`)
- `lowercase` for other directories (e.g., `docs`, `tests`)

**Classes:**
- `PascalCase` (e.g., `SubAgentOrchestrator`, `BrowserUseSubAgent`, `ProcessSubAgentOrchestrator`)

**Variables/Functions:**
- `snake_case` (e.g., `run_jobs`, `status_handler`, `utc_now`)

## Where to Add New Code

**IMPORTANT: No frontend exists yet. It must be created from scratch.**

**New Frontend (Next.js app):**
- Create at project root level (not inside `bu-agent/`)
- Suggested structure based on MEGAPLAN.md routes:
  ```
  app/
  ├── layout.tsx              # Root layout with providers
  ├── page.tsx                # House dashboard (/)
  ├── house/
  │   └── [id]/
  │       └── page.tsx        # House detail (/house/[id])
  ├── ticket/
  │   └── [id]/
  │       └── page.tsx        # Ticket detail (/ticket/[id])
  ├── proof/
  │   └── [ticketId]/
  │       └── page.tsx        # Proof pack view (/proof/[ticketId])
  └── approve/
      └── [token]/
          └── page.tsx        # Approval gate (/approve/[token])
  components/                   # Shared UI components
  lib/                          # Utilities, API clients, types
  convex/                       # Convex schema and functions (if using Convex)
  ```
- Add `package.json`, `tsconfig.json`, `next.config.ts` at project root
- MEGAPLAN.md specifies Convex -- add `convex/` directory for schema/queries/mutations

**New Backend Feature:**
- Add to `bu-agent/proquote/` for orchestration logic
- Add API server (FastAPI proposed in `docs/implementation-plan.md`) likely at `bu-agent/api/server.py`
- Add retailer adapters at `bu-agent/retailers/` (proposed but not created)

**New Tests:**
- Backend tests: `bu-agent/tests/`
- Frontend tests: co-locate with components or in `__tests__/` directories

**Utilities:**
- Backend shared helpers: `bu-agent/proquote/` (extend existing package)
- Frontend shared helpers: `lib/` directory at project root

## Special Directories

**`bu-agent/`:**
- Purpose: All Python backend code for browser-use agent orchestration
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning framework documents
- Generated: By tooling
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code configuration, agents, commands, hooks
- Generated: By GSD tooling
- Committed: Yes

**`convex/` (planned, does not exist):**
- Purpose: Convex database schema, queries, mutations, actions
- Generated: Partially (Convex generates some files)
- Committed: Yes (schema and functions are committed)

## Frontend P0 Routes Reference

Based on MEGAPLAN.md, the P0 frontend must implement:

| Route | Purpose | Key Data |
|-------|---------|----------|
| `/` | House dashboard grid | `listHouses()` -> cards with KPIs |
| `/house/[id]` | House detail + timeline | `getHouseDetail()`, `getHouseEvents()` |
| `/ticket/[id]` | Ticket with BOM + swarm + quotes | BOM items, live agent status, quote table |
| `/proof/[ticketId]` | Proof pack (judge-friendly) | Screenshots, URLs, timestamps per vendor |

## Frontend Component Categories (Planned)

Based on MEGAPLAN.md P0 features, these component groups will be needed:

- **Dashboard**: House cards, KPI badges, grid layout
- **House Detail**: Tab navigation, timeline event list, ticket list
- **Problem Intake**: Natural language input form, triage card display
- **BOM/Fix Pack**: Item list with specs/confidence, clarifying question UI (max 2)
- **Swarm Panel**: Per-vendor progress bars, status chips, screenshot previews (live)
- **Quote Table**: Line-item breakdown, vendor comparison, bundle recommendation card
- **Proof Pack**: Vendor-item-screenshot-URL-timestamp grid, clean printable layout
- **RFQ Status**: "RFQ sent" badges, email thread links, contact proof screenshots
- **Shared**: Loading skeletons, error banners, status badges, layout shells

---

*Structure analysis: 2026-02-28*
