"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AgentCardState } from "../types";
import { useTypingEffect } from "./hooks/useTypingEffect";
import { useCardActivitySimulator } from "./hooks/useCardActivitySimulator";
import { useElapsedTimer } from "./hooks/useElapsedTimer";

interface AgentBrowserCardProps {
  card: AgentCardState;
  index?: number;
}

const statusConfig = {
  searching: {
    border: "border-[var(--border-default)]",
    shadow: "",
    label: "Searching...",
  },
  completed: {
    border: "border-[var(--accent-jade)]",
    shadow: "",
    label: "Found results",
  },
  failed: {
    border: "border-[var(--accent-destructive)]",
    shadow: "",
    label: "Failed",
  },
  retrying: {
    border: "border-[var(--accent-amber)]",
    shadow: "",
    label: "Retrying...",
  },
};

const shakeAnimation = {
  x: [0, -4, 4, -4, 4, 0],
  transition: { duration: 0.4 },
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

export default function AgentBrowserCard({
  card,
  index = 0,
}: AgentBrowserCardProps) {
  const fakeUrl = `${card.retailer}/search?q=${encodeURIComponent(card.searchQuery)}`;
  const typedUrl = useTypingEffect(fakeUrl, 30);
  const config = statusConfig[card.status];
  const activityLines = useCardActivitySimulator(card.retailer, card.status);
  const elapsed = useElapsedTimer(
    card.startedAt,
    card.status === "searching" || card.status === "retrying"
  );

  const progressWidth =
    card.status === "completed"
      ? 100
      : card.status === "searching"
        ? Math.min(activityLines.length * 15, 85)
        : 0;

  const domain = card.retailer.includes(".")
    ? card.retailer
    : `${card.retailer}.com`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={
        card.status === "failed"
          ? { opacity: 1, scale: 1, y: 0, ...shakeAnimation }
          : { opacity: 1, scale: 1, y: 0 }
      }
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 28,
        delay: index * 0.1,
      }}
      className={`rounded-xl ${config.border} ${config.shadow} bg-[var(--bg-surface)] overflow-hidden transition-shadow duration-300 ${
        card.status === "completed" ? "animate-pulse-glow" : ""
      }`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-subtle)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt=""
            width={14}
            height={14}
            className="ml-1 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="flex-1 flex items-center rounded-md bg-[var(--bg-base)] px-2.5 py-1 text-[11px] font-mono text-[var(--fg-muted)] overflow-hidden">
          <span className="truncate">{typedUrl}</span>
          {card.status === "searching" && (
            <span className="ml-0.5 text-[var(--fg-base)] animate-cursor-blink">
              |
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-3 space-y-2">
        {/* Searching state: activity feed */}
        {card.status === "searching" && (
          <>
            <div className="max-h-20 overflow-hidden mask-fade-top space-y-0.5">
              {activityLines.map((line, i) => {
                const isLast = i === activityLines.length - 1;
                return (
                  <motion.p
                    key={`${i}-${line}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: isLast ? 1 : 0.4, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`text-xs font-mono ${
                      isLast
                        ? "text-[var(--fg-muted)]"
                        : "text-[var(--fg-disabled)]"
                    }`}
                  >
                    {line}
                    {isLast && (
                      <span className="animate-cursor-blink ml-0.5">
                        |
                      </span>
                    )}
                  </motion.p>
                );
              })}
            </div>

            {/* Segmented progress bar */}
            <div className="h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-amber)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progressWidth}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>

            {/* Elapsed timer */}
            <div className="flex justify-end">
              <span className="text-[10px] font-mono text-[var(--fg-disabled)]">
                {formatElapsed(elapsed)}
              </span>
            </div>
          </>
        )}

        {/* Retrying state */}
        {card.status === "retrying" && (
          <>
            <p className="text-xs font-mono text-[var(--accent-amber)]">
              Attempt {card.attempt}... Retrying search
            </p>
            <div className="h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-amber)]"
                initial={{ width: "85%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </>
        )}

        {/* Completed state */}
        <AnimatePresence>
          {card.status === "completed" && (
            <>
              <div className="h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent-jade)]"
                  initial={{ width: `${progressWidth}%` }}
                  animate={{ width: "100%" }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-jade)]" />
                <span className="text-[11px] font-medium text-[var(--accent-jade)]">
                  {config.label}
                </span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Failed state */}
        {card.status === "failed" && (
          <>
            <p className="text-xs font-mono text-[var(--accent-destructive)]">
              {card.message || "Search failed"}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-destructive)]" />
              <span className="text-[11px] font-medium text-[var(--accent-destructive)]">
                {config.label}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
