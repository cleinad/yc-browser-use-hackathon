"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { ChatMessage, AgentMessage, OrderDecision } from "../types";
import AgentCardGrid from "./AgentCardGrid";
import OrchestratorThinkingBanner from "./OrchestratorThinkingBanner";
import RecommendationGrid from "./RecommendationGrid";
import ComparisonTable from "./checkout/ComparisonTable";
import CheckoutFooter from "./checkout/CheckoutFooter";
import { useOrchestratorState } from "./hooks/useOrchestratorState";
import { useResultTransition } from "./hooks/useResultTransition";
import { useComparisonData } from "./checkout/useComparisonData";

interface MessageListProps {
  messages: ChatMessage[];
  onLocalDecisionChange?: (
    requestId: string,
    decision: OrderDecision,
    optionRank?: number,
  ) => Promise<void> | void;
}

function AgentMessageBlock({
  msg,
  onLocalDecisionChange,
}: {
  msg: AgentMessage;
  onLocalDecisionChange?: (
    requestId: string,
    decision: OrderDecision,
    optionRank?: number,
  ) => Promise<void> | void;
}) {
  const orchestratorState = useOrchestratorState(
    msg.events,
    msg.done,
    !!msg.plan,
    !!msg.error
  );
  const transition = useResultTransition(msg.done, !!msg.plan);
  const [startTime] = useState(() => Date.now());
  const comparisonTable = useComparisonData(msg.plan ?? null, "cheapest");
  const setDecision = useMutation(api.quotes.setDecision);
  const [showComparison, setShowComparison] = useState(false);

  const handleDecisionChange = async (decision: OrderDecision, optionRank?: number) => {
    if (onLocalDecisionChange && msg.requestId) {
      await onLocalDecisionChange(msg.requestId, decision, optionRank);
      return;
    }

    if (!msg.requestId) return;
    try {
      await setDecision({
        requestId: msg.requestId as Id<"quoteRequests">,
        decision,
        optionRank,
      });
    } catch {
      // Mutation failed silently — UI will reflect server state via reactivity
    }
  };

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

      {/* Recommendation grid — replaces old StrategyToggle + PurchasePlanCard */}
      {msg.done && msg.plan && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="space-y-4"
        >
          <RecommendationGrid
            plan={msg.plan}
            requestId={msg.requestId ?? ""}
            decision={msg.decision ?? "pending"}
            acceptedOptionRank={msg.acceptedOptionRank ?? null}
            onDecisionChange={handleDecisionChange}
          />

          {/* Collapsible comparison table */}
          {comparisonTable && (
            <div>
              <button
                type="button"
                onClick={() => setShowComparison(!showComparison)}
                className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] underline-offset-2 hover:underline"
              >
                {showComparison ? "Hide" : "View"} detailed comparison
              </button>
              {showComparison && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
                >
                  <ComparisonTable table={comparisonTable} />
                  <CheckoutFooter retailerTotals={comparisonTable.retailerTotals} />
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function MessageList({
  messages,
  onLocalDecisionChange,
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
            onLocalDecisionChange={onLocalDecisionChange}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
