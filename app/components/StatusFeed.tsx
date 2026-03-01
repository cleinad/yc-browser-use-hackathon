import type { AgentEventEntry } from "../types";

interface StatusFeedProps {
  events: AgentEventEntry[];
}

const STATUS_ICONS: Record<string, string> = {
  orchestrator_started: ">>",
  subagent_started: "->",
  subagent_retrying: "~~",
  subagent_completed: "OK",
  subagent_failed: "XX",
  orchestrator_completed: "**",
};

const STATUS_COLORS: Record<string, string> = {
  orchestrator_started: "text-[var(--fg-base)]",
  subagent_started: "text-[var(--fg-base)]",
  subagent_retrying: "text-[var(--accent-amber)]",
  subagent_completed: "text-[var(--accent-jade)]",
  subagent_failed: "text-[var(--accent-destructive)]",
  orchestrator_completed: "text-[var(--accent-jade)]",
};

export default function StatusFeed({ events }: StatusFeedProps) {
  if (events.length === 0) return null;

  return (
    <div className="max-h-60 overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 font-mono text-xs leading-5">
      {events.map((entry, i) => {
        if (entry.kind === "log") {
          return (
            <div key={i} className="whitespace-pre-wrap text-[var(--fg-muted)]">
              {entry.text}
            </div>
          );
        }

        const { event } = entry;
        const icon = STATUS_ICONS[event.event_type] ?? "--";
        const color = STATUS_COLORS[event.event_type] ?? "text-[var(--fg-base)]";

        return (
          <div key={i} className={`${color} whitespace-pre-wrap`}>
            [{icon}]{" "}
            {event.job_label && <span>{event.job_label}: </span>}
            {event.message ?? event.event_type}
          </div>
        );
      })}
    </div>
  );
}
