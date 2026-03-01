# yc-browser-use-hackathon

## Architecture

- Frontend (`app/`) handles UI and Clerk auth.
- Convex (`convex/`) is backend + database.
- `bu-agent/` is browser-use orchestration only.

See [docs/CONTEXT.md](docs/CONTEXT.md) for the definitive split and request flow.

setup venv
```bash
uv venv --python 3.12
source .venv/bin/activate
# On Windows use `.venv\Scripts\activate`
```

## Proquote orchestrator

Run interactively (REPL):
```bash
cd bu-agent
./.venv/bin/python run.py
```

Run with a one-shot request:
```bash
cd bu-agent
./.venv/bin/python run.py "I need a 1/2 inch brass ball valve and a wax ring for a standard toilet"
```

## Weather fanout test

Run 5 parallel weather agents
```bash
cd bu-agent
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5
```

run with visible browser windows
```bash
cd bu-agent
./.venv/bin/python tests/run_weather_fanout.py --mode process --agents 5 --show-browser
```

# Backend
cd bu-agent && .venv/bin/uvicorn server:app --reload --port 8000

# Frontend
Run these in **two separate terminals** when developing:

1. **Convex dev server** (keep running) — syncs Convex functions and generates API types:
   ```bash
   npx convex dev
   ```

2. **Next.js dev server**:
   ```bash
   npm install && npm run dev
   ```

The Convex dev server must stay running for auth, database, and Convex functions to work.

## One-command dev workflow

You can run the full local stack with:

```bash
./dev.sh
```

If you want Convex to call local `bu-agent`, run with a tunnel:

```bash
./dev.sh tunnel
```

To auto-set Convex env from the detected tunnel URL:

```bash
./dev.sh tunnel --set-convex-env
```

Optional provider override:

```bash
./dev.sh tunnel --provider ngrok --set-convex-env
```

`./dev.sh tunnel` requires one of these on your PATH:
- `cloudflared` (default provider)
- `ngrok` (when using `--provider ngrok`)

## Recommended local setup (persistent property chat)

For `/properties/[id]/chat`, the app uses Convex-backed request persistence.
That means Convex must be able to reach `bu-agent` over a public URL.

Use this workflow:

1. Start everything and auto-configure Convex: USE THIS!
   ```bash
   ./dev.sh tunnel --set-convex-env
   ```
2. Keep these processes running:
   - `npx convex dev`
   - `uvicorn` (started by `dev.sh`)
   - `npm run dev` (started by `dev.sh`)
   - tunnel process (started by `dev.sh`)
3. If the tunnel URL changes (common on free tiers), rerun:
   ```bash
   ./dev.sh tunnel --set-convex-env
   ```

You can also set it manually:

```bash
npx convex env set BU_AGENT_BASE_URL https://<public-bu-agent-url>
```

## Troubleshooting slow/stuck "Analyzing request"

If the chat appears to stay on "Analyzing request" for too long, it is usually waiting on
LLM parsing/optimization or long browser sub-agent attempts.

`dev.sh` now sets faster local defaults for `bu-agent`:
- `PROQUOTE_LLM_TIMEOUT_SEC=45`
- `PROQUOTE_PER_AGENT_TIMEOUT_SEC=60`
- `PROQUOTE_RETRIES=0`
- `PROQUOTE_REQUEST_TIMEOUT_SEC=300`

Override any of these when launching:

```bash
PROQUOTE_PER_AGENT_TIMEOUT_SEC=90 PROQUOTE_RETRIES=1 ./dev.sh tunnel --set-convex-env
```

## Convex <-> bu-agent bridge

Quote execution now runs through Convex actions (not direct browser SSE calls).

Set a Convex env var for the bu-agent base URL:

```bash
npx convex env set BU_AGENT_BASE_URL https://<your-bu-agent-host>
```

Important: this URL must be reachable from your Convex deployment runtime.

## Optional: direct bu-agent mode (local dev shortcut)

If you want to use direct browser -> `bu-agent` streaming for non-property/legacy flows,
set this in `.env.local`:

```bash
NEXT_PUBLIC_DIRECT_BU_AGENT_MODE=true
```

Direct mode uses `NEXT_PUBLIC_API_BASE` (defaults to `http://localhost:8000`) and keeps
chat request state in memory on `bu-agent` + browser session state in the current tab.
It does not use Convex for quote request persistence/history.
Property-scoped chat (`/properties/[id]/chat`) still uses Convex for persistence.

## Hackathon mode (fast local demo, no tunnel)

If you want property chat to skip Convex -> bu-agent bridging and call local `bu-agent`
directly from the browser, set:

```bash
NEXT_PUBLIC_DIRECT_BU_AGENT_MODE=true
NEXT_PUBLIC_HACKATHON_DIRECT_MODE=true
```

Behavior in hackathon mode:
- Property chat streams directly to `NEXT_PUBLIC_API_BASE` (default `http://localhost:8000`).
- No tunnel is required.
- Chat history is persisted in browser `localStorage` per property (survives refresh on same browser).
- History is not shared across devices/sessions and is not written to Convex quote tables.
