"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function AuthControls() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <Link
          href="/sign-in"
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--fg-base)] transition hover:border-[var(--fg-muted)]"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--accent-primary-hover)] dark:text-[var(--bg-base)]"
        >
          Create account
        </Link>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
