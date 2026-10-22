import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCrmWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const [
      crmContacts,
      cars,
      financings,
      financingDetails,
      financingDocs,
      inquiries,
      testDrives,
      sales,
      crmEvents,
    ] = await Promise.all([
      ctx.db.query("crmContacts").collect(),
      ctx.db.query("cars").collect(),
      ctx.db.query("financings").collect(),
      ctx.db.query("financingApplicationDetails").collect(),
      ctx.db.query("financingApplicationDocuments").collect(),
      ctx.db.query("inquiries").collect(),
      ctx.db.query("testDrives").collect(),
      ctx.db.query("sales").collect(),
      ctx.db.query("crmEvents").order("desc").take(100),
    ]);

    const enrichedFinancings = financings.map((f) => {
      const detail = financingDetails.find((d) => d.financingApplicationId === f.id);
      const docs = financingDocs.filter((d) => d.financingApplicationId === f.id);
      const car = cars[0];
      return {
        ...f,
        firstName: detail?.firstName || "",
        lastName: detail?.lastName || "",
        customerName: detail
          ? `${detail.firstName} ${detail.lastName}`.trim()
          : f.customerId,
        email: detail?.email || "",
        phone: detail?.phone || "",
        idNumber: detail?.idNumber || "",
        address: detail?.address || "",
        employerName: detail?.employerName || "",
        jobTitle: detail?.jobTitle || "",
        monthlyIncomeGross: detail?.monthlyIncomeGross || 0,
        downPaymentAmount: detail?.downPaymentAmount || 0,
        carName:
          (detail?.extraData as any)?.carName ||
          (car ? `${car.year} ${car.make} ${car.model}` : "Vehicle Finance"),
        carPrice: (detail?.extraData as any)?.carPrice || f.loanAmount,
        documents: docs,
      };
    });

    return {
      crmContacts,
      cars,
      financings: enrichedFinancings,
      inquiries,
      testDrives,
      sales,
      crmEvents,
    };
  },
});

export const upsertCrmContact = mutation({
  args: {
    contactKey: v.string(),
    chatId: v.string(),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    idNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    employerName: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    monthlyIncomeGross: v.optional(v.number()),
    monthlyExpenses: v.optional(v.number()),
    stage: v.optional(v.string()),
    priority: v.optional(v.string()),
    source: v.optional(v.string()),
    assignedCarId: v.optional(v.number()),
    assignedCarName: v.optional(v.string()),
    dealValueZar: v.optional(v.number()),
    depositZar: v.optional(v.number()),
    lastMessage: v.optional(v.string()),
    lastContactedLabel: v.optional(v.string()),
    lastContactedAt: v.optional(v.string()),
    isRecentChat: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    ficaDocsCount: v.optional(v.number()),
    pipelineOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("crmContacts")
      .withIndex("by_contactKey", (q) => q.eq("contactKey", args.contactKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name || existing.name,
        phone: args.phone || existing.phone,
        chatId: args.chatId || existing.chatId,
        email: args.email !== undefined ? args.email : existing.email,
        idNumber: args.idNumber !== undefined ? args.idNumber : existing.idNumber,
        address: args.address !== undefined ? args.address : existing.address,
        employerName:
          args.employerName !== undefined ? args.employerName : existing.employerName,
        jobTitle: args.jobTitle !== undefined ? args.jobTitle : existing.jobTitle,
        monthlyIncomeGross:
          args.monthlyIncomeGross !== undefined
            ? args.monthlyIncomeGross
            : existing.monthlyIncomeGross,
        monthlyExpenses:
          args.monthlyExpenses !== undefined
            ? args.monthlyExpenses
            : existing.monthlyExpenses,
        stage: args.stage || existing.stage,
        priority: args.priority || existing.priority,
        source: args.source || existing.source,
        assignedCarId:
          args.assignedCarId !== undefined
            ? args.assignedCarId
            : existing.assignedCarId,
        assignedCarName:
          args.assignedCarName !== undefined
            ? args.assignedCarName
            : existing.assignedCarName,
        dealValueZar:
          args.dealValueZar !== undefined ? args.dealValueZar : existing.dealValueZar,
        depositZar:
          args.depositZar !== undefined ? args.depositZar : existing.depositZar,
        lastMessage:
          args.lastMessage !== undefined ? args.lastMessage : existing.lastMessage,
        lastContactedLabel:
          args.lastContactedLabel !== undefined
            ? args.lastContactedLabel
            : existing.lastContactedLabel,
        lastContactedAt: args.lastContactedAt || now,
        isRecentChat:
          args.isRecentChat !== undefined ? args.isRecentChat : existing.isRecentChat,
        notes: args.notes !== undefined ? args.notes : existing.notes,
        ficaDocsCount:
          args.ficaDocsCount !== undefined
            ? args.ficaDocsCount
            : existing.ficaDocsCount,
        pipelineOrder:
          args.pipelineOrder !== undefined
            ? args.pipelineOrder
            : existing.pipelineOrder,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("crmContacts", {
      contactKey: args.contactKey,
      chatId: args.chatId,
      name: args.name,
      phone: args.phone,
      email: args.email || "",
      idNumber: args.idNumber || "",
      address: args.address || "Johannesburg, Gauteng",
      employerName: args.employerName || "",
      jobTitle: args.jobTitle || "",
      monthlyIncomeGross: args.monthlyIncomeGross || 0,
      monthlyExpenses: args.monthlyExpenses || 0,
      stage: args.stage || "CONTACTED",
      priority: args.priority || "HOT",
      source: args.source || "WHATSAPP",
      assignedCarId: args.assignedCarId,
      assignedCarName: args.assignedCarName || "",
      dealValueZar: args.dealValueZar || 0,
      depositZar: args.depositZar || 0,
      lastMessage: args.lastMessage || "Added to AutoFame CRM",
      lastContactedLabel: args.lastContactedLabel || "Just Now",
      lastContactedAt: args.lastContactedAt || now,
      isRecentChat: args.isRecentChat ?? true,
      notes: args.notes || "",
      ficaDocsCount: args.ficaDocsCount || 0,
      pipelineOrder: args.pipelineOrder,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCrmContactStage = mutation({
  args: {
    contactKey: v.string(),
    stage: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedCarId: v.optional(v.number()),
    assignedCarName: v.optional(v.string()),
    dealValueZar: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("crmContacts")
      .withIndex("by_contactKey", (q) => q.eq("contactKey", args.contactKey))
      .first();

    if (!existing) return null;

    await ctx.db.patch(existing._id, {
      ...(args.stage ? { stage: args.stage } : {}),
      ...(args.priority ? { priority: args.priority } : {}),
      ...(args.assignedCarId !== undefined ? { assignedCarId: args.assignedCarId } : {}),
      ...(args.assignedCarName !== undefined
        ? { assignedCarName: args.assignedCarName }
        : {}),
      ...(args.dealValueZar !== undefined ? { dealValueZar: args.dealValueZar } : {}),
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
      updatedAt: now,
    });
    return existing._id;
  },
});

export const deleteCrmContact = mutation({
  args: {
    contactKey: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("crmContacts")
      .withIndex("by_contactKey", (q) => q.eq("contactKey", args.contactKey))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});
