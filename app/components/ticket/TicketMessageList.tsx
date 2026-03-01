"use client";

import { useEffect, useRef } from "react";
import type { TicketMessage } from "@/app/types";

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*(.*)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    return part;
  });
}

interface TicketMessageListProps {
  messages: TicketMessage[];
}

export default function TicketMessageList({ messages }: TicketMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-[var(--fg-muted)]">
            Upload a photo of a maintenance issue to get started.
          </p>
          <p className="text-xs text-[var(--fg-disabled)]">
            We&apos;ll analyze the problem, find contractors, and get you the best quotes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg, i) => {
        if (msg.role === "user") {
          return (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] space-y-2">
                {msg.imageUrl && (
                  <div className="flex justify-end">
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded issue"
                      className="max-w-[240px] rounded-xl border border-[var(--border-default)] cursor-pointer hover:opacity-90 transition"
                    />
                  </div>
                )}
                {msg.text && (
                  <div className="rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm leading-6 text-[var(--bg-base)] whitespace-pre-wrap">
                    {renderMarkdown(msg.text)}
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="flex justify-start">
            <div className="max-w-[85%] rounded-xl bg-[var(--bg-subtle)] px-4 py-2.5 text-sm leading-6 text-[var(--fg-base)] whitespace-pre-wrap">
              {renderMarkdown(msg.text)}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
