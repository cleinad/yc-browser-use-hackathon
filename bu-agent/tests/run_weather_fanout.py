from __future__ import annotations

import argparse
import asyncio
import json
import os
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from proquote.models import OrchestratorConfig, StatusEvent, SubAgentJob, result_to_dict
from proquote.orchestrator import SubAgentOrchestrator
from proquote.process_orchestrator import ProcessSubAgentOrchestrator

CITY_POOL = [
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Phoenix, AZ",
    "Philadelphia, PA",
    "San Antonio, TX",
    "San Diego, CA",
    "Dallas, TX",
    "San Jose, CA",
    "Austin, TX",
    "Jacksonville, FL",
    "San Francisco, CA",
    "Seattle, WA",
    "Denver, CO",
    "Boston, MA",
    "Miami, FL",
    "Atlanta, GA",
    "Minneapolis, MN",
    "Portland, OR",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run 5 parallel weather subagents with browser-use.")
    parser.add_argument(
        "--mode",
        choices=["process", "inprocess"],
        default="process",
        help="Subagent execution mode (default: process isolation)",
    )
    parser.add_argument("--agents", type=int, default=5, help="Number of subagents to run in parallel")
    parser.add_argument(
        "--show-browser",
        action="store_true",
        help="Show browser windows for each subagent (default is headless)",
    )
    parser.add_argument("--seed", type=int, default=None, help="Optional random seed for reproducible city picks")
    parser.add_argument("--timeout-sec", type=int, default=180, help="Per-agent timeout in seconds")
    parser.add_argument("--max-steps", type=int, default=35, help="Max browser-use steps per subagent")
    parser.add_argument("--retries", type=int, default=0, help="Retries per subagent after failure")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional output JSON path (default: weather-results-<timestamp>.json)",
    )
    return parser.parse_args()


def build_jobs(count: int, rng: random.Random) -> list[SubAgentJob]:
    if count < 1:
        raise ValueError("agents must be >= 1")
    if count > len(CITY_POOL):
        raise ValueError(f"agents must be <= {len(CITY_POOL)}")

    cities = rng.sample(CITY_POOL, count)
    jobs: list[SubAgentJob] = []
    for idx, city in enumerate(cities, start=1):
        task = (
            f"Find the current weather for {city}. "
            "Use one reliable weather source and include the source URL. "
            "Return JSON only with keys: city, temperature, condition, humidity, wind, source_url, observed_at."
        )
        jobs.append(
            SubAgentJob(
                job_id=f"weather-{idx}",
                label=city,
                task=task,
                metadata={"city": city},
            )
        )
    return jobs


def print_status(event: StatusEvent) -> None:
    stamp = event.timestamp.astimezone(timezone.utc).strftime("%H:%M:%S")
    job_fragment = f" [{event.job_label}]" if event.job_label else ""
    message_fragment = f" {event.message}" if event.message else ""
    print(f"[{stamp} UTC] {event.event_type}{job_fragment}{message_fragment}")


async def run() -> int:
    args = parse_args()
    load_dotenv(PROJECT_ROOT / ".env")
    api_key = os.getenv("BROWSER_USE_API_KEY")
    if not api_key:
        print("Missing BROWSER_USE_API_KEY in bu-agent/.env (or environment).")
        return 2

    rng = random.Random(args.seed)
    jobs = build_jobs(args.agents, rng)

    print("Selected cities:")
    for job in jobs:
        print(f"- {job.label}")
    print()

    config = OrchestratorConfig(
        max_subagents=args.agents,
        per_agent_timeout_sec=args.timeout_sec,
        max_steps=args.max_steps,
        retries=args.retries,
        use_vision=False,
        headless=not args.show_browser,
    )
    if args.mode == "process":
        orchestrator = ProcessSubAgentOrchestrator(config)
    else:
        orchestrator = SubAgentOrchestrator(config)

    results = await orchestrator.run_jobs(jobs, status_handler=print_status)

    output_path = args.output
    if output_path is None:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        output_path = PROJECT_ROOT / f"weather-results-{stamp}.json"

    serializable = [result_to_dict(result) for result in results]
    output_path.write_text(json.dumps(serializable, indent=2), encoding="utf-8")

    print("\nFinal results:")
    failures = 0
    for result in results:
        status = "PASS" if result.success else "FAIL"
        if not result.success:
            failures += 1
        print(f"[{status}] {result.label} ({result.duration_seconds:.1f}s)")
        if result.final_result:
            print(result.final_result)
        if result.errors:
            print("Errors:")
            for error in result.errors:
                print(f"- {error}")
        print("-" * 80)

    print(f"Saved JSON results to: {output_path}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
