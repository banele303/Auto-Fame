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
      category: args.category || "2025",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(id);
  },
});
