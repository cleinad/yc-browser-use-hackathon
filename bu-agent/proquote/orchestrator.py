from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import replace

from browser_use import Agent, Browser, BrowserProfile, ChatBrowserUse

from .models import OrchestratorConfig, StatusEvent, SubAgentJob, SubAgentResult, utc_now

StatusHandler = Callable[[StatusEvent], Awaitable[None] | None]


class BrowserUseSubAgent:
    """Thin adapter around browser-use Agent."""

    def __init__(
        self,
        *,
        max_steps: int = 40,
        timeout_sec: int = 180,
        use_vision: bool = False,
        headless: bool = True,
        use_cloud: bool = True,
        cloud_proxy_country_code: str = "us",
        llm_factory: Callable[[], ChatBrowserUse] | None = None,
    ) -> None:
        self._max_steps = max_steps
        self._timeout_sec = timeout_sec
        self._use_vision = use_vision
        self._headless = headless
        self._use_cloud = use_cloud
        self._cloud_proxy_country_code = cloud_proxy_country_code
        self._llm_factory = llm_factory or (lambda: ChatBrowserUse(model="bu-latest"))

    async def run(self, job: SubAgentJob) -> SubAgentResult:
        started_at = utc_now()
        errors: list[str] = []
        final_result: str | None = None
        success = False

        if self._use_cloud:
            browser = Browser(
                use_cloud=True,
                cloud_proxy_country_code=self._cloud_proxy_country_code,
            )
            agent = Agent(
                task=job.task,
                llm=self._llm_factory(),
                browser=browser,
                use_vision=self._use_vision,
            )
        else:
            agent = Agent(
                task=job.task,
                llm=self._llm_factory(),
                browser_profile=BrowserProfile(headless=self._headless, keep_alive=False),
                use_vision=self._use_vision,
            )
        try:
            history = await asyncio.wait_for(
                agent.run(max_steps=self._max_steps),
                timeout=self._timeout_sec,
            )
            final_result = history.final_result()
            errors.extend(error for error in history.errors() if error)
            success = bool(final_result and final_result.strip())
            if not success and history.is_done() and not history.has_errors():
                success = True
        except asyncio.TimeoutError:
            errors.append(f"Timed out after {self._timeout_sec} seconds")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{type(exc).__name__}: {exc}")
        finally:
            try:
                await agent.close()
            except Exception:  # noqa: BLE001
                pass

        finished_at = utc_now()
        return SubAgentResult(
            job_id=job.job_id,
            label=job.label,
            task=job.task,
            success=success,
            started_at=started_at,
            finished_at=finished_at,
            duration_seconds=(finished_at - started_at).total_seconds(),
            final_result=final_result,
            errors=errors,
            metadata=job.metadata,
        )


class SubAgentOrchestrator:
    """Runs many sub-agent jobs with configurable parallelism and retries."""

    def __init__(
        self,
        config: OrchestratorConfig | None = None,
        subagent_runner: BrowserUseSubAgent | None = None,
    ) -> None:
        self._config = config or OrchestratorConfig()
        self._subagent_runner = subagent_runner or BrowserUseSubAgent(
            max_steps=self._config.max_steps,
            timeout_sec=self._config.per_agent_timeout_sec,
            use_vision=self._config.use_vision,
            headless=self._config.headless,
            use_cloud=self._config.use_cloud,
            cloud_proxy_country_code=self._config.cloud_proxy_country_code,
        )

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
                message=f"Starting {len(jobs)} jobs with max_subagents={self._config.max_subagents}",
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
                    message=f"Attempt {attempt}/{max_attempts}",
                ),
            )

            async with semaphore:
                result = await self._subagent_runner.run(job)
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

    async def _emit(self, handler: StatusHandler | None, event: StatusEvent) -> None:
        if handler is None:
            return
        emitted = handler(event)
        if asyncio.iscoroutine(emitted):
            await emitted
