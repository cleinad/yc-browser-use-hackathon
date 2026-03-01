"use client";

import { useMemo } from "react";
import type {
  AgentEventEntry,
  OrchestratorState,
  OrchestratorPhase,
} from "../../types";

export function useOrchestratorState(
  events: AgentEventEntry[],
  done: boolean,
  hasPlan: boolean,
  hasError: boolean
): OrchestratorState {
  return useMemo(() => {
    let phase: OrchestratorPhase = "parsing";
    const logLines: string[] = [];
    const parsedParts: string[] = [];
    let totalJobs = 0;
    let completedJobs = 0;
    let failedJobs = 0;
    let currentThought = "Analyzing request...";

    const seenJobs = new Set<string>();

    for (const entry of events) {
      if (entry.kind === "log") {
        logLines.push(entry.text);
        const text = entry.text.toLowerCase();

        if (text.includes("parsing") || text.includes("analyzing")) {
          phase = "parsing";
          currentThought = entry.text;
        } else if (
          text.includes("building search") ||
          text.includes("planning") ||
          text.includes("search jobs")
        ) {
          phase = "planning";
          currentThought = entry.text;
        } else if (
          text.includes("optimizing") ||
          text.includes("purchase plan")
        ) {
          phase = "optimizing";
          currentThought = entry.text;
        }
      } else if (entry.kind === "status") {
        const { event } = entry;

        if (
          event.event_type === "subagent_started" &&
          event.job_id &&
          !seenJobs.has(event.job_id)
        ) {
          seenJobs.add(event.job_id);
          totalJobs++;
          phase = "searching";
          currentThought = `Searching ${totalJobs} retailer${totalJobs > 1 ? "s" : ""}...`;
        }

        if (event.event_type === "subagent_completed") {
          completedJobs++;
        }

        if (event.event_type === "subagent_failed") {
          failedJobs++;
        }
      }
    }

    if (done && hasPlan) {
      phase = "complete";
      currentThought = "Done!";
    } else if (done && hasError) {
      phase = "error";
      currentThought = "An error occurred";
    }

    return {
      phase,
      logLines,
      parsedParts,
      totalJobs,
      completedJobs,
      failedJobs,
      currentThought,
    };
  }, [events, done, hasPlan, hasError]);
}
