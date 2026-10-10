import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("gallery").collect();
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  },
});

export const create = mutation({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lastItem = await ctx.db.query("gallery").order("desc").first();
    const nextId = lastItem ? lastItem.id + 1 : 1;

    const id = await ctx.db.insert("gallery", {
      id: nextId,
      url: args.url,
      title: args.title || null,
      category: args.category || "showroom",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(id);
  },
});

export const remove = mutation({
  args: {
    id: v.union(v.number(), v.string()),
  },
  handler: async (ctx, args) => {
    if (typeof args.id === "number") {
      const item = await ctx.db
        .query("gallery")
        .withIndex("by_numeric_id", (q) => q.eq("id", args.id as number))
        .first();
      if (item) {
        await ctx.db.delete(item._id);
        return true;
      }
    } else {
      // Try by convex document ID
      try {
        const item = await ctx.db.get(args.id as any);
        if (item) {
          await ctx.db.delete(item._id);
          return true;
        }
      } catch {}

      // Try by parsed numeric id
      const parsedNum = parseInt(args.id, 10);
      if (!isNaN(parsedNum)) {
        const item = await ctx.db
          .query("gallery")
          .withIndex("by_numeric_id", (q) => q.eq("id", parsedNum))
          .first();
        if (item) {
          await ctx.db.delete(item._id);
          return true;
        }
      }

      // Try by exact url match
      const itemByUrl = await ctx.db
        .query("gallery")
        .withIndex("by_url", (q) => q.eq("url", String(args.id)))
        .first();
      if (itemByUrl) {
        await ctx.db.delete(itemByUrl._id);
        return true;
      }
    }
    return false;
  },
});
