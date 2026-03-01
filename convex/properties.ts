import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

async function ensureUserIdFromIdentity(ctx: MutationCtx): Promise<Id<"users">> {
  const identity = await requireIdentity(ctx);
  const now = Date.now();

  const existing = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      subject: identity.subject,
      email: identity.email,
      name: identity.name,
      avatarUrl: identity.pictureUrl,
      updatedAt: now,
    });
    return existing._id;
  }

  return await ctx.db.insert("users", {
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject,
    email: identity.email,
    name: identity.name,
    avatarUrl: identity.pictureUrl,
    createdAt: now,
    updatedAt: now,
  });
}

async function getUserIdFromIdentity(ctx: QueryCtx): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  return user?._id ?? null;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const listMine = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromIdentity(ctx);
    if (!userId) {
      return [];
    }

    if (args.includeArchived) {
      return await ctx.db
        .query("properties")
        .withIndex("by_owner_createdAt", (q) => q.eq("ownerUserId", userId))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("properties")
      .withIndex("by_owner_archived_createdAt", (q) =>
        q.eq("ownerUserId", userId).eq("isArchived", false),
      )
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: {
    propertyId: v.id("properties"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromIdentity(ctx);
    if (!userId) {
      return null;
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.ownerUserId !== userId) {
      return null;
    }

    return property;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ensureUserIdFromIdentity(ctx);
    const now = Date.now();
    const name = args.name.trim();
    if (!name) {
      throw new Error("Property name is required.");
    }

    return await ctx.db.insert("properties", {
      ownerUserId: userId,
      name,
      address: normalizeOptionalText(args.address),
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    propertyId: v.id("properties"),
    name: v.string(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ensureUserIdFromIdentity(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property || property.ownerUserId !== userId) {
      throw new Error("Property not found.");
    }

    const name = args.name.trim();
    if (!name) {
      throw new Error("Property name is required.");
    }

    await ctx.db.patch(args.propertyId, {
      name,
      address: normalizeOptionalText(args.address),
      updatedAt: Date.now(),
    });
  },
});

export const setArchived = mutation({
  args: {
    propertyId: v.id("properties"),
    isArchived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await ensureUserIdFromIdentity(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property || property.ownerUserId !== userId) {
      throw new Error("Property not found.");
    }

    await ctx.db.patch(args.propertyId, {
      isArchived: args.isArchived,
      updatedAt: Date.now(),
    });
  },
});
