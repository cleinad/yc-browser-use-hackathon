# Proquote MVP Implementation Plan

## Goal

Implement an orchestrator that can spin up `x` browser-use subagents in parallel to source parts from multiple retailers and return optimized purchase plans.

## Scope (MVP)

- Input: natural language parts request + location + optional deadline
- Processing: parse request, dispatch retailer subagents in parallel, aggregate offers, optimize plans
- Output: top ranked purchase options with cost/delivery tradeoffs
- Out of scope: auto-ordering, account management, property dashboard

## System Architecture

1. Chat/API receives request
2. Parser converts natural language to structured parts and constraints
3. Planner selects retailers to query
4. Dispatcher runs subagents in parallel (`x` capped by semaphore)
5. Aggregator validates and normalizes offers
6. Optimizer ranks purchase plan options
7. API streams progress and returns final plans

## Proposed Project Layout

```text
bu-agent/
  api/
    server.py
  orchestrator/
    controller.py
    parser.py
    planner.py
    dispatcher.py
    aggregator.py
    optimizer.py
  retailers/
    base.py
    homedepot.py
    lowes.py
    amazon.py
  models/
    request.py
    offer.py
    result.py
    plan.py
  tests/
    unit/
    integration/
```

## Core Data Contracts

### `UserRequest`

- `request_id: str`
- `parts_text: str`
- `location: str | None`
- `deadline: datetime | None`
- `prefer_single_store: bool`
- `max_options: int`

### `PartSpec`

- `id: str`
- `normalized_query: str`
- `qty: int`
- `required_attrs: dict[str, str]`
- `optional_attrs: dict[str, str]`

### `Offer`

- `retailer: str`
- `part_id: str`
- `title: str`
- `price: float`
- `currency: str`
- `ship_cost: float | None`
- `delivery_date: datetime | None`
- `pickup_available: bool | None`
- `url: str`
- `confidence: float`
- `notes: str | None`

### `RetailerResult`

- `retailer: str`
- `offers: list[Offer]`
- `errors: list[str]`
- `duration_ms: int`

### `PlanOption`

- `line_items: list[...]`
- `subtotal: float`
- `shipping: float`
- `total: float`
- `latest_delivery: datetime | None`
- `feasible: bool`
- `tradeoff_summary: str`

## Orchestrator Execution Flow

1. Receive request and create `request_id`
2. Parse into `PartSpec[]` and constraints
3. Select retailers (v1: Home Depot, Lowe's, Amazon)
4. Dispatch `RetailerAdapter.search(parts, constraints)` in parallel
5. Enforce timeout/retry policy per retailer
6. Aggregate valid offers and errors
7. Run optimizer to produce ranked plan options
8. Return top options and supporting evidence

## Concurrency and Reliability

- `MAX_SUBAGENTS` controls parallel fan-out
- Use `asyncio.Semaphore(MAX_SUBAGENTS)`
- `RETAILER_TIMEOUT_SEC` per adapter run
- `RETAILER_RETRIES = 1` for transient failures
- Continue with partial results if one retailer fails
- Stream status events:
  - `started`
  - `parsed`
  - `retailer_started`
  - `retailer_completed`
  - `retailer_failed`
  - `optimized`
  - `completed`

## Retailer Adapter Contract

Each retailer adapter implements:

```python
class RetailerAdapter(Protocol):
    name: str
    async def search(self, parts: list[PartSpec], constraints: dict) -> RetailerResult: ...
```

Rules:

- One adapter run handles all parts for that retailer
- Output must be structured JSON-compatible data only
- No unvalidated free-form text in core offer fields
- Adapter-level logging includes request_id and retailer name

## Optimization Strategy (MVP)

1. Keep top `k` offers per part (`TOP_K_OFFERS_PER_PART`)
2. Build candidate combinations:
   - brute-force when cart is small (for example `<= 8` parts)
   - fallback greedy + local improvement for larger carts
3. Apply constraints:
   - hard: complete coverage of all parts
   - hard/soft: deadline depending on user request strictness
4. Rank by score:
   - `total_cost`
   - lateness penalty
   - split-order penalty (small convenience weight)
5. Return top `max_options` plans

## API Endpoints (Initial)

- `POST /quote`  
  accepts `UserRequest`, returns `request_id`
- `GET /quote/{request_id}`  
  returns final ranked options
- `GET /quote/{request_id}/events`  
  SSE stream for live status updates

## Configuration

- `MAX_SUBAGENTS`
- `RETAILER_TIMEOUT_SEC`
- `RETAILER_RETRIES`
- `TOP_K_OFFERS_PER_PART`
- `MAX_COMBINATIONS`
- `DEFAULT_CURRENCY`
- `ENABLE_PICKUP`

## Testing Plan

### Unit

- parser: part normalization and extraction
- optimizer: feasibility and ranking
- aggregator: schema validation and dedupe behavior

### Contract

- each adapter returns valid `RetailerResult`
- malformed adapter output fails validation clearly

### Integration

- orchestrator end-to-end with mocked adapters
- one retailer timeout still yields successful final response
- deterministic fixture for sample requests from `docs/overview.md`

## Implementation Phases

### Phase 1: Foundation

- create models and orchestrator skeleton
- implement mocked retailer adapters
- expose basic API endpoints

### Phase 2: First Live Retailer

- implement Home Depot adapter
- add robust timeout/retry and event streaming

### Phase 3: Multi-Retailer

- add Lowe's and Amazon adapters
- validate parallel execution and partial-failure behavior

### Phase 4: Optimization Quality

- improve ranking logic and tradeoff messaging
- tune scoring weights and constraints handling

### Phase 5: Hardening

- telemetry, metrics, and structured logs
- failure-mode tests and regression fixtures

## MVP Acceptance Criteria

- Supports multi-part natural language requests with optional deadline/location
- Runs at least 3 retailer subagents in parallel with configurable `x`
- Returns top ranked options with cost and delivery feasibility
- Handles single-retailer failure without blocking full response
- Streams progress updates during execution

## Immediate Next Tasks

1. Create `models/` Pydantic schemas and request/response validators
2. Build `orchestrator/controller.py` happy-path with mocked adapters
3. Add `dispatcher.py` semaphore + timeout + retry
4. Implement `optimizer.py` with small-cart brute-force baseline
5. Wire FastAPI `POST /quote` and SSE event stream
