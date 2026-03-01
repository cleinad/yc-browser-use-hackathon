"""FastAPI server wrapping controller.run() with SSE streaming."""

from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import asdict
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from proquote.controller import run
from proquote.models import StatusEvent

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
    request_id = uuid.uuid4().hex[:12]
    queue: asyncio.Queue[Any] = asyncio.Queue()
    _requests[request_id] = {
        "queue": queue,
        "status": "running",
        "result": None,
    }

    async def _run():
        try:
            plan = await run(
                req.text,
                retailers=req.retailers,
                status_handler=lambda evt: queue.put_nowait(
                    ("status", _serialize_status_event(evt))
                ),
                log=lambda msg: queue.put_nowait(("log", msg)),
            )
            _requests[request_id]["result"] = plan.model_dump()
            _requests[request_id]["status"] = "done"
            queue.put_nowait(("result", plan.model_dump()))
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
