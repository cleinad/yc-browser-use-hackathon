"use client";

import { useRef, useCallback, KeyboardEvent, ChangeEvent } from "react";

interface TicketChatInputProps {
  onSubmit: (text: string) => void;
  onImageUpload: (file: File) => void;
  onCsvUpload?: (file: File) => void;
  disabled: boolean;
  placeholder?: string;
  showImageUpload?: boolean;
  showCsvUpload?: boolean;
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
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

export default function TicketChatInput({
  onSubmit,
  onImageUpload,
  onCsvUpload,
  disabled,
  placeholder = "Describe the issue or answer questions...",
  showImageUpload = true,
  showCsvUpload = false,
}: TicketChatInputProps) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(
    (text?: string) => {
      const value = text ?? textRef.current?.value.trim();
      if (!value) return;
      onSubmit(value);
      if (textRef.current) textRef.current.value = "";
      if (textRef.current) textRef.current.style.height = "auto";
    },
    [onSubmit],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
      e.target.value = "";
    }
  };

  const handleCsvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCsvUpload?.(file);
      e.target.value = "";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4">
      <div
        className="flex items-end gap-2 rounded-[1.75rem] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus-within:border-[var(--fg-muted)] focus-within:shadow-[0_0_0_1px_var(--border-default)]"
        style={{ minHeight: "56px" }}
      >
        {showImageUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              aria-label="Upload photo"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              className="flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--bg-base)] w-9 h-9 ml-2 mb-2 hover:bg-[var(--accent-primary-hover)] transition disabled:opacity-40"
            >
              <CameraIcon />
            </button>
          </>
        )}
        {showCsvUpload && (
          <>
            <input
              ref={csvRef}
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="hidden"
            />
            <button
              type="button"
              aria-label="Upload CSV"
              onClick={() => csvRef.current?.click()}
              disabled={disabled}
              className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--bg-base)] w-9 h-9 mb-2 hover:bg-[var(--accent-primary-hover)] transition disabled:opacity-40 ${showImageUpload ? "" : "ml-2"}`}
            >
              <DocumentIcon />
            </button>
          </>
        )}
        <textarea
          ref={textRef}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          className={`flex-1 min-h-[52px] py-3 px-1 resize-none bg-transparent text-[var(--fg-base)] placeholder-[var(--fg-muted)] text-sm leading-6 outline-none disabled:text-[var(--fg-disabled)] ${showImageUpload ? "" : "pl-3"}`}
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
