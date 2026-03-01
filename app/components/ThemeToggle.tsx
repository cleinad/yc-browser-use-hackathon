"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "proquote-theme";

export type Theme = "light" | "dark";

/** Reads stored theme from localStorage, or null if not set (use system). */
function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

/** Applies theme class to document and persists to localStorage. */
function applyTheme(theme: Theme | null) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme) {
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  } else {
    // Use system preference when no stored preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  }
}

/** Resolves effective theme: stored preference or system. */
function getEffectiveTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window === "undefined") return "light";
  // Sync with class applied by layout script (no stored pref = system)
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getEffectiveTheme());

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--fg-muted)] transition hover:border-[var(--fg-muted)] hover:text-[var(--fg-base)]"
    >
      {/* Sun icon for light mode, moon for dark mode */}
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
