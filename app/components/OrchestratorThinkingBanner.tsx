"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { OrchestratorState, OrchestratorPhase } from "../types";
import { useElapsedTimer } from "./hooks/useElapsedTimer";

interface OrchestratorThinkingBannerProps {
  state: OrchestratorState;
  startTime: number | null;
}

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

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

function PhaseIcon({ phase }: { phase: OrchestratorPhase }) {
  if (phase === "complete") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15 }}
        className="w-6 h-6 rounded-full bg-[var(--accent-jade)] flex items-center justify-center shrink-0"
      >
        <svg
          width="12"
          height="12"
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
      <div className="w-6 h-6 rounded-full bg-[var(--accent-destructive)] flex items-center justify-center shrink-0">
        <svg
          width="12"
          height="12"
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

  // Active phases — spinning ring
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-6 h-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent-jade)] shrink-0"
    />
  );
}

export default function OrchestratorThinkingBanner({
  state,
  startTime,
}: OrchestratorThinkingBannerProps) {
  const isActive = state.phase !== "complete" && state.phase !== "error";
  const elapsed = useElapsedTimer(startTime, isActive);
  const currentSegment = getSegmentIndex(state.phase);

  const label =
    state.phase === "searching" && state.totalJobs > 0
      ? `Searching ${state.totalJobs} retailer${state.totalJobs > 1 ? "s" : ""}`
      : state.phase === "parsing"
        ? "Analyzing request"
        : state.phase === "planning"
          ? "Building search plan"
          : state.phase === "optimizing"
            ? "Optimizing purchase plan"
            : state.phase === "complete"
              ? `Found ${state.completedJobs} result${state.completedJobs !== 1 ? "s" : ""} in ${formatElapsed(elapsed)}`
              : "Error";

  const lastLog =
    state.logLines.length > 0
      ? state.logLines[state.logLines.length - 1]
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5"
    >
      <div className="flex items-center gap-2.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <PhaseIcon phase={state.phase} />
          </motion.div>
        </AnimatePresence>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="text-sm font-medium text-[var(--fg-base)]"
              >
                {label}
              </motion.span>
            </AnimatePresence>

            {/* Live counter for searching phase */}
            {state.phase === "searching" && state.totalJobs > 0 && (
              <span className="text-[10px] font-mono text-[var(--fg-disabled)] tabular-nums">
                {state.completedJobs + state.failedJobs}/{state.totalJobs}
                {state.failedJobs > 0 && (
                  <span className="text-[var(--accent-destructive)]">
                    {" "}
                    ({state.failedJobs} failed)
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Streaming log line */}
          {isActive && lastLog && (
            <motion.p
              key={lastLog}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="text-[11px] font-mono text-[var(--fg-disabled)] truncate mt-0.5"
            >
              {lastLog}
            </motion.p>
          )}
        </div>

        {/* Elapsed timer */}
        {isActive && startTime && (
          <span className="text-[11px] font-mono text-[var(--fg-disabled)] tabular-nums shrink-0">
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {/* 4-segment progress bar */}
      <div className="flex gap-0.5 mt-2">
        {phaseSegments.map((seg, i) => {
          const isComplete = i < currentSegment || state.phase === "complete";
          const isCurrent = i === currentSegment && isActive;

          return (
            <div
              key={seg}
              className="flex-1 h-0.5 rounded-full overflow-hidden bg-[var(--bg-subtle)]"
            >
              {isComplete && (
                <motion.div
                  className="h-full rounded-full bg-[var(--accent-jade)]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.2, delay: state.phase === "complete" ? i * 0.04 : 0 }}
                />
              )}
              {isCurrent && (
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-jade)] via-[var(--accent-amber)] to-[var(--accent-jade)] animate-shimmer w-full opacity-60" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
