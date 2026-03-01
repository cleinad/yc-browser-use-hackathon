"use client";

import type { ContractorQuote, CsvRow } from "@/app/types";
import { parseCsv } from "../utils/parseCsv";
import CardShell from "./CardShell";

interface QuoteSelectionCardProps {
  quotes: ContractorQuote[];
  selectedContractorEmail: string | null;
  onSelectContractor: (email: string) => void;
  active?: boolean;
}

function downloadCsv(csv: string, name: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/\s+/g, "_")}_quote.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QuoteSelectionCard({
  quotes,
  selectedContractorEmail,
  onSelectContractor,
  active,
}: QuoteSelectionCardProps) {
  const selected = quotes.find((q) => q.contractor_email === selectedContractorEmail);
  const rows: CsvRow[] = selected ? parseCsv(selected.csv_data) : [];

  return (
    <CardShell
      title="Contractor Quotes"
      status={active ? "active" : "complete"}
    >
      <div className="space-y-4">
        {/* Contractor selector */}
        <div className="flex gap-2 flex-wrap">
          {quotes.map((q) => {
            const isCheapest =
              q.total_price ===
              Math.min(...quotes.map((x) => x.total_price));
            const isSelected = q.contractor_email === selectedContractorEmail;
            return (
              <button
                key={q.contractor_email}
                type="button"
                onClick={() => onSelectContractor(q.contractor_email)}
                className={`relative flex flex-col items-start rounded-xl border px-3 py-2 text-left transition ${
                  isSelected
                    ? "border-[var(--accent-jade)] bg-[color-mix(in_srgb,var(--accent-jade)_8%,transparent)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--fg-muted)]"
                }`}
              >
                <span className="text-sm font-medium text-[var(--fg-base)]">
                  {q.contractor_name}
                </span>
                <span className="text-xs text-[var(--fg-muted)]">
                  ${q.total_price.toFixed(2)} &middot; {q.timeline_days}d
                </span>
                {isCheapest && (
                  <span className="absolute -top-1.5 -right-1.5 rounded-full bg-[var(--accent-jade)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--bg-base)]">
                    Best
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CSV table */}
        {selected && rows.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-[var(--border-default)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
                  <th className="text-left px-3 py-2 font-medium">Part</th>
                  <th className="text-right px-3 py-2 font-medium">Qty</th>
                  <th className="text-right px-3 py-2 font-medium">Unit $</th>
                  <th className="text-right px-3 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border-default)]">
                    <td className="px-3 py-2 text-[var(--fg-base)]">{r.part_name}</td>
                    <td className="px-3 py-2 text-right text-[var(--fg-muted)]">{r.quantity}</td>
                    <td className="px-3 py-2 text-right text-[var(--fg-muted)]">
                      ${r.unit_price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--fg-base)] font-medium">
                      ${r.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border-default)] bg-[var(--bg-subtle)]">
                  <td colSpan={3} className="px-3 py-2 text-right text-[var(--fg-muted)] font-medium">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--accent-jade)] font-medium">
                    ${selected.total_price.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Download */}
        {selected && (
          <button
            type="button"
            onClick={() => downloadCsv(selected.csv_data, selected.contractor_name)}
            className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
        )}
      </div>
    </CardShell>
  );
}
