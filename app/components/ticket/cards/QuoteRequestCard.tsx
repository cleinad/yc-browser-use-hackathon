"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ContractorInbox } from "@/app/types";
import CardShell from "./CardShell";

interface QuoteRequestCardProps {
  inboxes: ContractorInbox[];
  active?: boolean;
}

function StatusDot({ status }: { status: ContractorInbox["send_status"] }) {
  if (status === "sent") {
    return <span className="h-2 w-2 rounded-full bg-[var(--accent-jade)]" />;
  }
  if (status === "failed") {
    return <span className="h-2 w-2 rounded-full bg-[var(--accent-destructive)]" />;
  }
  return <span className="h-2 w-2 rounded-full bg-[var(--fg-disabled)] animate-pulse" />;
}

function InboxRow({ inbox }: { inbox: ContractorInbox }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-[var(--border-default)] last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-2 py-2.5 text-left hover:bg-[var(--bg-subtle)] transition rounded"
      >
        <StatusDot status={inbox.send_status} />
        <span className="text-sm text-[var(--fg-base)] flex-1 truncate">
          {inbox.contractor_name}
        </span>
        <span className="text-xs text-[var(--fg-muted)] truncate max-w-[140px]">
          {inbox.inbox_address}
        </span>
        <span className="text-xs text-[var(--fg-muted)] capitalize shrink-0">
          {inbox.send_status}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-[var(--fg-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-1.5">
              <p className="text-xs font-medium text-[var(--fg-muted)]">
                Subject: {inbox.email_subject}
              </p>
              <p className="text-xs text-[var(--fg-muted)] whitespace-pre-wrap leading-relaxed">
                {inbox.email_body}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuoteRequestCard({
  inboxes,
  active,
}: QuoteRequestCardProps) {
  return (
    <CardShell
      title="Quote Requests"
      status={active ? "active" : inboxes.length > 0 ? "complete" : "idle"}
    >
      {inboxes.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-amber)] border-t-transparent" />
          Sending quote requests...
        </div>
      ) : (
        <div className="divide-y-0">
          {inboxes.map((inbox) => (
            <InboxRow key={inbox.inbox_address} inbox={inbox} />
          ))}
        </div>
      )}
    </CardShell>
  );
}
