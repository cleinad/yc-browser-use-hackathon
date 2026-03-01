"use client";

import { useRef, useState, useCallback, type ChangeEvent, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSubmit: (
    input: string | { payloadText: string; displayText: string }
  ) => void;
  disabled: boolean;
}

type CsvAttachment = {
  name: string;
  content: string;
  nonEmptyRowCount: number;
};

const MAX_CSV_SIZE_BYTES = 1024 * 1024; // 1MB

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

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l8.49-8.49a3 3 0 1 1 4.24 4.24l-8.49 8.49a1 1 0 0 1-1.41-1.41l8.49-8.49" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function countNonEmptyRows(content: string): number {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function buildCsvTexts(notes: string, attachment: CsvAttachment): {
  payloadText: string;
  displayText: string;
} {
  const noteSection = notes.trim();
  const csvSection = attachment.content.trim();

  const payloadParts: string[] = [];
  if (noteSection) {
    payloadParts.push(noteSection);
  }
  payloadParts.push(
    `Attached CSV: ${attachment.name} (${attachment.nonEmptyRowCount} rows)\n\n${csvSection}`,
  );

  const displayText = noteSection
    ? `${noteSection}\n\n[Attached CSV: ${attachment.name} (${attachment.nonEmptyRowCount} rows)]`
    : `[Attached CSV: ${attachment.name} (${attachment.nonEmptyRowCount} rows)]`;

  return {
    payloadText: payloadParts.join("\n\n"),
    displayText,
  };
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvAttachment, setCsvAttachment] = useState<CsvAttachment | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const submit = useCallback(
    (text?: string) => {
      const noteText = (text ?? ref.current?.value ?? "").trim();
      if (!noteText && !csvAttachment) {
        return;
      }

      if (csvAttachment) {
        onSubmit(buildCsvTexts(noteText, csvAttachment));
      } else {
        onSubmit(noteText);
      }
      setCsvAttachment(null);
      setFileError(null);
      if (ref.current) {
        ref.current.value = "";
        ref.current.style.height = "auto";
      }
    },
    [csvAttachment, onSubmit],
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_CSV_SIZE_BYTES) {
      setFileError("CSV is too large. Please keep it under 1MB.");
      return;
    }

    try {
      const content = await file.text();
      const nonEmptyRowCount = countNonEmptyRows(content);
      if (!content.trim() || nonEmptyRowCount === 0) {
        setFileError("CSV appears empty. Please attach a file with at least one row.");
        return;
      }

      setCsvAttachment({
        name: file.name,
        content,
        nonEmptyRowCount,
      });
      setFileError(null);
    } catch {
      setFileError("Could not read this file. Please try another CSV.");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        className="flex items-end gap-2 rounded-[1.75rem] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus-within:border-[var(--fg-muted)] focus-within:shadow-[0_0_0_1px_var(--border-default)]"
        style={{ minHeight: "56px" }}
      >
        <button
          type="button"
          aria-label="Attach"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="flex shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--bg-base)] w-9 h-9 ml-2 mb-2 hover:bg-[var(--accent-primary-hover)] transition"
        >
          <PlusIcon />
        </button>
        <div className="flex-1 min-h-[52px] py-2 px-1 flex flex-col justify-center">
          {csvAttachment && (
            <div className="mb-1.5 inline-flex max-w-full items-center gap-1.5 self-start rounded-full border border-[var(--border-default)] bg-[var(--bg-base)] px-2.5 py-1 text-xs text-[var(--fg-base)]">
              <PaperclipIcon />
              <span className="truncate max-w-52">
                {csvAttachment.name} ({csvAttachment.nonEmptyRowCount} rows)
              </span>
              <button
                type="button"
                aria-label="Remove attached CSV"
                onClick={() => setCsvAttachment(null)}
                className="rounded-full p-0.5 text-[var(--fg-muted)] hover:text-[var(--fg-base)]"
              >
                <CloseIcon />
              </button>
            </div>
          )}
          <textarea
            ref={ref}
            rows={1}
            disabled={disabled}
            placeholder="Assign a task or ask anything"
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            className="min-h-[32px] w-full resize-none bg-transparent py-1 pr-1 text-sm leading-6 text-[var(--fg-base)] placeholder-[var(--fg-muted)] outline-none disabled:text-[var(--fg-disabled)]"
          />
        </div>
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
      {fileError && (
        <p className="mt-2 text-xs text-[var(--accent-destructive)]">{fileError}</p>
      )}
    </div>
  );
}
