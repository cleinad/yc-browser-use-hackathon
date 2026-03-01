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
  timestamp: string;
  message: string | null;
  job_id: string | null;
  job_label: string | null;
  attempt: number | null;
}

export interface LineItem {
  part_name: string;
  product_name: string;
  price: number | null;
  currency: string;
  availability: string | null;
  delivery_estimate: string | null;
  product_url: string | null;
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
