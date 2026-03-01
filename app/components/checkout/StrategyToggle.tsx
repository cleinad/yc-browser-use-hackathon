"use client";

import { motion } from "framer-motion";
import type { CheckoutStrategy } from "../../types";

interface StrategyToggleProps {
  strategy: CheckoutStrategy;
  onChange: (s: CheckoutStrategy) => void;
}

const options: { value: CheckoutStrategy; label: string }[] = [
  { value: "cheapest", label: "Best Price" },
  { value: "fastest", label: "Fastest Delivery" },
];

export default function StrategyToggle({
  strategy,
  onChange,
}: StrategyToggleProps) {
  return (
    <div className="relative flex rounded-lg bg-[var(--bg-subtle)] p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            strategy === opt.value
              ? "text-[var(--bg-base)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg-base)]"
          }`}
        >
          {strategy === opt.value && (
            <motion.div
              layoutId="strategy-pill"
              className="absolute inset-0 rounded-md bg-[var(--accent-primary)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
