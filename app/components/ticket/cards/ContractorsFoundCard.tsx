"use client";

import type { TicketContractor } from "@/app/types";
import CardShell from "./CardShell";
import TicketContractorCard from "../TicketContractorCard";

interface ContractorsFoundCardProps {
  contractors: TicketContractor[];
  active?: boolean;
}

export default function ContractorsFoundCard({
  contractors,
  active,
}: ContractorsFoundCardProps) {
  return (
    <CardShell
      title={`Contractors Found (${contractors.length})`}
      status={active ? "active" : "complete"}
    >
      {contractors.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-amber)] border-t-transparent" />
          Searching for contractors...
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {contractors.map((c) => (
            <div key={c.email} className="min-w-[200px] max-w-[240px] snap-start shrink-0">
              <TicketContractorCard contractor={c} />
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
