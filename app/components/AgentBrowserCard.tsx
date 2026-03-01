"use client";

import { motion } from "framer-motion";
import type { AgentCardState } from "../types";
import { useTypingEffect } from "./hooks/useTypingEffect";

interface AgentBrowserCardProps {
  card: AgentCardState;
}

const statusConfig = {
  searching: {
    border: "border-[var(--border-default)]",
    shadow: "",
    label: "Searching...",
  },
  completed: {
    border: "border-[var(--accent-jade)]",
    shadow: "shadow-[0_0_12px_rgba(111,162,135,0.3)]",
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

export default function AgentBrowserCard({ card }: AgentBrowserCardProps) {
  const fakeUrl = `${card.retailer}/search?q=${encodeURIComponent(card.searchQuery)}`;
  const typedUrl = useTypingEffect(fakeUrl, 30);
  const config = statusConfig[card.status];

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
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`rounded-xl ${config.border} ${config.shadow} bg-[var(--bg-surface)] overflow-hidden transition-shadow duration-300`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-subtle)] border-b border-[var(--border-default)]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex items-center rounded-md bg-[var(--bg-base)] px-2.5 py-1 text-[11px] font-mono text-[var(--fg-muted)] overflow-hidden">
          <span className="truncate">{typedUrl}</span>
          {card.status === "searching" && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
              className="ml-0.5 text-[var(--fg-base)]"
            >
              |
            </motion.span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-3 space-y-2">
        <p className="text-xs text-[var(--fg-muted)]">
          {card.message || `Searching for "${card.searchQuery}"`}
        </p>

        {card.status === "searching" && (
          <div className="h-1.5 rounded-full bg-gradient-to-r from-[var(--bg-subtle)] via-[var(--accent-amber)] to-[var(--bg-subtle)] animate-shimmer" />
        )}

        {card.status === "retrying" && (
          <p className="text-[11px] font-medium text-[var(--accent-amber)]">
            Attempt {card.attempt}...
          </p>
        )}

        {card.status === "completed" && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-jade)]" />
            <span className="text-[11px] font-medium text-[var(--accent-jade)]">
              {config.label}
            </span>
          </div>
        )}

        {card.status === "failed" && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-destructive)]" />
            <span className="text-[11px] font-medium text-[var(--accent-destructive)]">
              {config.label}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
