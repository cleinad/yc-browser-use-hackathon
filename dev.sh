#!/usr/bin/env bash
# Start all dev servers (Convex, bu-agent, Next.js) in one terminal.
# Ctrl-C stops everything.

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill 0 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

# --- Convex dev ---
echo "Starting Convex dev..."
npx convex dev &

# --- bu-agent (FastAPI) ---
echo "Starting bu-agent on :8000..."
cd "$ROOT/bu-agent"
.venv/bin/uvicorn server:app --reload --port 8000 &
cd "$ROOT"

# --- Next.js ---
echo "Starting Next.js on :3000..."
npm run dev &

wait
