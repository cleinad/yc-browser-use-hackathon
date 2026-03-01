"""Parse natural language requests into structured PartSpec lists."""

from __future__ import annotations

from . import llm_client
from .schemas import PartSpec, UserRequest

SYSTEM_PROMPT = """\
You are a parts procurement assistant. The user will describe parts they need \
to purchase. Extract each distinct part into a structured format.

Return a JSON object with these keys:
- "parts": array of objects, each with:
  - "name": string — the part name as a good search query (include key specs)
  - "qty": integer — quantity needed (default 1)
  - "attributes": object — key attributes like size, material, type, length
  - "notes": string or null — any extra context
- "location": string or null — delivery address or region if mentioned
- "deadline": string or null — delivery deadline if mentioned

Return ONLY valid JSON, no explanation.\
"""


async def parse_request(user_text: str) -> UserRequest:
    """Parse raw user text into a structured UserRequest via LLM."""
    data = await llm_client.chat_json(SYSTEM_PROMPT, user_text)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object from parser, got {type(data).__name__}")

    parts = [PartSpec(**p) for p in data.get("parts", [])]
    if not parts:
        raise ValueError("No parts extracted from request")

    return UserRequest(
        parts=parts,
        location=data.get("location"),
        deadline=data.get("deadline"),
    )
