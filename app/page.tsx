import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-[var(--fg-base)]">
            Proquote
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <span className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-base)] transition cursor-pointer">
            Sign in
          </span>
          <span className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-1.5 text-sm font-medium text-[var(--fg-base)] cursor-pointer hover:bg-[var(--bg-surface)] transition">
            Sign up
          </span>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--fg-disabled)] mb-6">
          Procurement Workspace
        </p>

        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-[var(--fg-base)] text-center leading-[1.1] [font-family:var(--font-heading),serif] max-w-2xl">
          Quotes sourced, compared, and ready to buy.
        </h1>

        <p className="mt-6 text-center text-sm leading-relaxed text-[var(--fg-muted)] max-w-md">
          Describe parts and constraints. Proquote agents check suppliers in
          real&#8209;time and return a ranked purchase plan.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/chat"
            className="inline-flex items-center rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-medium text-[var(--bg-base)] transition hover:bg-[var(--accent-primary-hover)]"
          >
            Open Workspace
          </Link>
          <a
            href="#how"
            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-base)] transition"
          >
            How it works&ensp;&darr;
          </a>
        </div>

        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-px w-full max-w-2xl rounded-xl border border-[var(--border-default)] overflow-hidden">
          {[
            {
              label: "Live agents",
              desc: "Status updates as suppliers are checked.",
              accent: "bg-[var(--accent-jade)]",
            },
            {
              label: "Ranked plans",
              desc: "Structured options with itemized line items.",
              accent: "bg-[var(--accent-amber)]",
            },
            {
              label: "Auditable",
              desc: "Plain output your team can review and approve.",
              accent: "bg-[var(--fg-disabled)]",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[var(--bg-surface)] px-5 py-5 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${item.accent}`}
                />
                <span className="text-xs font-medium text-[var(--fg-base)]">
                  {item.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--fg-muted)]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
