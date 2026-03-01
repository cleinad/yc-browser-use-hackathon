"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuoteSession } from "@/app/chat/useQuoteSession";
import MessageList from "@/app/components/MessageList";
import ChatInput from "@/app/components/ChatInput";
import OrderHistory from "@/app/components/OrderHistory";
import { AuthControls } from "@/app/components/AuthControls";
import { PropertyPicker } from "@/app/components/PropertyPicker";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import TicketTab from "./TicketTab";

type PropertyTab = "chat" | "orders" | "ticket";

function normalizePropertyParam(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
}

function readStoredChatCutoff(propertyId: string): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(`proquote-chat-cutoff:${propertyId}`);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function PropertyTabBar({
  activeTab,
  onTabChange,
  orderCount,
}: {
  activeTab: PropertyTab;
  onTabChange: (tab: PropertyTab) => void;
  orderCount: number;
}) {
  const tabs: { value: PropertyTab; label: string }[] = [
    { value: "chat", label: "Chat" },
    { value: "orders", label: orderCount > 0 ? `Orders (${orderCount})` : "Orders" },
    { value: "ticket", label: "Create a Ticket" },
  ];

  return (
    <div className="relative flex rounded-lg bg-[var(--bg-subtle)] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`relative z-10 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.value
              ? "text-[var(--bg-base)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg-base)]"
          }`}
        >
          {activeTab === tab.value && (
            <motion.div
              layoutId="property-tab-pill"
              className="absolute inset-0 rounded-md bg-[var(--accent-primary)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function PropertyChatPage() {
  const params = useParams<{ propertyId?: string | string[] }>();
  const propertyIdParam = normalizePropertyParam(params.propertyId);
  const propertyId = (propertyIdParam ?? null) as Id<"properties"> | null;
  const [chatSinceByProperty, setChatSinceByProperty] = useState<
    Record<string, number | null>
  >({});

  const property = useQuery(
    api.properties.getById,
    propertyId ? { propertyId } : "skip",
  );
  const orderTimeline = useQuery(
    api.quotes.listMine,
    propertyId ? { limit: 100, propertyId } : "skip",
  );
  const sessionPropertyId =
    propertyId && property !== null && property !== undefined ? propertyId : null;
  const chatSinceTs = propertyId
    ? Object.prototype.hasOwnProperty.call(chatSinceByProperty, propertyId)
      ? (chatSinceByProperty[propertyId] ?? null)
      : readStoredChatCutoff(propertyId)
    : null;
  const { messages, loading, submit, timelineLoaded } = useQuoteSession(
    sessionPropertyId,
    { sinceTs: chatSinceTs },
  );
  const isEmpty = timelineLoaded && messages.length === 0;
  const isArchived = !!property?.isArchived;
  const [activeTab, setActiveTab] = useState<PropertyTab>("chat");
  const orderCount = orderTimeline?.length ?? 0;

  const startNewChat = () => {
    if (!propertyId) {
      return;
    }
    const now = Date.now();
    window.localStorage.setItem(`proquote-chat-cutoff:${propertyId}`, String(now));
    setChatSinceByProperty((prev) => ({ ...prev, [propertyId]: now }));
  };

  const showFullHistory = () => {
    if (!propertyId) {
      return;
    }
    window.localStorage.removeItem(`proquote-chat-cutoff:${propertyId}`);
    setChatSinceByProperty((prev) => ({ ...prev, [propertyId]: null }));
  };

  if (!propertyIdParam) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] px-6 py-16 text-center">
        <p className="text-sm text-[var(--fg-muted)]">Invalid property id.</p>
        <Link
          href="/home"
          className="mt-4 inline-flex rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm text-[var(--bg-base)]"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  if (property === undefined) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] px-6 py-16">
        <div className="mx-auto h-48 w-full max-w-5xl rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]" />
      </div>
    );
  }

  if (property === null) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] px-6 py-16 text-center">
        <p className="text-sm text-[var(--fg-muted)]">
          Property not found or you do not have access.
        </p>
        <Link
          href="/home"
          className="mt-4 inline-flex rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm text-[var(--bg-base)]"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8 border-b border-[var(--border-default)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-[var(--fg-base)]">
              Proquote
            </span>
          </Link>
          <p className="hidden text-sm text-[var(--fg-muted)] sm:block">{property.name}</p>
        </div>
        <nav className="flex items-center gap-2">
          <PropertyPicker currentPropertyId={propertyId} />
          <ThemeToggle />
          <AuthControls />
        </nav>
      </header>

      <main className="flex-1 flex items-start w-full px-4 pt-6 pb-4 sm:pt-8">
        <div className="flex flex-col items-center justify-start mx-auto w-full max-w-4xl">
          {activeTab === "chat" && (
            <div className="mb-3 flex w-full items-center justify-end gap-2">
              {chatSinceTs !== null && (
                <button
                  type="button"
                  onClick={showFullHistory}
                  className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:border-[var(--fg-muted)]"
                >
                  Show full history
                </button>
              )}
              <button
                type="button"
                onClick={startNewChat}
                className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:border-[var(--fg-muted)]"
              >
                Start new chat
              </button>
            </div>
          )}

          {isArchived && (
            <div className="mb-4 w-full rounded-xl border border-[var(--accent-amber)] bg-[color-mix(in_srgb,var(--accent-amber)_12%,transparent)] px-4 py-3 text-sm text-[var(--fg-base)]">
              This property is archived. Unarchive it on the dashboard to create new requests.
            </div>
          )}

          {activeTab === "ticket" ? (
            <div className="w-full flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden" style={{ minHeight: "500px" }}>
              <TicketTab propertyAddress={property.address ?? null} />
            </div>
          ) : activeTab === "orders" && propertyId ? (
            <div className="w-full">
              <OrderHistory propertyId={propertyId} />
            </div>
          ) : isEmpty ? (
            <>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[var(--fg-base)] text-center [font-family:var(--font-heading),serif]">
                What can I do for {property.name}?
              </h1>
              <div className="w-full mt-10 flex flex-col items-center">
                <ChatInput onSubmit={submit} disabled={loading || isArchived} />
              </div>
            </>
          ) : (
            <div className="w-full flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <MessageList messages={messages} />
              </div>
              <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
                <ChatInput onSubmit={submit} disabled={loading || isArchived} />
              </div>
            </div>
          )}

          {/* Tab bar below chat */}
          <div className="w-full mt-4">
            <PropertyTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              orderCount={orderCount}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
