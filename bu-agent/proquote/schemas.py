"""Pydantic models for the orchestration layer."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PartSpec(BaseModel):
    """A single part extracted from the user's request."""

    name: str = Field(description="Normalized part name / search query")
    qty: int = Field(default=1, description="Quantity needed")
    attributes: dict[str, str] = Field(
        default_factory=dict,
        description="Key attributes like size, material, type",
    )
    notes: str | None = Field(default=None, description="Extra notes from user")


class UserRequest(BaseModel):
    """Parsed user request with parts and delivery context."""

    parts: list[PartSpec]
    location: str | None = Field(default=None, description="Delivery address or region")
    deadline: str | None = Field(default=None, description="Delivery deadline")


class LineItem(BaseModel):
    """A single product result from a retailer."""

    part_name: str
    product_name: str
    price: float | None = None
    currency: str = "USD"
    availability: str | None = None
    delivery_estimate: str | None = None
    product_url: str | None = None
    retailer: str | None = None


class PlanOption(BaseModel):
    """A ranked purchase plan option."""

    rank: int
    summary: str = Field(description="One-line description of this option")
    line_items: list[LineItem] = Field(default_factory=list)
    estimated_total: float | None = None
    currency: str = "USD"
    delivery_summary: str | None = None
    tradeoffs: str | None = Field(
        default=None,
        description="Why you might or might not pick this option",
    )


class PurchasePlan(BaseModel):
    """The final output: ranked purchase plan options."""

    options: list[PlanOption] = Field(default_factory=list)
    notes: str | None = Field(default=None, description="General notes or caveats")
