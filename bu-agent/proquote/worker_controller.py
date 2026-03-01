"""Orchestrator for the worker-finder flow."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from .models import OrchestratorConfig, StatusEvent
from .process_orchestrator import ProcessSubAgentOrchestrator
from .trade_classifier import classify_trade
from .worker_job_builder import build_worker_jobs
from .llm_client import extract_json
from .worker_schemas import WorkerResult, WorkerSearchResult

StatusHandler = Callable[[StatusEvent], Awaitable[None] | None]


async def run_worker_search(
    user_text: str,
    *,
    config: OrchestratorConfig | None = None,
    status_handler: StatusHandler | None = None,
    log: Callable[[str], None] | None = None,
) -> WorkerSearchResult:
    """End-to-end worker search: user text in, worker results out."""
    _log = log or (lambda _: None)

    # Step 1: Classify
    _log("Classifying your request...")
    classified = await classify_trade(user_text)
    _log(f"Trade: {classified.trade}")
    _log(f"Search query: {classified.search_query}")

    # Step 2: Build jobs
    _log("\nBuilding Google Maps search job...")
    jobs = build_worker_jobs(classified)

    # Step 3: Dispatch
    _log("\nLaunching browser agent to search Google Maps...")
    orchestrator = ProcessSubAgentOrchestrator(config=config)
    results = await orchestrator.run_jobs(jobs, status_handler=status_handler)

    succeeded = sum(1 for r in results if r.success)
    failed = len(results) - succeeded
    _log(f"\nSearch complete: {succeeded} succeeded, {failed} failed")

    # Step 4: Parse results
    _log("\nParsing worker results...")
    workers: list[WorkerResult] = []
    for r in results:
        if r.success and r.final_result:
            try:
                raw = extract_json(r.final_result)
                entries = raw if isinstance(raw, list) else [raw]
                for entry in entries:
                    workers.append(
                        WorkerResult(
                            name=entry.get("name", "Unknown"),
                            phone=entry.get("phone"),
                            address=entry.get("address"),
                            rating=entry.get("rating"),
                            trade_category=classified.trade,
                        )
                    )
            except (ValueError, KeyError) as exc:
                _log(f"Warning: could not parse result from {r.label}: {exc}")

    _log(f"Found {len(workers)} worker(s)")
    return WorkerSearchResult(
        workers=workers,
        trade=classified.trade,
        notes=None,
    )
