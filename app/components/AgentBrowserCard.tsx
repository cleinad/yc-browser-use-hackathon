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
    glow: "",
  },
  completed: {
    border: "border-[var(--accent-jade)]",
    glow: "",
  },
  failed: {
    border: "border-[var(--accent-destructive)]",
    glow: "",
  },
  retrying: {
    border: "border-[var(--accent-amber)]",
    glow: "",
  },
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
  const fakeUrl = `https://${card.retailer.includes(".") ? card.retailer : card.retailer + ".com"}/search?q=${encodeURIComponent(card.searchQuery)}`;
  const typedUrl = useTypingEffect(fakeUrl, 20);
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
        ? Math.min(activityLines.length * 8, 88)
        : 0;

  const domain = card.retailer.includes(".")
    ? card.retailer
    : `${card.retailer}.com`;

  const isActive = card.status === "searching" || card.status === "retrying";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={
        card.status === "failed"
          ? {
              opacity: 1,
              y: 0,
              x: [0, -3, 3, -3, 3, 0],
              transition: { duration: 0.35 },
            }
          : { opacity: 1, y: 0 }
      }
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, delay: index * 0.06 }}
      className={`rounded-lg ${config.border} bg-[var(--bg-surface)] overflow-hidden ${
        card.status === "completed" ? "animate-pulse-glow" : ""
      }`}
    >
      {/* Tab bar — clean, no traffic lights */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-subtle)] border-b border-[var(--border-default)]">
        {/* Favicon + domain as a "tab" */}
        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt=""
            width={12}
            height={12}
            className="shrink-0 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-[10px] font-medium text-[var(--fg-muted)] truncate max-w-[80px]">
            {domain}
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-3 bg-[var(--border-default)]" />

        {/* URL bar */}
        <div className="flex-1 flex items-center rounded bg-[var(--bg-base)] px-2 py-0.5 text-[10px] font-mono text-[var(--fg-disabled)] overflow-hidden">
          <span className="truncate">{typedUrl}</span>
          {isActive && (
            <span className="ml-0.5 text-[var(--fg-muted)] animate-cursor-blink">
              |
            </span>
          )}
        </div>

        {/* Status indicator */}
        {isActive && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3 rounded-full border border-[var(--fg-disabled)] border-t-[var(--accent-amber)] shrink-0"
          />
        )}
        {card.status === "completed" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-jade)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )}
        {card.status === "failed" && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-destructive)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-1.5 min-h-[52px]">
        {/* Searching: rapid activity feed */}
        {card.status === "searching" && (
          <>
            <div className="space-y-px max-h-16 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {activityLines.slice(-3).map((line, i, arr) => {
                  const isLatest = i === arr.length - 1;
                  return (
                    <motion.div
                      key={`${activityLines.length - arr.length + i}-${line}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: isLatest ? 0.9 : 0.3, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="flex items-center gap-1.5"
                    >
                      {isLatest && (
                        <span className="w-1 h-1 rounded-full bg-[var(--accent-amber)] shrink-0" />
                      )}
                      <span
                        className={`text-[11px] font-mono truncate ${
                          isLatest
                            ? "text-[var(--fg-muted)]"
                            : "text-[var(--fg-disabled)]"
                        }`}
                      >
                        {line}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Progress + timer row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-0.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent-amber)]"
                  animate={{ width: `${progressWidth}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <span className="text-[9px] font-mono text-[var(--fg-disabled)] tabular-nums shrink-0">
                {formatElapsed(elapsed)}
              </span>
            </div>
          </>
        )}

        {/* Retrying */}
        {card.status === "retrying" && (
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[var(--accent-amber)]" />
            <span className="text-[11px] font-mono text-[var(--accent-amber)]">
              Retry attempt {card.attempt}...
            </span>
          </div>
        )}

        {/* Completed */}
        {card.status === "completed" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-jade)]" />
              <span className="text-[11px] font-medium text-[var(--accent-jade)]">
                Found results
              </span>
            </div>
            <span className="text-[9px] font-mono text-[var(--fg-disabled)] tabular-nums">
              {formatElapsed(elapsed)}
            </span>
          </motion.div>
        )}

        {/* Failed */}
        {card.status === "failed" && (
          <div className="space-y-1">
            <p className="text-[11px] font-mono text-[var(--accent-destructive)] truncate">
              {card.message || "Search failed"}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-destructive)]" />
              <span className="text-[11px] font-medium text-[var(--accent-destructive)]">
                Failed
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
