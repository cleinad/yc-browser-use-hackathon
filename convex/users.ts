import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export const upsertCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
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
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
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

    if (!user) {
      return null;
    }

    return {
      id: user._id,
      subject: user.subject,
      email: user.email ?? null,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

export const requireAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return {
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject,
    };
  },
});
