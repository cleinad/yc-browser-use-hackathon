"""Interactive CLI for PartSource — run the full orchestration flow."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load environment before importing anything that needs API keys
load_dotenv(Path(__file__).parent / ".env")

from partsource.controller import run as run_orchestrator
from partsource.models import OrchestratorConfig, StatusEvent
from partsource.schemas import PurchasePlan


def print_status(event: StatusEvent) -> None:
    """Print sub-agent status events to stderr."""
    prefix = {
        "orchestrator_started": "[ORCH]",
        "orchestrator_completed": "[ORCH]",
        "subagent_started": "  [>>]",
        "subagent_completed": "  [OK]",
        "subagent_failed": "  [!!]",
        "subagent_retrying": "  [~~]",
    }.get(event.event_type, "  [--]")

    label = f" {event.job_label}" if event.job_label else ""
    attempt = f" (attempt {event.attempt})" if event.attempt else ""
    msg = f" — {event.message}" if event.message else ""
    print(f"{prefix}{label}{attempt}{msg}", file=sys.stderr)


def print_plan(plan: PurchasePlan) -> None:
    """Pretty-print the purchase plan."""
    print("\n" + "=" * 60)
    print("  PURCHASE PLAN")
    print("=" * 60)

    if not plan.options:
        print("\nNo purchase options available.")
        if plan.notes:
            print(f"\nNotes: {plan.notes}")
        return

    for opt in plan.options:
        print(f"\n--- Option {opt.rank}: {opt.summary} ---")
        for item in opt.line_items:
            price_str = f"${item.price:.2f}" if item.price is not None else "N/A"
            print(f"  - {item.part_name}")
            print(f"    Product: {item.product_name}")
            print(f"    Price:   {price_str}  |  {item.retailer or 'unknown'}")
            if item.availability:
                print(f"    Avail:   {item.availability}")
            if item.delivery_estimate:
                print(f"    Deliver: {item.delivery_estimate}")
            if item.product_url:
                print(f"    URL:     {item.product_url}")

        if opt.estimated_total is not None:
            print(f"\n  Total: ${opt.estimated_total:.2f}")
        if opt.delivery_summary:
            print(f"  Delivery: {opt.delivery_summary}")
        if opt.tradeoffs:
            print(f"  Tradeoffs: {opt.tradeoffs}")

    if plan.notes:
        print(f"\nNotes: {plan.notes}")
    print()


async def handle_request(user_text: str) -> None:
    """Run the full orchestrator flow for a single request."""
    config = OrchestratorConfig(
        max_subagents=5,
        per_agent_timeout_sec=180,
        max_steps=40,
        retries=1,
        headless=False,
    )

    plan = await run_orchestrator(
        user_text,
        config=config,
        status_handler=print_status,
        log=lambda msg: print(msg, file=sys.stderr),
    )
    print_plan(plan)


async def repl() -> None:
    """Interactive REPL loop."""
    print("PartSource — Intelligent Parts Procurement", file=sys.stderr)
    print('Type a request (or "quit" to exit):\n', file=sys.stderr)

    while True:
        try:
            user_text = input(">> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!", file=sys.stderr)
            break

        if not user_text:
            continue
        if user_text.lower() in ("quit", "exit", "q"):
            print("Bye!", file=sys.stderr)
            break

        try:
            await handle_request(user_text)
        except KeyboardInterrupt:
            print("\nRequest cancelled.", file=sys.stderr)
        except Exception as exc:
            print(f"\nError: {exc}", file=sys.stderr)


def main() -> None:
    if len(sys.argv) > 1:
        # One-shot mode: pass request as CLI argument
        user_text = " ".join(sys.argv[1:])
        asyncio.run(handle_request(user_text))
    else:
        # Interactive REPL mode
        asyncio.run(repl())


if __name__ == "__main__":
    main()
