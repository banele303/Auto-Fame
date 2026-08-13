import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dealerships").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    postalCode: v.string(),
    phoneNumber: v.string(),
    email: v.string(),
    website: v.optional(v.union(v.string(), v.null())),
    latitude: v.optional(v.union(v.number(), v.null())),
    longitude: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const last = await ctx.db.query("dealerships").order("desc").first();
    const nextId = last ? last.id + 1 : 1;
    const now = new Date().toISOString();
    const id = await ctx.db.insert("dealerships", {
      id: nextId,
      name: args.name,
      address: args.address,
      city: args.city,
      state: args.state,
      country: args.country,
      postalCode: args.postalCode,
      phoneNumber: args.phoneNumber,
      email: args.email,
      website: args.website || null,
      createdAt: now,
      updatedAt: now,
      latitude: args.latitude || null,
      longitude: args.longitude || null,
    });
    return await ctx.db.get(id);
  },
});

export const get = query({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dealerships")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
  },
});
