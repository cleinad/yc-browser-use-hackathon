# Roadmap: ProcureSwarm Frontend

## Overview

Six phases deliver the complete frontend for ProcureSwarm: a hackathon-ready, judge-friendly web dashboard that takes a user from a blank house dashboard through natural language problem intake, live agent swarm monitoring, quote comparison, and a verifiable Proof Pack. Phase 1 scaffolds the foundation; Phases 2–5 build each major screen in demo-flow order; Phase 6 applies the UX polish that makes the demo feel like a real product.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Project Scaffolding** - Next.js 15 + Convex + HeroUI wired up and deployed to Vercel
- [ ] **Phase 2: House Dashboard + House Detail** - Full house grid and per-house timeline with Convex real-time subscriptions
- [ ] **Phase 3: Problem Intake + BOM Display** - Ticket creation form, triage card, Fix Pack list, and swarm launch button
- [ ] **Phase 4: Live Swarm Panel** - Real-time per-vendor progress grid updated via Convex subscriptions
- [ ] **Phase 5: Quote Comparison + Bundle Optimizer + Proof Pack** - Quote table, bundle recommendation card, RFQ status, and /proof/[ticketId] view
- [ ] **Phase 6: Navigation Polish + Global UX** - Breadcrumbs, skeletons, error banners, empty states across all routes

## Phase Details

### Phase 1: Project Scaffolding
**Goal**: A runnable Next.js 15 app with Convex connected, HeroUI available (dark mode only, indigo/blue primary), and deployed to Vercel — ready for feature work
**Depends on**: Nothing (first phase)
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts the app with no errors; the root route renders without crashing
  2. A Convex `useQuery` call in a page component returns data (or empty array) from the Convex dev deployment — confirming the client is wired up
  3. A HeroUI Button component renders correctly on a verification page with indigo primary color, confirming HeroUI is installed and styled
  4. Pushing to main auto-deploys to Vercel and the live URL is accessible
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 15 + HeroUI (Tailwind v4) + Convex: bootstrap project, configure dark theme, wire providers, init Convex with houses schema, build verification page
- [ ] 01-02-PLAN.md — Configure Vercel deployment: add vercel.json + .vercelignore, connect GitHub repo, set NEXT_PUBLIC_CONVEX_URL in Vercel dashboard, verify production URL

### Phase 2: House Dashboard + House Detail
**Goal**: Users can navigate a grid of house cards and drill into a house to see its full event timeline and open tickets — all updating live
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, HOUSE-01, HOUSE-02, HOUSE-03, HOUSE-04, HOUSE-05, HOUSE-06
**Success Criteria** (what must be TRUE):
  1. Visiting `/` shows a responsive grid of house cards, each displaying house name, address, open ticket count, and last activity timestamp
  2. Clicking a house card navigates to `/house/[id]` showing the house name and address in the page header
  3. The house detail page has three tabs (History, Open Tickets, Settings); switching tabs shows the correct content
  4. The History tab renders a timeline of events sorted newest-first, with type icon, summary text, timestamp, and optional proof links per event
  5. The Open Tickets tab lists all tickets for the house with visible status badges
  6. A new house can be created via a form/dialog accessible from the dashboard; it appears in the grid immediately without a page refresh
**Plans**: TBD

Plans:
- [ ] 02-01: Build `/` dashboard — HouseCard component, grid layout, Convex `listHouses` query, "New House" dialog with `createHouse` mutation
- [ ] 02-02: Build `/house/[id]` — page header, tab layout (History / Open Tickets / Settings), Convex `getHouseDetail` + `getHouseEvents` subscriptions, TimelineEvent and TicketRow components

### Phase 3: Problem Intake + BOM Display
**Goal**: From a house page, a user can submit a natural language problem and see the structured triage card and Fix Pack list appear, then confirm and trigger the quote swarm
**Depends on**: Phase 2
**Requirements**: INTAKE-01, INTAKE-02, INTAKE-03, INTAKE-04, BOM-01, BOM-02, BOM-03, BOM-04
**Success Criteria** (what must be TRUE):
  1. "New Ticket" button opens a form with a single textarea; submitting it sends the problem description to the backend
  2. After submission, a triage card appears showing problem summary, room, urgency level, and constraints (with a loading skeleton while the backend processes)
  3. Below the triage card, a Fix Pack list renders each BOM item with name, quantity, specs, and a color/badge confidence indicator
  4. If the backend returns clarifying questions (up to 2), a minimal Q&A UI is shown before the Fix Pack is confirmed
  5. After the BOM is confirmed, a "Start Quote Swarm" button is visible and clickable
**Plans**: TBD

Plans:
- [ ] 03-01: Build "New Ticket" form component — textarea, submission handler calling `POST /api/triage`, loading state with TriageCard skeleton
- [ ] 03-02: Build TriageCard component (structured fields display) and BomItemList component (name/qty/specs/confidence badge)
- [ ] 03-03: Build ClarifyingQuestionsUI (conditional, max 2 questions) and "Start Quote Swarm" confirm button wired to `runQuotes` action

### Phase 4: Live Swarm Panel
**Goal**: While the quote swarm runs, users see a live grid of vendor-by-item status chips, screenshot previews, and an overall progress bar — all updating without any manual refresh
**Depends on**: Phase 3
**Requirements**: SWARM-01, SWARM-02, SWARM-03, SWARM-04, SWARM-05
**Success Criteria** (what must be TRUE):
  1. The Swarm Panel displays a grid with one cell per vendor-per-BOM-item combination
  2. Each cell shows a status chip: QUEUED, RUNNING, DONE, FAILED, or RFQ_REQUIRED
  3. Each vendor row shows the last screenshot as a thumbnail; clicking it opens a larger preview
  4. The panel updates in real-time as runs change state — no page refresh or polling required
  5. An overall progress bar shows completed runs vs total runs (e.g., "4 / 18 done")
**Plans**: TBD

Plans:
- [ ] 04-01: Build SwarmPanel component — vendor-item grid layout, StatusChip component for all states, Convex real-time subscription to Runs table
- [ ] 04-02: Add screenshot thumbnail display with click-to-enlarge, OverallProgressBar component tracking completed vs total runs

### Phase 5: Quote Comparison + Bundle Optimizer + Proof Pack
**Goal**: After the swarm completes, users can compare all vendor quotes in a table, see a deterministic bundle recommendation, inspect the Proof Pack receipts, and see RFQ status for vendors that required email outreach
**Depends on**: Phase 4
**Requirements**: QUOTE-01, QUOTE-02, QUOTE-03, QUOTE-04, QUOTE-05, PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05
**Success Criteria** (what must be TRUE):
  1. A quote comparison table renders with BOM items as columns, vendors as rows, and price+ETA in each cell; a totals row shows per-vendor total cost
  2. A "Recommended Bundle" card shows two strategies (Cheapest Total and Fastest Delivery), each with the specific vendors, items, and total cost — no vague language
  3. Vendors with RFQ_REQUIRED status display a "RFQ sent" chip and an email thread link in the quote table
  4. A "View Proof Pack" button navigates to `/proof/[ticketId]`, which renders vendor → item → screenshot → URL → timestamp → extracted fields in a clean layout
  5. Each screenshot on the Proof Pack page is clickable (opens full-size in a lightbox or new tab); the page is accessible via its URL for sharing
**Plans**: TBD

Plans:
- [ ] 05-01: Build QuoteComparisonTable component — dynamic columns (BOM items), vendor rows, price/ETA cells, totals row, RFQ status chips with email links
- [ ] 05-02: Build RecommendedBundleCard component — Cheapest and Fastest strategies with deterministic explanations
- [ ] 05-03: Build `/proof/[ticketId]` page — vendor-item grid, screenshot display with lightbox, URL/timestamp/extracted-fields layout, "View Proof Pack" button in quote table

### Phase 6: Navigation Polish + Global UX
**Goal**: Every page feels production-quality: consistent navigation with breadcrumbs, loading skeletons on all async data, error banners with retry actions, and meaningful empty states guiding users to the next step
**Depends on**: Phase 5
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. A navigation header appears on all pages; breadcrumbs accurately reflect the current location (e.g., Dashboard > House A > Ticket #3)
  2. Every page section that loads async data shows a skeleton placeholder — no blank flashes before data arrives
  3. When a Convex query or API call fails, an error banner appears with a description and a retry button
  4. When the dashboard has no houses, the houses tab has no tickets, or the quote table has no quotes, a clear empty state with a call-to-action is shown instead of an empty container
**Plans**: TBD

Plans:
- [ ] 06-01: Build global NavHeader with breadcrumb logic; apply to all route layouts
- [ ] 06-02: Create skeleton variants for HouseCard, TimelineEvent, BomItem, SwarmCell, QuoteRow; integrate into all data-loading components
- [ ] 06-03: Build ErrorBanner component with retry callback and EmptyState component with CTA; integrate across all routes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffolding | 1/2 | In progress | - |
| 2. House Dashboard + House Detail | 0/2 | Not started | - |
| 3. Problem Intake + BOM Display | 0/3 | Not started | - |
| 4. Live Swarm Panel | 0/2 | Not started | - |
| 5. Quote Comparison + Bundle Optimizer + Proof Pack | 0/3 | Not started | - |
| 6. Navigation Polish + Global UX | 0/3 | Not started | - |
