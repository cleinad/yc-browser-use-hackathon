"""Thin MiniMax LLM wrapper using the OpenAI-compatible API."""

from __future__ import annotations

import json
import os
import re

from openai import AsyncOpenAI

DEFAULT_MODEL = "MiniMax-M2.5-highspeed"
BASE_URL = "https://api.minimax.io/v1"


def _get_client() -> AsyncOpenAI:
    api_key = os.environ.get("MINIMAX_API_KEY", "")
    if not api_key:
        raise RuntimeError("MINIMAX_API_KEY environment variable is not set")
    return AsyncOpenAI(api_key=api_key, base_url=BASE_URL)


async def chat(
    system_prompt: str,
    user_message: str,
    *,
    model: str = DEFAULT_MODEL,
) -> str:
    """Send a chat completion request and return the assistant's text."""
    client = _get_client()
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.2,
    )
    content = response.choices[0].message.content or ""
    return content.strip()


async def chat_json(
    system_prompt: str,
    user_message: str,
    *,
    model: str = DEFAULT_MODEL,
) -> dict | list:
    """Send a chat request and parse the response as JSON.

    Extracts JSON from markdown code fences if present.
    """
    raw = await chat(system_prompt, user_message, model=model)
    return extract_json(raw)


def extract_json(text: str) -> dict | list:
    """Extract JSON from LLM output, handling code fences."""
    # Try stripping markdown code fences first
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    candidate = fence_match.group(1).strip() if fence_match else text.strip()
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    # Fallback: find first [ or { and parse from there
    for i, ch in enumerate(text):
        if ch in ("{", "["):
            try:
                return json.loads(text[i:])
            except json.JSONDecodeError:
                continue

    raise ValueError(f"Could not extract JSON from LLM response: {text[:200]}")
