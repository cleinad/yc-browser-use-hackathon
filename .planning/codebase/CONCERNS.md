# Codebase Concerns

**Analysis Date:** 2026-02-28

## Tech Debt

**No frontend exists — entire UI layer is missing:**
- Issue: The MEGAPLAN.md and `docs/overview.md` describe a full Next.js frontend with dashboard, ticket intake, swarm panel, quote table, proof pack viewer, timeline, and approval flow. Zero frontend code exists in the repository.
- Why: Backend orchestrator was built first during initial hackathon sprint
- Impact: The product cannot be demoed, used, or judged without a UI. All P0 frontend deliverables (house dashboard, ticket creation, swarm progress panel, quote comparison table, proof pack view, RFQ status) are unbuilt.
- Fix approach: Scaffold a Next.js app at project root with routes per MEGAPLAN.md: `/`, `/house/[id]`, `/ticket/[id]`, `/proof/[ticketId]`, `/approve/[token]`. Integrate with Convex for real-time data and the Python backend API for orchestration.

**No API server — backend has no HTTP layer:**
- Issue: The planned API endpoints (`POST /api/triage`, `POST /api/bom`, `POST /api/runQuotes`, `GET /quote/{id}/events` SSE) do not exist. Only the raw Python orchestrator library and a CLI test script exist.
- Files: `bu-agent/partsource/orchestrator.py`, `bu-agent/partsource/process_orchestrator.py`
- Why: Initial implementation focused on proving the browser-use orchestration pattern
- Impact: Frontend cannot communicate with the backend. No REST/SSE endpoints for the UI to call.
- Fix approach: Add a FastAPI server at `bu-agent/api/server.py` per the layout in `docs/implementation-plan.md`. Wire endpoints to orchestrator. Add SSE streaming for live progress updates.

**No data persistence layer:**
- Issue: MEGAPLAN.md specifies Convex tables (Houses, Tickets, BomItems, Runs, Artifacts, Threads, Events) but no database schema, ORM, or Convex project exists anywhere in the codebase.
- Why: Backend prototype stores results as JSON files on disk only (`bu-agent/tests/run_weather_fanout.py` writes `weather-results-*.json`)
- Impact: No persistent state for houses, tickets, quotes, or audit trail. Cannot support multi-user or multi-session workflows.
- Fix approach: Initialize a Convex project, define schema matching MEGAPLAN.md data model, add queries/mutations for all CRUD operations.

**Proposed project layout not implemented:**
- Issue: `docs/implementation-plan.md` specifies a structured layout (`bu-agent/api/`, `bu-agent/orchestrator/`, `bu-agent/retailers/`, `bu-agent/models/`) but the actual code uses a flat `bu-agent/partsource/` package with only 4 files.
- Files: `bu-agent/partsource/__init__.py`, `bu-agent/partsource/models.py`, `bu-agent/partsource/orchestrator.py`, `bu-agent/partsource/process_orchestrator.py`, `bu-agent/partsource/worker_subagent.py`
- Why: Rapid prototyping diverged from the planned architecture
- Impact: Missing key modules: parser (NL to structured parts), planner (retailer selection), aggregator (result normalization), optimizer (purchase plan ranking). These are all documented in `docs/implementation-plan.md` but not implemented.
- Fix approach: Either refactor `partsource/` to match the planned layout, or extend it with the missing modules (parser, planner, aggregator, optimizer) while keeping the working orchestration code.

**No dependency manifest:**
- Issue: No `pyproject.toml`, `requirements.txt`, or `setup.py` exists for the Python backend. Dependencies (`browser-use`, `python-dotenv`) are imported but not declared.
- Files: `bu-agent/partsource/orchestrator.py` (imports `browser_use`), `bu-agent/partsource/worker_subagent.py` (imports `dotenv`)
- Why: Early hackathon setup, dependencies installed manually
- Impact: Cannot reliably reproduce the environment. New contributors cannot install dependencies without reading source imports.
- Fix approach: Add `bu-agent/pyproject.toml` with all dependencies pinned: `browser-use`, `python-dotenv`, plus dev dependencies for testing.

## Known Bugs

**Test script is domain-unrelated (weather, not parts):**
- Symptoms: The only runnable test (`bu-agent/tests/run_weather_fanout.py`) searches for weather data across cities rather than testing part sourcing from retailers
- Trigger: Running any test
- Workaround: The test does validate the orchestrator concurrency pattern, but provides no signal about actual product functionality
- Root cause: Test was written as a proof-of-concept for the orchestration layer, not for the product domain

**BrowserUseSubAgent success detection is fragile:**
- Symptoms: A job may be marked `success=True` even when the agent did not extract useful data
- Trigger: Agent completes without errors but returns empty or irrelevant content
- Files: `bu-agent/partsource/orchestrator.py` (lines 50-53), `bu-agent/partsource/worker_subagent.py` (lines 77-79)
- Workaround: None currently
- Root cause: Success is determined by `bool(final_result and final_result.strip())` OR `history.is_done() and not history.has_errors()`. Neither checks whether the result contains valid structured data (price, availability, URL).

## Security Considerations

**Environment file loading uses hardcoded relative path:**
- Risk: `worker_subagent.py` loads `.env` from `Path(__file__).resolve().parents[1]` which resolves to `bu-agent/.env`. If the worker is invoked from a different working directory or symlinked, it could load the wrong env file or fail silently.
- Files: `bu-agent/partsource/worker_subagent.py` (line 140)
- Current mitigation: `.gitignore` excludes `.env` and `.env.*` files
- Recommendations: Validate that required env vars (e.g., `BROWSER_USE_API_KEY`) are present after loading; fail fast with a clear error if missing.

**No input validation or sanitization on agent tasks:**
- Risk: User-provided text is passed directly as `job.task` to browser-use agents without sanitization. A malicious input could craft prompt injection attacks against the LLM agent.
- Files: `bu-agent/partsource/orchestrator.py` (line 39, `task=job.task`), `bu-agent/partsource/worker_subagent.py` (line 64, `task=str(job["task"])`)
- Current mitigation: None
- Recommendations: Add input validation and length limits in the future API layer. Sanitize or template user input before passing to browser-use agents.

**No authentication or authorization:**
- Risk: The planned API endpoints have no auth mechanism. Anyone with network access could trigger expensive browser-use agent runs (each consuming LLM API credits).
- Current mitigation: No API server exists yet
- Recommendations: Add API key authentication at minimum when building the FastAPI server. Consider rate limiting per-user.

## Performance Bottlenecks

**Browser-use agent startup overhead:**
- Problem: Each sub-agent spawns a full Chromium browser instance. In process-isolation mode (`ProcessSubAgentOrchestrator`), each also spawns a new Python process.
- Files: `bu-agent/partsource/process_orchestrator.py` (line 186, `asyncio.create_subprocess_exec`), `bu-agent/partsource/orchestrator.py` (line 38-43, `Agent` creation)
- Measurement: Default timeout is 180 seconds per agent. With 5+ parallel agents, resource consumption is substantial.
- Cause: Each agent needs its own browser profile, temp directory, and LLM client instance
- Improvement path: Consider browser pool reuse for sequential tasks on the same vendor. For the hackathon, keep concurrency low (`max_subagents=3-4`) and optimize task prompts to reduce step count.

**No result caching or deduplication:**
- Problem: Identical searches across sessions re-run full browser automation every time
- Files: `bu-agent/partsource/orchestrator.py` (no caching logic exists)
- Cause: No persistence layer to store and retrieve previous results
- Improvement path: Add a quote cache keyed by (part_spec, vendor, date) once the database layer exists. Return cached results for identical queries within a configurable TTL.

## Fragile Areas

**Orchestrator-to-worker contract (process isolation mode):**
- Files: `bu-agent/partsource/process_orchestrator.py` (lines 155-166, job serialization), `bu-agent/partsource/worker_subagent.py` (lines 31-40, job deserialization)
- Why fragile: The contract between orchestrator and worker is implicit JSON with no schema validation. The orchestrator writes `{"job_id", "label", "task", "metadata"}` to a temp file; the worker reads and validates manually. Any field addition requires synchronized changes in both files.
- Common failures: Adding a new field to `SubAgentJob` without updating `_parse_worker_result` or `load_job` silently drops the field
- Safe modification: Add a shared Pydantic model or use `dataclasses.asdict()` / `dacite` for round-trip serialization
- Test coverage: No unit tests exist for serialization/deserialization

**Single test file with no test framework:**
- Files: `bu-agent/tests/run_weather_fanout.py`
- Why fragile: This is a manual integration script, not an automated test. It requires a live `BROWSER_USE_API_KEY` and real browser instances to run. No assertions, no pytest, no CI.
- Common failures: Any code change could break orchestration without detection
- Safe modification: Cannot safely modify orchestrator code without manual re-testing
- Test coverage: Zero automated tests

## Scaling Limits

**Browser-use API credits:**
- Current capacity: Limited by `BROWSER_USE_API_KEY` quota
- Limit: Each agent run consumes API credits. A single ticket with 5 BOM items across 6 vendors = 30 agent runs
- Symptoms at limit: API rate limiting or credit exhaustion causes all runs to fail
- Scaling path: Implement result caching, reduce redundant searches, add fallback to cached/stale data when API is unavailable

**Concurrent browser instances:**
- Current capacity: Default `max_subagents=5` means 5 simultaneous Chromium instances
- Limit: Each Chromium instance uses 200-500MB RAM. 5 instances = 1-2.5GB RAM minimum
- Symptoms at limit: OOM kills, browser crashes, system slowdown
- Scaling path: Use process isolation mode (already implemented) and tune `max_subagents` based on available RAM. For production, run on cloud instances with adequate memory.

## Dependencies at Risk

**browser-use SDK:**
- Risk: Core dependency with a rapidly evolving API. The hackathon is built on `browser_use.Agent`, `browser_use.BrowserProfile`, and `browser_use.ChatBrowserUse`. Breaking changes in browser-use releases could require significant refactoring.
- Impact: All agent orchestration breaks if the SDK API changes
- Migration plan: Pin the exact version in `pyproject.toml` once created. Abstract browser-use behind an adapter interface to allow swapping.

**No package.json for frontend:**
- Risk: No frontend dependencies are declared. The planned Next.js + Convex + Tailwind stack has zero scaffolding.
- Impact: Frontend work cannot begin without first initializing the project
- Migration plan: Run `npx create-next-app` and add Convex SDK, then build from the MEGAPLAN.md spec

## Missing Critical Features

**Entire frontend application:**
- Problem: No UI exists. The MEGAPLAN.md describes 8 major frontend features (P0.1 through P0.8) plus P1 features. None are built.
- Current workaround: Backend can only be tested via CLI script (`bu-agent/tests/run_weather_fanout.py`)
- Blocks: Cannot demo the product, cannot present to hackathon judges, cannot test user flows
- Implementation complexity: High — requires Next.js app scaffolding, Convex integration, 5+ page routes, real-time updates, and responsive design

**Natural language parser (NL to structured parts list):**
- Problem: The `docs/implementation-plan.md` describes a parser module that converts "I need a 1/2 inch brass ball valve" into structured `PartSpec` objects. This does not exist.
- Current workaround: Tasks are manually written as plain text strings in test scripts
- Blocks: Cannot accept user input and generate structured BOM items
- Implementation complexity: Medium — LLM-based with Zod/Pydantic validation

**Purchase optimizer:**
- Problem: The `docs/implementation-plan.md` describes a combinatorial optimizer that finds optimal bundles across vendors (cheapest total, fastest delivery, single-store convenience). This does not exist.
- Current workaround: None — raw results are returned without optimization
- Blocks: Cannot present ranked purchase plans, which is the core product value proposition
- Implementation complexity: Medium — brute-force for small carts, greedy heuristic for larger ones

**Vendor-specific retailer adapters:**
- Problem: No retailer-specific adapters exist (Home Depot, Lowe's, Amazon, Ferguson). The current orchestrator uses generic browser-use tasks with no vendor-specific search/extraction logic.
- Current workaround: Generic task prompts that may not handle each vendor's UX correctly
- Blocks: Cannot reliably extract prices, availability, and delivery info from specific vendor sites
- Implementation complexity: Medium per vendor — requires testing and tuning browser-use recipes per site

**Real-time progress streaming (SSE):**
- Problem: The `StatusEvent` system exists in the orchestrator but has no HTTP transport. The planned SSE endpoint (`GET /quote/{id}/events`) does not exist.
- Files: `bu-agent/partsource/models.py` (StatusEvent dataclass), `bu-agent/partsource/orchestrator.py` (status_handler callback)
- Current workaround: Status events print to stdout in the test script
- Blocks: Frontend cannot show live swarm progress panel
- Implementation complexity: Low — wire existing `status_handler` callback to FastAPI SSE endpoint

**Proof Pack generation and storage:**
- Problem: No screenshot capture, artifact storage, or proof rendering exists. MEGAPLAN.md describes this as a key judging differentiator.
- Blocks: Cannot show verifiable evidence of quotes to users or judges
- Implementation complexity: Medium — requires screenshot capture during agent runs, storage (Convex file storage or S3), and a proof viewer page

**Sponsor product integrations:**
- Problem: SPONSORS.MD lists sponsor tools (Convex, AgentMail, Laminar, Daytona, Supermemory, HUD) that should be integrated for hackathon scoring. None are integrated.
- Blocks: Missing points for using sponsor products in the hackathon evaluation
- Implementation complexity: Varies — Convex (database, high priority), AgentMail (RFQ emails, medium), Laminar (tracing, low), others optional

## Test Coverage Gaps

**No automated tests of any kind:**
- What's not tested: Everything — orchestrator logic, model serialization, worker process communication, error handling, retry logic
- Files: `bu-agent/partsource/orchestrator.py`, `bu-agent/partsource/process_orchestrator.py`, `bu-agent/partsource/worker_subagent.py`, `bu-agent/partsource/models.py`
- Risk: Any code change could introduce regressions without detection. The orchestrator's retry logic, timeout handling, and error propagation are untested.
- Priority: High
- Difficulty to test: Low for unit tests (models, serialization, optimizer logic). Medium for integration tests (requires mocking browser-use Agent). The existing `StatusHandler` callback pattern makes orchestrator testing straightforward with mock handlers.

**No test for partial failure scenarios:**
- What's not tested: What happens when 2 of 5 agents fail, when all agents timeout, when the worker process crashes
- Files: `bu-agent/partsource/orchestrator.py` (retry logic lines 136-195), `bu-agent/partsource/process_orchestrator.py` (process failure handling lines 139-300)
- Risk: Partial failures could silently corrupt results or hang indefinitely
- Priority: High
- Difficulty to test: Medium — requires mocking browser-use to simulate failures

---

*Concerns audit: 2026-02-28*
*Update as issues are fixed or new ones discovered*
