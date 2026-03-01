"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import type { AgentEventEntry, AgentCardState } from "../types";
import { parseJobLabel } from "../types";
import AgentBrowserCard from "./AgentBrowserCard";

interface AgentCardGridProps {
  events: AgentEventEntry[];
}

function buildCardStates(events: AgentEventEntry[]): AgentCardState[] {
  const map = new Map<string, AgentCardState>();

  for (const entry of events) {
    if (entry.kind !== "status") continue;
    const { event } = entry;
    const jobId = event.job_id;
    if (!jobId) continue;

    const { retailer, query } = parseJobLabel(event.job_label ?? "");

    const existing = map.get(jobId);

    switch (event.event_type) {
      case "subagent_started":
        map.set(jobId, {
          jobId,
          retailer,
          searchQuery: query,
          status: "searching",
          attempt: event.attempt ?? 1,
          message: event.message,
        });
        break;
      case "subagent_retrying":
        map.set(jobId, {
          ...(existing ?? {
            jobId,
            retailer,
            searchQuery: query,
            message: null,
          }),
          status: "retrying",
          attempt: event.attempt ?? (existing?.attempt ?? 1) + 1,
          message: event.message,
        });
        break;
      case "subagent_completed":
        map.set(jobId, {
          ...(existing ?? {
            jobId,
            retailer,
            searchQuery: query,
            attempt: 1,
          }),
          status: "completed",
          message: event.message,
        });
        break;
      case "subagent_failed":
        map.set(jobId, {
          ...(existing ?? {
            jobId,
            retailer,
            searchQuery: query,
            attempt: 1,
          }),
          status: "failed",
          message: event.message,
        });
        break;
    }
  }

  return Array.from(map.values());
}

export default function AgentCardGrid({ events }: AgentCardGridProps) {
  const cards = useMemo(() => buildCardStates(events), [events]);

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AnimatePresence mode="popLayout">
        {cards.map((card) => (
          <AgentBrowserCard key={card.jobId} card={card} />
        ))}
      </AnimatePresence>
    </div>
  );
}
