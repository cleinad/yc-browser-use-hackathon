"""Schemas for the worker-finder feature."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

TradeCategory = Literal[
    "plumbing",
    "electrical",
    "hvac",
    "general_handyman",
    "roofing",
    "painting",
    "carpentry",
    "appliance_repair",
    "landscaping",
    "cleaning",
]


class ClassifiedRequest(BaseModel):
    trade: TradeCategory
    search_query: str
    location: str = "560 20th St, San Francisco, CA 94107"


class WorkerResult(BaseModel):
    name: str
    phone: str | None = None
    address: str | None = None
    rating: float | None = None
    trade_category: TradeCategory


class WorkerSearchResult(BaseModel):
    workers: list[WorkerResult]
    trade: TradeCategory
    notes: str | None = None
