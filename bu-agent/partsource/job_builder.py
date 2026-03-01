"""Generate SubAgentJobs from parts x retailers."""

from __future__ import annotations

from .models import SubAgentJob
from .schemas import PartSpec

DEFAULT_RETAILERS = ["homedepot.com"]

TASK_TEMPLATE = """\
Go to https://www.{retailer} and search for: {query}

Find the most relevant product matching this description. Extract the following \
information and return it as JSON only:
- product_name: the full product name as listed
- price: numeric price in dollars (e.g. 12.99)
- availability: in-stock status or availability text
- delivery_estimate: shipping/delivery estimate{location_clause}
- product_url: the full URL of the product page

If multiple results appear, pick the best match for: {query}
Return ONLY valid JSON with those keys, nothing else.\
"""


def build_jobs(
    parts: list[PartSpec],
    retailers: list[str] | None = None,
    location: str | None = None,
) -> list[SubAgentJob]:
    """Generate one SubAgentJob per part per retailer.

    E.g. 3 parts x 2 retailers = 6 jobs.
    """
    retailers = retailers or DEFAULT_RETAILERS
    jobs: list[SubAgentJob] = []

    for part_idx, part in enumerate(parts, start=1):
        query = _build_query(part)
        location_clause = f" to {location}" if location else ""

        for retailer in retailers:
            retailer_slug = retailer.replace(".", "-").replace("/", "")
            job_id = f"{retailer_slug}-part-{part_idx}"
            label = f"{retailer} — {part.name}"

            task = TASK_TEMPLATE.format(
                retailer=retailer,
                query=query,
                location_clause=location_clause,
            )

            jobs.append(
                SubAgentJob(
                    job_id=job_id,
                    label=label,
                    task=task,
                    metadata={
                        "part_index": part_idx,
                        "part_name": part.name,
                        "retailer": retailer,
                        "qty": part.qty,
                    },
                )
            )

    return jobs


def _build_query(part: PartSpec) -> str:
    """Build a search query string from a PartSpec."""
    pieces = [part.name]
    for key, val in part.attributes.items():
        if val.lower() not in part.name.lower():
            pieces.append(f"{key}: {val}")
    if part.qty > 1:
        pieces.append(f"(qty {part.qty})")
    return ", ".join(pieces)
