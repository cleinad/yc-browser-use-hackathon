"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { OrchestratorState, OrchestratorPhase } from "../types";
import { useElapsedTimer } from "./hooks/useElapsedTimer";

interface OrchestratorThinkingBannerProps {
  state: OrchestratorState;
  startTime: number | null;
}

const phaseLabels: Record<OrchestratorPhase, string> = {
  parsing: "Analyzing request...",
  planning: "Building search plan...",
  searching: "Searching retailers...",
  optimizing: "Optimizing purchase plan...",
  complete: "Done!",
  error: "Error occurred",
};

const phaseSegments: OrchestratorPhase[] = [
  "parsing",
  "planning",
  "searching",
  "optimizing",
];

function getSegmentIndex(phase: OrchestratorPhase): number {
  const idx = phaseSegments.indexOf(phase);
  return idx === -1 ? phaseSegments.length : idx;
}

function PhaseIcon({ phase }: { phase: OrchestratorPhase }) {
  if (phase === "complete") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="w-8 h-8 rounded-full bg-[var(--accent-jade)] flex items-center justify-center"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--bg-base)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>
    );
  }

  if (phase === "error") {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--accent-destructive)] flex items-center justify-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--bg-base)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
    );
  }

  if (phase === "searching") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 rounded-full border-2 border-[var(--accent-jade)] border-t-transparent flex items-center justify-center"
      />
    );
  }

  // parsing, planning, optimizing — pulse
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center"
    >
      <div className="w-3 h-3 rounded-full bg-[var(--accent-jade)] opacity-60" />
    </motion.div>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

export default function OrchestratorThinkingBanner({
  state,
  startTime,
}: OrchestratorThinkingBannerProps) {
  const elapsed = useElapsedTimer(
    startTime,
    state.phase !== "complete" && state.phase !== "error"
  );

  const currentSegment = getSegmentIndex(state.phase);

  const label =
    state.phase === "searching" && state.totalJobs > 0
      ? `Searching ${state.totalJobs} retailer${state.totalJobs > 1 ? "s" : ""}...`
      : phaseLabels[state.phase];

  // Summary line when complete
  const completedRetailers = new Set<string>();
  if (state.phase === "complete") {
    for (const line of state.logLines) {
      // crude but effective
      const match = line.match(
        /(?:subagent|completed|found).*?(\w+\.com)/i
      );
      if (match) completedRetailers.add(match[1]);
    }
  }

  const lastLog =
    state.logLines.length > 0
      ? state.logLines[state.logLines.length - 1]
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3"
    >
      <div className="flex items-center gap-3">
        {/* Left: phase icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <PhaseIcon phase={state.phase} />
          </motion.div>
        </AnimatePresence>

        {/* Center: label + log */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-medium text-[var(--fg-base)]"
            >
              {state.phase === "complete" ? (
                <>
                  Found {state.completedJobs} result
                  {state.completedJobs !== 1 ? "s" : ""} in{" "}
                  {formatElapsed(elapsed)}
                </>
              ) : (
                label
              )}
            </motion.p>
          </AnimatePresence>
          {state.phase !== "complete" && state.phase !== "error" && lastLog && (
            <p className="text-xs font-mono text-[var(--fg-muted)] truncate mt-0.5">
              {lastLog}
            </p>
          )}
          {state.phase === "searching" &&
            state.totalJobs > 0 && (
              <p className="text-[10px] font-mono text-[var(--fg-disabled)] mt-0.5">
                {state.completedJobs + state.failedJobs}/{state.totalJobs}{" "}
                complete
                {state.failedJobs > 0 && (
                  <span className="text-[var(--accent-destructive)]">
                    {" "}
                    ({state.failedJobs} failed)
                  </span>
                )}
              </p>
            )}
        </div>

        {/* Right: elapsed timer */}
        {state.phase !== "complete" && state.phase !== "error" && startTime && (
          <span className="text-xs font-mono text-[var(--fg-disabled)] shrink-0">
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {/* Bottom: 4-segment progress bar */}
      <div className="flex gap-0.5 mt-3">
        {phaseSegments.map((seg, i) => {
          const isComplete = i < currentSegment;
          const isCurrent =
            i === currentSegment &&
            state.phase !== "complete" &&
            state.phase !== "error";
          const isAllDone = state.phase === "complete";

          return (
            <div
              key={seg}
              className="flex-1 h-1 rounded-full overflow-hidden bg-[var(--bg-subtle)]"
            >
              {(isComplete || isAllDone) && (
                <motion.div
                  className="h-full rounded-full bg-[var(--accent-jade)]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                    delay: isAllDone ? i * 0.05 : 0,
                  }}
                />
              )}
              {isCurrent && (
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-jade)] via-[var(--accent-amber)] to-[var(--accent-jade)] animate-shimmer w-full opacity-70" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
