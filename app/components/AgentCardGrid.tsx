"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AgentEventEntry, AgentCardState } from "../types";
import { parseJobLabel } from "../types";
import AgentBrowserCard from "./AgentBrowserCard";

interface AgentCardGridProps {
  events: AgentEventEntry[];
  cardOpacity?: number;
  cardScale?: number;
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

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function AgentCardGrid({
  events,
  cardOpacity = 1,
  cardScale = 1,
}: AgentCardGridProps) {
  const cards = useMemo(() => buildCardStates(events), [events]);

  if (cards.length === 0) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{
        opacity: cardOpacity,
        scale: cardScale,
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => (
          <AgentBrowserCard key={card.jobId} card={card} index={index} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
