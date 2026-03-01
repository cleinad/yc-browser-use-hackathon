"use client";

import Link from "next/link";
import { useQuoteSession } from "./useQuoteSession";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";

export default function ChatPage() {
  const { messages, loading, submit } = useQuoteSession();
  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-[var(--fg-base)]">
            Proquote
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-base)] transition"
          >
            Home
          </Link>
          <span className="text-sm text-[var(--fg-muted)]">Sign in</span>
          <span className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-1.5 text-sm font-medium text-[var(--fg-base)]">
            Sign up
          </span>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start w-full max-w-4xl mx-auto px-4 pt-8 pb-4 sm:pt-12">
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
          <>
            <div className="w-full flex-1 min-h-0 flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <MessageList messages={messages} />
              </div>
              <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
                <ChatInput onSubmit={submit} disabled={loading} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
