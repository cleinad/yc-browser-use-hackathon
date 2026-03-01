import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-[var(--fg-base)]">
              Proquote
            </p>
            <p className="text-xs text-[var(--fg-muted)]">
              Procurement Workspace
            </p>
          </div>
          <span className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--fg-muted)]">
            Agent-backed Quotes
          </span>
        </header>

        <section className="mx-auto my-auto w-full max-w-2xl rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            Start Session
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--fg-base)] sm:text-4xl">
            Run a procurement chat in one place.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--fg-muted)]">
            Describe parts, constraints, and delivery priorities. Proquote
            orchestrates supplier checks and returns a ranked purchase plan with
            supporting status logs.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-[var(--fg-muted)]">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]" />
              Live status updates as agents run.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--accent-amber)]" />
              Structured options with itemized line items.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--fg-muted)]" />
              Plain, auditable output for team review.
            </li>
          </ul>

          <div className="mt-8">
            <Link
              href="/chat"
              className="inline-flex items-center rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-primary-hover)] dark:text-[var(--bg-base)]"
            >
              Open Chat Workspace
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
