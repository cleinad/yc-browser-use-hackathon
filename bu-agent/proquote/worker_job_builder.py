"""Build SubAgentJobs for scraping Google Maps for workers."""

from __future__ import annotations

from .models import SubAgentJob
from .worker_schemas import ClassifiedRequest

TASK_TEMPLATE = """\
Go to https://www.google.com/maps and search for: {search_query} near {location}

Extract up to 5 results from the search results. For each result, extract:
- name: the business name
- phone: phone number (or null if not shown)
- address: street address (or null if not shown)
- rating: numeric star rating (e.g. 4.5) or null

Return ONLY a valid JSON array of objects with those keys, nothing else.
Example: [{{"name": "ABC Plumbing", "phone": "(415) 555-1234", "address": "123 Main St", "rating": 4.8}}]\
"""


def build_worker_jobs(classified: ClassifiedRequest) -> list[SubAgentJob]:
    """Build a single SubAgentJob to scrape Google Maps for workers."""
    task = TASK_TEMPLATE.format(
        search_query=classified.search_query,
        location=classified.location,
    )
    return [
        SubAgentJob(
            job_id=f"gmaps-{classified.trade}",
            label=f"Google Maps — {classified.trade}",
            task=task,
            metadata={"trade": classified.trade},
        )
    ]
