"""Optimize aggregated sub-agent results into ranked purchase plans."""

from __future__ import annotations

import json

from . import llm_client
from .models import SubAgentResult, result_to_dict
from .schemas import PurchasePlan

SYSTEM_PROMPT = """\
You are a purchase optimization assistant. You receive search results from \
one or more retailers for a list of parts the user needs. Your job is to \
produce ranked purchase plan options.

Consider:
- Total cost (sum of all items)
- Shipping and delivery estimates
- Delivery deadline (if provided)
- Single-store convenience vs. split-order savings
- Product availability

Return a JSON object with:
- "options": array of plan options ranked best-first, each with:
  - "rank": integer starting at 1
  - "summary": one-line description of this plan
  - "line_items": array of items in this plan, each with:
    - "part_name": original part the user asked for
    - "product_name": product name from retailer
    - "price": number or null
    - "retailer": retailer name
    - "availability": availability string or null
    - "delivery_estimate": delivery estimate or null
    - "product_url": URL or null
  - "estimated_total": total cost number or null
  - "delivery_summary": overall delivery estimate
  - "tradeoffs": why you might or might not pick this plan
- "notes": any general caveats or notes

Return ONLY valid JSON, no explanation.\
"""


async def optimize(
    results: list[SubAgentResult],
    location: str | None = None,
    deadline: str | None = None,
) -> PurchasePlan:
    """Take raw sub-agent results and produce a ranked purchase plan."""
    successful = [r for r in results if r.success and r.final_result]
    failed = [r for r in results if not r.success]

    if not successful:
        notes = "All sub-agent searches failed. No results to optimize."
        if failed:
            first_errors = failed[0].errors[:2]
            if first_errors:
                notes += " First failure: " + "; ".join(first_errors)
        return PurchasePlan(options=[], notes=notes)

    # Build context for the LLM
    results_summary = []
    for r in successful:
        results_summary.append({
            "job_id": r.job_id,
            "label": r.label,
            "retailer": r.metadata.get("retailer", "unknown"),
            "part_name": r.metadata.get("part_name", r.label),
            "result": r.final_result,
        })

    user_message_parts = [
        "Here are the search results from retailers:\n",
        json.dumps(results_summary, indent=2),
    ]
    if location:
        user_message_parts.append(f"\nDelivery location: {location}")
    if deadline:
        user_message_parts.append(f"\nDelivery deadline: {deadline}")
    if failed:
        failed_info = [{"job_id": r.job_id, "label": r.label, "errors": r.errors[:2]} for r in failed]
        user_message_parts.append(f"\nNote: these searches failed: {json.dumps(failed_info)}")

    user_message = "\n".join(user_message_parts)

    data = await llm_client.chat_json(SYSTEM_PROMPT, user_message)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object from optimizer, got {type(data).__name__}")

    return PurchasePlan(**data)
