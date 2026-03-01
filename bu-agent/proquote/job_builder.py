"""Generate SubAgentJobs from parts x retailers."""

from __future__ import annotations

from .models import SubAgentJob
from .query_optimizer import RetailerQuery
from .schemas import PartSpec

DEFAULT_RETAILERS = ["homedepot.com", "lowes.com", "amazon.com"]

TASK_TEMPLATE = """\
Go to https://www.{retailer}

HOW TO FIND THE PRODUCT — pick the best approach:
{category_nav_clause}
Option A — Search bar (preferred):
  1. Find the search bar input field at the top of the page.
  2. Click on the search bar, type "{query}", and press Enter to submit.
  3. Wait for the search results page to load.

Option B — Category navigation (use if search gives poor results):
  1. Browse the site's category menus / department links.
  2. Navigate into the most relevant department or category.
  3. Use filters or sub-categories to narrow down to the product.

After finding results, pick the best matching product for: {query}
Click into that product's page to get full details.

IMPORTANT RULES:
- Stay ONLY on {retailer}. Do NOT navigate to any other website.
- Do NOT type the query into the browser URL/address bar. Use the on-page search bar.
- If you cannot find the product on {retailer}, that is perfectly fine. \
Return the JSON below with "product_name" set to null.
- Do NOT try other retailers or search engines. Only use {retailer}.

Extract the following as JSON:
- product_name: the full product name as listed (or null if not found)
- price: numeric price in dollars (e.g. 12.99) or null
- availability: in-stock status or availability text, or null
- delivery_estimate: shipping/delivery estimate{location_clause}, or null
- product_url: the full URL of the product page, or null
- image_url: the URL of the main product image (the src attribute of the product's primary image), or null

Return ONLY valid JSON with those keys, nothing else.\
"""


def build_jobs(
    parts: list[PartSpec],
    retailers: list[str] | None = None,
    location: str | None = None,
    optimized_queries: dict[str, dict[str, RetailerQuery]] | None = None,
) -> list[SubAgentJob]:
    """Generate one SubAgentJob per part per retailer.

    E.g. 3 parts x 2 retailers = 6 jobs.

    If *optimized_queries* is provided, retailer-specific queries and category
    hints are used instead of the generic ``_build_query()`` output.
    """
    retailers = retailers or DEFAULT_RETAILERS
    optimized_queries = optimized_queries or {}
    jobs: list[SubAgentJob] = []

    for part_idx, part in enumerate(parts, start=1):
        location_clause = f" to {location}" if location else ""

        for retailer in retailers:
            # Use optimized query if available, otherwise fall back
            rq = optimized_queries.get(retailer, {}).get(part.name)
            query = rq.query if rq else _build_query(part)
            category_nav_clause = (
                f"Hint: the \"{rq.category_hint}\" department/category is a good place to look.\n"
                if rq and rq.category_hint
                else ""
            )

            retailer_slug = retailer.replace(".", "-").replace("/", "")
            job_id = f"{retailer_slug}-part-{part_idx}"
            label = f"{retailer} — {part.name}"

            task = TASK_TEMPLATE.format(
                retailer=retailer,
                query=query,
                location_clause=location_clause,
                category_nav_clause=category_nav_clause,
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
