"""Find contractors via Google Places API with browser-agent fallback."""

from __future__ import annotations

import os
import re

import httpx
from pydantic import BaseModel

from .worker_schemas import TradeCategory


class Contractor(BaseModel):
    name: str
    phone: str | None = None
    address: str | None = None
    rating: float | None = None
    trade_category: TradeCategory
    email: str  # demo: contractor-{slug}@agentmail.to


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:30]


async def find_contractors(
    trade: TradeCategory,
    issue_description: str,
    location: str,
    *,
    log=None,
) -> list[Contractor]:
    """Search for contractors. Tries Google Places first, falls back to mock data."""
    _log = log or (lambda _: None)

    places_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    contractors: list[Contractor] = []

    if places_key:
        _log("Searching Google Places API...")
        try:
            contractors = await _search_places(trade, location, places_key)
            _log(f"Found {len(contractors)} contractor(s) via Google Places")
        except Exception as exc:
            _log(f"Google Places search failed: {exc}")

    if len(contractors) < 3:
        _log("Generating demo contractor data...")
        contractors = _generate_demo_contractors(trade, location)
        _log(f"Generated {len(contractors)} demo contractor(s)")

    return contractors


async def _search_places(
    trade: TradeCategory,
    location: str,
    api_key: str,
) -> list[Contractor]:
    """Search Google Places API for contractors."""
    query = f"{trade.replace('_', ' ')} contractor near {location}"
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params={"query": query, "key": api_key})
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])[:5]
    contractors = []
    for place in results:
        name = place.get("name", "Unknown")
        contractors.append(
            Contractor(
                name=name,
                phone=None,
                address=place.get("formatted_address"),
                rating=place.get("rating"),
                trade_category=trade,
                email=f"contractor-{_slugify(name)}@agentmail.to",
            )
        )
    return contractors


def _generate_demo_contractors(
    trade: TradeCategory,
    location: str,
) -> list[Contractor]:
    """Generate realistic demo contractors for the given trade."""
    trade_names = {
        "plumbing": ["Bay Area Plumbing Co", "QuickFix Plumbers", "SF Drain Masters", "AquaPro Services"],
        "electrical": ["Spark Electric SF", "BrightWire Electrical", "PowerUp Solutions", "Circuit Pro Electric"],
        "hvac": ["CoolBreeze HVAC", "Bay Climate Control", "AirFlow Masters", "TempRight Services"],
        "general_handyman": ["HandyPro SF", "FixIt All Services", "Bay Area Handyman", "Mr. Fix Solutions"],
        "roofing": ["TopShield Roofing", "Bay Roof Pros", "SkyHigh Roofing", "Guardian Roof Co"],
        "painting": ["ColorCraft Painters", "Bay Area Painting Co", "FreshCoat Pro", "PaintMaster SF"],
        "carpentry": ["WoodWorks SF", "Bay Carpentry Co", "CraftWood Solutions", "TimberPro Services"],
        "appliance_repair": ["ApplianceFix SF", "QuickRepair Appliances", "Bay Appliance Pro", "FixRight Services"],
        "landscaping": ["GreenScape SF", "Bay Landscape Design", "NatureWorks Pro", "EcoGarden Services"],
        "cleaning": ["SparkClean SF", "Bay Area Cleaners", "PureShine Services", "CleanPro Solutions"],
    }

    names = trade_names.get(trade, trade_names["general_handyman"])
    ratings = [4.8, 4.5, 4.2, 3.9]
    phones = ["(415) 555-0101", "(415) 555-0202", "(415) 555-0303", "(415) 555-0404"]

    return [
        Contractor(
            name=name,
            phone=phones[i],
            address=f"{100 + i * 50} Market St, San Francisco, CA",
            rating=ratings[i],
            trade_category=trade,
            email=f"contractor-{_slugify(name)}@agentmail.to",
        )
        for i, name in enumerate(names)
    ]
