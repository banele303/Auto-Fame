import { mutation } from "./_generated/server";

export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    // Purge any legacy demo repairs that were previously seeded
    const existingRepairs = await ctx.db.query("carRepairs").collect();
    let purgedRepairs = 0;
    for (const r of existingRepairs) {
      if (r.repairNumber === "WO-2026-001" || r.repairNumber === "WO-2026-002") {
        await ctx.db.delete(r._id);
        purgedRepairs++;
      }
    }

    // Purge any legacy demo CRM events that were previously seeded
    const existingEvents = await ctx.db.query("crmEvents").collect();
    let purgedEvents = 0;
    for (const ev of existingEvents) {
      if (ev.customerName === "Thabo Mokoena" || ev.customerName === "Dr. Anelisa Sithole") {
        await ctx.db.delete(ev._id);
        purgedEvents++;
      }
    }

    return { status: "demo_purged", purgedRepairs, purgedEvents };
  },
});
