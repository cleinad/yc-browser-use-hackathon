#!/usr/bin/env bash
# Dev orchestrator:
# - default: start Convex, bu-agent, Next.js
# - tunnel: also start a public tunnel for bu-agent and print/set BU_AGENT_BASE_URL
#
# Examples:
#   ./dev.sh
#   ./dev.sh tunnel
#   ./dev.sh tunnel --set-convex-env
#   ./dev.sh tunnel --provider ngrok --set-convex-env

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
MODE="dev"
PROVIDER="cloudflared"
SET_CONVEX_ENV="false"
TUNNEL_LOG="/tmp/proquote-tunnel-${$}.log"

PIDS=()

usage() {
  cat <<'EOF'
Usage:
  ./dev.sh
  ./dev.sh tunnel [--provider cloudflared|ngrok] [--set-convex-env]

Options:
  tunnel              Start normal dev stack plus a public tunnel to bu-agent.
  --provider <name>   Tunnel provider. Default: cloudflared.
  --set-convex-env    Automatically run:
                      npx convex env set BU_AGENT_BASE_URL <public-url>
  -h, --help          Show this help.
EOF
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not installed." >&2
    exit 1
  fi
}

cleanup() {
  echo ""
  echo "Shutting down..."
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  rm -f "$TUNNEL_LOG" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

while [[ $# -gt 0 ]]; do
  case "$1" in
    tunnel)
      MODE="tunnel"
      shift
      ;;
    --provider)
      if [[ $# -lt 2 ]]; then
        echo "Error: --provider requires a value (cloudflared|ngrok)." >&2
        exit 1
      fi
      PROVIDER="$2"
      shift 2
      ;;
    --set-convex-env)
      SET_CONVEX_ENV="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument '$1'." >&2
      usage
      exit 1
      ;;
  esac
done

start_convex() {
  echo "Starting Convex dev..."
  (
    cd "$ROOT"
    npx convex dev
  ) &
  PIDS+=("$!")
}

start_bu_agent() {
  if [[ ! -x "$ROOT/bu-agent/.venv/bin/uvicorn" ]]; then
    echo "Error: bu-agent virtualenv not found at bu-agent/.venv/bin/uvicorn" >&2
    echo "Run setup first (from repo root):" >&2
    echo "  cd bu-agent && uv venv --python 3.12 && . .venv/bin/activate && pip install -r requirements.txt" >&2
    exit 1
  fi

  echo "Starting bu-agent on :8000..."
  (
    cd "$ROOT/bu-agent"
    export PROQUOTE_LLM_TIMEOUT_SEC="${PROQUOTE_LLM_TIMEOUT_SEC:-45}"
    export PROQUOTE_PER_AGENT_TIMEOUT_SEC="${PROQUOTE_PER_AGENT_TIMEOUT_SEC:-60}"
    export PROQUOTE_RETRIES="${PROQUOTE_RETRIES:-0}"
    export PROQUOTE_REQUEST_TIMEOUT_SEC="${PROQUOTE_REQUEST_TIMEOUT_SEC:-300}"
    # Default to local Chrome in dev — cloud mode is much slower (remote browser API round-trips)
    export PROQUOTE_USE_CLOUD="${PROQUOTE_USE_CLOUD:-false}"
    echo "bu-agent runtime: LLM timeout=${PROQUOTE_LLM_TIMEOUT_SEC}s, per-agent timeout=${PROQUOTE_PER_AGENT_TIMEOUT_SEC}s, retries=${PROQUOTE_RETRIES}, request timeout=${PROQUOTE_REQUEST_TIMEOUT_SEC}s"
    .venv/bin/uvicorn server:app --host 0.0.0.0 --reload --port 8000
  ) &
  PIDS+=("$!")
}

start_next() {
  echo "Starting Next.js on :3000..."
  (
    cd "$ROOT"
    npm run dev
  ) &
  PIDS+=("$!")
}

wait_for_bu_agent() {
  local attempts=60
  local i
  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS "http://127.0.0.1:8000/openapi.json" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "Error: bu-agent did not become ready on http://127.0.0.1:8000 within ${attempts}s." >&2
  exit 1
}

start_tunnel_cloudflared() {
  require_cmd cloudflared
  echo "Starting cloudflared tunnel to http://localhost:8000..."
  cloudflared tunnel --url "http://localhost:8000" --no-autoupdate >"$TUNNEL_LOG" 2>&1 &
  PIDS+=("$!")
}

start_tunnel_ngrok() {
  require_cmd ngrok
  echo "Starting ngrok tunnel to http://localhost:8000..."
  ngrok http 8000 >"$TUNNEL_LOG" 2>&1 &
  PIDS+=("$!")
}

extract_tunnel_url() {
  case "$PROVIDER" in
    cloudflared)
      grep -Eo 'https://[A-Za-z0-9.-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n1
      ;;
    ngrok)
      curl -fsS "http://127.0.0.1:4040/api/tunnels" 2>/dev/null \
        | grep -Eo 'https://[^"]*ngrok[^"]*' \
        | head -n1
      ;;
    *)
      echo ""
      ;;
  esac
}

start_tunnel_and_print_next_steps() {
  case "$PROVIDER" in
    cloudflared)
      start_tunnel_cloudflared
      ;;
    ngrok)
      start_tunnel_ngrok
      ;;
    *)
      echo "Error: unsupported provider '$PROVIDER'. Use cloudflared or ngrok." >&2
      exit 1
      ;;
  esac

  local tunnel_url=""
  local attempts=90
  local i
  for ((i = 1; i <= attempts; i++)); do
    tunnel_url="$(extract_tunnel_url || true)"
    if [[ -n "$tunnel_url" ]]; then
      break
    fi
    sleep 1
  done

  if [[ -z "$tunnel_url" ]]; then
    echo "Error: could not detect a public tunnel URL." >&2
    echo "Tunnel logs (tail):" >&2
    tail -n 40 "$TUNNEL_LOG" >&2 || true
    exit 1
  fi

  echo ""
  echo "Public bu-agent URL:"
  echo "  $tunnel_url"
  echo ""

  if [[ "$SET_CONVEX_ENV" == "true" ]]; then
    echo "Setting Convex env var BU_AGENT_BASE_URL..."
    (
      cd "$ROOT"
      npx convex env set BU_AGENT_BASE_URL "$tunnel_url"
    )
    echo "Set successfully."
  else
    echo "Run this once (or whenever tunnel URL changes):"
    echo "  npx convex env set BU_AGENT_BASE_URL $tunnel_url"
  fi
}

require_cmd npx
require_cmd npm
require_cmd curl

start_convex
start_bu_agent
start_next

if [[ "$MODE" == "tunnel" ]]; then
  wait_for_bu_agent
  start_tunnel_and_print_next_steps
fi

wait
