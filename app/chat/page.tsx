"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useQuoteSession } from "./useQuoteSession";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";
import CheckoutPanel from "../components/checkout/CheckoutPanel";
import { AuthControls } from "../components/AuthControls";
import { ThemeToggle } from "../components/ThemeToggle";
import type { CheckoutStrategy, PurchasePlan } from "../types";

export default function ChatPage() {
  const { messages, loading, submit } = useQuoteSession();
  const isEmpty = messages.length === 0;

  const [dismissedPlanKey, setDismissedPlanKey] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<CheckoutStrategy>("cheapest");

  // Derive the latest purchase plan from messages
  const latestPlanEntry: { plan: PurchasePlan | null; key: string | null } = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "agent" && msg.plan) {
        return { plan: msg.plan, key: `${i}` };
      }
    }
    return { plan: null, key: null };
  })();
  const latestPlan = latestPlanEntry.plan;

  const panelOpen = !!latestPlan && latestPlanEntry.key !== dismissedPlanKey;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-[var(--fg-base)]">
            Proquote
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-base)] transition"
          >
            Home
          </Link>
          <ThemeToggle />
          <AuthControls />
        </nav>
      </header>

      <main className="flex-1 flex items-start w-full px-4 pt-8 pb-4 sm:pt-12">
        <LayoutGroup>
          <motion.div
            layout
            className={`flex flex-col items-center justify-start mx-auto transition-all duration-300 ${
              panelOpen ? "w-full sm:w-1/2 sm:pr-2" : "w-full max-w-4xl"
            }`}
          >
            {isEmpty ? (
              <>
                <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[var(--fg-base)] text-center [font-family:var(--font-heading),serif]">
                  What can I do for you?
                </h1>
                <div className="w-full mt-10 flex flex-col items-center">
                  <ChatInput onSubmit={submit} disabled={loading} />
                </div>
              </>
            ) : (
              <div className="w-full flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="flex-1 min-h-0 overflow-hidden">
                  <MessageList
                    messages={messages}
                    onOpenPanel={() => setDismissedPlanKey(null)}
                  />
                </div>
                <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
                  <ChatInput onSubmit={submit} disabled={loading} />
                </div>
              </div>
            )}
          </motion.div>
        </LayoutGroup>

        <AnimatePresence>
          {panelOpen && latestPlan && (
            <CheckoutPanel
              plan={latestPlan}
              strategy={strategy}
              onStrategyChange={setStrategy}
              onClose={() => setDismissedPlanKey(latestPlanEntry.key)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
