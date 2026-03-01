"use client";

import { useCallback, useState } from "react";
import type {
  AgentEventEntry,
  ChatMessage,
  ChatTurn,
  PurchasePlan,
  StatusEvent,
} from "../types";
import { isPurchasePlan } from "../types";
import { getQuoteEventsUrl, getQuoteUrl } from "../lib/api";

function turnId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function turnToMessages(turn: ChatTurn): ChatMessage[] {
  const events: AgentEventEntry[] = [
    ...turn.statuses.map((e) => ({ kind: "status" as const, event: e as StatusEvent })),
    ...turn.logs.map((text) => ({ kind: "log" as const, text })),
  ];
  const plan: PurchasePlan | null = isPurchasePlan(turn.result)
    ? turn.result
    : null;
  return [
    { role: "user", text: turn.prompt },
    {
      role: "agent",
      events,
      plan,
      error: turn.error,
      done: turn.done,
    },
  ];
}

export function useQuoteSession() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);

  const messages: ChatMessage[] = turns.flatMap(turnToMessages);

  const patchTurn = useCallback((id: string, fn: (prev: ChatTurn) => ChatTurn) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));
  }, []);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const id = turnId();
      setLoading(true);
      setTurns((prev) => [
        ...prev,
        {
          id,
          prompt: trimmed,
          logs: [],
          statuses: [],
          result: null,
          error: null,
          done: false,
        },
      ]);

      try {
        const response = await fetch(getQuoteUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        let payload: { request_id?: string };
        try {
          payload = (await response.json()) as { request_id?: string };
        } catch {
          throw new Error("Invalid JSON from server");
        }
        if (!payload.request_id) {
          throw new Error("Missing request_id in backend response");
        }

        const eventSource = new EventSource(
          getQuoteEventsUrl(payload.request_id)
        );

        eventSource.addEventListener("log", (event) => {
          const data = typeof (event as MessageEvent).data === "string" ? (event as MessageEvent).data : "";
          patchTurn(id, (turn) => ({
            ...turn,
            logs: [...turn.logs, data],
          }));
        });

        eventSource.addEventListener("status", (event) => {
          try {
            const data = (event as MessageEvent).data;
            const status = JSON.parse(typeof data === "string" ? data : "{}") as StatusEvent;
            patchTurn(id, (turn) => ({
              ...turn,
              statuses: [...turn.statuses, status],
            }));
          } catch {
            // ignore malformed status
          }
        });

        eventSource.addEventListener("result", (event) => {
          try {
            const data = (event as MessageEvent).data;
            const result = JSON.parse(typeof data === "string" ? data : "null") as unknown;
            patchTurn(id, (turn) => ({ ...turn, result, done: true }));
          } catch {
            patchTurn(id, (turn) => ({
              ...turn,
              error: "Invalid result from server",
              done: true,
            }));
          }
          setLoading(false);
          eventSource.close();
        });

        eventSource.addEventListener("error", (event) => {
          const data = (event as MessageEvent).data;
          const message = typeof data === "string" && data ? data : "Unknown error";
          patchTurn(id, (turn) => ({
            ...turn,
            error: message,
            done: true,
          }));
          setLoading(false);
          eventSource.close();
        });

        eventSource.onerror = () => {
          patchTurn(id, (turn) => {
            if (turn.done) return turn;
            return {
              ...turn,
              error: turn.error ?? "Connection lost. Is the backend running on port 8000?",
              done: true,
            };
          });
          setLoading(false);
          eventSource.close();
        };
      } catch (error) {
        const message =
          error instanceof TypeError && (error as Error).message?.includes("fetch")
            ? "Could not reach the quote service. Start the backend with: cd bu-agent && .venv/bin/uvicorn server:app --port 8000"
            : error instanceof Error
              ? error.message
              : "Something went wrong";
        patchTurn(id, (turn) => ({
          ...turn,
          error: message,
          done: true,
        }));
        setLoading(false);
      }
    },
    [loading, patchTurn]
  );

  return { messages, loading, submit };
}
