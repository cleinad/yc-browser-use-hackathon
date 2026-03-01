"use client";

import { motion } from "framer-motion";
import type { PurchasePlan } from "../types";
import LineItemRow from "./LineItemRow";
import { useCountUp } from "./hooks/useCountUp";

interface PurchasePlanCardProps {
  plan: PurchasePlan;
}

function AnimatedTotal({
  value,
  currency,
}: {
  value: number;
  currency: string;
}) {
  const animated = useCountUp(value);
  return (
    <span className="shrink-0 text-sm font-semibold text-[var(--fg-base)]">
      {currency} {animated.toFixed(2)}
    </span>
  );
}

export default function PurchasePlanCard({ plan }: PurchasePlanCardProps) {
  return (
    <div className="space-y-3">
      {plan.notes && (
        <p className="text-sm italic text-[var(--fg-muted)]">{plan.notes}</p>
      )}

      {plan.options.map((option, optIdx) => (
        <motion.div
          key={option.rank}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: optIdx * 0.1 }}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
        >
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: optIdx * 0.1 + 0.15,
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-bold text-[var(--bg-base)]"
              >
                {option.rank}
              </motion.span>
              <p className="text-sm font-semibold text-[var(--fg-base)]">
                {option.summary}
              </p>
            </div>
            {option.estimated_total != null && (
              <AnimatedTotal
                value={option.estimated_total}
                currency={option.currency}
              />
            )}
          </div>

          {/* Line items */}
          {option.line_items.length > 0 && (
            <div className="mb-3">
              {option.line_items.map((item, i) => (
                <LineItemRow key={i} item={item} index={i} />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--fg-muted)]">
            {option.delivery_summary && (
              <span>Delivery: {option.delivery_summary}</span>
            )}
            {option.tradeoffs && <span>Tradeoffs: {option.tradeoffs}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
