# Requirements: ProcureSwarm Frontend

**Defined:** 2026-02-28
**Core Value:** From "toilet seat broken" to multi-vendor quotes with procurement action in under 3 minutes — with a judge-friendly Proof Pack that makes every quote verifiable.

---

## v1 Requirements (P0 Frontend — must ship for demo)

### Project Setup

- [ ] **SETUP-01**: Next.js 15 App Router project scaffolded with TypeScript and Tailwind CSS
- [ ] **SETUP-02**: Convex client configured and connected (real-time subscriptions working)
- [ ] **SETUP-03**: shadcn/ui installed with base component library
- [ ] **SETUP-04**: Vercel deployment configured (sponsor)

### House Dashboard

- [ ] **DASH-01**: User sees a grid of house cards at `/`
- [ ] **DASH-02**: Each house card displays: house name, address, open ticket count, last activity timestamp
- [ ] **DASH-03**: User can create a new house via a form/dialog (name + address)
- [ ] **DASH-04**: Clicking a house card navigates to `/house/[id]`

### House Detail + History Timeline

- [ ] **HOUSE-01**: `/house/[id]` displays house name and address in a header
- [ ] **HOUSE-02**: House detail page has tabs: History, Open Tickets, Settings
- [ ] **HOUSE-03**: History tab renders a chronological event timeline (sorted descending)
- [ ] **HOUSE-04**: Each timeline event shows: type icon, summary text, timestamp, and optional proof links
- [ ] **HOUSE-05**: Open Tickets tab lists all tickets for the house with status badges
- [ ] **HOUSE-06**: Timeline updates in real-time as events are appended (Convex subscription)

### Problem Intake

- [ ] **INTAKE-01**: User can open a "New Ticket" form from the house detail page
- [ ] **INTAKE-02**: Form accepts natural language problem description (single textarea)
- [ ] **INTAKE-03**: After submission, a triage card renders with structured fields: problem summary, room, urgency (low/med/high), constraints
- [ ] **INTAKE-04**: Triage card shows a loading skeleton while the backend processes the natural language

### BOM / Fix Pack Display

- [ ] **BOM-01**: Fix Pack list renders below the triage card showing: item name, qty, specs, confidence level
- [ ] **BOM-02**: Confidence level displayed as a visual indicator (color or badge) per item
- [ ] **BOM-03**: If clarifying questions returned (max 2): render a minimal Q&A UI before confirming
- [ ] **BOM-04**: "Start Quote Swarm" button appears after BOM is confirmed

### Live Swarm Panel

- [ ] **SWARM-01**: Swarm Panel shows a progress indicator per vendor per BOM item (grid or table layout)
- [ ] **SWARM-02**: Each vendor cell shows status chip: QUEUED / RUNNING / DONE / FAILED / RFQ_REQUIRED
- [ ] **SWARM-03**: Last screenshot preview displayed per vendor run (thumbnail, click to enlarge)
- [ ] **SWARM-04**: Swarm Panel updates in real-time via Convex subscription (no manual refresh)
- [ ] **SWARM-05**: Overall progress bar shows total runs completed vs total

### Quote Comparison + Bundle Optimizer

- [ ] **QUOTE-01**: Quote comparison table renders after swarm completes: columns = BOM item, rows = vendor, cells = price + ETA
- [ ] **QUOTE-02**: Vendor totals row shows total cost per vendor
- [ ] **QUOTE-03**: "Recommended Bundle" card appears with two strategies: Cheapest Total and Fastest Delivery
- [ ] **QUOTE-04**: Each strategy shows deterministic explanation (which vendors + items + total cost)
- [ ] **QUOTE-05**: Runs with RFQ_REQUIRED status show "RFQ sent" chip + email thread link

### Proof Pack Page

- [ ] **PROOF-01**: `/proof/[ticketId]` renders a clean, judge-friendly view
- [ ] **PROOF-02**: Page organized by vendor → item → screenshot → URL → timestamp → extracted fields
- [ ] **PROOF-03**: "View Proof Pack" button accessible from the quote table
- [ ] **PROOF-04**: Each screenshot is clickable (lightbox or new tab)
- [ ] **PROOF-05**: Page is printable / shareable via URL

### Navigation + Global UX

- [ ] **NAV-01**: Consistent navigation header across all pages with breadcrumbs
- [ ] **NAV-02**: Loading skeletons shown for all async data (no blank states)
- [ ] **NAV-03**: Error banners displayed when API calls fail (with retry option)
- [ ] **NAV-04**: Empty states with clear CTA when no houses / no tickets / no quotes exist

---

## v2 Requirements (P1 — build if ahead of schedule)

### Approval Gate

- **APPR-01**: "Request Approval" button on ticket detail
- **APPR-02**: `/approve/[token]` page shows ticket summary + one-click approve button
- **APPR-03**: Approved status reflected in ticket and timeline

### Cart Build Flow

- **CART-01**: "Build Cart" button triggers cart recipe for stable vendors
- **CART-02**: Screenshot proof of checkout review screen displayed

### PDF Download

- **PDF-01**: "Download Packet" button for Repair Pack PDF

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend Convex schema/mutations | Backend owner responsibility |
| POST /api/* endpoints | Backend owner responsibility |
| Browser Use orchestration | Backend owner responsibility |
| Agentmail send logic | Backend owner responsibility |
| Phone call / RFQ phone UI | Demo-risky, email path is reliable |
| Multi-user auth / login | Not needed for hackathon demo |
| P2 policy engine UI | Stretch, defer |
| P2 recheck/diff UI | Stretch, defer |
| P3 features | Explicitly excluded |
| Mobile responsive polish | Web-first for judges on desktop |

---

## Traceability

*Populated by ROADMAP.md creation — 2026-02-28. All 40 v1 requirements mapped.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 1 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| HOUSE-01 | Phase 2 | Pending |
| HOUSE-02 | Phase 2 | Pending |
| HOUSE-03 | Phase 2 | Pending |
| HOUSE-04 | Phase 2 | Pending |
| HOUSE-05 | Phase 2 | Pending |
| HOUSE-06 | Phase 2 | Pending |
| INTAKE-01 | Phase 3 | Pending |
| INTAKE-02 | Phase 3 | Pending |
| INTAKE-03 | Phase 3 | Pending |
| INTAKE-04 | Phase 3 | Pending |
| BOM-01 | Phase 3 | Pending |
| BOM-02 | Phase 3 | Pending |
| BOM-03 | Phase 3 | Pending |
| BOM-04 | Phase 3 | Pending |
| SWARM-01 | Phase 4 | Pending |
| SWARM-02 | Phase 4 | Pending |
| SWARM-03 | Phase 4 | Pending |
| SWARM-04 | Phase 4 | Pending |
| SWARM-05 | Phase 4 | Pending |
| QUOTE-01 | Phase 5 | Pending |
| QUOTE-02 | Phase 5 | Pending |
| QUOTE-03 | Phase 5 | Pending |
| QUOTE-04 | Phase 5 | Pending |
| QUOTE-05 | Phase 5 | Pending |
| PROOF-01 | Phase 5 | Pending |
| PROOF-02 | Phase 5 | Pending |
| PROOF-03 | Phase 5 | Pending |
| PROOF-04 | Phase 5 | Pending |
| PROOF-05 | Phase 5 | Pending |
| NAV-01 | Phase 6 | Pending |
| NAV-02 | Phase 6 | Pending |
| NAV-03 | Phase 6 | Pending |
| NAV-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-28*
*Last updated: 2026-02-28 — ROADMAP.md created, traceability confirmed complete*
