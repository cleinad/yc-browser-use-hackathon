````md
# ProcureSwarm — Repair-to-Procurement Web Agent (Hackathon PRD + Build Plan)

**Goal:** Win the Browser Use Web Agents Hackathon by maximizing judging criteria:
- **Impact (40%)**: clear ROI/time-savings + realistic workflow completion
- **Creativity (20%)**: multi-agent swarm + bundle optimization + fallback outreach
- **Technical Difficulty (20%)**: orchestration, extraction, receipts/audit trail, state machine
- **Demo & Presentation (20%)**: polished dashboard + live progress + Proof Pack + artifacts

**Core demo use-case:**  
User types a natural language maintenance issue like: **"Bathroom toilet seat broken"**  
System generates a **multi-part Fix Pack (BOM)**, runs a **vendor quote swarm**, picks a **bundle strategy**, produces a **Proof Pack**, and then either:
- **autoplaces a cart** on stable checkout vendors, or
- sends **RFQs via email (and optionally phone)** when checkout isn’t possible.

---

## Product Overview

### What the user experiences
1. Select a **House** in a dashboard
2. Enter a **Problem Ticket** (natural language)
3. System generates a **Diagnosis + BOM (Bill of Materials)**
4. Run **multi-agent procurement swarm** across vendors for each BOM item
5. System computes the **best bundle** (cheapest vs fastest)
6. User reviews **Proof Pack** receipts
7. **Approval** (optional) → **Order** (cart) or **RFQ outreach** (email/phone)
8. Everything is logged in **House history timeline**

---

## Data Model (Convex suggested)

### Tables
- `Houses { _id, name, address, tags[], budgetMonthly?, createdAt }`
- `Tickets { _id, houseId, problemText, triageJson, status, createdAt }`
- `BomItems { _id, ticketId, itemName, qty, specsJson, confidence, createdAt }`
- `Runs { _id, bomItemId, vendorId, state, extractedQuoteJson, rfqRequired, startedAt, finishedAt, error? }`
- `Artifacts { _id, runId, type, url, metaJson, createdAt }`  
  Types: `screenshot`, `proof`, `pdf`, `html`, `trace_link`
- `Threads { _id, ticketId, channel, externalId, to, subject, status, createdAt }`  
  Channels: `email`, `phone`
- `Events { _id, houseId, ticketId?, type, summary, links[], createdAt }`  
  Append-only audit log used for timeline.

### Status state machine (Tickets)
- `DRAFT` → `BOM_READY` → `QUOTING` → `QUOTED` → `PENDING_APPROVAL` → `APPROVED` → `ORDERING/RFQ_SENT` → `DONE`

---

## Vendor Recipe Pack (curated)
Maintain `vendors.ts`:
```ts
type Vendor = {
  id: string;
  name: string;
  baseUrl: string;
  mode: "checkout" | "rfq";
  searchRecipeId: string;     // Browser Use recipe for search/extract
  contactRecipeId?: string;   // Browser Use recipe to find email/phone/contact form
  cartRecipeId?: string;      // Browser Use recipe to add-to-cart/checkout (stable vendors only)
};
````

**Hackathon constraint:** You only support **6–8 vendors** you have tested repeatedly.
Coverage is not the goal. Reliability is.

---

# P0 → P3 Features (What we build + How we build it)

## P0 — Must Ship (demo backbone, highest scoring)

### P0.1 — House Dashboard (All Houses)

**User value:** Central control to manage multiple houses/properties and all procurement history.

**Backend (Convex)**

* Query: `listHouses()` returns houses + aggregates:

  * open tickets count
  * last activity timestamp from Events
  * monthly spend (optional; can be stubbed)
* Mutations: `createHouse()`, `updateHouse()`

**Frontend**

* `/` dashboard grid of house cards
* Each card shows KPIs: open tickets, last activity, spend/budget (optional)
* Click card → house detail page

---

### P0.2 — House Detail + History Timeline (“history and shi”)

**User value:** Drill into a house to see all issues, purchases, and agent activity.

**Backend**

* Query: `getHouseDetail(houseId)` → house + related tickets
* Query: `getHouseEvents(houseId)` → timeline sorted desc
* Mutation: `appendEvent({houseId, ticketId, type, summary, links})` used by every action

**Frontend**

* `/house/[id]` with tabs:

  * `History` (timeline)
  * `Open Tickets`
  * `Settings` (optional)
* Timeline renders events with links to Proof Pack / PDFs

---

### P0.3 — Problem Intake (natural language)

**User value:** “Bathroom toilet seat broken” is enough.

**Backend**

* `POST /api/triage`:

  * LLM returns strict JSON:

    ```json
    { "problem":"...", "room":"bathroom", "urgency":"low|med|high",
      "constraints":{"budget":..., "delivery_by":"..."} }
    ```
  * Validate with Zod; repair/retry once if invalid.
  * Store in `Tickets` and append event `TICKET_CREATED`.

**Frontend**

* Ticket creation form in house page
* Show “Triage card” with parsed structured fields

---

### P0.4 — Diagnosis → BOM (Bill of Materials) generator

**User value:** One problem becomes a **multi-part Fix Pack** with quantities and specs.

**Backend**

* `POST /api/bom` or Convex action `generateBom(ticketId)`:

  * Planner agent produces BOM:

    ```json
    {
      "items":[
        {"item":"toilet seat", "qty":1, "specs":{"shape":"round|elongated","color":"white"}, "confidence":0.8},
        {"item":"toilet seat bolt kit", "qty":1, "specs":{"mount":"top|bottom|universal"}, "confidence":0.7},
        {"item":"hinge kit", "qty":1, "specs":{}, "confidence":0.6}
      ],
      "questions":[ ...max 2... ]
    }
    ```
  * Hard rule: ask at most **2 clarifying questions** total. If unanswered, choose “universal” parts and mark lower confidence.
  * Store each in `BomItems`.
  * Append event `BOM_READY`.

**Frontend**

* Display Fix Pack list with specs + confidence
* If questions exist: render minimal Q UI (max 2), then confirm

---

### P0.5 — Multi-agent quote swarm (per BOM line item)

**User value:** It finds prices/availability fast across multiple vendors.

**Backend**

* `POST /api/runQuotes(ticketId)`:

  * Read BOM items
  * For each BOM item, create `Runs` for each vendor
  * Spawn workers with concurrency cap (e.g., 4):

    * call Browser Use with `searchRecipeId`:

      * open vendor
      * search item + specs
      * pick best match
      * extract price/availability/ETA/shipping if visible
      * take screenshots (always)
  * Stream run updates to DB:

    * `state: QUEUED → RUNNING → DONE|FAILED|RFQ_REQUIRED`
  * Append events: `QUOTE_STARTED`, `QUOTE_VENDOR_DONE`, `QUOTE_COMPLETE`

**Frontend**

* Live “Swarm Panel”:

  * progress bars per vendor + per BOM item
  * status chips and last screenshot preview
* When complete: show quote table + bundle recommendation

---

### P0.6 — Quote extraction + normalization + bundle optimizer

**User value:** Decides “buy all from 1 vendor” vs “split”.

**Backend**

* For each run, store:

  ```json
  { "unitPrice":..., "shipping":..., "etaText":"...", "stockText":"...", "returnSnippet":"..." }
  ```
* Normalization:

  * `total = qty*unitPrice + shipping`
  * if shipping unknown: store `totalRange` and mark `confidence`
* Bundle optimizer heuristic:

  * compute total for each vendor that can satisfy most items
  * compute split strategy for missing items (penalize extra shipping)
  * output two recommended strategies:

    * `Cheapest Total`
    * `Fastest Delivery`
* Store in ticket summary.

**Frontend**

* Comparison table: line-item breakdown + vendor totals
* “Recommended bundle” card with explanation (deterministic, not vibes)

---

### P0.7 — Proof Pack (receipts/audit)

**User value:** Trust + verifiability; judges love it.

**Backend**

* Every run saves artifacts:

  * screenshot of price area
  * final URL
  * timestamp
  * extracted fields
* Provide `GET /proof/[ticketId]` rendering all items/vendors with receipts
* Append event `PROOF_PACK_READY`

**Frontend**

* “Proof Pack” button next to every quote
* Opens a clean, judge-friendly proof page:

  * vendor → item → screenshot → URL → timestamp → extracted fields

---

### P0.8 — Fallback: If no checkout, RFQ via Email AND/OR Phone

**User value:** Agent takes action instead of giving up.

**Backend**

* Detection: if cart/checkout not reachable in X steps OR vendor mode is `rfq`:

  * mark run `RFQ_REQUIRED`
* **Email path (default)**

  * Browser Use `contactRecipeId` finds procurement email/contact form
  * Use **Agentmail** to send RFQ:

    * subject: `RFQ: <house> - <problem> - Need quote by <date>`
    * body: BOM items, qty, ship-to, deadline, ask for lead time and quote
  * Store `Threads(email)` with `externalId`
  * Append event `RFQ_EMAIL_SENT`
* **Phone path (optional)**

  * Extract phone number from site
  * Generate call script + questions
  * Only place call if you have a controlled endpoint (demo-safe)
  * Store transcript and append event `RFQ_PHONE_CALLED`

**Frontend**

* In quote table, show “RFQ sent” status and email thread link
* Show “contact found” proof (screenshot of contact page)

---

## P1 — Build if on track (closes loop, adds “full stack” feel)

### P1.1 — Approval gate (owner/manager)

**Backend**

* Ticket status to `PENDING_APPROVAL`
* Send approval email via Agentmail with signed token link
* `POST /api/approve?token=...` updates ticket to `APPROVED`
* Append event `APPROVED`

**Frontend**

* “Request approval” + “Approve” UI
* Approval page shows summary + one click approve

---

### P1.2 — Autoplace order on 1–2 stable vendors (stop before payment)

**Backend**

* Only for vendors with `cartRecipeId`
* Browser Use recipe:

  * add selected items to cart
  * set qty
  * proceed to checkout
  * STOP at final review page (no payment)
  * screenshot “Order Summary”
* Store artifacts + append event `CART_READY`

**Frontend**

* “Build Cart” button
* Show screenshot proof of checkout review screen

---

### P1.3 — Repair Pack PDF (Work Order + Purchase Plan)

**Backend**

* Deterministic PDF generation:

  * problem, BOM, bundle choice, totals, proof links, approval record
* Save artifact and append event `PACKET_PDF_READY`

**Frontend**

* “Download Packet” button

---

## P2 — Stretch (adds technical difficulty + monitoring)

### P2.1 — Policy engine (per house)

**Backend**

* House settings: preferred vendors, spend threshold, blocked categories
* Evaluate before approval/order; add flags to ticket
* Append event `POLICY_FLAGGED` when triggered

**Frontend**

* Policy flags banner + explanation

---

### P2.2 — Recheck & diff (monitoring)

**Backend**

* Store quote snapshots
* Allow rerun for top vendors and show diff:

  * price changed
  * ETA changed
  * page changed
* Append event `RECHECK_COMPLETE`

**Frontend**

* Diff view component (before vs after)

---

### P2.3 — Observability / tracing (Laminar)

**Backend**

* Wrap each run in a Laminar trace:

  * inputs (BOM item, vendor)
  * steps
  * extraction attempts + fallbacks
  * outputs and errors
* Store trace link as artifact

**Frontend**

* “Trace” link for each vendor run (optional in demo)

---

## P3 — Do not build (mention only in Q&A)

* Inventory + auto-restock
* Contractor dispatch
* ERP integrations (NetSuite/SAP)
* Multi-user permissions/roles

---

# Team Split: Frontend vs Backend (per feature)

## Backend owner (Person A)

Owns:

* Convex schema + queries/mutations/actions
* `POST /api/*` endpoints (triage, BOM, runQuotes, approve)
* Browser Use orchestration + vendor recipes
* Agentmail integration (RFQs + approvals)
* Proof Pack artifact storage
* Bundle optimizer
* Laminar tracing (optional)

Deliverables:

* Stable API contracts (JSON schemas)
* Reliability: retries, timeouts, skip-on-fail
* Seed data for 3 houses + 2 demo tickets

## Frontend owner (Person B)

Owns:

* Next.js UI routes: `/`, `/house/[id]`, `/ticket/[id]`, `/proof/[ticketId]`, `/approve/[token]`
* Dashboard visuals + cards + KPIs
* Swarm progress UI (live updates)
* Quote table + bundle recommendation UI
* Timeline/history UI
* PDF download link display
* Polish: loading states, skeletons, error banners

Deliverables:

* Demo-ready visuals
* “Judge-friendly” Proof Pack view
* Tight 3-minute demo flow

---

# Live Demo Plan (3 minutes)

1. Dashboard: show 3 houses → click House A
2. Create ticket: “Bathroom toilet seat broken”
3. Fix Pack (BOM) appears (maybe 1 clarifying question)
4. Start swarm: 6 vendors running in parallel
5. Show quote table + recommended bundle
6. Click Proof Pack: screenshots + URLs + timestamps
7. Vendor without checkout triggers RFQ email (Agentmail) OR build cart on stable vendor
8. Timeline updates live on house page

---

# Non-negotiable Constraints (to avoid embarrassment)

* Curate vendors and test recipes repeatedly.
* Always produce receipts even if extraction fails.
* Cap clarifying questions at 2.
* Email > phone for reliability (phone only if controlled).
* If something fails, mark it and keep moving (never block the job).

---

# Definition of Done (hackathon)

* P0 fully works live, end-to-end, on at least 1 problem scenario.
* Proof Pack is beautiful and undeniable.
* RFQ email fallback works at least once in demo.
* Dashboard/history makes it look like a real product.

```

If you want, I can also convert this into **two checklists** (Frontend checklist + Backend checklist) with “must finish by hour X” so you don’t drift and die.
```
