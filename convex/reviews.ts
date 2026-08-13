import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper to recalculate rating stats for a car
async function recalculateCarRating(ctx: any, carId: number) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_carId", (q: any) => q.eq("carId", carId))
    .collect();

  const count = reviews.length;
  const avg = count > 0 
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / count
    : 0;

  const car = await ctx.db
    .query("cars")
    .withIndex("by_numeric_id", (q: any) => q.eq("id", carId))
    .first();

  if (car) {
    await ctx.db.patch(car._id, {
      averageRating: Math.round(avg * 10) / 10,
      numberOfReviews: count,
    });
  }
}

export const getReviews = query({
  args: {
    carId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let reviews = await ctx.db.query("reviews").collect();
    if (args.carId !== undefined) {
      reviews = reviews.filter(r => r.carId === args.carId);
    }
    
    // Resolve customer details
    const resolved = [];
    for (const r of reviews) {
      const customer = await ctx.db
        .query("customers")
        .withIndex("by_cognitoId", q => q.eq("cognitoId", r.customerId))
        .first();
      resolved.push({
        ...r,
        customer,
      });
    }
    return resolved;
  },
});

export const getReview = query({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
  },
});

export const createReview = mutation({
  args: {
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
    carId: v.number(),
    customerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if customer already reviewed this car
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_carId_customerId", q => q.eq("carId", args.carId).eq("customerId", args.customerId))
      .first();
    if (existing) {
      throw new Error("You have already reviewed this car.");
    }

    const lastReview = await ctx.db.query("reviews").order("desc").first();
    const nextId = lastReview ? lastReview.id + 1 : 1;

    const reviewId = await ctx.db.insert("reviews", {
      id: nextId,
      rating: args.rating,
      title: args.title,
      comment: args.comment,
      reviewDate: new Date().toISOString(),
      carId: args.carId,
      customerId: args.customerId,
    });

    // Recalculate car stats
    await recalculateCarRating(ctx, args.carId);

    return await ctx.db.get(reviewId);
  },
});

export const updateReview = mutation({
  args: {
    id: v.number(),
    rating: v.optional(v.number()),
    title: v.optional(v.string()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
    if (!review) throw new Error("Review not found");

    const patch: any = {};
    if (args.rating !== undefined) patch.rating = args.rating;
    if (args.title !== undefined) patch.title = args.title;
    if (args.comment !== undefined) patch.comment = args.comment;

    await ctx.db.patch(review._id, patch);

    if (args.rating !== undefined) {
      await recalculateCarRating(ctx, review.carId);
    }

    return await ctx.db.get(review._id);
  },
});

export const deleteReview = mutation({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("reviews")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
    if (!review) throw new Error("Review not found");

    await ctx.db.delete(review._id);
    await recalculateCarRating(ctx, review.carId);

    return { success: true };
  },
});
