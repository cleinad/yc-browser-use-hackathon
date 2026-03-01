"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type PropertyPickerProps = {
  currentPropertyId?: Id<"properties"> | null;
};

export function PropertyPicker({ currentPropertyId = null }: PropertyPickerProps) {
  const router = useRouter();
  const properties = useQuery(api.properties.listMine, {
    includeArchived: false,
  });

  const selected = useMemo(() => {
    if (!properties) {
      return "";
    }

    if (currentPropertyId && properties.some((property) => property._id === currentPropertyId)) {
      return currentPropertyId;
    }

    return "";
  }, [currentPropertyId, properties]);

  if (properties === undefined) {
    return (
      <div className="h-9 w-52 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]" />
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-3 pr-2 text-xs text-[var(--fg-muted)]">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 20h18M5 20V7l7-3v16M19 20V10l-7-3" />
      </svg>
      <select
        value={selected}
        onChange={(event) => {
          const nextPropertyId = event.target.value as Id<"properties">;
          if (!nextPropertyId) {
            router.push("/home");
            return;
          }
          router.push(`/properties/${nextPropertyId}/chat`);
        }}
        className="h-9 min-w-44 bg-transparent text-sm text-[var(--fg-base)] outline-none"
      >
        <option value="">Select property</option>
        {properties.map((property) => (
          <option key={property._id} value={property._id}>
            {property.name}
          </option>
        ))}
      </select>
    </label>
  );
}
