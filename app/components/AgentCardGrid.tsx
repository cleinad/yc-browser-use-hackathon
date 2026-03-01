"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentEventEntry, AgentCardState } from "../types";
import { parseJobLabel } from "../types";
import AgentBrowserCard from "./AgentBrowserCard";

const VISIBLE_LIMIT = 6;

interface AgentCardGridProps {
  events: AgentEventEntry[];
  cardOpacity?: number;
  cardScale?: number;
  done?: boolean;
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
          startedAt: Date.now(),
        });
        break;
      case "subagent_retrying":
        map.set(jobId, {
          ...(existing ?? {
            jobId,
            retailer,
            searchQuery: query,
            message: null,
            startedAt: null,
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
            startedAt: null,
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
            startedAt: null,
          }),
          status: "failed",
          message: event.message,
        });
        break;
    }
  }

  return Array.from(map.values());
}

export default function AgentCardGrid({
  events,
  cardOpacity = 1,
  cardScale = 1,
  done = false,
}: AgentCardGridProps) {
  const cards = useMemo(() => {
    const all = buildCardStates(events);
    // Sort failed cards to the bottom so they're hidden by default
    const active = all.filter((c) => c.status !== "failed");
    const failed = all.filter((c) => c.status === "failed");
    return [...active, ...failed];
  }, [events]);
  const [expanded, setExpanded] = useState(false);

  if (cards.length === 0) return null;

  const activeCount = cards.filter((c) => c.status !== "failed").length;
  const limit = Math.min(VISIBLE_LIMIT, activeCount || VISIBLE_LIMIT);
  const hasOverflow = cards.length > limit;
  const visibleCards = expanded || !hasOverflow ? cards : cards.slice(0, limit);
  const hiddenCount = cards.length - limit;

  return (
    <div
      className={done ? "max-h-48 overflow-y-auto rounded-lg" : ""}
      style={{
        opacity: cardOpacity,
        transform: `scale(${cardScale})`,
        transition: "opacity 0.3s ease, transform 0.3s ease",
        transformOrigin: "top left",
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((card, index) => (
            <AgentBrowserCard key={card.jobId} card={card} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {hasOverflow && !done && (
        <motion.button
          type="button"
          onClick={() => setExpanded(!expanded)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:border-[var(--fg-muted)] transition-colors"
        >
          <svg
            viewBox="0 0 16 16"
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
          {expanded ? "Show fewer" : `Show ${hiddenCount} more browser${hiddenCount !== 1 ? "s" : ""}`}
        </motion.button>
      )}
    </div>
  );
}
