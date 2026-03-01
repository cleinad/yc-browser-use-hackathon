"use client";

import { useRef, useCallback, KeyboardEvent } from "react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const value = ref.current?.value.trim();
    if (!value) return;
    onSubmit(value);
    if (ref.current) ref.current.value = "";
    // reset height
    if (ref.current) ref.current.style.height = "auto";
  }, [onSubmit]);

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
    <div className="flex items-end gap-2 border-t border-zinc-200 bg-white px-4 py-3">
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder="Describe the parts you need..."
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className="flex-1 resize-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
      />
      <button
        onClick={submit}
        disabled={disabled}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40"
      >
        Send
      </button>
    </div>
  );
}
