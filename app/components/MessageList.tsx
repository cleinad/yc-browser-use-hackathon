"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ChatMessage, AgentMessage, CheckoutStrategy } from "../types";
import AgentCardGrid from "./AgentCardGrid";
import OrchestratorThinkingBanner from "./OrchestratorThinkingBanner";
import PurchasePlanCard from "./PurchasePlanCard";
import StrategyToggle from "./checkout/StrategyToggle";
import ComparisonTable from "./checkout/ComparisonTable";
import CheckoutFooter from "./checkout/CheckoutFooter";
import { useOrchestratorState } from "./hooks/useOrchestratorState";
import { useResultTransition } from "./hooks/useResultTransition";
import { useComparisonData } from "./checkout/useComparisonData";

interface MessageListProps {
  messages: ChatMessage[];
}

function AgentMessageBlock({ msg }: { msg: AgentMessage }) {
  const orchestratorState = useOrchestratorState(
    msg.events,
    msg.done,
    !!msg.plan,
    !!msg.error
  );
  const transition = useResultTransition(msg.done, !!msg.plan);
  const [startTime] = useState(() => Date.now());
  const [strategy, setStrategy] = useState<CheckoutStrategy>("cheapest");
  const comparisonTable = useComparisonData(msg.plan ?? null, strategy);

  return (
    <div className="max-w-full space-y-3">
      {/* Orchestrator banner */}
      <OrchestratorThinkingBanner
        state={orchestratorState}
        startTime={startTime}
      />

      {/* Agent card grid — scrollable when done */}
      <AgentCardGrid
        events={msg.events}
        cardOpacity={transition.cardOpacity}
        cardScale={transition.cardScale}
        done={msg.done}
      />

      {/* Error */}
      {msg.error && (
        <div className="rounded-lg border border-[var(--accent-destructive)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--accent-destructive)]">
          {msg.error}
        </div>
      )}

      {/* Inline purchase plan — appears directly in the chat */}
      {msg.done && msg.plan && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="space-y-4"
        >
          {/* Strategy toggle */}
          <StrategyToggle strategy={strategy} onChange={setStrategy} />

          {/* Comparison table */}
          {comparisonTable && (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
              <ComparisonTable table={comparisonTable} />
              <CheckoutFooter retailerTotals={comparisonTable.retailerTotals} />
            </div>
          )}

          {/* Full plan card with all options */}
          <PurchasePlanCard plan={msg.plan} />
        </motion.div>
      )}
    </div>
  );
}

export default function MessageList({ messages }: MessageListProps) {
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

        return <AgentMessageBlock key={i} msg={msg} />;
      })}
      <div ref={bottomRef} />
    </div>
  );
}
