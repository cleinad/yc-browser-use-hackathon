# Project Context

## System Split

### Frontend (`app/`) + Clerk
- Owns user-facing UI and routing.
- Uses Clerk for authentication and session management.
- Talks to Convex functions (queries/mutations) for application data.
- Should not call `bu-agent` directly in the default architecture.

### Convex (`convex/`)
- Source of truth for backend logic and database.
- Stores users, quote requests, status events, and results.
- Validates auth with Clerk JWTs.
- Bridges to `bu-agent` via internal action (`quotes.processRequest`).

### `bu-agent/`
- Browser-use orchestration worker only.
- Runs retailer search/agent workflows and emits status/log/result streams.
- Does not own app auth or app database state.

## Request Flow
1. User signs in via Clerk.
2. Frontend upserts user in Convex.
3. Frontend submits quote request to Convex.
4. Convex creates the request row and starts processing action.
5. Convex action calls `bu-agent` and persists streamed events/results.
6. Frontend renders live state from Convex queries.

## Optional Local Dev Shortcut
- `NEXT_PUBLIC_DIRECT_BU_AGENT_MODE=true` enables a direct browser -> `bu-agent` quote path.
- This bypasses Convex quote processing and stores request/session state in memory only.
- Use this for local iteration only; Convex remains the default integration boundary.

## Boundaries
- Auth lives in Clerk.
- Persistent state lives in Convex.
- Agent execution lives in `bu-agent`.

If behavior spans multiple layers, Convex is the integration boundary.
