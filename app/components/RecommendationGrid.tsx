"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { PurchasePlan, OrderDecision, LabeledPlanOption, RecommendationLabel } from "../types";
import { classifyOptions } from "./checkout/classifyOptions";
import RecommendationCard from "./RecommendationCard";

interface RecommendationGridProps {
  plan: PurchasePlan;
  requestId: string;
  decision: OrderDecision;
  acceptedOptionRank: number | null;
  onDecisionChange: (
    decision: OrderDecision,
    optionRank?: number,
  ) => void;
}

const tabColors: Record<RecommendationLabel, { active: string; text: string }> = {
  best: { active: "var(--accent-jade)", text: "var(--accent-jade)" },
  cheapest: { active: "var(--accent-amber)", text: "var(--accent-amber)" },
  fastest: { active: "var(--accent-primary)", text: "var(--accent-primary)" },
};

export default function RecommendationGrid({
  plan,
  decision,
  acceptedOptionRank,
  onDecisionChange,
}: RecommendationGridProps) {
  const labeled = classifyOptions(plan.options);
  const [activeRank, setActiveRank] = useState<number>(labeled[0]?.rank ?? 0);

  if (labeled.length === 0) return null;

  const activeOption = labeled.find((o) => o.rank === activeRank) ?? labeled[0];

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
        {labeled.map((option) => {
          const isActive = option.rank === activeOption.rank;
          const colors = tabColors[option.label];
          return (
            <button
              key={option.rank}
              type="button"
              onClick={() => setActiveRank(option.rank)}
              className={`relative flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-[var(--fg-base)]"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg-base)]"
              }`}
            >
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: isActive ? colors.text : undefined }}
                >
                  {option.labelDisplay}
                </span>
                {option.estimated_total != null && (
                  <span className="text-sm tabular-nums font-semibold">
                    {option.currency} {option.estimated_total.toFixed(2)}
                  </span>
                )}
              </span>
              {isActive && (
                <motion.div
                  layoutId="rec-tab-indicator"
                  className="absolute inset-x-0 bottom-0 h-0.5"
                  style={{ backgroundColor: colors.active }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      <div className="p-4">
        <RecommendationCard
          key={activeOption.rank}
          option={activeOption}
          decision={decision}
          acceptedRank={acceptedOptionRank}
          onAccept={() => onDecisionChange("accepted", activeOption.rank)}
          onReject={() => onDecisionChange("rejected", activeOption.rank)}
          onClear={() => onDecisionChange("pending")}
        />
      </div>
    </div>
  );
}
