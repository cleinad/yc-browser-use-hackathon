import type { AgentMessage, ChatMessage, PurchasePlan } from "../types";

type SavingsBreakdown = {
  baselineTotal: number | null;
  cheapestTotal: number | null;
  acceptedTotal: number | null;
  potentialSavings: number;
  realizedSavings: number;
};

function collectOptionTotals(plan: PurchasePlan): Array<{ rank: number; total: number }> {
  const totals: Array<{ rank: number; total: number }> = [];
  for (const option of plan.options) {
    if (typeof option.estimated_total !== "number" || !Number.isFinite(option.estimated_total)) {
      continue;
    }
    totals.push({ rank: option.rank, total: option.estimated_total });
  }
  return totals;
}

export function computePlanSavings(
  plan: PurchasePlan,
  acceptedOptionRank: number | null,
): SavingsBreakdown {
  const totals = collectOptionTotals(plan);
  if (totals.length === 0) {
    return {
      baselineTotal: null,
      cheapestTotal: null,
      acceptedTotal: null,
      potentialSavings: 0,
      realizedSavings: 0,
    };
  }

  const sortedTotals = totals.map((entry) => entry.total).sort((a, b) => a - b);
  const cheapestTotal = sortedTotals[0];
  const baselineTotal = sortedTotals[1] ?? cheapestTotal;
  const acceptedTotal =
    acceptedOptionRank === null
      ? null
      : totals.find((entry) => entry.rank === acceptedOptionRank)?.total ?? null;

  return {
    baselineTotal,
    cheapestTotal,
    acceptedTotal,
    potentialSavings: Math.max(0, baselineTotal - cheapestTotal),
    realizedSavings:
      acceptedTotal === null ? 0 : Math.max(0, baselineTotal - acceptedTotal),
  };
}

function isAcceptedAgentMessage(message: ChatMessage): message is AgentMessage {
  return (
    message.role === "agent" &&
    !!message.plan &&
    message.decision === "accepted" &&
    typeof message.acceptedOptionRank === "number"
  );
}

export function computeCumulativeRealizedSavings(messages: ChatMessage[]): number {
  let total = 0;
  for (const message of messages) {
    if (!isAcceptedAgentMessage(message)) {
      continue;
    }
    const savings = computePlanSavings(message.plan, message.acceptedOptionRank).realizedSavings;
    total += savings;
  }
  return total;
}
