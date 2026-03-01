"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { OrderDecision, PurchasePlan } from "../types";
import { isPurchasePlan } from "../types";
import RecommendationGrid from "./RecommendationGrid";

interface OrderHistoryProps {
  propertyId: Id<"properties">;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

function DecisionBadge({
  status,
  decision,
}: {
  status: string;
  decision: string;
}) {
  if (status === "queued" || status === "running") {
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[color-mix(in_srgb,var(--accent-amber)_12%,transparent)] text-[var(--accent-amber)]">
        In Progress
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[color-mix(in_srgb,var(--accent-destructive)_12%,transparent)] text-[var(--accent-destructive)]">
        Failed
      </span>
    );
  }
  if (decision === "accepted") {
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[color-mix(in_srgb,var(--accent-jade)_12%,transparent)] text-[var(--accent-jade)]">
        Accepted
      </span>
    );
  }
  if (decision === "rejected") {
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[color-mix(in_srgb,var(--accent-destructive)_8%,transparent)] text-[var(--fg-muted)]">
        Rejected
      </span>
    );
  }
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
      Pending Decision
    </span>
  );
}

type TimelineEntry = {
  id: string;
  inputText: string;
  displayText: string | null;
  status: string;
  error: string | null;
  createdAt: number;
  result: unknown | null;
  decision: string;
  acceptedOptionRank: number | null;
};

export default function OrderHistory({ propertyId }: OrderHistoryProps) {
  const timeline = useQuery(api.quotes.listMineWithEvents, {
    propertyId,
    limit: 50,
  }) as TimelineEntry[] | undefined;
  const setDecision = useMutation(api.quotes.setDecision);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (timeline === undefined) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
          />
        ))}
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-10 text-center">
        <p className="text-sm text-[var(--fg-muted)]">
          No orders yet. Start a chat to create your first request.
        </p>
      </div>
    );
  }

  const handleDecisionChange = async (
    requestId: string,
    decision: OrderDecision,
    optionRank?: number,
  ) => {
    try {
      await setDecision({
        requestId: requestId as Id<"quoteRequests">,
        decision,
        optionRank,
      });
    } catch {
      // Silent — reactivity will reflect server state
    }
  };

  // Show in reverse chronological order
  const sorted = [...timeline].reverse();

  return (
    <div className="space-y-2 py-4">
      {sorted.map((entry) => {
        const plan: PurchasePlan | null = isPurchasePlan(entry.result)
          ? (entry.result as PurchasePlan)
          : null;
        const isExpanded = expandedId === entry.id;

        return (
          <div
            key={entry.id}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--fg-base)] truncate">
                  {entry.displayText ?? entry.inputText}
                </p>
                <p className="text-xs text-[var(--fg-disabled)] mt-0.5">
                  {formatRelativeTime(entry.createdAt)}
                </p>
              </div>
              <DecisionBadge
                status={entry.status}
                decision={entry.decision}
              />
            </button>

            {isExpanded && plan && (
              <div className="px-4 pb-4 border-t border-[var(--border-default)]">
                <div className="pt-3">
                  <RecommendationGrid
                    plan={plan}
                    requestId={entry.id}
                    decision={(entry.decision ?? "pending") as OrderDecision}
                    acceptedOptionRank={entry.acceptedOptionRank ?? null}
                    onDecisionChange={(decision, optionRank) =>
                      handleDecisionChange(entry.id, decision, optionRank)
                    }
                  />
                </div>
              </div>
            )}

            {isExpanded && !plan && entry.error && (
              <div className="px-4 pb-4 border-t border-[var(--border-default)]">
                <p className="pt-3 text-sm text-[var(--accent-destructive)]">
                  {entry.error}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
