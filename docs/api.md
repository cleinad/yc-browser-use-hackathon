# Proquote API Reference

Base URL: `http://localhost:8000`

---

## POST /quote

Start an async quote job. Poll results via SSE at `/quote/{request_id}/events`.

### Request

```json
{
  "text": "string (required) — natural-language purchase request",
  "retailers": ["string"] | null
}
```

### Response

```json
{
  "request_id": "string — 12-char hex ID"
}
```

---

## GET /quote/{request_id}/events

SSE stream of events for an in-progress quote job.

### Event types

#### `status`

```json
{
  "event_type": "orchestrator_started" | "subagent_started" | "subagent_retrying" | "subagent_completed" | "subagent_failed" | "orchestrator_completed",
  "timestamp": "ISO 8601 string",
  "message": "string | null",
  "job_id": "string | null",
  "job_label": "string | null",
  "attempt": "int | null"
}
```

#### `log`

```
data: "plain string message"
```

#### `result`

Data is a `PurchasePlan` JSON (see shape below).

#### `error`

```
data: "error message string"
```

---

## POST /quote/sync

Run a quote synchronously. Returns the `PurchasePlan` directly.

### Request

Same as `POST /quote`:

```json
{
  "text": "string (required)",
  "retailers": ["string"] | null
}
```

### Response

Returns a `PurchasePlan` JSON (see below).

---

## POST /workers

Start an async worker search. Poll results via SSE at `/workers/{request_id}/events`.

### Request

```json
{
  "text": "string (required) — natural-language description of the job needed"
}
```

### Response

```json
{
  "request_id": "string — 12-char hex ID"
}
```

---

## GET /workers/{request_id}/events

SSE stream of events for an in-progress worker search.

### Event types

#### `status`

Same shape as quote status events (see StatusEvent below).

#### `log`

```
data: "plain string message"
```

#### `result`

Data is a `WorkerSearchResult` JSON (see shape below).

#### `error`

```
data: "error message string"
```

---

## JSON Shapes

### QuoteRequest

```json
{
  "text": "string",
  "retailers": ["string"] | null
}
```

### QuoteResponse

```json
{
  "request_id": "string"
}
```

### StatusEvent

```json
{
  "event_type": "orchestrator_started | subagent_started | subagent_retrying | subagent_completed | subagent_failed | orchestrator_completed",
  "timestamp": "ISO 8601 string",
  "message": "string | null",
  "job_id": "string | null",
  "job_label": "string | null",
  "attempt": "int | null"
}
```

### PurchasePlan

```json
{
  "options": [PlanOption],
  "notes": "string | null"
}
```

### PlanOption

```json
{
  "rank": 1,
  "summary": "string",
  "line_items": [LineItem],
  "estimated_total": 123.45 | null,
  "currency": "USD",
  "delivery_summary": "string | null",
  "tradeoffs": "string | null"
}
```

### LineItem

```json
{
  "part_name": "string",
  "product_name": "string",
  "price": 12.99 | null,
  "currency": "USD",
  "availability": "string | null",
  "delivery_estimate": "string | null",
  "product_url": "string | null",
  "image_url": "string | null",
  "retailer": "string | null"
}
```

### WorkerRequest

```json
{
  "text": "string"
}
```

### WorkerResponse

```json
{
  "request_id": "string"
}
```

### WorkerSearchResult

```json
{
  "workers": [WorkerResult],
  "trade": "plumbing | electrical | hvac | general_handyman | roofing | painting | carpentry | appliance_repair | landscaping | cleaning",
  "notes": "string | null"
}
```

### WorkerResult

```json
{
  "name": "string",
  "phone": "string | null",
  "address": "string | null",
  "rating": 4.5 | null,
  "trade_category": "string — same trade categories as above"
}
```
