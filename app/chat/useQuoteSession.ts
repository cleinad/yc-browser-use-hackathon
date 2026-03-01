"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { AgentEventEntry, ChatMessage, OrderDecision, PurchasePlan, StatusEvent } from "../types";
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
  displayText: string | null;
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
  decision: string;
  acceptedOptionRank: number | null;
  decidedAt: number | null;
};

type SubmitInput = string | { payloadText: string; displayText: string };

type DirectTurn = {
  id: string;
  prompt: string;
  events: AgentEventEntry[];
  plan: PurchasePlan | null;
  error: string | null;
  done: boolean;
  createdAt: number;
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

const DIRECT_HISTORY_STORAGE_PREFIX = "proquote-direct-history";

function getDirectHistoryStorageKey(propertyId: Id<"properties"> | null): string {
  if (!propertyId) {
    return `${DIRECT_HISTORY_STORAGE_PREFIX}:legacy`;
  }
  return `${DIRECT_HISTORY_STORAGE_PREFIX}:property:${propertyId}`;
}

function makeLocalTurnId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseStoredStatusEvent(value: unknown): StatusEvent | null {
  const parsed = asRecord(value);
  if (!parsed || typeof parsed.event_type !== "string") {
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
}

function parseStoredAgentEventEntry(value: unknown): AgentEventEntry | null {
  const parsed = asRecord(value);
  if (!parsed || typeof parsed.kind !== "string") {
    return null;
  }

  if (parsed.kind === "log" && typeof parsed.text === "string") {
    return { kind: "log", text: parsed.text };
  }

  if (parsed.kind === "status") {
    const event = parseStoredStatusEvent(parsed.event);
    if (!event) {
      return null;
    }
    return { kind: "status", event };
  }

  return null;
}

function parseStoredDirectTurns(raw: string | null): DirectTurn[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const turns: DirectTurn[] = [];
    for (const item of parsed) {
      const turn = asRecord(item);
      if (!turn || typeof turn.prompt !== "string") {
        continue;
      }

      const events = Array.isArray(turn.events)
        ? turn.events
            .map((event) => parseStoredAgentEventEntry(event))
            .filter((event): event is AgentEventEntry => event !== null)
        : [];

      turns.push({
        id: typeof turn.id === "string" ? turn.id : makeLocalTurnId(),
        prompt: turn.prompt,
        events,
        plan: isPurchasePlan(turn.plan) ? (turn.plan as PurchasePlan) : null,
        error: typeof turn.error === "string" ? turn.error : null,
        done: turn.done === true,
        createdAt:
          typeof turn.createdAt === "number" && Number.isFinite(turn.createdAt)
            ? turn.createdAt
            : 0,
      });
    }

    return turns;
  } catch {
    return [];
  }
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

export function useQuoteSession(
  propertyId: Id<"properties"> | null,
  options?: { sinceTs?: number | null },
) {
  const sinceTs = options?.sinceTs ?? null;
  const directModeRequested = isEnabled(
    process.env.NEXT_PUBLIC_DIRECT_BU_AGENT_MODE,
  );
  const hackathonDirectMode = isEnabled(
    process.env.NEXT_PUBLIC_HACKATHON_DIRECT_MODE,
  );
  // Property-scoped chat must stay persistent via Convex.
  // Hackathon mode can opt into direct mode for property chat too.
  const directMode = directModeRequested && (!propertyId || hackathonDirectMode);
  const directHistoryStorageKey = useMemo(
    () => getDirectHistoryStorageKey(propertyId),
    [propertyId],
  );
  const timeline = useQuery(
    api.quotes.listMineWithEvents,
    directMode || !propertyId ? "skip" : { limit: 20, propertyId },
  ) as TimelineRow[] | undefined;
  const createQuote = useMutation(api.quotes.create);

  const [submitting, setSubmitting] = useState(false);
  const [localFailure, setLocalFailure] = useState<{
    prompt: string;
    error: string;
  } | null>(null);
  const [directTurns, setDirectTurns] = useState<DirectTurn[]>([]);
  const activeStreamsRef = useRef<Map<string, EventSource>>(new Map());

  const visibleTimeline = useMemo(() => {
    if (!sinceTs) {
      return timeline ?? [];
    }
    return (timeline ?? []).filter((request) => request.createdAt >= sinceTs);
  }, [sinceTs, timeline]);

  useEffect(() => {
    const streams = activeStreamsRef.current;
    return () => {
      for (const stream of streams.values()) {
        stream.close();
      }
      streams.clear();
    };
  }, []);

  useEffect(() => {
    if (!directMode || typeof window === "undefined") {
      return;
    }

    const streams = activeStreamsRef.current;
    for (const stream of streams.values()) {
      stream.close();
    }
    streams.clear();

    const raw = window.localStorage.getItem(directHistoryStorageKey);
    setDirectTurns(parseStoredDirectTurns(raw));
  }, [directMode, directHistoryStorageKey]);

  useEffect(() => {
    if (!directMode || typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(directHistoryStorageKey, JSON.stringify(directTurns));
  }, [directMode, directHistoryStorageKey, directTurns]);

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

    for (const request of visibleTimeline) {
      built.push({ role: "user", text: request.displayText ?? request.inputText });

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
        requestId: request.id,
        decision: (request.decision ?? "pending") as OrderDecision,
        acceptedOptionRank: request.acceptedOptionRank ?? null,
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
  }, [visibleTimeline, localFailure]);

  const directMessages: ChatMessage[] = useMemo(() => {
    const visibleTurns = sinceTs
      ? directTurns.filter((turn) => turn.createdAt >= sinceTs)
      : directTurns;
    const built: ChatMessage[] = [];

    for (const turn of visibleTurns) {
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
  }, [directTurns, sinceTs]);

  const messages = directMode ? directMessages : convexMessages;

  const hasActiveRequest = directMode
    ? directTurns.some((turn) => !turn.done)
    : (timeline ?? []).some(
        (request) => request.status === "queued" || request.status === "running",
      );

  const loading = submitting || hasActiveRequest;

  const submit = useCallback(
    async (input: SubmitInput) => {
      const payloadText =
        typeof input === "string" ? input.trim() : input.payloadText.trim();
      const displayText =
        typeof input === "string" ? payloadText : input.displayText.trim();

      if (!payloadText || !displayText || loading) {
        return;
      }

      if (!directMode && !propertyId) {
        setLocalFailure({
          prompt: displayText,
          error: "Select a property before creating a request.",
        });
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
            prompt: displayText,
            events: [],
            plan: null,
            error: null,
            done: false,
            createdAt: Date.now(),
          },
        ]);

        try {
          const createResponse = await fetch(getQuoteUrl(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: payloadText }),
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
        await createQuote({
          propertyId: propertyId as Id<"properties">,
          inputText: payloadText,
          displayText,
        });
      } catch (error) {
        setLocalFailure({
          prompt: displayText,
          error: toErrorMessage(error),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [createQuote, directMode, loading, propertyId, updateDirectTurn],
  );

  const timelineLoaded = directMode || timeline !== undefined;

  return { messages, loading, submit, timelineLoaded };
}
