from __future__ import annotations

import asyncio
import json
import re
import sys
import tempfile
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import replace
from datetime import datetime
from pathlib import Path

from .models import OrchestratorConfig, StatusEvent, SubAgentJob, SubAgentResult, utc_now

StatusHandler = Callable[[StatusEvent], Awaitable[None] | None]


class ProcessSubAgentOrchestrator:
    """Runs each subagent in a dedicated Python process for stronger isolation."""

    def __init__(
        self,
        config: OrchestratorConfig | None = None,
        *,
        python_executable: str | None = None,
        worker_module: str = "proquote.worker_subagent",
        worker_cwd: Path | None = None,
    ) -> None:
        self._config = config or OrchestratorConfig()
        self._python_executable = python_executable or sys.executable
        self._worker_module = worker_module
        self._worker_cwd = worker_cwd or Path(__file__).resolve().parents[1]

    async def run_jobs(
        self,
        jobs: Sequence[SubAgentJob],
        *,
        status_handler: StatusHandler | None = None,
    ) -> list[SubAgentResult]:
        if not jobs:
            return []

        await self._emit(
            status_handler,
            StatusEvent(
                event_type="orchestrator_started",
                timestamp=utc_now(),
                message=(
                    f"Starting {len(jobs)} jobs with max_subagents={self._config.max_subagents} "
                    "(process isolation enabled)"
                ),
            ),
        )

        semaphore = asyncio.Semaphore(max(1, self._config.max_subagents))
        tasks: list[asyncio.Task[SubAgentResult]] = []
        for job in jobs:
            tasks.append(asyncio.create_task(self._run_single_job(job, semaphore, status_handler)))

        results = await asyncio.gather(*tasks)

        await self._emit(
            status_handler,
            StatusEvent(
                event_type="orchestrator_completed",
                timestamp=utc_now(),
                message=f"Completed {len(results)} jobs",
            ),
        )
        return results

    async def _run_single_job(
        self,
        job: SubAgentJob,
        semaphore: asyncio.Semaphore,
        status_handler: StatusHandler | None,
    ) -> SubAgentResult:
        max_attempts = max(1, self._config.retries + 1)
        last_result: SubAgentResult | None = None

        for attempt in range(1, max_attempts + 1):
            if attempt > 1:
                await self._emit(
                    status_handler,
                    StatusEvent(
                        event_type="subagent_retrying",
                        timestamp=utc_now(),
                        job_id=job.job_id,
                        job_label=job.label,
                        attempt=attempt,
                        message="Retrying after previous failure",
                    ),
                )

            await self._emit(
                status_handler,
                StatusEvent(
                    event_type="subagent_started",
                    timestamp=utc_now(),
                    job_id=job.job_id,
                    job_label=job.label,
                    attempt=attempt,
                    message=f"Attempt {attempt}/{max_attempts} (new process)",
                ),
            )

            async with semaphore:
                result = await self._run_process_attempt(job)
            last_result = replace(result)

            if result.success:
                await self._emit(
                    status_handler,
                    StatusEvent(
                        event_type="subagent_completed",
                        timestamp=utc_now(),
                        job_id=result.job_id,
                        job_label=result.label,
                        attempt=attempt,
                        message=f"Finished in {result.duration_seconds:.1f}s",
                    ),
                )
                return result

        assert last_result is not None
        await self._emit(
            status_handler,
            StatusEvent(
                event_type="subagent_failed",
                timestamp=utc_now(),
                job_id=last_result.job_id,
                job_label=last_result.label,
                attempt=max_attempts,
                message="All retries exhausted",
            ),
        )
        return last_result

    async def _run_process_attempt(self, job: SubAgentJob) -> SubAgentResult:
        started_at = utc_now()
        safe_job_id = self._sanitize_temp_prefix_fragment(job.job_id)
        try:
            tmp_ctx = tempfile.TemporaryDirectory(prefix=f"proquote-{safe_job_id}-")
        except Exception as exc:  # noqa: BLE001
            return self._build_failure_result(
                job=job,
                started_at=started_at,
                errors=[f"Failed to create temp workspace for job_id={job.job_id!r}: {type(exc).__name__}: {exc}"],
            )

        with tmp_ctx as tmp_dir:
            tmp = Path(tmp_dir)
            job_file = tmp / "job.json"
            output_file = tmp / "result.json"
            job_file.write_text(
                json.dumps(
                    {
                        "job_id": job.job_id,
                        "label": job.label,
                        "task": job.task,
                        "metadata": job.metadata,
                    },
                    ensure_ascii=True,
                ),
                encoding="utf-8",
            )

            cmd = [
                self._python_executable,
                "-m",
                self._worker_module,
                "--job-file",
                str(job_file),
                "--output-file",
                str(output_file),
                "--timeout-sec",
                str(self._config.per_agent_timeout_sec),
                "--max-steps",
                str(self._config.max_steps),
            ]
            if self._config.use_vision:
                cmd.append("--use-vision")
            if not self._config.headless:
                cmd.append("--show-browser")
            if self._config.use_cloud:
                cmd.append("--use-cloud")
                cmd.extend(["--cloud-proxy-country", self._config.cloud_proxy_country_code])

            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(self._worker_cwd),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self._config.per_agent_timeout_sec + 30,
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return self._build_failure_result(
                    job=job,
                    started_at=started_at,
                    errors=[f"Worker process exceeded timeout of {self._config.per_agent_timeout_sec + 30} seconds"],
                )

            if output_file.exists():
                try:
                    payload = json.loads(output_file.read_text(encoding="utf-8"))
                    return self._parse_worker_result(payload)
                except Exception as exc:  # noqa: BLE001
                    parse_error = f"Failed to parse worker output: {type(exc).__name__}: {exc}"
                    return self._build_failure_result(
                        job=job,
                        started_at=started_at,
                        errors=self._merge_errors(
                            parse_error=parse_error,
                            return_code=process.returncode,
                            stdout_bytes=stdout_bytes,
                            stderr_bytes=stderr_bytes,
                        ),
                    )

            return self._build_failure_result(
                job=job,
                started_at=started_at,
                errors=self._merge_errors(
                    parse_error="Worker did not produce a result file",
                    return_code=process.returncode,
                    stdout_bytes=stdout_bytes,
                    stderr_bytes=stderr_bytes,
                ),
            )

    def _sanitize_temp_prefix_fragment(self, value: str) -> str:
        safe = re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip("._-")
        if not safe:
            safe = "job"
        return safe[:48]

    def _parse_worker_result(self, payload: dict) -> SubAgentResult:
        return SubAgentResult(
            job_id=str(payload.get("job_id", "")),
            label=str(payload.get("label", "")),
            task=str(payload.get("task", "")),
            success=bool(payload.get("success", False)),
            started_at=datetime.fromisoformat(payload["started_at"]),
            finished_at=datetime.fromisoformat(payload["finished_at"]),
            duration_seconds=float(payload.get("duration_seconds", 0.0)),
            final_result=payload.get("final_result"),
            errors=[str(error) for error in payload.get("errors", [])],
            metadata=dict(payload.get("metadata", {})),
        )

    def _build_failure_result(
        self,
        *,
        job: SubAgentJob,
        started_at: datetime,
        errors: list[str],
    ) -> SubAgentResult:
        finished_at = utc_now()
        return SubAgentResult(
            job_id=job.job_id,
            label=job.label,
            task=job.task,
            success=False,
            started_at=started_at,
            finished_at=finished_at,
            duration_seconds=(finished_at - started_at).total_seconds(),
            final_result=None,
            errors=errors,
            metadata=job.metadata,
        )

    def _merge_errors(
        self,
        *,
        parse_error: str,
        return_code: int | None,
        stdout_bytes: bytes,
        stderr_bytes: bytes,
    ) -> list[str]:
        errors = [parse_error]
        if return_code not in (None, 0):
            errors.append(f"Worker process exited with code {return_code}")

        stderr = stderr_bytes.decode("utf-8", errors="replace").strip()
        if stderr:
            errors.append(f"stderr: {self._trim(stderr)}")

        stdout = stdout_bytes.decode("utf-8", errors="replace").strip()
        if stdout:
            errors.append(f"stdout: {self._trim(stdout)}")
        return errors

    def _trim(self, text: str, limit: int = 1200) -> str:
        if len(text) <= limit:
            return text
        return f"{text[:limit]}... [truncated]"

    async def _emit(self, handler: StatusHandler | None, event: StatusEvent) -> None:
        if handler is None:
            return
        emitted = handler(event)
        if asyncio.iscoroutine(emitted):
            await emitted
