"use client";

import { AnimatePresence, motion } from "framer-motion";
import type {
  TicketPhase,
  VisionAnalysis,
  TicketContractor,
  ContractorInbox,
  ContractorQuote,
  PurchasePlan,
} from "@/app/types";
import IssueSummaryCard from "./cards/IssueSummaryCard";
import ContractorsFoundCard from "./cards/ContractorsFoundCard";
import QuoteRequestCard from "./cards/QuoteRequestCard";
import QuoteSelectionCard from "./cards/QuoteSelectionCard";
import SupplyComparisonCard from "./cards/SupplyComparisonCard";

interface TicketCardFlowProps {
  phase: TicketPhase;
  imageUrl: string | null;
  analysis: VisionAnalysis | null;
  userDescription?: string | null;
  contractors: TicketContractor[];
  inboxes: ContractorInbox[];
  quotes: ContractorQuote[];
  purchasePlan: PurchasePlan | null;
  selectedContractorEmail: string | null;
  onSelectContractor: (email: string) => void;
  error: string | null;
  onRetry?: () => void;
  supplyLoading?: boolean;
}

const AFTER_ANALYSIS: TicketPhase[] = [
  "finding_contractors",
  "sending_quotes",
  "receiving_quotes",
  "finding_supplies",
  "complete",
];

function phaseGte(current: TicketPhase, target: TicketPhase): boolean {
  const order: TicketPhase[] = [
    "idle",
    "uploading",
    "analyzing",
    "finding_contractors",
    "sending_quotes",
    "receiving_quotes",
    "finding_supplies",
    "complete",
  ];
  return order.indexOf(current) >= order.indexOf(target);
}

export default function TicketCardFlow({
  phase,
  imageUrl,
  analysis,
  userDescription,
  contractors,
  inboxes,
  quotes,
  purchasePlan,
  selectedContractorEmail,
  onSelectContractor,
  error,
  onRetry,
  supplyLoading,
}: TicketCardFlowProps) {
  const showIssue = analysis && AFTER_ANALYSIS.includes(phase);
  const showContractors = phaseGte(phase, "finding_contractors");
  const showQuoteRequest = phaseGte(phase, "sending_quotes");
  const showQuoteSelection = quotes.length > 0 && phaseGte(phase, "receiving_quotes");
  const showSupply = purchasePlan && phaseGte(phase, "finding_supplies");

  return (
    <div className="space-y-4 px-4 py-4 pb-8">
      <AnimatePresence mode="popLayout">
        {showIssue && (
          <motion.div key="issue" layout>
            <IssueSummaryCard
              analysis={analysis}
              imageUrl={imageUrl}
              userDescription={userDescription}
            />
          </motion.div>
        )}

        {showContractors && (
          <motion.div key="contractors" layout>
            <ContractorsFoundCard
              contractors={contractors}
              active={phase === "finding_contractors"}
            />
          </motion.div>
        )}

        {showQuoteRequest && (
          <motion.div key="quote-request" layout>
            <QuoteRequestCard
              inboxes={inboxes}
              active={phase === "sending_quotes" || phase === "receiving_quotes"}
            />
          </motion.div>
        )}

        {showQuoteSelection && (
          <motion.div key="quote-selection" layout>
            <QuoteSelectionCard
              quotes={quotes}
              selectedContractorEmail={selectedContractorEmail}
              onSelectContractor={onSelectContractor}
              active={phase === "receiving_quotes"}
            />
          </motion.div>
        )}

        {showSupply && (
          <motion.div key="supply" layout>
            <SupplyComparisonCard
              purchasePlan={purchasePlan}
              loading={supplyLoading}
              active={phase === "finding_supplies"}
            />
          </motion.div>
        )}

        {/* Loading indicator for in-progress phases with no card yet */}
        {phase === "finding_supplies" && !purchasePlan && (
          <motion.div
            key="supply-loading"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
          >
            <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-amber)] border-t-transparent" />
              Finding best supply prices...
            </div>
          </motion.div>
        )}

        {/* Error card */}
        {error && (
          <motion.div
            key="error"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--accent-destructive)] bg-[color-mix(in_srgb,var(--accent-destructive)_8%,transparent)] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[var(--accent-destructive)]">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="shrink-0 rounded-lg border border-[var(--accent-destructive)] px-3 py-1.5 text-xs font-medium text-[var(--accent-destructive)] hover:bg-[color-mix(in_srgb,var(--accent-destructive)_12%,transparent)] transition"
                >
                  Retry
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
