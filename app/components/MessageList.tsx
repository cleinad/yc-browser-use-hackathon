"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ChatMessage, AgentMessage } from "../types";
import AgentCardGrid from "./AgentCardGrid";
import OrchestratorThinkingBanner from "./OrchestratorThinkingBanner";
import { useOrchestratorState } from "./hooks/useOrchestratorState";
import { useResultTransition } from "./hooks/useResultTransition";

interface MessageListProps {
  messages: ChatMessage[];
  onOpenPanel?: () => void;
}

function AgentMessageBlock({
  msg,
  onOpenPanel,
}: {
  msg: AgentMessage;
  onOpenPanel?: () => void;
}) {
  const orchestratorState = useOrchestratorState(
    msg.events,
    msg.done,
    !!msg.plan,
    !!msg.error
  );

  const transition = useResultTransition(msg.done, !!msg.plan);

  const [startTime] = useState(() => Date.now());

  return (
    <div className="max-w-full space-y-3">
      {/* Orchestrator banner: show while not done */}
      {!msg.done && (
        <OrchestratorThinkingBanner
          state={orchestratorState}
          startTime={startTime}
        />
      )}

      {/* Show completed banner briefly */}
      {msg.done && orchestratorState.phase === "complete" && (
        <OrchestratorThinkingBanner
          state={orchestratorState}
          startTime={startTime}
        />
      )}

      {/* Agent card grid with transition opacity/scale */}
      <AgentCardGrid
        events={msg.events}
        cardOpacity={transition.cardOpacity}
        cardScale={transition.cardScale}
      />

      {msg.error && (
        <div className="rounded-lg border border-[var(--accent-destructive)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--accent-destructive)]">
          {msg.error}
        </div>
      )}

      {transition.showButton && msg.plan && (
        <motion.button
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={onOpenPanel}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-jade)] bg-[rgba(111,162,135,0.1)] px-4 py-2.5 text-sm font-medium text-[var(--accent-jade)] hover:bg-[rgba(111,162,135,0.2)] transition"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          View Purchase Plan
        </motion.button>
      )}

      {/* Non-transition: show button immediately if already done on mount */}
      {!transition.showButton && msg.done && msg.plan && (
        <button
          onClick={onOpenPanel}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-jade)] bg-[rgba(111,162,135,0.1)] px-4 py-2.5 text-sm font-medium text-[var(--accent-jade)] hover:bg-[rgba(111,162,135,0.2)] transition"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          View Purchase Plan
        </button>
      )}
    </div>
  );
}

export default function MessageList({
  messages,
  onOpenPanel,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-center text-sm text-[var(--fg-muted)]">
          Tell us what parts you need and we&apos;ll find the best deals.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg, i) => {
        if (msg.role === "user") {
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm leading-6 text-[var(--bg-base)] whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          );
        }

        return (
          <AgentMessageBlock
            key={i}
            msg={msg}
            onOpenPanel={onOpenPanel}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
