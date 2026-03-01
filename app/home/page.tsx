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
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18v12H3z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 10a3 3 0 0 0 3-3M21 10a3 3 0 0 1-3-3M3 14a3 3 0 0 1 3 3M21 14a3 3 0 0 0-3 3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      <div className="w-full max-w-md rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)]">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--fg-base)]">
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
              className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 text-sm text-[var(--fg-base)] outline-none focus:border-[var(--fg-muted)] disabled:opacity-60"
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
              className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 text-sm text-[var(--fg-base)] outline-none focus:border-[var(--fg-muted)] disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-[var(--accent-destructive)] px-3 py-2 text-sm text-[var(--accent-destructive)]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--fg-base)] hover:border-[var(--fg-muted)] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
            >
              {busy ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
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
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-[var(--fg-base)]">
            Proquote
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <PropertyPicker />
          <ThemeToggle />
          <AuthControls />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 pb-12 pt-3 sm:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-24 -top-20 h-60 w-60 rounded-full bg-[color-mix(in_srgb,var(--accent-amber)_22%,transparent)] blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--accent-jade)_16%,transparent)] blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[var(--fg-disabled)]">
                Portfolio Concierge
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--fg-base)]">
                Your Properties
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--fg-muted)]">
                Coordinate requests by location, track operational momentum, and surface
                weekly procurement wins across your portfolio.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)]"
            >
              New property
            </button>
          </div>

          <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] p-4">
              <p className="text-xs text-[var(--fg-disabled)]">
                Active
              </p>
              <p className="mt-1 text-2xl text-[var(--fg-base)]">{metrics?.activeProperties ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] p-4">
              <p className="text-xs text-[var(--fg-disabled)]">
                Archived
              </p>
              <p className="mt-1 text-2xl text-[var(--fg-base)]">{metrics?.archivedProperties ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] p-4">
              <p className="text-xs text-[var(--fg-disabled)]">
                Open requests
              </p>
              <p className="mt-1 text-2xl text-[var(--fg-base)]">{metrics?.openRequests ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_72%,transparent)] p-4">
              <p className="text-xs text-[var(--fg-disabled)]">
                Last 7d requests
              </p>
              <p className="mt-1 text-2xl text-[var(--fg-base)]">{metrics?.weeklyRequests ?? 0}</p>
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_68%,transparent)] p-4">
              <div className="flex items-center gap-2 text-[var(--accent-jade)]">
                <MoneyIcon />
                <p className="text-xs">Potential savings (7d)</p>
              </div>
              <p className="mt-2 text-3xl font-semibold text-[var(--fg-base)]">
                {formatCurrency(metrics?.weeklyPotentialSavings ?? 0)}
              </p>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">
                Compared against the next-best quote option per completed request.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_68%,transparent)] p-4">
              <div className="flex items-center gap-2 text-[var(--accent-amber)]">
                <ClockIcon />
                <p className="text-xs">Estimated time saved (7d)</p>
              </div>
              <p className="mt-2 text-3xl font-semibold text-[var(--fg-base)]">
                {formatDurationMinutes(metrics?.weeklyEstimatedTimeSavedMinutes ?? 0)}
              </p>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">
                Manual sourcing estimate minus automated run time plus review buffer.
              </p>
            </div>
          </div>

          <details className="relative mt-4 rounded-xl border border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-base)_60%,transparent)] px-3 py-2 text-xs text-[var(--fg-muted)]">
            <summary className="cursor-pointer select-none text-[var(--fg-base)]">
              How these weekly stats are calculated
            </summary>
            <div className="mt-2 space-y-1 leading-relaxed">
              <p>
                Potential savings per request = max(0, next-best quote total - best quote
                total), then summed for completed requests in the last 7 days.
              </p>
              <p>
                Estimated time saved per request = max(0, manual estimate - automated
                runtime estimate), where manual estimate = 8 + (3 x line items) + (2 x
                retailers compared) minutes.
              </p>
            </div>
          </details>
        </section>

        <section className="mt-6">
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--fg-base)]">Property list</h2>
              <button
                type="button"
                onClick={() => setShowArchived((prev) => !prev)}
                className="text-xs text-[var(--fg-muted)] underline-offset-2 hover:text-[var(--fg-base)] hover:underline"
              >
                {showArchived ? "Hide archived" : "Show archived"}
              </button>
            </div>

            {pageError && (
              <p className="mb-3 rounded-xl border border-[var(--accent-destructive)] px-3 py-2 text-sm text-[var(--accent-destructive)]">
                {pageError}
              </p>
            )}

            {dashboard === undefined ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-44 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
                  />
                ))}
              </div>
            ) : visibleProperties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-12 text-center">
                <p className="text-base text-[var(--fg-base)]">
                  {showArchived
                    ? "No properties yet."
                    : "No active properties. Create one to start making part requests."}
                </p>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)]"
                >
                  Create property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {visibleProperties.map((property) => (
                  <article
                    key={property._id}
                    className="group relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--fg-muted)]"
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-[2px] ${
                        property.isArchived
                          ? "bg-[var(--fg-disabled)]"
                          : "bg-[color-mix(in_srgb,var(--accent-jade)_70%,var(--accent-amber)_30%)]"
                      }`}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <BuildingIcon />
                          <h3 className="text-lg font-medium text-[var(--fg-base)]">
                            {property.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-[var(--fg-muted)]">
                          {property.address ?? "Address not set"}
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-xs text-[var(--fg-muted)]">
                        {property.isArchived ? "Archived" : "Active"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-2 py-2">
                        <p className="text-[var(--fg-disabled)]">Open</p>
                        <p className="mt-1 text-base text-[var(--fg-base)]">
                          {property.openRequestCount}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-2 py-2">
                        <p className="text-[var(--fg-disabled)]">Last 7d</p>
                        <p className="mt-1 text-base text-[var(--fg-base)]">
                          {property.weeklyRequestCount}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-2 py-2">
                        <p className="text-[var(--fg-disabled)]">Lifetime</p>
                        <p className="mt-1 text-base text-[var(--fg-base)]">
                          {property.totalRequestCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                      <SparkIcon />
                      <span>Last activity: {formatRelativeTime(property.lastRequestAt)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {!property.isArchived && (
                        <Link
                          href={`/properties/${property._id}/chat`}
                          className="rounded-xl bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)]"
                        >
                          Open chat
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingPropertyId(property._id)}
                        className="rounded-xl border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--fg-base)] hover:border-[var(--fg-muted)]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void toggleArchive(property);
                        }}
                        disabled={archivingPropertyId === property._id}
                        className="rounded-xl border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--fg-base)] hover:border-[var(--fg-muted)] disabled:opacity-60"
                      >
                        {archivingPropertyId === property._id
                          ? "Saving..."
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
        </section>
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
