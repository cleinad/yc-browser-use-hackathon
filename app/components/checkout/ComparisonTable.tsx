"use client";

import type { ComparisonTable as ComparisonTableType } from "../../types";
import ComparisonRowCell from "./ComparisonRowCell";
import RetailerBadge from "../RetailerBadge";

interface ComparisonTableProps {
  table: ComparisonTableType;
}

export default function ComparisonTable({ table }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--border-default)]">
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
              Part
            </th>
            {table.retailers.map((r) => (
              <th
                key={r}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]"
              >
                <RetailerBadge retailer={r} size="md" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => {
            const selectedRetailer = table.selectedRetailers.get(row.partName);
            return (
              <tr
                key={row.partName}
                className="border-b border-[var(--border-default)] last:border-b-0"
              >
                <td className="px-3 py-2.5">
                  <p className="text-sm font-medium text-[var(--fg-base)]">
                    {row.partName}
                  </p>
                </td>
                {table.retailers.map((r) => (
                  <ComparisonRowCell
                    key={r}
                    cell={row.cells.get(r)}
                    selected={selectedRetailer === r}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
