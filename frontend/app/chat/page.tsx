"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type StatusEventType =
  | "orchestrator_started"
  | "subagent_started"
  | "subagent_retrying"
  | "subagent_completed"
  | "subagent_failed"
  | "orchestrator_completed";

interface StatusEvent {
  event_type: StatusEventType;
  timestamp?: string | null;
  message: string | null;
  job_label: string | null;
  attempt?: number | null;
}

interface LineItem {
  part_name: string;
  product_name: string;
  price: number | null;
  currency: string;
  availability: string | null;
  delivery_estimate: string | null;
  product_url: string | null;
  retailer: string | null;
}

interface PlanOption {
  rank: number;
  summary: string;
  line_items: LineItem[];
  estimated_total: number | null;
  currency: string;
  delivery_summary: string | null;
  tradeoffs: string | null;
}

interface PurchasePlan {
  options: PlanOption[];
  notes: string | null;
}

interface ChatTurn {
  id: string;
  prompt: string;
  logs: string[];
  statuses: StatusEvent[];
  result: unknown | null;
  error: string | null;
  done: boolean;
}

const STATUS_LABEL: Record<StatusEventType, string> = {
  orchestrator_started: "Orchestrator started",
  subagent_started: "Sub-agent started",
  subagent_retrying: "Sub-agent retrying",
  subagent_completed: "Sub-agent completed",
  subagent_failed: "Sub-agent failed",
  orchestrator_completed: "Orchestrator completed",
};

const STATUS_TONE: Record<StatusEventType, string> = {
  orchestrator_started: "text-[var(--fg-base)]",
  subagent_started: "text-[var(--fg-base)]",
  subagent_retrying: "text-[var(--accent-amber)]",
  subagent_completed: "text-[var(--accent-jade)]",
  subagent_failed: "text-[var(--accent-destructive)]",
  orchestrator_completed: "text-[var(--accent-jade)]",
};

function turnId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPurchasePlan(value: unknown): value is PurchasePlan {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { options?: unknown };
  return Array.isArray(candidate.options);
}

function formatAmount(amount: number | null, currency: string) {
  if (amount == null) return "N/A";
  return `${currency} ${amount.toFixed(2)}`;
}

function PlanResult({ plan }: { plan: PurchasePlan }) {
  if (plan.options.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--fg-muted)]">
        No ranked options were returned.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {plan.notes && (
        <p className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--fg-muted)]">
          {plan.notes}
        </p>
      )}

      {plan.options.map((option) => (
        <section
          key={option.rank}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
        >
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-semibold text-white dark:text-[var(--bg-base)]">
                {option.rank}
              </span>
              <h3 className="text-sm font-semibold text-[var(--fg-base)]">
                {option.summary}
              </h3>
            </div>
            <p className="text-sm font-medium text-[var(--fg-base)]">
              {formatAmount(option.estimated_total, option.currency)}
            </p>
          </header>

          {option.line_items.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
                <thead>
                  <tr className="text-[var(--fg-muted)]">
                    <th className="border-b border-[var(--border-default)] px-2 py-2 font-medium">
                      Item
                    </th>
                    <th className="border-b border-[var(--border-default)] px-2 py-2 font-medium">
                      Retailer
                    </th>
                    <th className="border-b border-[var(--border-default)] px-2 py-2 font-medium">
                      Availability
                    </th>
                    <th className="border-b border-[var(--border-default)] px-2 py-2 font-medium">
                      Price
                    </th>
                    <th className="border-b border-[var(--border-default)] px-2 py-2 font-medium">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[var(--fg-base)]">
                  {option.line_items.map((item, index) => (
                    <tr key={`${option.rank}-${index}`}>
                      <td className="border-b border-[var(--border-default)] px-2 py-2 align-top">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="mt-0.5 text-[var(--fg-muted)]">
                          {item.part_name}
                        </p>
                      </td>
                      <td className="border-b border-[var(--border-default)] px-2 py-2 align-top text-[var(--fg-muted)]">
                        {item.retailer ?? "Unknown"}
                      </td>
                      <td className="border-b border-[var(--border-default)] px-2 py-2 align-top text-[var(--fg-muted)]">
                        {item.availability ?? item.delivery_estimate ?? "N/A"}
                      </td>
                      <td className="border-b border-[var(--border-default)] px-2 py-2 align-top">
                        {formatAmount(item.price, item.currency)}
                      </td>
                      <td className="border-b border-[var(--border-default)] px-2 py-2 align-top">
                        {item.product_url ? (
                          <a
                            href={item.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[var(--accent-primary)] underline-offset-2 hover:underline"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="text-[var(--fg-disabled)]">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(option.delivery_summary || option.tradeoffs) && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--fg-muted)]">
              {option.delivery_summary && (
                <p>Delivery: {option.delivery_summary}</p>
              )}
              {option.tradeoffs && <p>Tradeoffs: {option.tradeoffs}</p>}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const patchTurn = useCallback(
    (id: string, fn: (prev: ChatTurn) => ChatTurn) => {
      setTurns((prev) => prev.map((turn) => (turn.id === id ? fn(turn) : turn)));
    },
    []
  );

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const id = turnId();
    setInput("");
    setLoading(true);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    setTurns((prev) => [
      ...prev,
      {
        id,
        prompt: text,
        logs: [],
        statuses: [],
        result: null,
        error: null,
        done: false,
      },
    ]);

    try {
      const response = await fetch(`${API_BASE}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const payload = (await response.json()) as { request_id?: string };
      if (!payload.request_id) {
        throw new Error("Missing request_id in backend response");
      }

      const eventSource = new EventSource(
        `${API_BASE}/quote/${payload.request_id}/events`
      );

      eventSource.addEventListener("log", (event) => {
        patchTurn(id, (turn) => ({
          ...turn,
          logs: [...turn.logs, event.data],
        }));
      });

      eventSource.addEventListener("status", (event) => {
        const status: StatusEvent = JSON.parse(event.data);
        patchTurn(id, (turn) => ({
          ...turn,
          statuses: [...turn.statuses, status],
        }));
      });

      eventSource.addEventListener("result", (event) => {
        const result = JSON.parse(event.data) as unknown;
        patchTurn(id, (turn) => ({ ...turn, result, done: true }));
        setLoading(false);
        eventSource.close();
      });

      eventSource.addEventListener("error", (event) => {
        if (event instanceof MessageEvent) {
          patchTurn(id, (turn) => ({
            ...turn,
            error: event.data || "Unknown error",
            done: true,
          }));
        }
        setLoading(false);
        eventSource.close();
      });

      eventSource.onerror = () => {
        patchTurn(id, (turn) => (turn.done ? turn : { ...turn, done: true }));
        setLoading(false);
        eventSource.close();
      };
    } catch (error) {
      patchTurn(id, (turn) => ({
        ...turn,
        error: error instanceof Error ? error.message : "Something went wrong",
        done: true,
      }));
      setLoading(false);
    }
  }, [input, loading, patchTurn]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
          <div>
            <p className="text-sm font-semibold text-[var(--fg-base)]">
              Proquote Chat
            </p>
            <p className="text-xs text-[var(--fg-muted)]">
              Live procurement orchestration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <code className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--fg-muted)]">
              {API_BASE}
            </code>
            <Link
              href="/"
              className="text-sm text-[var(--fg-muted)] underline-offset-2 hover:text-[var(--fg-base)] hover:underline"
            >
              Home
            </Link>
          </div>
        </header>

        <main className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[var(--border-default)] px-4 py-3 sm:px-5">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--fg-muted)]">
              Session
            </p>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Ask for parts and constraints. The agent returns status traces and
              ranked plan options.
            </p>
          </div>

          <section className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
            {turns.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-6 text-sm text-[var(--fg-muted)]">
                No requests yet. Enter a message below to begin.
              </div>
            )}

            {turns.map((turn) => (
              <article key={turn.id} className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm leading-6 text-white dark:text-[var(--bg-base)]">
                    {turn.prompt}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-medium uppercase tracking-[0.12em] text-[var(--fg-muted)]">
                      Agent Output
                    </p>
                    <p className="text-[var(--fg-muted)]">
                      {turn.done ? "Complete" : "Running"}
                    </p>
                  </div>

                  {turn.statuses.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {turn.statuses.map((status, index) => (
                        <div
                          key={`${turn.id}-status-${index}`}
                          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                        >
                          <p
                            className={`font-medium ${
                              STATUS_TONE[status.event_type] ?? "text-[var(--fg-base)]"
                            }`}
                          >
                            {STATUS_LABEL[status.event_type] ?? status.event_type}
                            {status.job_label ? ` · ${status.job_label}` : ""}
                            {status.attempt ? ` (attempt ${status.attempt})` : ""}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                            {status.message ?? "No message provided"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {turn.logs.length > 0 && (
                    <pre className="mt-3 max-h-44 overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-xs leading-5 text-[var(--fg-muted)]">
                      {turn.logs.join("\n")}
                    </pre>
                  )}

                  {turn.error && (
                    <p className="mt-3 rounded-lg border border-[var(--accent-destructive)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--accent-destructive)]">
                      {turn.error}
                    </p>
                  )}

                  {turn.result && (
                    <div className="mt-3">
                      {isPurchasePlan(turn.result) ? (
                        <PlanResult plan={turn.result} />
                      ) : (
                        <pre className="overflow-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-xs leading-5 text-[var(--fg-muted)]">
                          {JSON.stringify(turn.result, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}

            <div ref={bottomRef} />
          </section>

          <footer className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 sm:px-5">
            <label htmlFor="prompt" className="sr-only">
              Procurement request
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="prompt"
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  event.currentTarget.style.height = "auto";
                  event.currentTarget.style.height = `${Math.min(
                    event.currentTarget.scrollHeight,
                    160
                  )}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                placeholder="Example: Need 12x M4 stainless socket head cap screws, delivery in 5 days, lowest total cost."
                disabled={loading}
                className="max-h-40 min-h-11 flex-1 resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm leading-6 text-[var(--fg-base)] outline-none transition focus:border-[var(--accent-primary)] disabled:text-[var(--fg-disabled)]"
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading || input.trim().length === 0}
                className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40 dark:text-[var(--bg-base)]"
              >
                {loading ? "Running" : "Send"}
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
