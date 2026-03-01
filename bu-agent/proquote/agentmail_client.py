"""AgentMail integration for sending quote requests and receiving simulated replies."""

from __future__ import annotations

import os
import random

from pydantic import BaseModel

from . import llm_client


class ContractorInboxInfo(BaseModel):
    contractor_name: str
    contractor_email: str
    inbox_address: str
    email_subject: str
    email_body: str
    send_status: str  # "pending" | "sent" | "failed"


class ContractorQuote(BaseModel):
    contractor_name: str
    contractor_email: str
    inbox_address: str
    csv_data: str
    total_price: float
    timeline_days: int


QUOTE_GENERATION_PROMPT = """\
You are simulating a contractor's quote reply for a maintenance job. \
Generate a realistic CSV bill of materials.

The CSV must have these columns: part_name,quantity,unit_price,total
Include 3-6 line items that would be needed for this repair.
Add a labor line at the end.

Vary prices realistically. Return ONLY the CSV with a header row, no explanation.\
"""


async def create_contractor_inbox(contractor_name: str) -> str:
    """Create an AgentMail inbox for a specific contractor. Returns inbox address."""
    api_key = os.environ.get("AGENTMAIL_API_KEY")
    if api_key:
        try:
            import agentmail
            client = agentmail.AgentMail(api_key=api_key)
            inbox = client.inboxes.create()
            return inbox.address
        except Exception:
            pass
    # Fallback: generate a demo inbox address
    import uuid
    slug = contractor_name.lower().replace(" ", "-")[:12]
    return f"{slug}-{uuid.uuid4().hex[:6]}@agentmail.to"


async def send_quote_request(
    inbox_address: str,
    contractor_name: str,
    contractor_email: str,
    issue_description: str,
) -> ContractorInboxInfo:
    """Send a quote request email to a contractor via AgentMail. Returns inbox info."""
    subject = f"Quote Request: {issue_description[:50]}"
    body = (
        f"Hi,\n\nWe need a quote for the following maintenance issue:\n\n"
        f"{issue_description}\n\n"
        f"Please reply with a CSV bill of materials including parts, quantities, and pricing.\n\n"
        f"Thank you."
    )
    send_status = "sent"

    api_key = os.environ.get("AGENTMAIL_API_KEY")
    if api_key:
        try:
            import agentmail
            client = agentmail.AgentMail(api_key=api_key)
            inbox_username = inbox_address.split("@")[0]
            client.inboxes.send_message(
                inbox_username,
                to=contractor_email,
                subject=subject,
                body=body,
            )
        except Exception:
            send_status = "failed"
    # In demo mode send_status stays "sent" (simulated)

    return ContractorInboxInfo(
        contractor_name=contractor_name,
        contractor_email=contractor_email,
        inbox_address=inbox_address,
        email_subject=subject,
        email_body=body,
        send_status=send_status,
    )


async def simulate_contractor_reply(
    contractor_name: str,
    contractor_email: str,
    inbox_address: str,
    issue_description: str,
) -> ContractorQuote:
    """Generate a simulated contractor reply with a CSV quote."""
    user_msg = f"Contractor: {contractor_name}\nIssue: {issue_description}"
    raw_csv = await llm_client.chat(QUOTE_GENERATION_PROMPT, user_msg)

    # Clean up the CSV
    lines = [l.strip() for l in raw_csv.strip().splitlines() if l.strip()]
    csv_data = "\n".join(lines)

    # Calculate total from CSV
    total = 0.0
    for line in lines[1:]:  # skip header
        parts = line.split(",")
        if len(parts) >= 4:
            try:
                total += float(parts[3].strip().replace("$", ""))
            except (ValueError, IndexError):
                pass

    # Add some variation
    price_factor = 0.85 + random.random() * 0.3  # 0.85-1.15x
    total = round(total * price_factor, 2)
    timeline = random.choice([1, 2, 3, 5, 7])

    return ContractorQuote(
        contractor_name=contractor_name,
        contractor_email=contractor_email,
        inbox_address=inbox_address,
        csv_data=csv_data,
        total_price=total,
        timeline_days=timeline,
    )
