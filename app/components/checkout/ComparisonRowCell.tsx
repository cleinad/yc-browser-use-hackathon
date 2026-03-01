"use client";

import { motion } from "framer-motion";
import type { ComparisonCell } from "../../types";

interface ComparisonRowCellProps {
  cell: ComparisonCell | undefined;
  selected: boolean;
}

export default function ComparisonRowCell({
  cell,
  selected,
}: ComparisonRowCellProps) {
  if (!cell) {
    return (
      <td className="px-3 py-2.5 text-center text-xs text-[var(--fg-disabled)]">
        Not available
      </td>
    );
  }

  return (
    <td
      className={`px-3 py-2.5 transition-opacity duration-200 ${
        selected ? "opacity-100" : "opacity-60"
      }`}
    >
      <motion.div
        animate={
          selected
            ? { backgroundColor: "rgba(111, 162, 135, 0.1)" }
            : { backgroundColor: "rgba(0, 0, 0, 0)" }
        }
        className="rounded-lg p-2 -m-1"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[var(--fg-base)]">
            {cell.price != null
              ? `${cell.currency} ${cell.price.toFixed(2)}`
              : "—"}
          </span>
          {selected && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-jade)] bg-[rgba(111,162,135,0.15)] px-1.5 py-0.5 rounded"
            >
              Selected
            </motion.span>
          )}
        </div>
        {cell.availability && (
          <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
            {cell.availability}
          </p>
        )}
        {cell.delivery_estimate && (
          <p className="text-[11px] text-[var(--fg-muted)]">
            {cell.delivery_estimate}
          </p>
        )}
      </motion.div>
    </td>
  );
}
