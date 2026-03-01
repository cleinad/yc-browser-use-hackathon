"""Analyze maintenance issue photos using MiniMax vision AI."""

from __future__ import annotations

from pydantic import BaseModel

from . import llm_client
from .worker_schemas import TradeCategory


class VisionAnalysis(BaseModel):
    issue_description: str
    trade: TradeCategory
    severity: str  # low | medium | high
    follow_up_questions: list[str]


SYSTEM_PROMPT = """\
You are a property maintenance expert. The user will provide a photo of a \
maintenance issue at a property. Analyze the image and return a JSON object with:

- "issue_description": a clear 1-2 sentence description of the problem
- "trade": one of: plumbing, electrical, hvac, general_handyman, roofing, \
painting, carpentry, appliance_repair, landscaping, cleaning
- "severity": "low", "medium", or "high"
- "follow_up_questions": array of 2-3 short questions to clarify scope \
(e.g. "How long has this been happening?", "Is there water damage nearby?")

Return ONLY valid JSON, no explanation.\
"""


async def analyze_image(
    image_base64: str,
    property_address: str | None = None,
) -> VisionAnalysis:
    """Analyze a maintenance issue photo using MiniMax vision."""
    user_text = f"Property address: {property_address}" if property_address else None

    data = await llm_client.chat_vision_json(
        SYSTEM_PROMPT,
        image_base64,
        user_text,
    )
    if not isinstance(data, dict):
        raise ValueError("Vision model did not return a JSON object")

    return VisionAnalysis(
        issue_description=data.get("issue_description", "Unknown issue"),
        trade=data.get("trade", "general_handyman"),
        severity=data.get("severity", "medium"),
        follow_up_questions=data.get("follow_up_questions", []),
    )
