"""Classify user text into a trade category using LLM."""

from __future__ import annotations

from . import llm_client
from .worker_schemas import ClassifiedRequest

SYSTEM_PROMPT = """\
You are a home-services classifier. The user will describe a problem or job \
they need done. Classify it into exactly one trade category and produce a \
Google Maps search query for finding a contractor.

Trade categories (pick exactly one):
plumbing, electrical, hvac, general_handyman, roofing, painting, carpentry, \
appliance_repair, landscaping, cleaning

Return a JSON object with these keys:
- "trade": one of the categories above
- "search_query": a short descriptive query for finding this type of worker \
(e.g. "plumber toilet leak repair", "electrician outlet installation")

Return ONLY valid JSON, no explanation.\
"""


async def classify_trade(user_text: str) -> ClassifiedRequest:
    """Classify user text into a trade category via LLM."""
    data = await llm_client.chat_json(SYSTEM_PROMPT, user_text)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object from classifier, got {type(data).__name__}")
    return ClassifiedRequest(
        trade=data["trade"],
        search_query=data["search_query"],
    )
