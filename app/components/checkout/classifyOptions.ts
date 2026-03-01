import type { PlanOption, LabeledPlanOption, RecommendationLabel } from "../../types";

function parseDeliveryDays(summary: string | null): number {
  if (!summary) return 999;
  const lower = summary.toLowerCase();
  if (lower.includes("same day")) return 0;
  if (lower.includes("next day") || lower.includes("1 day")) return 1;
  const dayMatch = lower.match(/(\d+)\s*(?:day|business)/);
  if (dayMatch) return parseInt(dayMatch[1], 10);
  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) return parseInt(weekMatch[1], 10) * 7;
  return 999;
}

const LABEL_DISPLAY: Record<RecommendationLabel, string> = {
  best: "Overall Best",
  cheapest: "Cheapest",
  fastest: "Fastest",
};

export function classifyOptions(options: PlanOption[]): LabeledPlanOption[] {
  if (options.length === 0) return [];

  const sorted = [...options].sort((a, b) => a.rank - b.rank);
  const used = new Set<number>();
  const result: LabeledPlanOption[] = [];

  // Rank-1 option is "Overall Best"
  const best = sorted[0];
  result.push({ ...best, label: "best", labelDisplay: LABEL_DISPLAY.best });
  used.add(best.rank);

  // Cheapest by estimated_total (skip if same as best)
  const byPrice = [...sorted]
    .filter((o) => o.estimated_total != null)
    .sort((a, b) => (a.estimated_total ?? Infinity) - (b.estimated_total ?? Infinity));

  for (const candidate of byPrice) {
    if (!used.has(candidate.rank)) {
      result.push({ ...candidate, label: "cheapest", labelDisplay: LABEL_DISPLAY.cheapest });
      used.add(candidate.rank);
      break;
    }
  }

  // Fastest by delivery_summary (skip if already used)
  const byDelivery = [...sorted].sort(
    (a, b) => parseDeliveryDays(a.delivery_summary) - parseDeliveryDays(b.delivery_summary),
  );

  for (const candidate of byDelivery) {
    if (!used.has(candidate.rank)) {
      result.push({ ...candidate, label: "fastest", labelDisplay: LABEL_DISPLAY.fastest });
      used.add(candidate.rank);
      break;
    }
  }

  return result;
}
