import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ──────────────────────────────────────────────
// Chat Sessions Management (CRUD)
// ──────────────────────────────────────────────

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_lastMessageAt")
      .order("desc")
      .collect();
    return sessions;
  },
});

export const getSession = query({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_sessionId_createdAt", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
    return {
      session,
      messages,
    };
  },
});

export const createSession = mutation({
  args: {
    title: v.optional(v.string()),
    model: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const sessionId = await ctx.db.insert("chatSessions", {
      title: args.title || "New Dealership Session",
      model: args.model || "claude-3-5-sonnet",
      category: args.category || "general",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Seed default welcome message from AI Agent
    await ctx.db.insert("chatMessages", {
      sessionId,
      role: "assistant",
      content: `Hello! I am your AutoFame AI Copilot, fully synced with your South Africa dealership inventory, active vehicle financing, workshop repairs, and CRM WhatsApp engine. 

How can I assist you right now? You can ask me to:
• **"Send a vehicle finance application link to a client via WhatsApp"**
• **"Check which cars are currently at the workshop for repairs"**
• **"Auto-generate high-converting sales & social media descriptions for our 2018 BMW X2 or 2024 Toyota Hilux"**
• **"Review customer inquiries, test drive bookings, or finance statuses"**`,
      createdAt: now,
    });

    return sessionId;
  },
});

export const updateSessionTitle = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      title: args.title.trim(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    // Delete all messages belonging to this session
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    await ctx.db.delete(args.sessionId);
    return true;
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    role: v.string(),
    content: v.string(),
    actionType: v.optional(v.string()),
    actionPayload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const messageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      actionType: args.actionType,
      actionPayload: args.actionPayload,
      createdAt: now,
    });

    // Update session timestamp & auto-title if first user message
    const session = await ctx.db.get(args.sessionId);
    if (session) {
      const updates: any = {
        lastMessageAt: now,
        updatedAt: now,
      };

      if (args.role === "user" && (session.title === "New Dealership Session" || session.title.startsWith("New "))) {
        const cleanTitle = args.content.slice(0, 42).replace(/\n/g, " ").trim();
        updates.title = cleanTitle ? cleanTitle + (args.content.length > 42 ? "..." : "") : session.title;
      }

      await ctx.db.patch(args.sessionId, updates);
    }

    return messageId;
  },
});

// ──────────────────────────────────────────────
// Centralized Dealership Context Provider
// Returns real live inventory, financing, repairs & inquiries
// ──────────────────────────────────────────────

export const getDealershipContext = query({
  args: {},
  handler: async (ctx) => {
    // 1. Live Cars Inventory
    const cars = await ctx.db.query("cars").collect();
    // 2. Active Repairs
    const repairs = await ctx.db.query("carRepairs").collect();
    // 3. Financing Applications
    const financings = await ctx.db.query("financingApplications").order("desc").take(15);
    // 4. Inquiries
    const inquiries = await ctx.db.query("inquiries").order("desc").take(15);
    // 5. CRM Events (WhatsApp, Leads)
    const crmEvents = await ctx.db.query("crmEvents").order("desc").take(20);

    const availableCars = cars.filter((c) => c.status === "AVAILABLE");
    const soldCars = cars.filter((c) => c.status === "SOLD");
    const maintenanceCars = cars.filter((c) => c.status === "MAINTENANCE");

    return {
      dealership: {
        name: "AutoFame Pre-Owned & Luxury",
        country: "South Africa (ZAR)",
        whatsappProvider: "Whapi.Cloud (https://panel.whapi.cloud)",
        dealershipPhone: "+27 82 000 0000",
        address: "Sandton, Johannesburg, Gauteng, South Africa",
      },
      stats: {
        totalInventory: cars.length,
        availableCount: availableCars.length,
        soldCount: soldCars.length,
        inRepairCount: repairs.filter((r) => r.status !== "COMPLETED" && r.status !== "COLLECTED").length,
        pendingFinancingCount: financings.filter((f) => f.status === "PENDING").length,
      },
      inventorySample: cars.slice(0, 15).map((c) => ({
        id: c.id,
        make: c.make,
        model: c.model,
        year: c.year,
        price: c.price,
        mileage: c.mileage,
        status: c.status,
        vin: c.vin,
        transmission: c.transmission,
        fuelType: c.fuelType,
      })),
      activeRepairs: repairs.map((r) => {
        const car = cars.find((c) => c.id === r.carId);
        return {
          repairNumber: r.repairNumber,
          carName: car ? `${car.year} ${car.make} ${car.model}` : `Car #${r.carId}`,
          carId: r.carId,
          workshopName: r.workshopName,
          status: r.status,
          issueDescription: r.issueDescription,
          costEstimated: r.costEstimated,
          dateSent: r.dateSent,
          estimatedCompletionDate: r.estimatedCompletionDate,
        };
      }),
      recentFinancing: financings.map((f) => ({
        id: f.id,
        loanAmount: f.loanAmount,
        status: f.status,
        applicationDate: f.applicationDate,
        customerId: f.customerId,
      })),
      recentInquiries: inquiries.slice(0, 8),
      recentCrmEvents: crmEvents.slice(0, 8),
    };
  },
});

// ──────────────────────────────────────────────
// Workshop & Car Repairs Management (CRUD)
// ──────────────────────────────────────────────

export const listCarRepairs = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let repairs = await ctx.db.query("carRepairs").collect();
    if (args.status) {
      repairs = repairs.filter((r) => r.status === args.status);
    }
    const cars = await ctx.db.query("cars").collect();

    return repairs.map((r) => {
      const car = cars.find((c) => c.id === r.carId);
      return {
        ...r,
        car,
      };
    });
  },
});

export const createCarRepair = mutation({
  args: {
    carId: v.number(),
    workshopName: v.string(),
    issueDescription: v.string(),
    costEstimated: v.number(),
    status: v.optional(v.string()),
    estimatedCompletionDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    technicianContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const repairCount = (await ctx.db.query("carRepairs").collect()).length;
    const repairNumber = `WO-${new Date().getFullYear()}-${String(repairCount + 1).padStart(3, "0")}`;

    const repairId = await ctx.db.insert("carRepairs", {
      carId: args.carId,
      repairNumber,
      workshopName: args.workshopName,
      status: args.status || "SENT_FOR_REPAIR",
      issueDescription: args.issueDescription,
      costEstimated: args.costEstimated,
      dateSent: now,
      estimatedCompletionDate: args.estimatedCompletionDate,
      notes: args.notes,
      technicianContact: args.technicianContact,
      createdAt: now,
      updatedAt: now,
    });

    // Update car status to MAINTENANCE if applicable
    const car = await ctx.db
      .query("cars")
      .withIndex("by_numeric_id", (q) => q.eq("id", args.carId))
      .first();

    if (car) {
      await ctx.db.patch(car._id, {
        status: "MAINTENANCE",
        updatedAt: now,
      });
    }

    // Record CRM Event
    await ctx.db.insert("crmEvents", {
      eventType: "REPAIR_UPDATE",
      recipient: args.workshopName,
      summary: `Car #${args.carId} sent to ${args.workshopName} (${repairNumber}) for: ${args.issueDescription}`,
      status: "SUCCESS",
      createdAt: now,
    });

    return { repairId, repairNumber };
  },
});

export const updateCarRepairStatus = mutation({
  args: {
    id: v.id("carRepairs"),
    status: v.string(),
    costActual: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const repair = await ctx.db.get(args.id);
    if (!repair) throw new Error("Repair record not found");

    const patch: any = {
      status: args.status,
      updatedAt: now,
    };
    if (args.costActual !== undefined) patch.costActual = args.costActual;
    if (args.notes !== undefined) patch.notes = args.notes;
    if (args.status === "COMPLETED" || args.status === "COLLECTED") {
      patch.dateCompleted = now;

      // Restore car status to AVAILABLE if was MAINTENANCE
      const car = await ctx.db
        .query("cars")
        .withIndex("by_numeric_id", (q) => q.eq("id", repair.carId))
        .first();
      if (car && car.status === "MAINTENANCE") {
        await ctx.db.patch(car._id, {
          status: "AVAILABLE",
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.id, patch);

    // Record CRM Event
    await ctx.db.insert("crmEvents", {
      eventType: "REPAIR_UPDATE",
      recipient: repair.workshopName,
      summary: `Repair ${repair.repairNumber} status updated to ${args.status}`,
      status: "SUCCESS",
      createdAt: now,
    });

    return true;
  },
});

// ──────────────────────────────────────────────
// Record CRM Events (WhatsApp Dispatches & Leads)
// ──────────────────────────────────────────────

export const recordCrmEvent = mutation({
  args: {
    eventType: v.string(),
    recipient: v.string(),
    customerName: v.optional(v.string()),
    summary: v.string(),
    payload: v.optional(v.any()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("crmEvents", {
      ...args,
      createdAt: now,
    });
  },
});

export const listCrmEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crmEvents")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit || 30);
  },
});
