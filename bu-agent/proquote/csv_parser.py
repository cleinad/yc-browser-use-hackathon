"""Parse contractor CSV quotes into PartSpec lists for the quote pipeline."""

from __future__ import annotations

import csv
import io

from .schemas import PartSpec


def parse_contractor_csv(csv_data: str) -> list[PartSpec]:
    """Parse a contractor CSV bill of materials into PartSpec list.

    Expected CSV format: part_name,quantity,unit_price,total
    """
    reader = csv.DictReader(io.StringIO(csv_data))
    parts: list[PartSpec] = []

    for row in reader:
        name = (
            row.get("part_name")
            or row.get("Part Name")
            or row.get("item")
            or row.get("description")
            or ""
        ).strip()

        if not name:
            continue

        # Skip labor lines — they're not searchable parts
        if "labor" in name.lower() or "service" in name.lower():
            continue

        qty_raw = (
            row.get("quantity")
            or row.get("Quantity")
            or row.get("qty")
            or "1"
        )
        try:
            qty = int(float(qty_raw.strip()))
        except (ValueError, TypeError):
            qty = 1

        parts.append(PartSpec(name=name, qty=max(qty, 1)))

    return parts


def csv_to_text(csv_data: str) -> str:
    """Convert contractor CSV into natural language for the parser.

    This can be fed directly into controller.run() as user_text.
    """
    parts = parse_contractor_csv(csv_data)
    if not parts:
        return csv_data  # fallback: raw text

    lines = [f"I need quotes for the following parts:"]
    for p in parts:
        lines.append(f"- {p.qty}x {p.name}")
    return "\n".join(lines)
