import { mutation } from "./_generated/server";

export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRepairs = await ctx.db.query("carRepairs").collect();
    if (existingRepairs.length > 0) {
      return { status: "already_seeded", count: existingRepairs.length };
    }

    const now = new Date().toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const estimatedTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const estimatedNextWeek = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    // Workshop repairs for real dealership context
    await ctx.db.insert("carRepairs", {
      carId: 5, // BMW X2
      repairNumber: "WO-2026-001",
      workshopName: "BMW Approved Panel & Mechanical Sandton",
      status: "IN_PROGRESS",
      issueDescription: "Scheduled 100k major service inspection, front brake pad replacement and multi-point roadworthy certification.",
      costEstimated: 8500,
      dateSent: threeDaysAgo,
      estimatedCompletionDate: estimatedTomorrow,
      notes: "Parts arrived from BMW Midrand. Roadworthy certificate booking confirmed.",
      technicianContact: "+27 11 883 4900 (Sipho Dlamini)",
      createdAt: threeDaysAgo,
      updatedAt: now,
    });

    await ctx.db.insert("carRepairs", {
      carId: 4, // Toyota Hilux or other vehicle
      repairNumber: "WO-2026-002",
      workshopName: "Bosch Car Service Johannesburg Central",
      status: "AWAITING_PARTS",
      issueDescription: "Air conditioning compressor clutch rebuild and rear wheel alignment.",
      costEstimated: 4200,
      dateSent: oneWeekAgo,
      estimatedCompletionDate: estimatedNextWeek,
      notes: "OEM Denso condenser ordered. Expected delivery Thursday.",
      technicianContact: "+27 11 334 2200 (Mark Van Der Merwe)",
      createdAt: oneWeekAgo,
      updatedAt: now,
    });

    // Initial CRM Activity Events
    await ctx.db.insert("crmEvents", {
      eventType: "WHATSAPP_SENT",
      recipient: "+27 83 492 1109",
      customerName: "Thabo Mokoena",
      summary: "Vehicle finance pre-approval link dispatched for 2018 BMW X2 sDrive20i via Whapi.cloud gateway.",
      status: "SUCCESS",
      createdAt: threeDaysAgo,
    });

    await ctx.db.insert("crmEvents", {
      eventType: "FINANCE_SUBMITTED",
      recipient: "WesBank Auto South Africa",
      customerName: "Dr. Anelisa Sithole",
      summary: "Completed financing pre-qualification package sent to WesBank & Standard Bank Auto.",
      status: "SUCCESS",
      createdAt: oneWeekAgo,
    });

    return { status: "seeded_successfully", repairs: 2, crmEvents: 2 };
  },
});
