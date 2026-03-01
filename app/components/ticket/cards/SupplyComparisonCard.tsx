"use client";

import { useState } from "react";
import type { CheckoutStrategy, PurchasePlan } from "@/app/types";
import CardShell from "./CardShell";
import StrategyToggle from "../../checkout/StrategyToggle";
import ComparisonTable from "../../checkout/ComparisonTable";
import CheckoutFooter from "../../checkout/CheckoutFooter";
import PurchasePlanCard from "../../PurchasePlanCard";
import { useComparisonData } from "../../checkout/useComparisonData";

interface SupplyComparisonCardProps {
  purchasePlan: PurchasePlan;
  loading?: boolean;
  active?: boolean;
}

export default function SupplyComparisonCard({
  purchasePlan,
  loading,
  active,
}: SupplyComparisonCardProps) {
  const [strategy, setStrategy] = useState<CheckoutStrategy>("cheapest");
  const comparisonTable = useComparisonData(purchasePlan, strategy);

  return (
    <CardShell
      title="Supply Comparison"
      status={active ? "active" : "complete"}
    >
      <div className={`space-y-4 ${loading ? "relative" : ""}`}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[var(--bg-surface)]/60 backdrop-blur-[2px]">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-amber)] border-t-transparent" />
          </div>
        )}
        <StrategyToggle strategy={strategy} onChange={setStrategy} />

        {comparisonTable && (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
            <ComparisonTable table={comparisonTable} />
            <CheckoutFooter retailerTotals={comparisonTable.retailerTotals} />
          </div>
        )}

        <PurchasePlanCard plan={purchasePlan} />
      </div>
    </CardShell>
  );
}
