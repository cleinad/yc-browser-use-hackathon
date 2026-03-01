"""FastAPI server wrapping controller.run() with SSE streaming."""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from dataclasses import asdict
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

# Load env so MINIMAX_API_KEY etc. are available (e.g. from repo root .env.local or bu-agent/.env)
_root = Path(__file__).resolve().parent
load_dotenv(_root / ".env")
load_dotenv(_root.parent / ".env.local")
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from proquote.controller import run
from proquote.models import OrchestratorConfig
from proquote.models import StatusEvent
from proquote.worker_controller import run_worker_search

app = FastAPI(title="Proquote API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory request store
# ---------------------------------------------------------------------------

_SENTINEL = object()

_requests: dict[str, dict[str, Any]] = {}
# Each entry: {"queue": asyncio.Queue, "status": str, "result": ... | None}


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class QuoteRequest(BaseModel):
    text: str
    retailers: list[str] | None = None


class QuoteResponse(BaseModel):
    request_id: str


# ---------------------------------------------------------------------------
# Runtime config (env-driven)
# ---------------------------------------------------------------------------


def _bool_env(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    normalized = raw.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    return default


def _int_env(name: str, default: int, *, minimum: int | None = None) -> int:
    raw = os.environ.get(name)
    if raw is None or not raw.strip():
        value = default
    else:
        try:
            value = int(raw)
        except ValueError:
            value = default
    if minimum is not None:
        return max(minimum, value)
    return value


def _orchestrator_config_from_env() -> OrchestratorConfig:
    return OrchestratorConfig(
        max_subagents=_int_env("PROQUOTE_MAX_SUBAGENTS", 5, minimum=1),
        per_agent_timeout_sec=_int_env("PROQUOTE_PER_AGENT_TIMEOUT_SEC", 90, minimum=1),
        max_steps=_int_env("PROQUOTE_MAX_STEPS", 40, minimum=1),
        retries=_int_env("PROQUOTE_RETRIES", 1, minimum=0),
        use_vision=_bool_env("PROQUOTE_USE_VISION", False),
        headless=_bool_env("PROQUOTE_HEADLESS", True),
        use_cloud=_bool_env("PROQUOTE_USE_CLOUD", True),
        cloud_proxy_country_code=os.environ.get("PROQUOTE_CLOUD_PROXY_COUNTRY", "us"),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _serialize_status_event(evt: StatusEvent) -> dict[str, Any]:
    d = asdict(evt)
    d["timestamp"] = evt.timestamp.isoformat()
    return d


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post("/quote", response_model=QuoteResponse)
async def create_quote(req: QuoteRequest):
    config = _orchestrator_config_from_env()
    request_timeout_sec = _int_env("PROQUOTE_REQUEST_TIMEOUT_SEC", 600, minimum=10)
    request_id = uuid.uuid4().hex[:12]
    queue: asyncio.Queue[Any] = asyncio.Queue()
    _requests[request_id] = {
        "queue": queue,
        "status": "running",
        "result": None,
    }

    async def _run():
        try:
            plan = await asyncio.wait_for(
                run(
                    req.text,
                    retailers=req.retailers,
                    config=config,
                    status_handler=lambda evt: queue.put_nowait(
                        ("status", _serialize_status_event(evt))
                    ),
                    log=lambda msg: queue.put_nowait(("log", msg)),
                ),
                timeout=request_timeout_sec,
            )
            _requests[request_id]["result"] = plan.model_dump()
            _requests[request_id]["status"] = "done"
            queue.put_nowait(("result", plan.model_dump()))
        except asyncio.TimeoutError:
            _requests[request_id]["status"] = "error"
            queue.put_nowait(
                (
                    "error",
                    f"Request timed out after {request_timeout_sec} seconds. "
                    "Try a more specific query or reduce retries/timeouts in bu-agent env.",
                )
            )
        except Exception as exc:
            _requests[request_id]["status"] = "error"
            queue.put_nowait(("error", str(exc)))
        finally:
            queue.put_nowait(_SENTINEL)

    asyncio.create_task(_run())
    return QuoteResponse(request_id=request_id)


@app.get("/quote/{request_id}/events")
async def quote_events(request_id: str):
    entry = _requests.get(request_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Unknown request_id")

    queue: asyncio.Queue[Any] = entry["queue"]

    async def _generate():
        while True:
            item = await queue.get()
            if item is _SENTINEL:
                return
            event_type, data = item
            payload = data if isinstance(data, str) else json.dumps(data)
            yield {"event": event_type, "data": payload}

    return EventSourceResponse(_generate())


@app.post("/quote/sync")
async def create_quote_sync(req: QuoteRequest):
    plan = await run(req.text, retailers=req.retailers)
    return plan.model_dump()


# ---------------------------------------------------------------------------
# Worker endpoints
# ---------------------------------------------------------------------------


class WorkerRequest(BaseModel):
    text: str


class WorkerResponse(BaseModel):
    request_id: str


@app.post("/workers", response_model=WorkerResponse)
async def create_worker_search(req: WorkerRequest):
    request_id = uuid.uuid4().hex[:12]
    queue: asyncio.Queue[Any] = asyncio.Queue()
    _requests[request_id] = {
        "queue": queue,
        "status": "running",
        "result": None,
    }

    async def _run():
        try:
            result = await run_worker_search(
                req.text,
                status_handler=lambda evt: queue.put_nowait(
                    ("status", _serialize_status_event(evt))
                ),
                log=lambda msg: queue.put_nowait(("log", msg)),
            )
            _requests[request_id]["result"] = result.model_dump()
            _requests[request_id]["status"] = "done"
            queue.put_nowait(("result", result.model_dump()))
        except Exception as exc:
            _requests[request_id]["status"] = "error"
            queue.put_nowait(("error", str(exc)))
        finally:
            queue.put_nowait(_SENTINEL)

    asyncio.create_task(_run())
    return WorkerResponse(request_id=request_id)


@app.get("/workers/{request_id}/events")
async def worker_events(request_id: str):
    entry = _requests.get(request_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Unknown request_id")

    queue: asyncio.Queue[Any] = entry["queue"]

    async def _generate():
        while True:
            item = await queue.get()
            if item is _SENTINEL:
                return
            event_type, data = item
            payload = data if isinstance(data, str) else json.dumps(data)
            yield {"event": event_type, "data": payload}

    return EventSourceResponse(_generate())
