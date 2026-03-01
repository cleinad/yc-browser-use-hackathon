"use client";

import { motion } from "framer-motion";
import type { PurchasePlan, CheckoutStrategy } from "../../types";
import { useComparisonData } from "./useComparisonData";
import StrategyToggle from "./StrategyToggle";
import ComparisonTable from "./ComparisonTable";
import CheckoutFooter from "./CheckoutFooter";

interface CheckoutPanelProps {
  plan: PurchasePlan;
  strategy: CheckoutStrategy;
  onStrategyChange: (s: CheckoutStrategy) => void;
  onClose: () => void;
}

export default function CheckoutPanel({
  plan,
  strategy,
  onStrategyChange,
  onClose,
}: CheckoutPanelProps) {
  const table = useComparisonData(plan, strategy);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 h-full w-full sm:w-1/2 bg-[var(--bg-surface)] border-l border-[var(--border-default)] z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
        <h2 className="text-lg font-semibold text-[var(--fg-base)]">
          Purchase Plan
        </h2>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--bg-subtle)] transition text-[var(--fg-muted)] hover:text-[var(--fg-base)]"
          aria-label="Close panel"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Strategy Toggle */}
      <div className="px-5 py-4">
        <StrategyToggle strategy={strategy} onChange={onStrategyChange} />
      </div>

      {/* Comparison Table */}
      <div className="flex-1 overflow-y-auto px-5">
        {table ? (
          <ComparisonTable table={table} />
        ) : (
          <p className="text-sm text-[var(--fg-muted)] text-center py-8">
            No comparison data available.
          </p>
        )}
      </div>

      {/* Footer */}
      {table && <CheckoutFooter retailerTotals={table.retailerTotals} />}
    </motion.div>
  );
}
