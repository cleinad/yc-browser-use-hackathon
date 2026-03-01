from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal

StatusEventType = Literal[
    "orchestrator_started",
    "subagent_started",
    "subagent_retrying",
    "subagent_completed",
    "subagent_failed",
    "orchestrator_completed",
]


@dataclass(slots=True)
class OrchestratorConfig:
    max_subagents: int = 5
    per_agent_timeout_sec: int = 180
    max_steps: int = 40
    retries: int = 1
    use_vision: bool = False
    headless: bool = True


@dataclass(slots=True)
class SubAgentJob:
    job_id: str
    label: str
    task: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class SubAgentResult:
    job_id: str
    label: str
    task: str
    success: bool
    started_at: datetime
    finished_at: datetime
    duration_seconds: float
    final_result: str | None = None
    errors: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class StatusEvent:
    event_type: StatusEventType
    timestamp: datetime
    message: str | None = None
    job_id: str | None = None
    job_label: str | None = None
    attempt: int | None = None


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def result_to_dict(result: SubAgentResult) -> dict[str, Any]:
    payload = asdict(result)
    payload["started_at"] = result.started_at.isoformat()
    payload["finished_at"] = result.finished_at.isoformat()
    return payload
