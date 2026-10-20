import { mutation } from "./_generated/server";

export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRepairs = await ctx.db.query("carRepairs").collect();
    let purgedRepairs = 0;
    for (const r of existingRepairs) {
      if (r.repairNumber === "WO-2026-001" || r.repairNumber === "WO-2026-002") {
        await ctx.db.delete(r._id);
        purgedRepairs++;
      }
    }

    const existingEvents = await ctx.db.query("crmEvents").collect();
    let purgedEvents = 0;
    for (const ev of existingEvents) {
      if (ev.customerName === "Thabo Mokoena" || ev.customerName === "Dr. Anelisa Sithole") {
        await ctx.db.delete(ev._id);
        purgedEvents++;
      }
    }

    const existingMessages = await ctx.db.query("agentMessages").collect();
    let purgedMessages = 0;
    for (const m of existingMessages) {
      if (
        m.content?.includes("Gmail Channel (") ||
        m.content?.includes("elexsouthflow@gmail.com") ||
        m.content?.includes("Review the fields below and click Send with Gmail") ||
        m.content?.includes("autofame.dealers@gmail.com") ||
        m.content?.includes("• **Google**")
      ) {
        await ctx.db.delete(m._id);
        purgedMessages++;
      }
    }

    return { status: "demo_purged", purgedRepairs, purgedEvents, purgedMessages };
  },
});
