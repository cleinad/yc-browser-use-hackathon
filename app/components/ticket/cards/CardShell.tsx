"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type CardStatus = "active" | "complete" | "error" | "idle";

interface CardShellProps {
  title: string;
  status?: CardStatus;
  children: ReactNode;
  action?: ReactNode;
}

const dotColor: Record<CardStatus, string> = {
  active: "bg-[var(--accent-amber)]",
  complete: "bg-[var(--accent-jade)]",
  error: "bg-[var(--accent-destructive)]",
  idle: "bg-[var(--fg-disabled)]",
};

export default function CardShell({
  title,
  status = "idle",
  children,
  action,
}: CardShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor[status]} ${status === "active" ? "animate-pulse" : ""}`} />
          <h3 className="text-sm font-medium text-[var(--fg-base)]">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}
