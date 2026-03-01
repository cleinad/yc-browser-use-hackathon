"""Generate retailer-specific optimized search queries using MiniMax."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from . import llm_client
from .schemas import PartSpec

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a search-query optimizer for construction / home-improvement products.

Given a list of parts and a list of retailer domains, produce an optimized
search query for EACH part × retailer combination.

Retailer-specific strategies:
- homedepot.com: Use concise, SKU-style keywords. Include brand if known.
  Prefer specs over generic descriptions (e.g. "1/2 in x 10 ft copper pipe type M").
- amazon.com: Use long-tail, natural-language phrases that match how products
  are listed. Include key specs and common synonyms (e.g. "1/2 inch copper pipe
  10 foot type M plumbing").
- lowes.com: Use clean product names with key dimensions. Lowes search works
  best with category-style terms (e.g. "copper pipe 1/2 in x 10 ft").

For each query also provide an optional `category_hint` — a short category or
department name the browser agent can use to narrow results (e.g. "Plumbing",
"Electrical", "Lumber"). Set to null if uncertain.

Return JSON in this exact shape:
{
  "<retailer_domain>": {
    "<part_name>": { "query": "...", "category_hint": "..." | null }
  }
}
"""


@dataclass(slots=True)
class RetailerQuery:
    """An optimized query for a specific retailer + part."""

    query: str
    category_hint: str | None = None


async def optimize_queries(
    parts: list[PartSpec],
    retailers: list[str],
) -> dict[str, dict[str, RetailerQuery]]:
    """Generate retailer-specific search queries for each part.

    Returns:
        Nested dict: optimized_queries[retailer][part_name] = RetailerQuery
        Returns empty dict on LLM failure (caller falls back to generic queries).
    """
    parts_desc = []
    for p in parts:
        attrs = ", ".join(f"{k}: {v}" for k, v in p.attributes.items())
        line = f"- {p.name}"
        if attrs:
            line += f" ({attrs})"
        if p.qty > 1:
            line += f" x{p.qty}"
        parts_desc.append(line)

    user_message = (
        f"Parts:\n{''.join(chr(10) + l for l in parts_desc).strip()}\n\n"
        f"Retailers: {', '.join(retailers)}"
    )

    try:
        raw = await llm_client.chat_json(SYSTEM_PROMPT, user_message)
    except Exception:
        logger.warning("Query optimizer LLM call failed; falling back to generic queries", exc_info=True)
        return {}

    if not isinstance(raw, dict):
        logger.warning("Query optimizer returned non-dict: %s", type(raw).__name__)
        return {}

    result: dict[str, dict[str, RetailerQuery]] = {}
    for retailer, part_map in raw.items():
        if not isinstance(part_map, dict):
            continue
        result[retailer] = {}
        for part_name, entry in part_map.items():
            if not isinstance(entry, dict) or "query" not in entry:
                continue
            result[retailer][part_name] = RetailerQuery(
                query=entry["query"],
                category_hint=entry.get("category_hint"),
            )

    return result
