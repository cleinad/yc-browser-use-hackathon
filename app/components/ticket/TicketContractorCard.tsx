"use client";

import type { TicketContractor } from "@/app/types";

interface TicketContractorCardProps {
  contractor: TicketContractor;
  selected?: boolean;
  onSelect?: () => void;
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent-amber)" stroke="var(--accent-amber)" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function TicketContractorCard({
  contractor,
  selected,
  onSelect,
}: TicketContractorCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-4 transition ${
        selected
          ? "border-[var(--accent-jade)] bg-[color-mix(in_srgb,var(--accent-jade)_8%,transparent)]"
          : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--fg-muted)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-[var(--fg-base)] truncate">
            {contractor.name}
          </h4>
          <p className="text-xs text-[var(--fg-muted)] capitalize mt-0.5">
            {contractor.trade_category.replace("_", " ")}
          </p>
        </div>
        {contractor.rating && (
          <div className="flex items-center gap-1 shrink-0">
            <StarIcon />
            <span className="text-xs font-medium text-[var(--fg-base)]">
              {contractor.rating}
            </span>
          </div>
        )}
      </div>
      {contractor.address && (
        <p className="mt-2 text-xs text-[var(--fg-muted)] truncate">
          {contractor.address}
        </p>
      )}
      {contractor.phone && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
          <PhoneIcon />
          <span>{contractor.phone}</span>
        </div>
      )}
    </button>
  );
}
