"use client";

import { useMemo } from "react";
import type {
  PurchasePlan,
  CheckoutStrategy,
  ComparisonRow,
  ComparisonCell,
  ComparisonTable,
} from "../../types";

function parseDeliveryDays(estimate: string | null): number {
  if (!estimate) return 999;
  const lower = estimate.toLowerCase();
  if (lower.includes("next day") || lower.includes("1 day")) return 1;
  if (lower.includes("same day")) return 0;
  const match = lower.match(/(\d+)\s*(?:day|business)/);
  if (match) return parseInt(match[1], 10);
  // "1-2 weeks" style
  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) return parseInt(weekMatch[1], 10) * 7;
  return 999;
}

export function useComparisonData(
  plan: PurchasePlan | null,
  strategy: CheckoutStrategy
): ComparisonTable | null {
  return useMemo(() => {
    if (!plan) return null;

    // 1. Flatten all line items, deduplicate by (part_name, retailer), keep cheapest
    const cellMap = new Map<string, ComparisonCell>();
    const partNames = new Set<string>();
    const retailers = new Set<string>();

    for (const option of plan.options) {
      for (const item of option.line_items) {
        const retailer = item.retailer ?? "Unknown";
        const key = `${item.part_name}::${retailer}`;
        partNames.add(item.part_name);
        retailers.add(retailer);

        const existing = cellMap.get(key);
        if (
          !existing ||
          (item.price != null &&
            (existing.price == null || item.price < existing.price))
        ) {
          cellMap.set(key, {
            retailer,
            price: item.price,
            currency: item.currency,
            availability: item.availability,
            delivery_estimate: item.delivery_estimate,
            product_url: item.product_url,
            product_name: item.product_name,
          });
        }
      }
    }

    const retailerList = Array.from(retailers).sort();

    // 2. Build rows
    const rows: ComparisonRow[] = Array.from(partNames).map((partName) => {
      const cells = new Map<string, ComparisonCell>();
      for (const r of retailerList) {
        const cell = cellMap.get(`${partName}::${r}`);
        if (cell) cells.set(r, cell);
      }
      return { partName, cells };
    });

    // 3. Select best retailer per row based on strategy
    const selectedRetailers = new Map<string, string>();

    for (const row of rows) {
      let bestRetailer: string | null = null;
      let bestScore = Infinity;

      for (const [retailer, cell] of row.cells) {
        let score: number;
        if (strategy === "cheapest") {
          score = cell.price ?? Infinity;
        } else {
          score = parseDeliveryDays(cell.delivery_estimate);
        }
        if (score < bestScore) {
          bestScore = score;
          bestRetailer = retailer;
        }
      }

      if (bestRetailer) {
        selectedRetailers.set(row.partName, bestRetailer);
      }
    }

    // 4. Compute per-retailer subtotals (for selected items only)
    const retailerTotals = new Map<string, number>();
    for (const [partName, retailer] of selectedRetailers) {
      const row = rows.find((r) => r.partName === partName);
      const cell = row?.cells.get(retailer);
      if (cell?.price != null) {
        retailerTotals.set(
          retailer,
          (retailerTotals.get(retailer) ?? 0) + cell.price
        );
      }
    }

    return { rows, retailers: retailerList, selectedRetailers, retailerTotals };
  }, [plan, strategy]);
}
