"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AgentEventEntry, ChatMessage, PurchasePlan, StatusEvent } from "../types";
import { isPurchasePlan } from "../types";
import { getQuoteEventsUrl, getQuoteUrl } from "../lib/api";

type TimelineStatusEvent = {
  event_type: string;
  timestamp: string | null;
  message: string | null;
  job_id: string | null;
  job_label: string | null;
  attempt: number | null;
};

type TimelineRow = {
  id: string;
  inputText: string;
  status: "queued" | "running" | "succeeded" | "failed";
  error: string | null;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  events: Array<
    | { kind: "log"; text: string; ts: number }
    | { kind: "status"; status: TimelineStatusEvent; ts: number }
  >;
  result: unknown | null;
};

type DirectTurn = {
  id: string;
  prompt: string;
  events: AgentEventEntry[];
  plan: PurchasePlan | null;
  error: string | null;
  done: boolean;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Could not submit quote request.";
}

function isEnabled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function makeLocalTurnId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseDirectStatusEvent(raw: string): StatusEvent | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.event_type !== "string") {
      return null;
    }

    return {
      event_type: parsed.event_type as StatusEvent["event_type"],
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : null,
      message: typeof parsed.message === "string" ? parsed.message : null,
      job_id: typeof parsed.job_id === "string" ? parsed.job_id : null,
      job_label: typeof parsed.job_label === "string" ? parsed.job_label : null,
      attempt: typeof parsed.attempt === "number" ? parsed.attempt : null,
    };
  } catch {
    return null;
  }
}

async function shortResponseText(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return "";
  }
}

export function useQuoteSession() {
  const directMode = isEnabled(process.env.NEXT_PUBLIC_DIRECT_BU_AGENT_MODE);
  const timeline = useQuery(
    api.quotes.listMineWithEvents,
    directMode ? "skip" : { limit: 20 },
  ) as TimelineRow[] | undefined;
  const createQuote = useMutation(api.quotes.create);

  const [submitting, setSubmitting] = useState(false);
  const [localFailure, setLocalFailure] = useState<{
    prompt: string;
    error: string;
  } | null>(null);
  const [directTurns, setDirectTurns] = useState<DirectTurn[]>([]);
  const activeStreamsRef = useRef<Map<string, EventSource>>(new Map());

  useEffect(() => {
    const streams = activeStreamsRef.current;
    return () => {
      for (const stream of streams.values()) {
        stream.close();
      }
      streams.clear();
    };
  }, []);

  const updateDirectTurn = useCallback(
    (turnId: string, updater: (turn: DirectTurn) => DirectTurn) => {
      setDirectTurns((prev) =>
        prev.map((turn) => (turn.id === turnId ? updater(turn) : turn)),
      );
    },
    [],
  );

  const convexMessages: ChatMessage[] = useMemo(() => {
    const built: ChatMessage[] = [];

    for (const request of timeline ?? []) {
      built.push({ role: "user", text: request.inputText });

      const events: AgentEventEntry[] = request.events.map((event) => {
        if (event.kind === "log") {
          return { kind: "log", text: event.text };
        }

        return {
          kind: "status",
          event: event.status as StatusEvent,
        };
      });

      const plan: PurchasePlan | null = isPurchasePlan(request.result)
        ? (request.result as PurchasePlan)
        : null;

      built.push({
        role: "agent",
        events,
        plan,
        error: request.error,
        done: request.status === "succeeded" || request.status === "failed",
      });
    }

    if (localFailure) {
      built.push({ role: "user", text: localFailure.prompt });
      built.push({
        role: "agent",
        events: [],
        plan: null,
        error: localFailure.error,
        done: true,
      });
    }

    return built;
  }, [timeline, localFailure]);

  const directMessages: ChatMessage[] = useMemo(() => {
    const built: ChatMessage[] = [];

    for (const turn of directTurns) {
      built.push({ role: "user", text: turn.prompt });
      built.push({
        role: "agent",
        events: turn.events,
        plan: turn.plan,
        error: turn.error,
        done: turn.done,
      });
    }

    return built;
  }, [directTurns]);

  const messages = directMode ? directMessages : convexMessages;

  const hasActiveRequest = directMode
    ? directTurns.some((turn) => !turn.done)
    : (timeline ?? []).some(
        (request) => request.status === "queued" || request.status === "running",
      );

  const loading = submitting || hasActiveRequest;

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) {
        return;
      }

      setSubmitting(true);
      setLocalFailure(null);

      if (directMode) {
        const turnId = makeLocalTurnId();

        setDirectTurns((prev) => [
          ...prev,
          {
            id: turnId,
            prompt: trimmed,
            events: [],
            plan: null,
            error: null,
            done: false,
          },
        ]);

        try {
          const createResponse = await fetch(getQuoteUrl(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: trimmed }),
          });

          if (!createResponse.ok) {
            const body = await shortResponseText(createResponse);
            throw new Error(
              `bu-agent /quote failed (${createResponse.status}): ${body || "no response body"}`,
            );
          }

          const payload = (await createResponse.json()) as { request_id?: unknown };
          if (typeof payload.request_id !== "string" || !payload.request_id) {
            throw new Error("bu-agent /quote did not return request_id.");
          }
          const upstreamRequestId = payload.request_id;

          await new Promise<void>((resolve) => {
            const eventSource = new EventSource(getQuoteEventsUrl(upstreamRequestId));
            let done = false;

            const finish = (updater: (turn: DirectTurn) => DirectTurn) => {
              if (done) {
                return;
              }
              done = true;
              eventSource.close();
              activeStreamsRef.current.delete(turnId);
              updateDirectTurn(turnId, updater);
              resolve();
            };

            eventSource.addEventListener("log", (event) => {
              if (done) {
                return;
              }
              const message = (event as MessageEvent<string>).data ?? "";
              updateDirectTurn(turnId, (turn) => ({
                ...turn,
                events: [...turn.events, { kind: "log", text: message }],
              }));
            });

            eventSource.addEventListener("status", (event) => {
              if (done) {
                return;
              }
              const message = (event as MessageEvent<string>).data ?? "";
              const status = parseDirectStatusEvent(message);

              if (!status) {
                updateDirectTurn(turnId, (turn) => ({
                  ...turn,
                  events: [...turn.events, { kind: "log", text: message }],
                }));
                return;
              }

              updateDirectTurn(turnId, (turn) => ({
                ...turn,
                events: [...turn.events, { kind: "status", event: status }],
              }));
            });

            eventSource.addEventListener("result", (event) => {
              const message = (event as MessageEvent<string>).data ?? "";

              let parsed: unknown;
              try {
                parsed = JSON.parse(message);
              } catch {
                finish((turn) => ({
                  ...turn,
                  error: "bu-agent returned invalid result JSON.",
                  done: true,
                }));
                return;
              }

              finish((turn) => ({
                ...turn,
                plan: isPurchasePlan(parsed) ? parsed : null,
                done: true,
              }));
            });

            eventSource.addEventListener("error", (event) => {
              if (done) {
                return;
              }

              const errorMessage =
                event instanceof MessageEvent && typeof event.data === "string"
                  ? event.data.trim()
                  : "";

              finish((turn) => ({
                ...turn,
                error: errorMessage || "Disconnected from bu-agent event stream.",
                done: true,
              }));
            });

            activeStreamsRef.current.set(turnId, eventSource);
          });
        } catch (error) {
          updateDirectTurn(turnId, (turn) => ({
            ...turn,
            error: toErrorMessage(error),
            done: true,
          }));
        } finally {
          setSubmitting(false);
        }
        return;
      }

      try {
        await createQuote({ inputText: trimmed });
      } catch (error) {
        setLocalFailure({
          prompt: trimmed,
          error: toErrorMessage(error),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [createQuote, directMode, loading, updateDirectTurn],
  );

  return { messages, loading, submit };
}
