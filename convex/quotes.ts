import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity;
}

async function ensureUserIdFromIdentity(ctx: MutationCtx) {
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

async function getUserIdFromIdentity(ctx: QueryCtx) {
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

function parseStatusPayload(payload: string) {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    if (typeof parsed.event_type !== "string") {
      return null;
    }
    return {
      event_type: parsed.event_type,
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : null,
      message: typeof parsed.message === "string" ? parsed.message : null,
      job_id: typeof parsed.job_id === "string" ? parsed.job_id : null,
      job_label: typeof parsed.job_label === "string" ? parsed.job_label : null,
      attempt: typeof parsed.attempt === "number" ? parsed.attempt : null,
    };
  } catch {
    return null;
  }
}

type TimelineStatus = NonNullable<ReturnType<typeof parseStatusPayload>>;

export const create = mutation({
  args: {
    inputText: v.string(),
    location: v.optional(v.string()),
    deadlineIso: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ensureUserIdFromIdentity(ctx);
    const now = Date.now();

    const requestId = await ctx.db.insert("quoteRequests", {
      userId,
      inputText: args.inputText,
      location: args.location,
      deadlineIso: args.deadlineIso,
      status: "queued",
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.quotes.processRequest, {
      requestId,
    });

    return requestId;
  },
});

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromIdentity(ctx);
    if (!userId) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);

    return await ctx.db
      .query("quoteRequests")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const listMineWithEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromIdentity(ctx);
    if (!userId) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const requests = await ctx.db
      .query("quoteRequests")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    const timeline = await Promise.all(
      requests.map(async (request) => {
        const rawEvents = await ctx.db
          .query("quoteEvents")
          .withIndex("by_request_seq", (q) => q.eq("requestId", request._id))
          .order("asc")
          .collect();

        let result: unknown | null = null;
        const events: Array<
          | { kind: "log"; text: string; ts: number }
          | { kind: "status"; status: TimelineStatus; ts: number }
        > = [];

        for (const event of rawEvents) {
          if (event.eventType === "log") {
            events.push({
              kind: "log",
              text: event.message ?? "",
              ts: event.ts,
            });
            continue;
          }

          if (event.eventType === "status") {
            if (!event.message) {
              continue;
            }

            const status = parseStatusPayload(event.message);
            if (!status) {
              continue;
            }

            events.push({
              kind: "status",
              status,
              ts: event.ts,
            });
            continue;
          }

          if (event.eventType === "result" && event.message) {
            try {
              result = JSON.parse(event.message) as unknown;
            } catch {
              result = null;
            }
            continue;
          }

          if (event.eventType === "error") {
            events.push({
              kind: "log",
              text: event.message ?? "Unknown error",
              ts: event.ts,
            });
          }
        }

        return {
          id: request._id,
          inputText: request.inputText,
          status: request.status,
          error: request.error ?? null,
          createdAt: request.createdAt,
          startedAt: request.startedAt ?? null,
          finishedAt: request.finishedAt ?? null,
          events,
          result,
        };
      }),
    );

    return timeline.reverse();
  },
});

export const getRequestForProcessing = internalQuery({
  args: { requestId: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return null;
    }

    if (request.status === "succeeded") {
      return null;
    }

    return {
      id: request._id,
      inputText: request.inputText,
    };
  },
});

export const markRunning = internalMutation({
  args: { requestId: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return;
    }

    if (request.status === "succeeded" || request.status === "failed") {
      return;
    }

    await ctx.db.patch(args.requestId, {
      status: "running",
      startedAt: request.startedAt ?? Date.now(),
      error: undefined,
    });
  },
});

export const appendEvent = internalMutation({
  args: {
    requestId: v.id("quoteRequests"),
    eventType: v.string(),
    message: v.optional(v.string()),
    retailer: v.optional(v.string()),
    attempt: v.optional(v.number()),
    ts: v.number(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return;
    }

    const latest = await ctx.db
      .query("quoteEvents")
      .withIndex("by_request_seq", (q) => q.eq("requestId", args.requestId))
      .order("desc")
      .take(1);

    const nextSeq = (latest[0]?.seq ?? 0) + 1;

    await ctx.db.insert("quoteEvents", {
      requestId: args.requestId,
      seq: nextSeq,
      eventType: args.eventType,
      message: args.message,
      retailer: args.retailer,
      attempt: args.attempt,
      ts: args.ts,
    });
  },
});

export const markSucceeded = internalMutation({
  args: { requestId: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return;
    }

    await ctx.db.patch(args.requestId, {
      status: "succeeded",
      finishedAt: Date.now(),
      error: undefined,
    });
  },
});

export const markFailed = internalMutation({
  args: {
    requestId: v.id("quoteRequests"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      return;
    }

    await ctx.db.patch(args.requestId, {
      status: "failed",
      finishedAt: Date.now(),
      error: args.error,
    });
  },
});

type SseEvent = {
  event: string;
  data: string;
};

function parseSseBlock(rawBlock: string): SseEvent | null {
  const lines = rawBlock.replace(/\r/g, "").split("\n");

  let event = "message";
  const data: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? "" : line.slice(separator + 1);

    if (value.startsWith(" ")) {
      value = value.slice(1);
    }

    if (field === "event") {
      event = value;
      continue;
    }

    if (field === "data") {
      data.push(value);
    }
  }

  if (data.length === 0) {
    return null;
  }

  return { event, data: data.join("\n") };
}

async function* readSseEvents(stream: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const splitAt = buffer.indexOf("\n\n");
      if (splitAt === -1) {
        break;
      }

      const rawBlock = buffer.slice(0, splitAt);
      buffer = buffer.slice(splitAt + 2);

      const parsed = parseSseBlock(rawBlock);
      if (parsed) {
        yield parsed;
      }
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const parsed = parseSseBlock(buffer);
    if (parsed) {
      yield parsed;
    }
  }
}

async function shortResponseText(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return "";
  }
}

export const processRequest = internalAction({
  args: { requestId: v.id("quoteRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.runQuery(internal.quotes.getRequestForProcessing, {
      requestId: args.requestId,
    });

    if (!request) {
      return;
    }

    let finalized = false;

    const fail = async (message: string) => {
      if (finalized) {
        return;
      }
      finalized = true;

      await ctx.runMutation(internal.quotes.appendEvent, {
        requestId: args.requestId,
        eventType: "error",
        message,
        ts: Date.now(),
      });

      await ctx.runMutation(internal.quotes.markFailed, {
        requestId: args.requestId,
        error: message,
      });
    };

    await ctx.runMutation(internal.quotes.markRunning, {
      requestId: args.requestId,
    });

    const baseUrl = process.env.BU_AGENT_BASE_URL;
    if (!baseUrl) {
      await fail(
        "BU_AGENT_BASE_URL is not set in Convex env. Set it with `npx convex env set BU_AGENT_BASE_URL <url>`.",
      );
      return;
    }
    let upstreamRequestId: string | null = null;

    try {
      const createResponse = await fetch(`${baseUrl}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: request.inputText }),
      });

      if (!createResponse.ok) {
        const body = await shortResponseText(createResponse);
        await fail(
          `bu-agent /quote failed (${createResponse.status}): ${body || "no response body"}`,
        );
        return;
      }

      const payload = (await createResponse.json()) as { request_id?: unknown };
      if (typeof payload.request_id !== "string" || !payload.request_id) {
        await fail("bu-agent /quote did not return request_id.");
        return;
      }

      upstreamRequestId = payload.request_id;

      const eventsResponse = await fetch(
        `${baseUrl}/quote/${encodeURIComponent(upstreamRequestId)}/events`,
      );

      if (!eventsResponse.ok || !eventsResponse.body) {
        const body = await shortResponseText(eventsResponse);
        await fail(
          `bu-agent event stream failed (${eventsResponse.status}): ${body || "no response body"}`,
        );
        return;
      }

      for await (const event of readSseEvents(eventsResponse.body)) {
        if (event.event === "log") {
          await ctx.runMutation(internal.quotes.appendEvent, {
            requestId: args.requestId,
            eventType: "log",
            message: event.data,
            ts: Date.now(),
          });
          continue;
        }

        if (event.event === "status") {
          const status = parseStatusPayload(event.data);

          await ctx.runMutation(internal.quotes.appendEvent, {
            requestId: args.requestId,
            eventType: "status",
            message: event.data,
            retailer: status?.job_label ?? undefined,
            attempt: status?.attempt ?? undefined,
            ts: Date.now(),
          });
          continue;
        }

        if (event.event === "result") {
          let normalizedResult = event.data;

          try {
            normalizedResult = JSON.stringify(JSON.parse(event.data));
          } catch {
            await fail("bu-agent returned invalid result JSON.");
            return;
          }

          await ctx.runMutation(internal.quotes.appendEvent, {
            requestId: args.requestId,
            eventType: "result",
            message: normalizedResult,
            ts: Date.now(),
          });

          finalized = true;
          await ctx.runMutation(internal.quotes.markSucceeded, {
            requestId: args.requestId,
          });
          return;
        }

        if (event.event === "error") {
          await fail(event.data || "bu-agent reported an error event.");
          return;
        }
      }

      await fail("bu-agent stream ended before a result was emitted.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      const location = upstreamRequestId
        ? `while processing upstream request ${upstreamRequestId}`
        : "before upstream request creation";

      await fail(`Failed to bridge quote request to bu-agent ${location}: ${detail}`);
    }
  },
});
