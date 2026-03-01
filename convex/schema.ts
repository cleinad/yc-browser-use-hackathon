import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    subject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_subject", ["subject"]),

  properties: defineTable({
    ownerUserId: v.id("users"),
    name: v.string(),
    address: v.optional(v.string()),
    isArchived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_createdAt", ["ownerUserId", "createdAt"])
    .index("by_owner_archived_createdAt", ["ownerUserId", "isArchived", "createdAt"]),

  quoteRequests: defineTable({
    userId: v.id("users"),
    propertyId: v.optional(v.id("properties")),
    inputText: v.string(),
    location: v.optional(v.string()),
    deadlineIso: v.optional(v.string()),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("succeeded"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  })
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_user_property_createdAt", ["userId", "propertyId", "createdAt"])
    .index("by_status_createdAt", ["status", "createdAt"]),

  quoteEvents: defineTable({
    requestId: v.id("quoteRequests"),
    seq: v.number(),
    eventType: v.string(),
    message: v.optional(v.string()),
    retailer: v.optional(v.string()),
    attempt: v.optional(v.number()),
    ts: v.number(),
  }).index("by_request_seq", ["requestId", "seq"]),

  retailerRuns: defineTable({
    requestId: v.id("quoteRequests"),
    retailer: v.string(),
    success: v.boolean(),
    durationSeconds: v.optional(v.number()),
    finalResult: v.optional(v.string()),
    errors: v.array(v.string()),
    metadata: v.optional(v.any()),
    updatedAt: v.number(),
  }).index("by_request_retailer", ["requestId", "retailer"]),

  planOptions: defineTable({
    requestId: v.id("quoteRequests"),
    rank: v.number(),
    total: v.number(),
    shipping: v.optional(v.number()),
    latestDeliveryIso: v.optional(v.string()),
    feasible: v.boolean(),
    summary: v.string(),
    lineItems: v.array(v.any()),
  }).index("by_request_rank", ["requestId", "rank"]),
});
