# ProcureSwarm

## What This Is

ProcureSwarm is a repair-to-procurement web agent dashboard for property managers and homeowners. A user types a natural language maintenance issue (e.g. "Bathroom toilet seat broken"), the system generates a multi-part Fix Pack (Bill of Materials), spawns a multi-agent quote swarm across 6–8 curated vendors, computes the best bundle strategy, and either auto-places a cart or sends RFQ emails when checkout isn't possible. Everything is logged in a per-house audit timeline.

## Core Value

From "toilet seat broken" to multi-vendor quotes with procurement action in under 3 minutes — with a judge-friendly Proof Pack that makes every quote verifiable.

## Requirements

### Validated

- ✓ Python browser-use agent orchestrator — existing (`bu-agent/partsource/`)
- ✓ Multi-agent concurrent spawning pattern — existing (worker_subagent.py)

### Active

**P0.1 — House Dashboard**
- [ ] `/` route renders a grid of house cards
- [ ] Each card shows: open ticket count, last activity, spend/budget KPIs
- [ ] Click card navigates to house detail page

**P0.2 — House Detail + History Timeline**
- [ ] `/house/[id]` with tabs: History, Open Tickets, Settings
- [ ] Timeline renders events with proof links, sorted descending

**P0.3 — Problem Intake**
- [ ] Ticket creation form inside house page (natural language input)
- [ ] "Triage card" displays parsed structured fields (problem, room, urgency, constraints)

**P0.4 — BOM / Fix Pack display**
- [ ] Fix Pack list with item name, qty, specs, confidence level
- [ ] If max 2 clarifying questions returned: render minimal Q UI, then confirm

**P0.5 — Live Swarm Panel**
- [ ] Real-time progress bars per vendor + per BOM item
- [ ] Status chips (QUEUED / RUNNING / DONE / FAILED / RFQ_REQUIRED)
- [ ] Last screenshot preview per vendor run

**P0.6 — Quote comparison + bundle optimizer**
- [ ] Comparison table: line-item breakdown + vendor totals
- [ ] "Recommended bundle" card showing Cheapest vs Fastest strategies with explanation

**P0.7 — Proof Pack page**
- [ ] `/proof/[ticketId]` — judge-friendly view
- [ ] Per vendor: item → screenshot → URL → timestamp → extracted fields

**P0.8 — RFQ fallback status**
- [ ] In quote table: "RFQ sent" status chip + email thread link
- [ ] "Contact found" proof (screenshot of contact page)

### Out of Scope

- Backend Convex schema/mutations — backend owner responsibility
- POST /api/* endpoints — backend owner responsibility
- Browser Use orchestration — backend owner responsibility
- Agentmail send logic — backend owner responsibility
- P1 / P2 / P3 features — deferred
- Mobile app — web-first
- Multi-user permissions/roles — P3

## Context

- **Hackathon:** Browser Use Web Agents Hackathon — judged on Impact (40%), Creativity (20%), Technical Difficulty (20%), Demo & Presentation (20%)
- **Team split:** Frontend owner (this project) builds all Next.js UI. Backend owner builds Convex schema, API routes, Browser Use recipes, Agentmail.
- **Demo flow (3 min):** Dashboard → house → create ticket → BOM appears → swarm runs → quote table → Proof Pack → RFQ email / cart
- **Existing code:** Python browser-use orchestrator in `bu-agent/partsource/` — NOT touched by frontend work
- **Codebase map:** `.planning/codebase/` — full analysis available

## Constraints

- **Tech stack:** Next.js 15 (App Router) + Convex (real-time reactivity) + TypeScript + Tailwind CSS + shadcn/ui
- **Sponsors to use:** Convex (DB + live queries), Vercel (deploy), AgentMail (RFQ email display), Laminar (trace links in UI)
- **Hackathon constraint:** 6–8 curated vendors only. Reliability > coverage.
- **No payment:** Cart flow stops at checkout review page — never completes payment
- **Frontend-only scope:** All API contracts assumed stable from backend. Frontend uses Convex subscriptions for live updates.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Standard 2025 stack, Vercel-native | — Pending |
| Convex for DB + real-time | Sponsor, zero-config reactivity for swarm panel | — Pending |
| shadcn/ui + Tailwind | Fast, polished, judge-friendly visuals | — Pending |
| Frontend-only focus | Backend already working; UI is the bottleneck for demo quality | — Pending |

---
*Last updated: 2026-02-28 after initialization from MEGAPLAN.md*
