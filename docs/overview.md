# PartSource — Intelligent Parts Procurement Agent

## Problem

Property managers and contractors regularly need to purchase multiple parts for maintenance and repair jobs. Today, this means manually searching across several retailer websites (Home Depot, Lowe's, Amazon, Ferguson, etc.), comparing prices, checking availability, estimating delivery, and figuring out the cheapest combination — often across split orders from multiple stores.

This is tedious and time-consuming. When you're managing dozens or hundreds of properties, it adds up fast.

## Solution

A chat-based AI agent that takes a natural language parts list and automatically searches multiple retailer websites in parallel, then optimizes the purchase plan across stores for cost and delivery time.

### Example Interaction

```
User: I need a 1/2 inch brass ball valve, a wax ring for a standard toilet,
      and 6ft of 3/4 inch PEX tubing. Delivery to 123 Main St, Toronto
      by Thursday.

Agent: Searching Home Depot, Lowe's, Amazon...

Agent: Here's the optimal purchase plan:

  Recommended: Split order — $41.30 total, all items arrive by Wednesday
    - Home Depot: wax ring ($5.49) + PEX tubing ($12.80) — $18.29 + free pickup
    - Lowe's: 1/2" brass ball valve ($23.01) — delivery Wed

  Alternative A: All from Home Depot — $47.82, arrives Wednesday
  Alternative B: All from Amazon — $38.50, arrives Friday (misses deadline)
```

## MVP Scope

The MVP is focused purely on the **sourcing and purchase optimization** experience:

- **Chat interface** — single page, conversational UI
- **Input** — user describes what they need in natural language, including delivery constraints
- **Output** — optimized purchase plan with options, showing price/delivery tradeoffs

Not in MVP scope: property dashboard, contractor matching, auto-ordering, account management.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Chat UI                        │
│              (Next.js frontend)                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│              Orchestrator Agent                  │
│                                                  │
│  1. Parse user request → structured parts list   │
│  2. Determine which retailers to search          │
│  3. Spawn sub-agents in parallel                 │
│  4. Aggregate results                            │
│  5. Run purchase optimization                    │
│  6. Present options to user                      │
└────┬──────────┬──────────┬──────────┬───────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  Home  │ │Lowe's  │ │ Amazon │ │  ...   │
│  Depot │ │ Agent  │ │ Agent  │ │        │
│  Agent │ │        │ │        │ │        │
└────────┘ └────────┘ └────────┘ └────────┘
   browser-use sub-agents (parallel)
```

### Orchestrator Agent

The orchestrator is an LLM-powered agent responsible for:

- **Parsing**: Converting natural language ("I need a wax ring for a standard toilet") into structured queries with enough specificity to search accurately
- **Dispatching**: Spinning up browser-use sub-agents per retailer, running them in parallel
- **Aggregation**: Collecting structured results from each sub-agent
- **Optimization**: Finding the best purchase plan given constraints (cost, delivery date, single-store vs split-order tradeoffs)

### Sub-Agents (browser-use)

Each sub-agent is a browser-use instance targeting a single retailer site. For each part in the list, it:

1. Searches the retailer's website
2. Identifies the correct matching product (using LLM judgement for relevance)
3. Extracts: product name, price, availability, delivery/pickup estimate, product URL
4. Returns structured results back to the orchestrator

Sub-agents run in parallel to keep total response time manageable.

### Purchase Optimization

The key insight: **you rarely buy one part at a time.** Optimizing a multi-part purchase across multiple stores is a combinatorial problem. The optimizer considers:

- **Per-item price** across stores
- **Shipping costs** — buying more from one store may unlock free shipping
- **Delivery date constraints** — user may have a hard deadline (contractor is coming Thursday)
- **Pickup vs delivery** — local pickup may be faster and cheaper
- **Single-store convenience** vs split-order savings

The output is a set of ranked purchase plans, not just a raw price list.

## Key Technical Challenges

### Part Identification

Mapping natural language descriptions to the correct products across different retailers. "1/2 inch ball valve" returns many results — the agent needs to determine which one actually matches. Approach: use the LLM to judge relevance from search results, filtering by specs mentioned in the query.

### Delivery Estimation

Retailers show delivery info differently. Some show exact dates, some show ranges, some require entering a zip code first. The sub-agents need to handle each site's UX to extract this data. For MVP, surface whatever the site shows and flag uncertainty.

### Speed

Searching multiple sites takes time even in parallel. The UI should stream status updates as sub-agents complete, so the user sees progress rather than waiting for everything to finish.

## Target Retailers (v1)

- Home Depot (homedepot.ca / homedepot.com)
- Lowe's (lowes.ca / lowes.com)
- Amazon (amazon.ca / amazon.com)

Additional retailers (Ferguson, Grainger, local suppliers) can be added as additional sub-agent configs.

## Future Directions (Post-MVP)

- **Property dashboard** — manage multiple properties and their maintenance issues
- **Contractor integration** — contractors submit parts lists directly into the system
- **Auto-ordering** — one-click purchase through the platform
- **Order tracking** — unified tracking across multiple retailer orders
- **Historical pricing** — track price trends for commonly purchased parts
- **Preferred vendor rules** — "always check Ferguson first for plumbing parts"
- **Bulk/contractor pricing** — leverage volume for better rates
