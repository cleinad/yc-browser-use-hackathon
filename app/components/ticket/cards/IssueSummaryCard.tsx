"use client";

import type { VisionAnalysis } from "@/app/types";
import CardShell from "./CardShell";

interface IssueSummaryCardProps {
  analysis: VisionAnalysis;
  imageUrl: string | null;
  userDescription?: string | null;
}

export default function IssueSummaryCard({
  analysis,
  imageUrl,
  userDescription,
}: IssueSummaryCardProps) {
  return (
    <CardShell title="Issue Summary" status="complete">
      <div className="flex gap-3">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Issue photo"
            className="w-20 h-20 rounded-xl object-cover border border-[var(--border-default)] shrink-0"
          />
        )}
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-[var(--fg-base)] leading-relaxed">
            {analysis.issue_description}
          </p>
          {userDescription && (
            <p className="text-xs text-[var(--fg-muted)] italic">
              &ldquo;{userDescription}&rdquo;
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--fg-base)] capitalize">
              {analysis.trade.replace(/_/g, " ")}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                analysis.severity === "high"
                  ? "bg-[color-mix(in_srgb,var(--accent-destructive)_15%,transparent)] text-[var(--accent-destructive)]"
                  : analysis.severity === "medium"
                    ? "bg-[color-mix(in_srgb,var(--accent-amber)_15%,transparent)] text-[var(--accent-amber)]"
                    : "bg-[var(--bg-subtle)] text-[var(--fg-muted)]"
              }`}
            >
              {analysis.severity} severity
            </span>
          </div>
        </div>
      </div>
    </CardShell>
  );
}
