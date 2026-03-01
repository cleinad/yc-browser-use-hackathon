# Phase 1: Project Scaffolding - Research

**Researched:** 2026-02-28
**Domain:** Next.js 15 App Router + HeroUI + Convex + Vercel scaffolding
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Component Library**
- Use **HeroUI** (`npx heroui-cli@latest init`) as the sole component library — NOT shadcn/ui
- HeroUI only — no shadcn/ui alongside it. Single source of truth for components.
- Use HeroUI components consistently throughout all phases

**Visual Theme**
- Primary color: **Blue / Indigo** — professional, trustworthy, SaaS-standard
- Status chip colors are **semantic**: DONE=green, FAILED=red, RUNNING=amber/yellow, QUEUED=gray, RFQ_REQUIRED=orange
- Visual density: **Dense / data-rich** — compact cards, tight spacing (Linear/Vercel/Supabase style)
- Configure HeroUI theme with blue/indigo primary, semantic status colors locked in at init

**Dark / Light Mode**
- **Dark mode only** — set as the default, no runtime toggle
- No theme toggle button needed in Phase 6 either
- CSS variables and HeroUI theme config should only define the dark theme

**Typography**
- **Inter** for all text — body, headings, UI labels
- No separate display font; use Inter weight variation (font-bold / font-semibold) for heading hierarchy
- Load via `next/font/google` (optimized font loading)

**Convex Setup**
- **Owner:** This developer owns the Convex deployment
- Run `npx convex dev` to create the deployment
- Connect via `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` env vars
- Phase 1 success verification: `useQuery(api.houses.list)` returns `[]` — empty array is enough to confirm wire-up
- No seed data needed for Phase 1 verification

**Environment Variables**
- **Pattern:** Vercel env vars dashboard for production + `.env.local` for local dev
- `.env.local` should NOT be committed (already in .gitignore)
- Set `NEXT_PUBLIC_CONVEX_URL` in Vercel dashboard for the production deployment

**Vercel Deployment**
- Push to `main` branch triggers auto-deploy
- Connect the GitHub repo to the Vercel project
- Project root is the Next.js app root (not a subdirectory)

### Claude's Discretion
- Exact HeroUI theme configuration values (base color shades, border radius)
- Next.js project structure (folder layout within `app/`, `components/`, etc.)
- Convex schema structure for the initial `houses` table (backend owner will expand it)
- Tailwind config details
- ESLint / prettier configuration

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SETUP-01 | Next.js 15 App Router project scaffolded with TypeScript and Tailwind CSS | Next.js 15 + Tailwind v4 setup verified via official docs; create-next-app command confirmed |
| SETUP-02 | Convex client configured and connected (real-time subscriptions working) | ConvexClientProvider pattern + useQuery hook verified via Convex official docs; env var pattern confirmed |
| SETUP-03 | HeroUI installed with base component library (note: REQUIREMENTS.md says shadcn/ui but CONTEXT.md locked HeroUI — CONTEXT.md wins) | HeroUI CLI init + Tailwind v4 plugin setup verified via heroui.com official docs |
| SETUP-04 | Vercel deployment configured (sponsor) | Vercel GitHub integration pattern confirmed; env var dashboard setup confirmed |
</phase_requirements>

---

## Summary

Phase 1 scaffolds a greenfield Next.js 15 App Router application at the repository root (alongside the existing Python backend in `bu-agent/`). The frontend uses HeroUI as the sole component library with Tailwind CSS v4, Convex for real-time data, and deploys to Vercel. No user-facing features are built — only the foundation is wired up.

The key distinction from standard scaffolds: HeroUI requires Tailwind v4 with a CSS-plugin approach (`hero.ts` + `@plugin` directive in globals.css) rather than the traditional `tailwind.config.js` plugin approach. Dark mode is implemented by hardcoding `className="dark"` on the `<html>` element — no `next-themes` library needed since there is no toggle. The Inter font is loaded via `next/font/google` with a CSS variable (`--font-sans`) so Tailwind can reference it. Convex is initialized with `npx convex dev`, which auto-generates `.env.local` with `NEXT_PUBLIC_CONVEX_URL`.

The REQUIREMENTS.md says SETUP-03 is "shadcn/ui" but the CONTEXT.md (locked decisions) overrides this with HeroUI. The planner must follow CONTEXT.md — HeroUI is the component library.

**Primary recommendation:** Use `npx heroui-cli@latest init -t app` to scaffold the Next.js 15 + HeroUI + Tailwind v4 template, then layer in Convex manually per the quickstart, configure the dark-mode-only theme in `hero.ts`, and connect Vercel to the GitHub repo.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | App Router framework | Vercel-native, SSR + RSC, locked decision |
| @heroui/react | 2.8.x+ | Component library | User locked this; Tailwind v4 support added in v2.8.0 (2025-07-15) |
| tailwindcss | 4.x | Utility CSS | Required by HeroUI; v4 is CSS-first, no config file needed |
| convex | latest | Real-time DB client | Sponsor; zero-config live subscriptions |
| framer-motion | 11.9+ | HeroUI peer dep | Required by HeroUI for animations |
| typescript | 5.x | Type safety | Standard; `create-next-app` includes it |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @heroui/react (individual packages) | same | Tree-shakeable component imports | Import from `@heroui/button` etc. for smaller bundles |
| next/font/google | built-in | Font optimization | Inter font loading; zero external requests |
| convex/react | included in convex | useQuery, useMutation hooks | All client-side data access |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HeroUI | shadcn/ui | shadcn has more ecosystem docs but user explicitly chose HeroUI |
| Tailwind v4 CSS-first | tailwind.config.js | tailwind.config.js still works in v4 but HeroUI prefers CSS-first for v4 |
| Static dark class | next-themes | next-themes needed only if toggle exists; not needed here |

**Installation:**

```bash
# Option A: HeroUI CLI scaffold (recommended — creates the whole project)
npx heroui-cli@latest init -t app my-app
cd my-app

# Option B: Manual install into existing Next.js project
npm i @heroui/react framer-motion

# Then install Convex
npm install convex
```

---

## Architecture Patterns

### Recommended Project Structure

The HeroUI next-app-template provides this structure (verified from GitHub). Adapt it for this project:

```
/ (repo root — Next.js app lives here)
├── app/
│   ├── layout.tsx           # Root layout: Inter font, dark class, providers
│   ├── page.tsx             # Root page (minimal landing or redirect)
│   ├── providers.tsx        # HeroUIProvider + ConvexClientProvider ("use client")
│   └── globals.css          # Tailwind v4 @import + HeroUI plugin + CSS vars
├── convex/
│   ├── _generated/          # Auto-generated by npx convex dev (do not edit)
│   ├── schema.ts            # Initial houses table schema
│   └── houses.ts            # Query functions (houses.list)
├── components/
│   └── ui/                  # Shared UI primitives (Phase 1: placeholder only)
├── config/
│   └── site.ts              # Site metadata, constants
├── types/
│   └── index.ts             # Shared TypeScript types
├── public/                  # Static assets
├── .env.local               # NOT committed — NEXT_PUBLIC_CONVEX_URL
├── hero.ts                  # HeroUI Tailwind v4 plugin export
├── next.config.ts           # Next.js config
├── postcss.config.js        # @tailwindcss/postcss plugin
├── tsconfig.json
└── package.json
```

Note: `bu-agent/` (Python backend) coexists at the repo root. Vercel is configured to treat the repo root as the Next.js project root. The `bu-agent/` directory is ignored by Next.js build.

### Pattern 1: Providers Composition

**What:** All client-side providers (HeroUI, Convex) are composed in a single `app/providers.tsx` file marked `"use client"`, then imported into the server-side `app/layout.tsx`.

**When to use:** Always — this is the Next.js App Router pattern for client providers in a server-component root layout.

```typescript
// Source: https://www.heroui.com/docs/frameworks/nextjs + https://docs.convex.dev/quickstart/nextjs
// app/providers.tsx
"use client";
import { HeroUIProvider } from "@heroui/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <HeroUIProvider>
        {children}
      </HeroUIProvider>
    </ConvexProvider>
  );
}
```

### Pattern 2: Root Layout with Dark Mode and Font

**What:** The root layout hardcodes `className="dark"` on `<html>` to force dark mode permanently. Inter is loaded via `next/font/google` as a CSS variable applied to `<body>`.

**When to use:** Phase 1 and every phase after — this is the global foundation.

```typescript
// Source: https://nextjs.org/docs/app/getting-started/fonts + https://www.heroui.com/docs/customization/dark-mode
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ProcureSwarm",
  description: "Repair-to-procurement agent dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Pattern 3: Tailwind v4 + HeroUI Plugin

**What:** HeroUI with Tailwind v4 uses a CSS-first plugin approach. No `tailwind.config.js` needed. The `hero.ts` file exports the plugin, and `globals.css` references it via `@plugin`.

**When to use:** This is the only supported Tailwind v4 pattern for HeroUI.

```typescript
// Source: https://www.heroui.com/docs/guide/tailwind-v4
// hero.ts (repo root)
import { heroui } from "@heroui/react";

export default heroui({
  defaultTheme: "dark",
  themes: {
    dark: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",  // indigo-500
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#22c55e",  // green-500
          foreground: "#ffffff",
        },
        danger: {
          DEFAULT: "#ef4444",  // red-500
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#f59e0b",  // amber-500
          foreground: "#000000",
        },
      },
    },
  },
});
```

```css
/* Source: https://www.heroui.com/docs/guide/tailwind-v4 */
/* app/globals.css */
@import "tailwindcss";
@plugin './hero.ts';
@source '../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}';
@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: var(--font-sans);
}

@layer base {
  body {
    @apply antialiased;
  }
}
```

Note: `@source` path must be relative from the CSS file to `node_modules`. Adjust if globals.css is in `app/`.

### Pattern 4: Convex Schema and Query

**What:** Minimal Convex schema with `houses` table. A `list` query that the Phase 1 verification uses. Backend owner will expand this schema in later phases.

**When to use:** Phase 1 — establishes the Convex schema baseline.

```typescript
// Source: https://docs.convex.dev/database/schemas
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  houses: defineTable({
    name: v.string(),
    address: v.string(),
  }),
});
```

```typescript
// Source: https://docs.convex.dev/functions/query-functions
// convex/houses.ts
import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("houses").collect();
  },
});
```

```typescript
// Source: https://docs.convex.dev/quickstart/nextjs
// Verification usage in app/page.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const houses = useQuery(api.houses.list);
  // undefined = loading, [] = connected + empty table (Phase 1 success)
  return (
    <main>
      <p>Houses: {JSON.stringify(houses)}</p>
    </main>
  );
}
```

### Anti-Patterns to Avoid

- **Using shadcn/ui alongside HeroUI:** Creates conflicting CSS variable namespaces. HeroUI is the single source of truth.
- **Adding `next-themes` for dark mode:** Unnecessary — just hardcode `class="dark"` on `<html>`. next-themes adds complexity and a ThemeProvider that's only needed for toggles.
- **Putting `ConvexReactClient` inside a React component:** Causes a new client instance on every render. Always define it at module scope outside the component.
- **Importing all of HeroUI from `@heroui/react` in every file:** Prefer individual package imports (`@heroui/button`) to avoid bloat. The initial setup can use `@heroui/react` for providers.
- **Forgetting `@source` in globals.css:** Without this, Tailwind v4 won't scan HeroUI's node_modules theme files and components will be unstyled.
- **Using `darkMode: "class"` in a tailwind.config.js:** This is Tailwind v3 syntax. In Tailwind v4, dark mode is controlled by `@custom-variant dark (&:is(.dark *))` in the CSS file.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time data subscriptions | WebSocket polling, SWR polling | `convex/react` `useQuery` | Convex handles WebSocket lifecycle, reconnection, optimistic updates |
| Component theming system | Custom CSS variables + React context | HeroUI + Tailwind v4 theme | HeroUI's semantic color tokens (primary, success, danger) are pre-wired to all components |
| Font optimization | Manual `<link rel="preload">` tags | `next/font/google` | Zero layout shift, automatic self-hosting, no Google CDN requests |
| Dark mode class injection | Custom JS to toggle body class | Static `className="dark"` on `<html>` | No JS overhead; HeroUI reads the class directly |
| Deployment CI/CD | Custom GitHub Actions | Vercel GitHub integration | One-click, zero config, preview URLs per PR |

**Key insight:** Every one of these problems has a purpose-built solution in the chosen stack. Custom implementations will be inferior and waste hackathon time.

---

## Common Pitfalls

### Pitfall 1: HeroUI Source Path Mismatch in globals.css

**What goes wrong:** HeroUI components render with no styles — buttons are unstyled, colors don't appear.

**Why it happens:** The `@source` directive in globals.css points to the wrong relative path. If `globals.css` is in `app/`, the path to `node_modules` is `../node_modules/`, not `../../node_modules/`.

**How to avoid:** Verify the relative path from your CSS file to the repo root `node_modules`. For `app/globals.css` → use `../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}`.

**Warning signs:** Buttons render as plain browser buttons; HeroUI color utilities (`text-primary`, `bg-success`) have no effect.

### Pitfall 2: ConvexReactClient Instantiated Inside Component

**What goes wrong:** Every render creates a new WebSocket connection. Real-time subscriptions disconnect/reconnect on every re-render.

**Why it happens:** Developer puts `const convex = new ConvexReactClient(...)` inside the Providers function body.

**How to avoid:** Define `const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)` at module scope in `providers.tsx`, outside any component function.

**Warning signs:** Console shows repeated WebSocket connect/disconnect messages; `useQuery` resets to `undefined` frequently.

### Pitfall 3: NEXT_PUBLIC_CONVEX_URL Not Set for Vercel

**What goes wrong:** Production deployment shows "Invalid deployment URL" or Convex queries never load.

**Why it happens:** `npx convex dev` writes the URL to `.env.local` (local only), which is gitignored. Vercel never sees it.

**How to avoid:** After confirming local setup works, add `NEXT_PUBLIC_CONVEX_URL` manually in the Vercel dashboard under Project Settings → Environment Variables.

**Warning signs:** Local dev works, Vercel deployment shows blank data or JS errors about undefined Convex URL.

### Pitfall 4: `suppressHydrationWarning` Missing on `<html>`

**What goes wrong:** React hydration warnings in the console about attribute mismatch on the `<html>` element.

**Why it happens:** The `className="dark"` on `<html>` is server-rendered, and some tools may modify it on the client. `suppressHydrationWarning` tells React to ignore this mismatch.

**How to avoid:** Always add `suppressHydrationWarning` to the `<html>` tag in `app/layout.tsx`.

**Warning signs:** Console error: "Warning: Prop `className` did not match."

### Pitfall 5: Vercel Detects Wrong Root / Build Fails

**What goes wrong:** Vercel tries to build the Python `bu-agent/` directory or can't find `package.json`.

**Why it happens:** Vercel auto-detects project root. If the Next.js `package.json` is at the repo root alongside `bu-agent/`, Vercel should find it — but the `bu-agent/` directory may confuse detection.

**How to avoid:** During Vercel project setup, confirm the "Root Directory" is set to `/` (the repo root, not a subdirectory). Verify that `package.json`, `next.config.ts`, and `app/` are all at the same level.

**Warning signs:** Vercel build log shows "Could not find a production build" or Python-related errors.

### Pitfall 6: useQuery Returns undefined vs. [] — Handling the Difference

**What goes wrong:** Code treats `undefined` (loading) the same as `[]` (empty but connected). Phase 1 verification falsely passes or fails.

**Why it happens:** Convex `useQuery` returns `undefined` while the subscription is being established, then `[]` once connected to an empty table.

**How to avoid:** In verification code, check `houses !== undefined` (meaning Convex is connected) and `houses.length === 0` (meaning table is empty). Both are valid success states for Phase 1.

**Warning signs:** "Connected" indicator shows false even when the Convex panel shows an active connection.

---

## Code Examples

Verified patterns from official sources:

### PostCSS Config (Tailwind v4)

```javascript
// Source: https://www.heroui.com/docs/guide/tailwind-v4
// postcss.config.js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Inter Font with CSS Variable

```typescript
// Source: https://nextjs.org/docs/app/getting-started/fonts (verified 2026-02-27)
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  // Inter is a variable font — no need to specify weights
});
```

### Convex useQuery Pattern

```typescript
// Source: https://docs.convex.dev/functions/query-functions
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function VerificationComponent() {
  const houses = useQuery(api.houses.list);

  if (houses === undefined) return <p>Connecting to Convex...</p>;
  return <p>Connected. Houses: {houses.length}</p>;
}
```

### HeroUI Button Import (Preferred)

```typescript
// Source: https://www.heroui.com/docs/frameworks/nextjs
// Prefer individual package imports for tree-shaking
import { Button } from "@heroui/button";

// Not: import { Button } from "@heroui/react";
// (The @heroui/react barrel import is fine for providers but adds weight to components)
```

### Convex npx dev Run

```bash
# Source: https://docs.convex.dev/quickstart/nextjs
# Run in the repo root. Creates:
# 1. convex/ directory with _generated/
# 2. .env.local with NEXT_PUBLIC_CONVEX_URL
# 3. Starts file watcher for hot-reloading functions
npx convex dev
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `plugins: [heroui()]` | `hero.ts` + `@plugin` in CSS | HeroUI v2.8.0 / Tailwind v4 (2025-07) | No config file needed; CSS-first theming |
| `darkMode: "class"` in tailwind.config.js | `@custom-variant dark (&:is(.dark *))` in CSS | Tailwind v4 | Breaking change — must use new syntax |
| `next-themes` ThemeProvider for dark mode | Static `className="dark"` on html | N/A (always was an option) | Simpler when no toggle needed |
| Three separate `@tailwind` directives | Single `@import "tailwindcss"` | Tailwind v4 | Cleaner CSS entry point |
| `autoprefixer` in PostCSS | Not needed | Tailwind v4 | Built-in prefixing; remove from postcss.config |

**Deprecated/outdated:**
- `tailwind.config.js` plugin array for HeroUI: Still works via `@config` directive but not the recommended Tailwind v4 path
- `@tailwind base; @tailwind components; @tailwind utilities;`: Replaced by `@import "tailwindcss"` in v4
- HeroUI v2 before 2025-07-15 (v2.8.0): Did not support Tailwind v4. If version is < 2.8.0, must upgrade.

---

## Open Questions

1. **HeroUI CLI scaffold vs manual install at existing repo root**
   - What we know: `npx heroui-cli@latest init -t app` creates a new project. The repo already has files at the root.
   - What's unclear: Whether the CLI safely initializes into an existing non-empty directory or requires a fresh directory.
   - Recommendation: Prefer manual install (`npm i @heroui/react framer-motion`) + `npx create-next-app@latest .` rather than using the CLI if the repo root already has content. The CLI template can be referenced for file contents but may not handle existing files gracefully.

2. **Vercel Root Directory with bu-agent/ coexistence**
   - What we know: Vercel auto-detects Next.js. The repo root has both `package.json` (Next.js) and `bu-agent/` (Python).
   - What's unclear: Whether Vercel's auto-detection gets confused by the Python directory.
   - Recommendation: During Vercel project import, manually verify "Root Directory" is set to `/` and the framework is detected as "Next.js". If auto-detect fails, set framework preset to Next.js manually.

3. **CONVEX_DEPLOYMENT vs NEXT_PUBLIC_CONVEX_URL**
   - What we know: `npx convex dev` writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`. The CONTEXT.md mentions both `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`.
   - What's unclear: Whether `CONVEX_DEPLOYMENT` is needed separately or if it's only used by the Convex CLI itself (not the frontend client).
   - Recommendation: `NEXT_PUBLIC_CONVEX_URL` is what the frontend `ConvexReactClient` needs. `CONVEX_DEPLOYMENT` is the Convex CLI's internal reference and is written to `.env.local` automatically by `npx convex dev`. Do not manually set `CONVEX_DEPLOYMENT` in Vercel — only `NEXT_PUBLIC_CONVEX_URL` is needed there.

---

## Sources

### Primary (HIGH confidence)

- https://www.heroui.com/docs/frameworks/nextjs — HeroUI Next.js setup, provider code, Tailwind v4 CSS config
- https://www.heroui.com/docs/guide/tailwind-v4 — CSS-first plugin setup, hero.ts pattern, @custom-variant dark
- https://www.heroui.com/docs/customization/theme — Plugin options, themes config structure, primary color customization
- https://www.heroui.com/docs/customization/dark-mode — Dark class on html element, dark-mode-only setup
- https://docs.convex.dev/quickstart/nextjs — ConvexClientProvider, useQuery, NEXT_PUBLIC_CONVEX_URL, npx convex dev
- https://docs.convex.dev/database/schemas — defineSchema, defineTable, v validators
- https://docs.convex.dev/functions/query-functions — Query handler pattern, useQuery return values
- https://docs.convex.dev/client/react/deployment-urls — Env var names per framework confirmed
- https://nextjs.org/docs/app/getting-started/fonts — next/font/google Inter setup, variable font, layout.tsx pattern (docs dated 2026-02-27)

### Secondary (MEDIUM confidence)

- https://vercel.com/docs/git/vercel-for-github — Vercel GitHub integration, auto-deploy on push to main
- https://github.com/heroui-inc/next-app-template — Official HeroUI template file structure (388 stars, MIT)
- WebSearch: HeroUI v2.8.0 Tailwind v4 support confirmed added 2025-07-15

### Tertiary (LOW confidence)

- Medium articles on HeroUI + Next.js 15 — corroborating setup steps but not primary source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — HeroUI, Convex, Next.js, Tailwind v4 all verified via official docs
- Architecture: HIGH — Provider patterns, font setup, dark mode all verified via official docs; project structure follows official HeroUI template
- Pitfalls: MEDIUM — Most pitfalls verified from official docs or direct observation of the tech; Vercel + bu-agent coexistence pitfall is LOW (inferred, not directly tested)

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (stable technologies; HeroUI/Tailwind v4 integration recently stabilized)
