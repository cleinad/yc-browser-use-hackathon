"use client";

import { motion } from "framer-motion";
import type { LabeledPlanOption, OrderDecision } from "../types";
import LineItemRow from "./LineItemRow";

interface RecommendationCardProps {
  option: LabeledPlanOption;
  decision: OrderDecision;
  acceptedRank: number | null;
  onAccept: () => void;
  onReject: () => void;
  onClear: () => void;
}

export default function RecommendationCard({
  option,
  decision,
  acceptedRank,
  onAccept,
  onReject,
  onClear,
}: RecommendationCardProps) {
  const isThisAccepted = decision === "accepted" && acceptedRank === option.rank;
  const isOtherAccepted = decision === "accepted" && acceptedRank !== option.rank;
  const isThisRejected = decision === "rejected" && acceptedRank === option.rank;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Summary */}
      <p className="text-sm font-medium text-[var(--fg-base)] leading-snug">
        {option.summary}
      </p>

      {/* Delivery */}
      {option.delivery_summary && (
        <p className="mt-1 text-xs text-[var(--fg-muted)]">
          Delivery: {option.delivery_summary}
        </p>
      )}

      {option.tradeoffs && (
        <p className="mt-1 text-xs text-[var(--fg-muted)]">
          Tradeoffs: {option.tradeoffs}
        </p>
      )}

      {/* Line items — always visible with images */}
      {option.line_items.length > 0 && (
        <div className="mt-3">
          {option.line_items.map((item, i) => (
            <LineItemRow key={i} item={item} index={i} />
          ))}
        </div>
      )}

      {/* Accept / Reject buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border-default)]">
        {isThisAccepted ? (
          <>
            <span className="rounded-lg bg-[color-mix(in_srgb,var(--accent-jade)_14%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-jade)]">
              Accepted
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] underline-offset-2 hover:underline"
            >
              Undo
            </button>
          </>
        ) : isThisRejected ? (
          <>
            <span className="rounded-lg bg-[color-mix(in_srgb,var(--accent-destructive)_14%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-destructive)]">
              Rejected
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] underline-offset-2 hover:underline"
            >
              Undo
            </button>
          </>
        ) : isOtherAccepted ? (
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:border-[var(--fg-muted)]"
          >
            Choose this instead
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onAccept}
              className="rounded-lg bg-[color-mix(in_srgb,var(--accent-jade)_14%,transparent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-jade)] hover:bg-[color-mix(in_srgb,var(--accent-jade)_22%,transparent)]"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:border-[var(--fg-muted)]"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
