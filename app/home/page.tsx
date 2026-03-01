"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AuthControls } from "../components/AuthControls";
import { PropertyPicker } from "../components/PropertyPicker";
import { ThemeToggle } from "../components/ThemeToggle";

type PropertySummary = {
  _id: Id<"properties">;
  name: string;
  address?: string;
  isArchived: boolean;
  openRequestCount: number;
  totalRequestCount: number;
  weeklyRequestCount: number;
  lastRequestAt: number | null;
};

type PropertyFormModalProps = {
  title: string;
  submitLabel: string;
  busy: boolean;
  initialName?: string;
  initialAddress?: string;
  onClose: () => void;
  onSubmit: (values: { name: string; address?: string }) => Promise<void>;
};

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 20h18M5 20V7l7-3v16M19 20V10l-7-3" />
      <path d="M9 10h2M9 14h2M13 10h2M13 14h2" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18v12H3z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 10a3 3 0 0 0 3-3M21 10a3 3 0 0 1-3-3M3 14a3 3 0 0 1 3 3M21 14a3 3 0 0 0-3 3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l1.9 4.7L19 9.6l-4 3.4 1.2 5L12 15.4 7.8 18l1.2-5-4-3.4 5.1-1.9L12 3z" />
    </svg>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDurationMinutes(value: number): string {
  const rounded = Math.round(value);
  if (rounded < 60) {
    return `${rounded} min`;
  }
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) {
    return "No requests yet";
  }

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)}m ago`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }
  return `${Math.floor(diff / day)}d ago`;
}

function PropertyFormModal({
  title,
  submitLabel,
  busy,
  initialName,
  initialAddress,
  onClose,
  onSubmit,
}: PropertyFormModalProps) {
  const [name, setName] = useState(initialName ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,14,12,0.45)] px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)]">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--fg-base)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Add a name and optional address. You can refine details later.
        </p>

        <form
          className="mt-5 space-y-4"
          onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const trimmedName = name.trim();
            if (!trimmedName) {
              setError("Property name is required.");
              return;
            }

            setError(null);
            try {
              await onSubmit({
                name: trimmedName,
                address: address.trim() || undefined,
              });
              onClose();
            } catch (submitError) {
              setError(
                submitError instanceof Error
                  ? submitError.message
                  : "Could not save property.",
              );
            }
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="property-name"
              className="block text-xs text-[var(--fg-disabled)]"
            >
              Property name
            </label>
            <input
              id="property-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sunset Towers"
              disabled={busy}
              className="h-9 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 text-sm text-[var(--fg-base)] outline-none focus:border-[var(--fg-muted)] disabled:opacity-60"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="property-address"
              className="block text-xs text-[var(--fg-disabled)]"
            >
              Address (optional)
            </label>
            <input
              id="property-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="123 Main St, Austin, TX"
              disabled={busy}
              className="h-9 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 text-sm text-[var(--fg-base)] outline-none focus:border-[var(--fg-muted)] disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[var(--accent-destructive)] px-3 py-2 text-sm text-[var(--accent-destructive)]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-sm text-[var(--fg-base)] hover:border-[var(--fg-muted)] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[var(--accent-primary)] px-3.5 py-1.5 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-60 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]"
            >
              {busy ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StatCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-[var(--fg-disabled)] leading-none">{label}</span>
      <span className="mt-1 text-lg font-semibold text-[var(--fg-base)] tabular-nums leading-none">
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DashboardDecisionBadge({ status, decision }: { status: string; decision: string }) {
  if (status === "queued" || status === "running") {
    return (
      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[color-mix(in_srgb,var(--accent-amber)_12%,transparent)] text-[var(--accent-amber)]">
        In Progress
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[color-mix(in_srgb,var(--accent-destructive)_12%,transparent)] text-[var(--accent-destructive)]">
        Failed
      </span>
    );
  }
  if (decision === "accepted") {
    return (
      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[color-mix(in_srgb,var(--accent-jade)_12%,transparent)] text-[var(--accent-jade)]">
        Accepted
      </span>
    );
  }
  if (decision === "rejected") {
    return (
      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[color-mix(in_srgb,var(--accent-destructive)_8%,transparent)] text-[var(--fg-muted)]">
        Rejected
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--fg-muted)]">
      Pending
    </span>
  );
}

export default function DashboardPage() {
  const dashboard = useQuery(api.properties.dashboard);
  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);
  const setArchived = useMutation(api.properties.setArchived);

  const [showArchived, setShowArchived] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<Id<"properties"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [archivingPropertyId, setArchivingPropertyId] = useState<Id<"properties"> | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const properties = useMemo(
    () => (dashboard?.properties ?? []) as PropertySummary[],
    [dashboard?.properties],
  );
  const metrics = dashboard?.metrics;

  const editingProperty = useMemo(() => {
    if (!editingPropertyId) {
      return null;
    }
    return properties.find((property) => property._id === editingPropertyId) ?? null;
  }, [editingPropertyId, properties]);

  const visibleProperties = showArchived
    ? properties
    : properties.filter((property) => !property.isArchived);

  const saveNewProperty = async (values: { name: string; address?: string }) => {
    setSaving(true);
    setPageError(null);
    try {
      await createProperty(values);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not create property.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const saveExistingProperty = async (
    propertyId: Id<"properties">,
    values: { name: string; address?: string },
  ) => {
    setSaving(true);
    setPageError(null);
    try {
      await updateProperty({
        propertyId,
        ...values,
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not update property.");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (property: PropertySummary) => {
    setArchivingPropertyId(property._id);
    setPageError(null);
    try {
      await setArchived({
        propertyId: property._id,
        isArchived: !property.isArchived,
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not update archive state.");
    } finally {
      setArchivingPropertyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8 border-b border-[var(--border-default)] shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-[var(--fg-base)] drop-shadow-[0_1px_0_rgba(0,0,0,0.08)]">
            Proquote
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <PropertyPicker />
          <ThemeToggle />
          <AuthControls />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-12 pt-2 sm:px-8">
        {/* --- Header row --- */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--fg-base)] drop-shadow-[0_1px_0_rgba(0,0,0,0.06)]">
              Properties
            </h1>
            <p className="mt-0.5 text-sm text-[var(--fg-muted)]">
              Manage locations and track procurement activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="shrink-0 rounded-lg bg-[var(--accent-primary)] px-3.5 py-1.5 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)] shadow-[0_3px_10px_rgba(0,0,0,0.14),0_1px_2px_rgba(0,0,0,0.08)]"
          >
            New property
          </button>
        </div>

        {/* --- Stats bar --- */}
        <div className="mt-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <StatCell label="Active" value={metrics?.activeProperties ?? 0} />
            <StatCell label="Archived" value={metrics?.archivedProperties ?? 0} />
            <StatCell label="Open requests" value={metrics?.openRequests ?? 0} />
            <StatCell label="Last 7d" value={metrics?.weeklyRequests ?? 0} />

            <div className="hidden sm:block w-px h-8 bg-[var(--border-default)]" />

            <div className="flex flex-col">
              <span className="flex items-center gap-1 text-[11px] text-[var(--accent-primary)] leading-none">
                <MoneyIcon />
                Cumulative savings
              </span>
              <span className="mt-1 text-lg font-semibold text-[var(--fg-base)] tabular-nums leading-none">
                {formatCurrency(metrics?.cumulativeRealizedSavings ?? 0)}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="flex items-center gap-1 text-[11px] text-[var(--accent-jade)] leading-none">
                <MoneyIcon />
                Savings (7d)
              </span>
              <span className="mt-1 text-lg font-semibold text-[var(--fg-base)] tabular-nums leading-none">
                {formatCurrency(metrics?.weeklyPotentialSavings ?? 0)}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="flex items-center gap-1 text-[11px] text-[var(--accent-amber)] leading-none">
                <ClockIcon />
                Time saved (7d)
              </span>
              <span className="mt-1 text-lg font-semibold text-[var(--fg-base)] tabular-nums leading-none">
                {formatDurationMinutes(metrics?.weeklyEstimatedTimeSavedMinutes ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* --- Property list --- */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--fg-base)]">
              {visibleProperties.length} {visibleProperties.length === 1 ? "property" : "properties"}
            </h2>
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className="text-xs text-[var(--fg-muted)] underline-offset-2 hover:text-[var(--fg-base)] hover:underline"
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </button>
          </div>

          {pageError && (
            <p className="mb-3 rounded-lg border border-[var(--accent-destructive)] px-3 py-2 text-sm text-[var(--accent-destructive)]">
              {pageError}
            </p>
          )}

          {dashboard === undefined ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-36 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
                />
              ))}
            </div>
          ) : visibleProperties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-10 text-center">
              <p className="text-sm text-[var(--fg-muted)]">
                {showArchived
                  ? "No properties yet."
                  : "No active properties. Create one to start."}
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="mt-3 rounded-lg bg-[var(--accent-primary)] px-3.5 py-1.5 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)] shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]"
              >
                Create property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProperties.map((property) => (
                <article
                  key={property._id}
                  className="group relative rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:border-[var(--fg-disabled)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
                >
                  {/* Top accent bar */}
                  <div
                    className={`absolute inset-x-0 top-0 h-px ${
                      property.isArchived
                        ? "bg-[var(--fg-disabled)]"
                        : "bg-[var(--accent-jade)]"
                    }`}
                  />

                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--fg-muted)]"><BuildingIcon /></span>
                        <h3 className="text-sm font-medium text-[var(--fg-base)] truncate">
                          {property.name}
                        </h3>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--fg-disabled)] truncate">
                        {property.address ?? "No address"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        property.isArchived
                          ? "bg-[var(--bg-subtle)] text-[var(--fg-disabled)]"
                          : "bg-[color-mix(in_srgb,var(--accent-jade)_12%,transparent)] text-[var(--accent-jade)]"
                      }`}
                    >
                      {property.isArchived ? "Archived" : "Active"}
                    </span>
                  </div>

                  {/* Inline stats */}
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-[var(--fg-disabled)]">Open </span>
                      <span className="font-medium text-[var(--fg-base)] tabular-nums">
                        {property.openRequestCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--fg-disabled)]">7d </span>
                      <span className="font-medium text-[var(--fg-base)] tabular-nums">
                        {property.weeklyRequestCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--fg-disabled)]">Total </span>
                      <span className="font-medium text-[var(--fg-base)] tabular-nums">
                        {property.totalRequestCount}
                      </span>
                    </div>
                  </div>

                  {/* Last activity */}
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--fg-disabled)]">
                    <SparkIcon />
                    <span>{formatRelativeTime(property.lastRequestAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--border-default)] pt-3">
                    {!property.isArchived && (
                      <Link
                        href={`/properties/${property._id}/chat`}
                        className="rounded-lg bg-[var(--accent-primary)] px-3 py-1 text-xs font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)] shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
                      >
                        Open chat
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingPropertyId(property._id)}
                      className="rounded-lg border border-[var(--border-default)] px-2.5 py-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:border-[var(--fg-muted)]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void toggleArchive(property);
                      }}
                      disabled={archivingPropertyId === property._id}
                      className="rounded-lg border border-[var(--border-default)] px-2.5 py-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:border-[var(--fg-muted)] disabled:opacity-60"
                    >
                      {archivingPropertyId === property._id
                        ? "..."
                        : property.isArchived
                          ? "Unarchive"
                          : "Archive"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* --- Recent Orders --- */}
        {(dashboard?.recentActivity ?? []).length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-[var(--fg-base)]">
              Recent Orders
            </h2>
            <div className="space-y-2">
              {(
                dashboard?.recentActivity as Array<{
                  requestId: string;
                  propertyId: string;
                  propertyName: string;
                  status: string;
                  inputText: string;
                  createdAt: number;
                  decision: string;
                  acceptedOptionRank: number | null;
                }>
              )?.map((activity) => (
                <Link
                  key={activity.requestId}
                  href={`/properties/${activity.propertyId}/chat`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 hover:border-[var(--fg-disabled)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--fg-base)] truncate">
                      {activity.inputText}
                    </p>
                    <p className="text-xs text-[var(--fg-disabled)] mt-0.5">
                      {activity.propertyName} &middot; {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                  <DashboardDecisionBadge
                    status={activity.status}
                    decision={activity.decision}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {createModalOpen && (
        <PropertyFormModal
          key="create-property"
          title="Create Property"
          submitLabel="Create property"
          busy={saving}
          onClose={() => {
            if (saving) {
              return;
            }
            setCreateModalOpen(false);
          }}
          onSubmit={saveNewProperty}
        />
      )}

      {editingProperty && (
        <PropertyFormModal
          key={editingProperty._id}
          title="Edit Property"
          submitLabel="Save changes"
          busy={saving}
          initialName={editingProperty.name}
          initialAddress={editingProperty.address}
          onClose={() => {
            if (saving) {
              return;
            }
            setEditingPropertyId(null);
          }}
          onSubmit={async (values) => {
            await saveExistingProperty(editingProperty._id, values);
            setEditingPropertyId(null);
          }}
        />
      )}
    </div>
  );
}
