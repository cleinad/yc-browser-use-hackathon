"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { AuthControls } from "../components/AuthControls";
import { PropertyPicker } from "../components/PropertyPicker";
import { ThemeToggle } from "../components/ThemeToggle";

type PropertyDoc = Doc<"properties">;

type PropertyFormModalProps = {
  title: string;
  submitLabel: string;
  busy: boolean;
  initialName?: string;
  initialAddress?: string;
  onClose: () => void;
  onSubmit: (values: { name: string; address?: string }) => Promise<void>;
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.24)]">
        <h2 className="text-xl font-normal tracking-tight text-[var(--fg-base)] [font-family:var(--font-heading),serif]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Keep it simple for now. You can edit this later.
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
              className="block text-xs uppercase tracking-[0.14em] text-[var(--fg-disabled)]"
            >
              Property name
            </label>
            <input
              id="property-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sunset Towers"
              disabled={busy}
              className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 text-sm text-[var(--fg-base)] outline-none focus:border-[var(--fg-muted)] disabled:opacity-60"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="property-address"
              className="block text-xs uppercase tracking-[0.14em] text-[var(--fg-disabled)]"
            >
              Address (optional)
            </label>
            <input
              id="property-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="123 Main St, Austin, TX"
              disabled={busy}
              className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3 text-sm text-[var(--fg-base)] outline-none focus:border-[var(--fg-muted)] disabled:opacity-60"
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
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--fg-base)] hover:border-[var(--fg-muted)] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
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
  const properties = useQuery(api.properties.listMine, { includeArchived: true });
  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);
  const setArchived = useMutation(api.properties.setArchived);

  const [showArchived, setShowArchived] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<Id<"properties"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [archivingPropertyId, setArchivingPropertyId] = useState<Id<"properties"> | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const editingProperty = useMemo(() => {
    if (!properties || !editingPropertyId) {
      return null;
    }
    return properties.find((property) => property._id === editingPropertyId) ?? null;
  }, [editingPropertyId, properties]);

  const activeProperties = useMemo(
    () => (properties ?? []).filter((property) => !property.isArchived),
    [properties],
  );

  const archivedProperties = useMemo(
    () => (properties ?? []).filter((property) => property.isArchived),
    [properties],
  );

  const visibleProperties = showArchived ? properties ?? [] : activeProperties;

  const saveNewProperty = async (values: { name: string; address?: string }) => {
    setSaving(true);
    setPageError(null);
    try {
      await createProperty(values);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create property.";
      setPageError(message);
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
      const message = error instanceof Error ? error.message : "Could not update property.";
      setPageError(message);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (property: PropertyDoc) => {
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

      <main className="mx-auto w-full max-w-6xl px-6 pb-12 pt-4 sm:px-8">
        <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--fg-disabled)]">
                Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-normal tracking-tight text-[var(--fg-base)] [font-family:var(--font-heading),serif]">
                Your Properties
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[var(--fg-muted)]">
                Create and manage locations, then route each part request through the
                right property chat workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)]"
            >
              New property
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-disabled)]">
                Active
              </p>
              <p className="mt-1 text-2xl text-[var(--fg-base)]">{activeProperties.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-disabled)]">
                Archived
              </p>
              <p className="mt-1 text-2xl text-[var(--fg-base)]">{archivedProperties.length}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-disabled)]">
                Total
              </p>
              <p className="mt-1 text-2xl text-[var(--fg-base)]">
                {(properties ?? []).length}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--fg-base)]">Property list</h2>
            <button
              type="button"
              onClick={() => setShowArchived((prev) => !prev)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--fg-base)] hover:border-[var(--fg-muted)]"
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </button>
          </div>

          {pageError && (
            <p className="mb-3 rounded-lg border border-[var(--accent-destructive)] px-3 py-2 text-sm text-[var(--accent-destructive)]">
              {pageError}
            </p>
          )}

          {properties === undefined ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
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
                className="mt-4 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)]"
              >
                Create property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProperties.map((property) => (
                <article
                  key={property._id}
                  className="flex min-h-44 flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-medium text-[var(--fg-base)]">
                        {property.name}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--fg-muted)]">
                        {property.address ?? "Address not set"}
                      </p>
                    </div>
                    {property.isArchived && (
                      <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-xs text-[var(--fg-muted)]">
                        Archived
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                    {!property.isArchived && (
                      <Link
                        href={`/properties/${property._id}/chat`}
                        className="rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-[var(--bg-base)] hover:bg-[var(--accent-primary-hover)]"
                      >
                        Open chat
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingPropertyId(property._id)}
                      className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--fg-base)] hover:border-[var(--fg-muted)]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void toggleArchive(property);
                      }}
                      disabled={archivingPropertyId === property._id}
                      className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--fg-base)] hover:border-[var(--fg-muted)] disabled:opacity-60"
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
