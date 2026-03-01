"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AgentEventEntry, ChatMessage, PurchasePlan, StatusEvent } from "../types";
import { isPurchasePlan } from "../types";

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

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Could not submit quote request.";
}

export function useQuoteSession() {
  const timeline = useQuery(api.quotes.listMineWithEvents, {
    limit: 20,
  }) as TimelineRow[] | undefined;
  const createQuote = useMutation(api.quotes.create);

  const [submitting, setSubmitting] = useState(false);
  const [localFailure, setLocalFailure] = useState<{
    prompt: string;
    error: string;
  } | null>(null);

  const messages: ChatMessage[] = useMemo(() => {
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

  const hasActiveRequest = (timeline ?? []).some(
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
    [createQuote, loading],
  );

  return { messages, loading, submit };
}
