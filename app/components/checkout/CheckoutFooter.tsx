"use client";

interface CheckoutFooterProps {
  retailerTotals: Map<string, number>;
}

export default function CheckoutFooter({
  retailerTotals,
}: CheckoutFooterProps) {
  const entries = Array.from(retailerTotals.entries());
  const grandTotal = entries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-4 space-y-2">
      {entries.map(([retailer, total]) => (
        <div
          key={retailer}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-[var(--fg-muted)]">{retailer}</span>
          <span className="font-medium text-[var(--fg-base)]">
            USD {total.toFixed(2)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
        <span className="text-sm font-semibold text-[var(--fg-base)]">
          Total
        </span>
        <span className="text-base font-bold text-[var(--accent-jade)]">
          USD {grandTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
