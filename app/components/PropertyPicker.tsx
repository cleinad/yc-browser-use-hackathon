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
      <div className="h-8 w-44 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]" />
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-3 pr-2 text-xs text-[var(--fg-muted)]">
      Property
      <select
        value={selected}
        onChange={(event) => {
          const nextPropertyId = event.target.value as Id<"properties">;
          if (!nextPropertyId) {
            return;
          }
          router.push(`/properties/${nextPropertyId}/chat`);
        }}
        className="h-8 min-w-40 bg-transparent text-sm text-[var(--fg-base)] outline-none"
      >
        <option value="">Select</option>
        {properties.map((property) => (
          <option key={property._id} value={property._id}>
            {property.name}
          </option>
        ))}
      </select>
    </label>
  );
}
