"use client";

import { useRef, useCallback, KeyboardEvent } from "react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(
    (text?: string) => {
      const value = text ?? ref.current?.value.trim();
      if (!value) return;
      onSubmit(value);
      if (ref.current) ref.current.value = "";
      if (ref.current) ref.current.style.height = "auto";
    },
    [onSubmit]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div
        className="flex items-end gap-2 rounded-[1.75rem] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus-within:border-[var(--fg-muted)] focus-within:shadow-[0_0_0_1px_var(--border-default)]"
        style={{ minHeight: "56px" }}
      >
        <button
          type="button"
          aria-label="Attach"
          className="flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--bg-base)] w-9 h-9 ml-2 mb-2 hover:bg-[var(--accent-primary-hover)] transition"
        >
          <PlusIcon />
        </button>
        <textarea
          ref={ref}
          rows={1}
          disabled={disabled}
          placeholder="Assign a task or ask anything"
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          className="flex-1 min-h-[52px] py-3 px-1 resize-none bg-transparent text-[var(--fg-base)] placeholder-[var(--fg-muted)] text-sm leading-6 outline-none disabled:text-[var(--fg-disabled)]"
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={disabled}
          aria-label="Send"
          className="flex shrink-0 items-center justify-center rounded-full w-9 h-9 mr-2 mb-2 bg-[var(--bg-subtle)] text-[var(--fg-base)] hover:bg-[var(--border-default)] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowUpIcon />
        </button>
      </div>
    </div>
  );
}
