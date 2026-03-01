"use client";

import { useState } from "react";

interface ProductThumbnailProps {
  src: string | null;
  alt: string;
  size?: number;
}

export default function ProductThumbnail({
  src,
  alt,
  size = 48,
}: ProductThumbnailProps) {
  const [state, setState] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error"
  );

  return (
    <div
      className="shrink-0 rounded-lg bg-[var(--bg-subtle)] overflow-hidden"
      style={{ width: size, height: size }}
    >
      {state === "loading" && src && (
        <>
          <div className="w-full h-full animate-pulse bg-[var(--bg-subtle)]" />
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            onLoad={() => setState("loaded")}
            onError={() => setState("error")}
          />
        </>
      )}
      {state === "loaded" && src && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover animate-[fadeIn_0.3s_ease-in]"
          style={{ animationFillMode: "both" }}
        />
      )}
      {state === "error" && (
        <div className="w-full h-full flex items-center justify-center text-[var(--fg-disabled)]">
          <svg
            width={size * 0.5}
            height={size * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
          </svg>
        </div>
      )}
    </div>
  );
}
