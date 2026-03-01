// Mirrors Python models from proquote/schemas.py and proquote/models.py

export type StatusEventType =
  | "orchestrator_started"
  | "subagent_started"
  | "subagent_retrying"
  | "subagent_completed"
  | "subagent_failed"
  | "orchestrator_completed";

export interface StatusEvent {
  event_type: StatusEventType;
  timestamp?: string | null;
  message: string | null;
  job_id?: string | null;
  job_label: string | null;
  attempt?: number | null;
}

export interface LineItem {
  part_name: string;
  product_name: string;
  price: number | null;
  currency: string;
  availability: string | null;
  delivery_estimate: string | null;
  product_url: string | null;
  image_url: string | null;
  retailer: string | null;
}

export interface PlanOption {
  rank: number;
  summary: string;
  line_items: LineItem[];
  estimated_total: number | null;
  currency: string;
  delivery_summary: string | null;
  tradeoffs: string | null;
}

export interface PurchasePlan {
  options: PlanOption[];
  notes: string | null;
}

// UI types

export type AgentEventEntry =
  | { kind: "log"; text: string }
  | { kind: "status"; event: StatusEvent };

export interface AgentMessage {
  role: "agent";
  events: AgentEventEntry[];
  plan: PurchasePlan | null;
  error: string | null;
  done: boolean;
}

export interface UserMessage {
  role: "user";
  text: string;
}

export type ChatMessage = UserMessage | AgentMessage;

/** Internal: one user prompt + one agent response (SSE stream). */
export interface ChatTurn {
  id: string;
  prompt: string;
  logs: string[];
  statuses: StatusEvent[];
  result: unknown | null;
  error: string | null;
  done: boolean;
}

export function isPurchasePlan(value: unknown): value is PurchasePlan {
  if (!value || typeof value !== "object") return false;
  return Array.isArray((value as { options?: unknown }).options);
}

// --- Agent card types ---

export type AgentCardStatus = "searching" | "completed" | "failed" | "retrying";

export interface AgentCardState {
  jobId: string;
  retailer: string;
  searchQuery: string;
  status: AgentCardStatus;
  attempt: number;
  message: string | null;
}

export type CheckoutStrategy = "fastest" | "cheapest";

export interface ComparisonCell {
  retailer: string;
  price: number | null;
  currency: string;
  availability: string | null;
  delivery_estimate: string | null;
  product_url: string | null;
  product_name: string;
}

export interface ComparisonRow {
  partName: string;
  cells: Map<string, ComparisonCell>;
}

export interface ComparisonTable {
  rows: ComparisonRow[];
  retailers: string[];
  selectedRetailers: Map<string, string>; // partName -> retailer
  retailerTotals: Map<string, number>;
}

/** Splits "homedepot.com — toilet seat" into { retailer, query }. */
export function parseJobLabel(label: string): {
  retailer: string;
  query: string;
} {
  const sep = label.indexOf(" — ");
  if (sep === -1) {
    return { retailer: label, query: "" };
  }
  return {
    retailer: label.slice(0, sep).trim(),
    query: label.slice(sep + 3).trim(),
  };
}
