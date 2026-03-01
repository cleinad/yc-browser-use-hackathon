import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function requireUserIdFromIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user) {
    throw new Error("User profile not found. Call upsertCurrentUser first.");
  }
  return user._id;
}

export const create = mutation({
  args: {
    inputText: v.string(),
    location: v.optional(v.string()),
    deadlineIso: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserIdFromIdentity(ctx);
    const now = Date.now();
    return await ctx.db.insert("quoteRequests", {
      userId,
      inputText: args.inputText,
      location: args.location,
      deadlineIso: args.deadlineIso,
      status: "queued",
      createdAt: now,
    });
  },
});

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserIdFromIdentity(ctx);
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);

    return await ctx.db
      .query("quoteRequests")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});
