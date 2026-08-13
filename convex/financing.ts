import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getFinancingApplications = query({
  args: {
    customerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let apps = await ctx.db.query("financingApplications").collect();

    if (args.customerId !== undefined) {
      apps = apps.filter(a => a.customerId === args.customerId);
    }

    const appsWithRelations = [];
    for (const app of apps) {
      const customer = await ctx.db
        .query("customers")
        .withIndex("by_cognitoId", q => q.eq("cognitoId", app.customerId))
        .first();
      const details = await ctx.db
        .query("financingApplicationDetails")
        .withIndex("by_financingApplicationId", q => q.eq("financingApplicationId", app.id))
        .first();
      const documents = await ctx.db
        .query("financingApplicationDocuments")
        .withIndex("by_financingApplicationId", q => q.eq("financingApplicationId", app.id))
        .collect();

      appsWithRelations.push({
        ...app,
        customer,
        details,
        documents,
      });
    }

    return appsWithRelations;
  },
});

export const getFinancingApplication = query({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const app = await ctx.db
      .query("financingApplications")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
    if (!app) return null;

    const customer = await ctx.db
      .query("customers")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", app.customerId))
      .first();
    const details = await ctx.db
      .query("financingApplicationDetails")
      .withIndex("by_financingApplicationId", q => q.eq("financingApplicationId", app.id))
      .first();
    const documents = await ctx.db
      .query("financingApplicationDocuments")
      .withIndex("by_financingApplicationId", q => q.eq("financingApplicationId", app.id))
      .collect();

    return {
      ...app,
      customer,
      details,
      documents,
    };
  },
});

export const createFinancingApplication = mutation({
  args: {
    loanAmount: v.number(),
    interestRate: v.number(),
    termMonths: v.number(),
    monthlyPayment: v.number(),
    customerId: v.string(),
    creditScore: v.optional(v.number()),
    annualIncome: v.optional(v.number()),
    // Details
    details: v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      phone: v.string(),
      dateOfBirth: v.optional(v.string()),
      idNumber: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      housingStatus: v.optional(v.string()),
      monthlyHousingPayment: v.optional(v.number()),
      employmentStatus: v.optional(v.string()),
      employerName: v.optional(v.string()),
      jobTitle: v.optional(v.string()),
      employmentYears: v.optional(v.number()),
      monthlyIncomeGross: v.optional(v.number()),
      otherIncome: v.optional(v.number()),
      otherIncomeSource: v.optional(v.string()),
      creditScoreRange: v.optional(v.string()),
      downPaymentAmount: v.optional(v.number()),
      preferredContactMethod: v.optional(v.string()),
      hasTradeIn: v.boolean(),
      tradeInDetails: v.optional(v.string()),
      coApplicantName: v.optional(v.string()),
      coApplicantIncome: v.optional(v.number()),
      coApplicantRelationship: v.optional(v.string()),
      consentCreditCheck: v.boolean(),
      agreeTerms: v.boolean(),
      extraData: v.optional(v.any()),
    }),
    // Docs
    documents: v.array(v.object({
      docType: v.string(),
      originalName: v.string(),
      storedName: v.string(),
      mime: v.string(),
      size: v.number(),
      url: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Generate IDs
    const lastApp = await ctx.db.query("financingApplications").order("desc").first();
    const nextAppId = lastApp ? lastApp.id + 1 : 1;

    // 1. Create Application
    const appId = await ctx.db.insert("financingApplications", {
      id: nextAppId,
      loanAmount: args.loanAmount,
      interestRate: args.interestRate,
      termMonths: args.termMonths,
      monthlyPayment: args.monthlyPayment,
      status: "PENDING",
      applicationDate: new Date().toISOString(),
      customerId: args.customerId,
      creditScore: args.creditScore || null,
      annualIncome: args.annualIncome || null,
    });

    // 2. Create Details
    const lastDetail = await ctx.db.query("financingApplicationDetails").order("desc").first();
    const nextDetailId = lastDetail ? lastDetail.id + 1 : 1;

    await ctx.db.insert("financingApplicationDetails", {
      id: nextDetailId,
      financingApplicationId: nextAppId,
      ...args.details,
      createdAt: new Date().toISOString(),
    });

    // 3. Create Documents
    let docCounter = 1;
    const lastDoc = await ctx.db.query("financingApplicationDocuments").order("desc").first();
    let nextDocId = lastDoc ? lastDoc.id + 1 : 1;

    for (const doc of args.documents) {
      await ctx.db.insert("financingApplicationDocuments", {
        id: nextDocId++,
        financingApplicationId: nextAppId,
        ...doc,
        uploadedAt: new Date().toISOString(),
      });
    }

    return { id: nextAppId };
  },
});

export const updateFinancingApplication = mutation({
  args: {
    id: v.number(),
    status: v.string(),
    creditScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const app = await ctx.db
      .query("financingApplications")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();

    if (!app) throw new Error("Financing application not found");

    const patch: any = { status: args.status };
    if (args.creditScore !== undefined) patch.creditScore = args.creditScore;
    if (args.status === "APPROVED") patch.approvalDate = new Date().toISOString();

    await ctx.db.patch(app._id, patch);
    return await ctx.db.get(app._id);
  },
});

export const deleteFinancingApplication = mutation({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const app = await ctx.db
      .query("financingApplications")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();

    if (!app) throw new Error("Financing application not found");

    // Delete details and documents
    const details = await ctx.db
      .query("financingApplicationDetails")
      .withIndex("by_financingApplicationId", q => q.eq("financingApplicationId", args.id))
      .first();
    if (details) await ctx.db.delete(details._id);

    const docs = await ctx.db
      .query("financingApplicationDocuments")
      .withIndex("by_financingApplicationId", q => q.eq("financingApplicationId", args.id))
      .collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }

    await ctx.db.delete(app._id);
    return { success: true };
  },
});
