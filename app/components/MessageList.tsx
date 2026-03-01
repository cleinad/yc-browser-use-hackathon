"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import AgentCardGrid from "./AgentCardGrid";

interface MessageListProps {
  messages: ChatMessage[];
  onOpenPanel?: () => void;
}

export default function MessageList({ messages, onOpenPanel }: MessageListProps) {
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

        // Agent message
        return (
          <div key={i} className="max-w-full space-y-3">
            <AgentCardGrid events={msg.events} />

            {msg.error && (
              <div className="rounded-lg border border-[var(--accent-destructive)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--accent-destructive)]">
                {msg.error}
              </div>
            )}

            {msg.plan && (
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

            {!msg.done && !msg.error && (
              <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--fg-muted)]" />
                Searching...
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
