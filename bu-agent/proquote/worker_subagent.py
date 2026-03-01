from __future__ import annotations

import argparse
import asyncio
import json
import tempfile
from pathlib import Path
from typing import Any

from browser_use import Agent, BrowserProfile, ChatBrowserUse
from dotenv import load_dotenv

from .models import SubAgentResult, result_to_dict, utc_now


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run one browser-use subagent job in a dedicated process.")
    parser.add_argument("--job-file", type=Path, required=True, help="Path to job JSON file")
    parser.add_argument("--output-file", type=Path, required=True, help="Path to write result JSON file")
    parser.add_argument("--timeout-sec", type=int, required=True, help="Per-agent timeout in seconds")
    parser.add_argument("--max-steps", type=int, required=True, help="Max browser-use steps")
    parser.add_argument("--use-vision", action="store_true", help="Enable browser-use vision mode")
    parser.add_argument(
        "--show-browser",
        action="store_true",
        help="Run with visible browser window (default is headless)",
    )
    return parser.parse_args()


def load_job(job_file: Path) -> dict[str, Any]:
    payload = json.loads(job_file.read_text(encoding="utf-8"))
    required = ["job_id", "label", "task"]
    missing = [key for key in required if key not in payload]
    if missing:
        raise ValueError(f"Job file missing required keys: {missing}")
    metadata = payload.get("metadata")
    if metadata is None:
        payload["metadata"] = {}
    return payload


async def run_job(
    *,
    job: dict[str, Any],
    timeout_sec: int,
    max_steps: int,
    use_vision: bool,
    headless: bool,
) -> SubAgentResult:
    started_at = utc_now()
    errors: list[str] = []
    final_result: str | None = None
    success = False

    with tempfile.TemporaryDirectory(prefix=f"proquote-worker-{job['job_id']}-") as user_data_dir:
        llm = ChatBrowserUse()
        browser_profile = BrowserProfile(
            headless=headless,
            user_data_dir=user_data_dir,
            keep_alive=False,
        )
        agent = Agent(
            task=str(job["task"]),
            llm=llm,
            browser_profile=browser_profile,
            use_vision=use_vision,
        )

        try:
            history = await asyncio.wait_for(
                agent.run(max_steps=max_steps),
                timeout=timeout_sec,
            )
            final_result = history.final_result()
            errors.extend(error for error in history.errors() if error)
            success = bool(final_result and final_result.strip())
            if not success and history.is_done() and not history.has_errors():
                success = True
        except asyncio.TimeoutError:
            errors.append(f"Timed out after {timeout_sec} seconds")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{type(exc).__name__}: {exc}")
        finally:
            try:
                await agent.close()
            except Exception:  # noqa: BLE001
                pass

    finished_at = utc_now()
    return SubAgentResult(
        job_id=str(job["job_id"]),
        label=str(job["label"]),
        task=str(job["task"]),
        success=success,
        started_at=started_at,
        finished_at=finished_at,
        duration_seconds=(finished_at - started_at).total_seconds(),
        final_result=final_result,
        errors=errors,
        metadata=dict(job.get("metadata", {})),
    )


def write_result(output_file: Path, result: SubAgentResult) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(
        json.dumps(result_to_dict(result), ensure_ascii=True, indent=2),
        encoding="utf-8",
    )


def build_bootstrap_failure(
    *,
    job_id: str,
    label: str,
    task: str,
    metadata: dict[str, Any],
    error: str,
) -> SubAgentResult:
    started_at = utc_now()
    finished_at = utc_now()
    return SubAgentResult(
        job_id=job_id,
        label=label,
        task=task,
        success=False,
        started_at=started_at,
        finished_at=finished_at,
        duration_seconds=(finished_at - started_at).total_seconds(),
        final_result=None,
        errors=[error],
        metadata=metadata,
    )


def main() -> int:
    args = parse_args()
    project_root = Path(__file__).resolve().parents[1]
    load_dotenv(project_root / ".env")
    load_dotenv(project_root.parent / ".env.local")

    try:
        job = load_job(args.job_file)
    except Exception as exc:  # noqa: BLE001
        fallback = build_bootstrap_failure(
            job_id="unknown",
            label="unknown",
            task="unknown",
            metadata={},
            error=f"Failed to load job: {type(exc).__name__}: {exc}",
        )
        write_result(args.output_file, fallback)
        return 2

    try:
        result = asyncio.run(
            run_job(
                job=job,
                timeout_sec=args.timeout_sec,
                max_steps=args.max_steps,
                use_vision=args.use_vision,
                headless=not args.show_browser,
            )
        )
        write_result(args.output_file, result)
        return 0
    except Exception as exc:  # noqa: BLE001
        fallback = build_bootstrap_failure(
            job_id=str(job.get("job_id", "unknown")),
            label=str(job.get("label", "unknown")),
            task=str(job.get("task", "unknown")),
            metadata=dict(job.get("metadata", {})),
            error=f"Worker crashed: {type(exc).__name__}: {exc}",
        )
        write_result(args.output_file, fallback)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
