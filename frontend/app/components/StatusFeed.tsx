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
  orchestrator_started: "text-blue-600",
  subagent_started: "text-zinc-600",
  subagent_retrying: "text-amber-600",
  subagent_completed: "text-green-600",
  subagent_failed: "text-red-600",
  orchestrator_completed: "text-blue-600",
};

export default function StatusFeed({ events }: StatusFeedProps) {
  if (events.length === 0) return null;

  return (
    <div className="max-h-60 overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-200 p-3 font-mono text-xs leading-5">
      {events.map((entry, i) => {
        if (entry.kind === "log") {
          return (
            <div key={i} className="text-zinc-600 whitespace-pre-wrap">
              {entry.text}
            </div>
          );
        }

        const { event } = entry;
        const icon = STATUS_ICONS[event.event_type] ?? "--";
        const color = STATUS_COLORS[event.event_type] ?? "text-zinc-600";

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
