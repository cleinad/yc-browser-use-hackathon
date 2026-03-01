"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuoteSession } from "@/app/chat/useQuoteSession";
import MessageList from "@/app/components/MessageList";
import ChatInput from "@/app/components/ChatInput";
import { AuthControls } from "@/app/components/AuthControls";
import { PropertyPicker } from "@/app/components/PropertyPicker";
import { ThemeToggle } from "@/app/components/ThemeToggle";

function normalizePropertyParam(value: string | string[] | undefined) {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
}

export default function PropertyChatPage() {
  const params = useParams<{ propertyId?: string | string[] }>();
  const propertyIdParam = normalizePropertyParam(params.propertyId);
  const propertyId = (propertyIdParam ?? null) as Id<"properties"> | null;

  const property = useQuery(
    api.properties.getById,
    propertyId ? { propertyId } : "skip",
  );
  const sessionPropertyId =
    propertyId && property !== null && property !== undefined ? propertyId : null;
  const { messages, loading, submit } = useQuoteSession(sessionPropertyId);
  const isEmpty = messages.length === 0;
  const isArchived = !!property?.isArchived;

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
          {isArchived && (
            <div className="mb-4 w-full rounded-xl border border-[var(--accent-amber)] bg-[color-mix(in_srgb,var(--accent-amber)_12%,transparent)] px-4 py-3 text-sm text-[var(--fg-base)]">
              This property is archived. Unarchive it on the dashboard to create new requests.
            </div>
          )}

          {isEmpty ? (
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
        </div>
      </main>
    </div>
  );
}
