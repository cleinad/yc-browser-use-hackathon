import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  houses: defineTable({
    name: v.string(),
    address: v.string(),
  }),
});
