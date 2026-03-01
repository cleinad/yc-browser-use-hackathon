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

function getRollingWeekStart(now: number): number {
  return now - 7 * 24 * 60 * 60 * 1000;
}

type ParsedResultMetrics = {
  bestTotal: number;
  baselineTotal: number;
  lineItemCount: number;
  retailerCount: number;
};

function parseResultMetrics(payload: string | undefined): ParsedResultMetrics | null {
  if (!payload) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const options = (parsed as { options?: unknown }).options;
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }

  const numericTotals: number[] = [];
  let bestOptionLineItemCount = 0;
  let bestOptionTotal = Number.POSITIVE_INFINITY;
  const retailers = new Set<string>();

  for (const option of options) {
    if (!option || typeof option !== "object") {
      continue;
    }

    const estimatedTotal = (option as { estimated_total?: unknown }).estimated_total;
    const totalNumber =
      typeof estimatedTotal === "number" && Number.isFinite(estimatedTotal)
        ? estimatedTotal
        : null;
    if (totalNumber !== null) {
      numericTotals.push(totalNumber);
    }

    const lineItems = (option as { line_items?: unknown }).line_items;
    const safeLineItems = Array.isArray(lineItems) ? lineItems : [];

    for (const item of safeLineItems) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const retailer = (item as { retailer?: unknown }).retailer;
      if (typeof retailer === "string" && retailer.trim()) {
        retailers.add(retailer.trim().toLowerCase());
      }
    }

    if (totalNumber !== null && totalNumber < bestOptionTotal) {
      bestOptionTotal = totalNumber;
      bestOptionLineItemCount = safeLineItems.length;
    }
  }

  if (numericTotals.length === 0) {
    return null;
  }

  numericTotals.sort((a, b) => a - b);
  const bestTotal = numericTotals[0];
  const baselineTotal = numericTotals[1] ?? bestTotal;
  const retailerCount = Math.max(retailers.size, 1);

  return {
    bestTotal,
    baselineTotal,
    lineItemCount: bestOptionLineItemCount,
    retailerCount,
  };
}

function estimateManualMinutes(lineItemCount: number, retailerCount: number): number {
  return 8 + lineItemCount * 3 + retailerCount * 2;
}

function estimateAutomatedMinutes(startedAt: number | undefined, finishedAt: number | undefined): number {
  if (typeof startedAt === "number" && typeof finishedAt === "number" && finishedAt >= startedAt) {
    return Math.max(1, (finishedAt - startedAt) / 60000) + 2;
  }
  // Fallback: 4 minutes system/runtime + 2 minutes operator review.
  return 6;
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

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserIdFromIdentity(ctx);
    if (!userId) {
      return {
        generatedAt: Date.now(),
        periodStart: getRollingWeekStart(Date.now()),
        properties: [],
        recentActivity: [],
        metrics: {
          totalProperties: 0,
          activeProperties: 0,
          archivedProperties: 0,
          totalRequests: 0,
          openRequests: 0,
          weeklyRequests: 0,
          weeklyPotentialSavings: 0,
          weeklyEstimatedTimeSavedMinutes: 0,
          weeklyEvaluatedRequests: 0,
        },
      };
    }

    const now = Date.now();
    const periodStart = getRollingWeekStart(now);

    const properties = await ctx.db
      .query("properties")
      .withIndex("by_owner_createdAt", (q) => q.eq("ownerUserId", userId))
      .order("desc")
      .collect();

    const propertyStats = new Map(
      properties.map((property) => [
        property._id,
        {
          ...property,
          totalRequestCount: 0,
          openRequestCount: 0,
          weeklyRequestCount: 0,
          lastRequestAt: null as number | null,
        },
      ]),
    );

    const quoteRequests = await ctx.db
      .query("quoteRequests")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const recentActivity: Array<{
      requestId: Id<"quoteRequests">;
      propertyId: Id<"properties">;
      propertyName: string;
      status: "queued" | "running" | "succeeded" | "failed";
      inputText: string;
      createdAt: number;
      decision: "pending" | "accepted" | "rejected";
      acceptedOptionRank: number | null;
    }> = [];

    let totalRequests = 0;
    let openRequests = 0;
    let weeklyRequests = 0;

    for (const request of quoteRequests) {
      if (!request.propertyId) {
        continue;
      }

      const property = propertyStats.get(request.propertyId);
      if (!property) {
        continue;
      }

      totalRequests += 1;
      property.totalRequestCount += 1;

      const isOpen = request.status === "queued" || request.status === "running";
      if (isOpen) {
        openRequests += 1;
        property.openRequestCount += 1;
      }

      if (!property.lastRequestAt || request.createdAt > property.lastRequestAt) {
        property.lastRequestAt = request.createdAt;
      }

      if (request.createdAt >= periodStart) {
        weeklyRequests += 1;
        property.weeklyRequestCount += 1;
      }

      if (recentActivity.length < 8) {
        recentActivity.push({
          requestId: request._id,
          propertyId: property._id,
          propertyName: property.name,
          status: request.status,
          inputText: request.inputText,
          createdAt: request.createdAt,
          decision: request.decision ?? "pending",
          acceptedOptionRank: request.acceptedOptionRank ?? null,
        });
      }
    }

    const succeededThisWeek = quoteRequests.filter(
      (request) =>
        request.propertyId &&
        request.createdAt >= periodStart &&
        request.status === "succeeded",
    );

    const weeklyRows = await Promise.all(
      succeededThisWeek.map(async (request) => {
        const latest = await ctx.db
          .query("quoteEvents")
          .withIndex("by_request_seq", (q) => q.eq("requestId", request._id))
          .order("desc")
          .take(1);

        const resultEvent = latest[0];
        if (!resultEvent || resultEvent.eventType !== "result") {
          return null;
        }

        const resultMetrics = parseResultMetrics(resultEvent.message);
        if (!resultMetrics) {
          return null;
        }

        const potentialSavings = Math.max(
          0,
          resultMetrics.baselineTotal - resultMetrics.bestTotal,
        );
        const manualMinutes = estimateManualMinutes(
          resultMetrics.lineItemCount,
          resultMetrics.retailerCount,
        );
        const automatedMinutes = estimateAutomatedMinutes(
          request.startedAt,
          request.finishedAt,
        );
        const timeSavedMinutes = Math.max(0, manualMinutes - automatedMinutes);

        return {
          potentialSavings,
          timeSavedMinutes,
        };
      }),
    );

    let weeklyPotentialSavings = 0;
    let weeklyEstimatedTimeSavedMinutes = 0;
    let weeklyEvaluatedRequests = 0;

    for (const row of weeklyRows) {
      if (!row) {
        continue;
      }
      weeklyEvaluatedRequests += 1;
      weeklyPotentialSavings += row.potentialSavings;
      weeklyEstimatedTimeSavedMinutes += row.timeSavedMinutes;
    }

    const propertyList = Array.from(propertyStats.values());
    const activeProperties = propertyList.filter((property) => !property.isArchived).length;
    const archivedProperties = propertyList.length - activeProperties;

    return {
      generatedAt: now,
      periodStart,
      properties: propertyList,
      recentActivity,
      metrics: {
        totalProperties: propertyList.length,
        activeProperties,
        archivedProperties,
        totalRequests,
        openRequests,
        weeklyRequests,
        weeklyPotentialSavings,
        weeklyEstimatedTimeSavedMinutes,
        weeklyEvaluatedRequests,
      },
    };
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
