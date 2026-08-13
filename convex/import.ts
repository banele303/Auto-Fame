import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const bulkInsert = mutation({
  args: {
    table: v.string(),
    documents: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    console.log(`Bulk inserting ${args.documents.length} rows into ${args.table}`);
    
    // Clear existing data in this table to prevent duplicates during sync
    const existing = await ctx.db.query(args.table as any).collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }

    for (const doc of args.documents) {
      await ctx.db.insert(args.table as any, doc);
    }

    return { success: true, count: args.documents.length };
  },
});
