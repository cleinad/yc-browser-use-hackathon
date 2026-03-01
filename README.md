# yc-browser-use-hackathon

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

## Convex <-> bu-agent bridge

Quote execution now runs through Convex actions (not direct browser SSE calls).

Set a Convex env var for the bu-agent base URL:

```bash
npx convex env set BU_AGENT_BASE_URL https://<your-bu-agent-host>
```

Important: this URL must be reachable from your Convex deployment runtime.
