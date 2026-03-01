import type { PurchasePlan } from "../types";
import LineItemRow from "./LineItemRow";

interface PurchasePlanCardProps {
  plan: PurchasePlan;
}

export default function PurchasePlanCard({ plan }: PurchasePlanCardProps) {
  return (
    <div className="space-y-3">
      {plan.notes && (
        <p className="text-sm text-zinc-600 italic">{plan.notes}</p>
      )}

      {plan.options.map((option) => (
        <div
          key={option.rank}
          className="rounded-lg border border-zinc-200 bg-white p-4"
        >
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                {option.rank}
              </span>
              <p className="text-sm font-semibold text-zinc-900">
                {option.summary}
              </p>
            </div>
            {option.estimated_total != null && (
              <span className="shrink-0 text-sm font-semibold text-zinc-900">
                ${option.estimated_total.toFixed(2)}
              </span>
            )}
          </div>

          {/* Line items */}
          {option.line_items.length > 0 && (
            <div className="mb-3">
              {option.line_items.map((item, i) => (
                <LineItemRow key={i} item={item} />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            {option.delivery_summary && (
              <span>Delivery: {option.delivery_summary}</span>
            )}
            {option.tradeoffs && <span>Tradeoffs: {option.tradeoffs}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
