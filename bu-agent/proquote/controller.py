"""Main orchestrator: wires parser -> job_builder -> sub-agents -> optimizer."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from .job_builder import DEFAULT_RETAILERS, build_jobs
from .models import OrchestratorConfig, StatusEvent
from .optimizer import optimize
from .parser import parse_request
from .process_orchestrator import ProcessSubAgentOrchestrator
from .query_optimizer import optimize_queries
from .schemas import PurchasePlan, UserRequest

StatusHandler = Callable[[StatusEvent], Awaitable[None] | None]


async def run(
    user_text: str,
    *,
    retailers: list[str] | None = None,
    config: OrchestratorConfig | None = None,
    status_handler: StatusHandler | None = None,
    log: Callable[[str], None] | None = None,
) -> PurchasePlan:
    """End-to-end orchestration: user text in, purchase plan out.

    Args:
        user_text: Natural language request describing parts needed.
        retailers: List of retailer domains to search. Defaults to Home Depot.
        config: Orchestrator configuration (concurrency, timeouts, etc.).
        status_handler: Callback for sub-agent status events.
        log: Callback for human-readable progress messages.
    """
    _log = log or (lambda _: None)
    retailers = retailers or DEFAULT_RETAILERS

    # Step 1: Parse
    _log("Parsing your request...")
    request = await parse_request(user_text)
    _log(f"Found {len(request.parts)} part(s):")
    for i, p in enumerate(request.parts, 1):
        _log(f"  {i}. {p.name} (qty {p.qty})")
    if request.location:
        _log(f"  Location: {request.location}")
    if request.deadline:
        _log(f"  Deadline: {request.deadline}")

    # Step 1.5: Optimize queries per retailer
    _log("\nOptimizing search queries per retailer...")
    optimized = await optimize_queries(request.parts, retailers)
    if optimized:
        for retailer, part_map in optimized.items():
            for part_name, rq in part_map.items():
                hint = f" [{rq.category_hint}]" if rq.category_hint else ""
                _log(f"  {retailer} / {part_name}: {rq.query}{hint}")
    else:
        _log("  (using generic queries — optimizer returned no results)")

    # Step 2: Build jobs
    _log(f"\nBuilding search jobs for {len(retailers)} retailer(s)...")
    jobs = build_jobs(
        request.parts,
        retailers=retailers,
        location=request.location,
        optimized_queries=optimized,
    )
    _log(f"Generated {len(jobs)} search job(s)")

    # Step 3: Dispatch
    _log("\nLaunching sub-agents...")
    orchestrator = ProcessSubAgentOrchestrator(config=config)
    results = await orchestrator.run_jobs(jobs, status_handler=status_handler)

    succeeded = sum(1 for r in results if r.success)
    failed = len(results) - succeeded
    _log(f"\nSearch complete: {succeeded} succeeded, {failed} failed")

    # Step 4: Optimize
    _log("\nOptimizing purchase plan...")
    plan = await optimize(
        results,
        location=request.location,
        deadline=request.deadline,
    )
    _log("Done!")
    return plan
