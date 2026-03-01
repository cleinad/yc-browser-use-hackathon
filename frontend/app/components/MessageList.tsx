"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import StatusFeed from "./StatusFeed";
import PurchasePlanCard from "./PurchasePlanCard";

interface MessageListProps {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-center text-zinc-400 text-sm">
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
              <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2.5 text-sm text-white whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          );
        }

        // Agent message
        return (
          <div key={i} className="max-w-full space-y-3">
            <StatusFeed events={msg.events} />

            {msg.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {msg.error}
              </div>
            )}

            {msg.plan && <PurchasePlanCard plan={msg.plan} />}

            {!msg.done && !msg.error && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
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
