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
      model: args.model || "autofame-copilot",
      category: args.category || "general",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
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
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          type: v.string(),
          size: v.optional(v.number()),
        })
      )
    ),
    actionType: v.optional(v.string()),
    actionPayload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const messageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      attachments: args.attachments,
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
    // 1. Live Cars Inventory from Convex DB
    const cars = await ctx.db.query("cars").collect();

    // 2. Active Repairs from Convex DB
    const repairs = await ctx.db.query("carRepairs").collect();
    // 3. Financing Applications, Form Details & Proof Documents from Convex DB
    const financings = await ctx.db.query("financingApplications").order("desc").take(25);
    const financingDetails = await ctx.db.query("financingApplicationDetails").order("desc").take(25);
    const financingDocs = await ctx.db.query("financingApplicationDocuments").order("desc").take(100);
    // 4. Inquiries & Test Drives & Customers & Employees & Dealerships & Reviews & CRM Contacts from Convex DB
    const inquiries = await ctx.db.query("inquiries").order("desc").collect();
    const testDrives = await ctx.db.query("testDrives").order("desc").collect();
    const customers = await ctx.db.query("customers").order("desc").collect();
    const sales = await ctx.db.query("sales").order("desc").collect();
    const employees = await ctx.db.query("employees").collect();
    const dealerships = await ctx.db.query("dealerships").collect();
    const reviews = await ctx.db.query("reviews").collect();
    const posts = await ctx.db.query("posts").collect();
    const crmContacts = await ctx.db.query("crmContacts").order("desc").collect();
    // 5. CRM Events (WhatsApp, Gmail Dispatches, Leads)
    const crmEvents = await ctx.db.query("crmEvents").order("desc").take(30);

    const availableCars = cars.filter((c) => c.status === "AVAILABLE");
    const soldCars = cars.filter((c) => c.status === "SOLD");
    const inactiveCars = cars.filter((c) => c.status === "INACTIVE");
    const maintenanceCars = cars.filter((c) => c.status === "MAINTENANCE" || c.status === "REPAIR");

    const enrichedSales = sales.map((s) => {
      const car = cars.find((c) => c.id === s.carId);
      const cust = customers.find((c) => c.cognitoId === s.customerId);
      const emp = employees.find((e) => e.cognitoId === s.employeeId);
      return {
        id: s.id,
        salePrice: s.salePrice,
        downPayment: s.downPayment,
        tradeInValue: s.tradeInValue,
        saleDate: s.saleDate,
        carId: s.carId,
        carName: car ? `${car.year} ${car.make} ${car.model}` : `Car #${s.carId}`,
        customerName: cust?.name || s.customerId,
        employeeName: emp?.name || s.employeeId,
      };
    });

    const enrichedEmployees = employees.map((e) => {
      const empSales = sales.filter((s) => s.employeeId === e.cognitoId);
      const empInquiries = inquiries.filter((i) => i.employeeId === e.cognitoId);
      const empTestDrives = testDrives.filter((t) => t.employeeId === e.cognitoId);
      const empRevenue = empSales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
      return {
        id: e.id,
        cognitoId: e.cognitoId,
        name: e.name,
        email: e.email,
        phone: e.phoneNumber,
        role: e.role,
        status: e.status,
        commission: e.commission,
        hireDate: e.hireDate,
        salesCount: empSales.length,
        salesRevenue: empRevenue,
        inquiriesCount: empInquiries.length,
        testDrivesCount: empTestDrives.length,
      };
    });

    // Comprehensive Dealership Analytics Breakdown
    const makeBreakdown: Record<string, { count: number; available: number; sold: number; totalValue: number }> = {};
    const carTypeBreakdown: Record<string, number> = {};
    const fuelBreakdown: Record<string, number> = {};
    const transmissionBreakdown: Record<string, number> = {};
    const priceRangeBuckets = [
      { label: "R0 - R100k", min: 0, max: 100000, count: 0 },
      { label: "R100k - R200k", min: 100000, max: 200000, count: 0 },
      { label: "R200k - R300k", min: 200000, max: 300000, count: 0 },
      { label: "R300k - R400k", min: 300000, max: 400000, count: 0 },
      { label: "R400k - R500k", min: 400000, max: 500000, count: 0 },
      { label: "R500k+", min: 500000, max: Infinity, count: 0 },
    ];

    for (const c of cars) {
      const mk = c.make || "Other";
      if (!makeBreakdown[mk]) {
        makeBreakdown[mk] = { count: 0, available: 0, sold: 0, totalValue: 0 };
      }
      makeBreakdown[mk].count += 1;
      if (c.status === "AVAILABLE") makeBreakdown[mk].available += 1;
      if (c.status === "SOLD") makeBreakdown[mk].sold += 1;
      makeBreakdown[mk].totalValue += c.price || 0;

      const cType = c.carType || c.condition || "Vehicle";
      carTypeBreakdown[cType] = (carTypeBreakdown[cType] || 0) + 1;

      const fuel = c.fuelType || "Petrol";
      fuelBreakdown[fuel] = (fuelBreakdown[fuel] || 0) + 1;

      const trans = c.transmission || "Automatic";
      transmissionBreakdown[trans] = (transmissionBreakdown[trans] || 0) + 1;

      const p = c.price || 0;
      const bucket = priceRangeBuckets.find((b) => p >= b.min && p < b.max);
      if (bucket) bucket.count += 1;
    }

    const customerCities: Record<string, number> = {};
    for (const cust of customers) {
      const city = cust.city || "Johannesburg";
      customerCities[city] = (customerCities[city] || 0) + 1;
    }

    const crmStageBreakdown: Record<string, { count: number; valueZar: number }> = {};
    for (const contact of crmContacts) {
      const st = contact.stage || "NEW_LEAD";
      if (!crmStageBreakdown[st]) {
        crmStageBreakdown[st] = { count: 0, valueZar: 0 };
      }
      crmStageBreakdown[st].count += 1;
      crmStageBreakdown[st].valueZar += contact.dealValueZar || 0;
    }

    const totalInventoryValue = cars.reduce((sum, c) => sum + (c.price || 0), 0);
    const soldCarsValue = soldCars.reduce((sum, c) => sum + (c.price || 0), 0);
    const salesTableRevenue = sales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
    const totalGrossRevenue = salesTableRevenue || soldCarsValue;
    const avgMileage =
      cars.length > 0 ? Math.round(cars.reduce((sum, c) => sum + (c.mileage || 0), 0) / cars.length) : 0;
    const avgReviewRating =
      reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1))
        : 5.0;

    const totalShowroomValue = availableCars.reduce((sum, c) => sum + (c.price || 0), 0);
    const averagePrice = availableCars.length > 0 ? Math.round(totalShowroomValue / availableCars.length) : 0;

    const sortedByPrice = [...availableCars].sort((a, b) => (a.price || 0) - (b.price || 0));
    const cheapestCar = sortedByPrice[0] || null;
    const mostExpensiveCar = sortedByPrice[sortedByPrice.length - 1] || null;

    // Enrich financing applications with full User Details, Car Details, Financial Details & FICA Proof Documents Check
    const enrichedFinancings = financings.map((f) => {
      const detail = financingDetails.find((d) => d.financingApplicationId === f.id);
      const cust = customers.find((c) => c.cognitoId === f.customerId);
      const appDocs = financingDocs.filter((doc) => doc.financingApplicationId === f.id);

      const extra = (detail?.extraData as any) || {};
      const selectedCarId = extra.carId || null;
      const matchedCar = selectedCarId ? cars.find((c) => c.id === Number(selectedCarId)) : null;
      const carName =
        extra.carName ||
        (matchedCar ? `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}` : "Selected Vehicle");
      const carPrice = extra.carPrice || matchedCar?.price || f.loanAmount;

      const customerName = detail
        ? `${detail.firstName} ${detail.lastName}`.trim()
        : cust?.name || "Applicant";
      const idNumber = detail?.idNumber || extra.idNumber || "";
      const email = detail?.email || cust?.email || "";
      const phone = detail?.phone || cust?.phoneNumber || "";
      const address = detail?.address || cust?.address || "";
      const employerName = detail?.employerName || "";
      const jobTitle = detail?.jobTitle || "";
      const monthlyIncomeGross = detail?.monthlyIncomeGross || 0;
      const monthlyExpenses = detail?.monthlyHousingPayment || extra.monthlyExpenses || 0;
      const downPaymentAmount = detail?.downPaymentAmount || 0;

      // Mandatory FICA & Bank Checklist Verification
      const missingItems: string[] = [];
      if (!customerName || customerName === "Applicant") missingItems.push("Full Name");
      if (!idNumber) missingItems.push("SA ID Number");
      if (!phone) missingItems.push("Phone / WhatsApp Number");
      if (!email) missingItems.push("Email Address");
      if (!address) missingItems.push("Residential Address");
      if (!carName || carName === "Selected Vehicle") missingItems.push("Selected Vehicle Details");
      if (!employerName) missingItems.push("Employer Name");
      if (!monthlyIncomeGross || monthlyIncomeGross <= 0) missingItems.push("Gross Monthly Income");

      const docTypesPresent = appDocs.map((d) => d.docType.toUpperCase());
      const requiredDocs = [
        { code: "ID_COPY", label: "SA ID Copy" },
        { code: "DRIVERS_LICENSE", label: "Driver's License" },
        { code: "BANK_STATEMENTS", label: "3 Months Bank Statements" },
        { code: "PAYSLIPS", label: "Latest Payslips" },
        { code: "PROOF_OF_ADDRESS", label: "Proof of Residence" },
      ];

      for (const reqDoc of requiredDocs) {
        const hasDoc = docTypesPresent.some(
          (t) => t.includes(reqDoc.code) || t.includes(reqDoc.label.toUpperCase())
        );
        if (!hasDoc) {
          missingItems.push(`Proof Doc: ${reqDoc.label}`);
        }
      }

      return {
        id: f.id,
        loanAmount: f.loanAmount,
        interestRate: f.interestRate,
        termMonths: f.termMonths,
        monthlyPayment: f.monthlyPayment,
        status: f.status,
        applicationDate: f.applicationDate,
        customerId: f.customerId,
        // User Details
        customerName,
        firstName: detail?.firstName || "",
        lastName: detail?.lastName || "",
        idNumber,
        email,
        phone,
        address,
        city: detail?.city || "",
        postalCode: detail?.postalCode || "",
        // Car Details
        carId: selectedCarId,
        carName,
        carPrice,
        downPaymentAmount,
        hasTradeIn: detail?.hasTradeIn || false,
        tradeInDetails: detail?.tradeInDetails || null,
        // Financial Details
        employmentStatus: detail?.employmentStatus || "EMPLOYED",
        employerName,
        jobTitle,
        monthlyIncomeGross,
        monthlyExpenses,
        creditScoreRange: detail?.creditScoreRange || null,
        // Proof Documents & Bank Readiness
        documents: appDocs.map((d) => ({
          id: d.id,
          docType: d.docType,
          name: d.originalName,
          url: d.url,
          mime: d.mime,
          size: d.size,
        })),
        isCompleteForBank: missingItems.length === 0,
        missingItems,
      };
    });

    // Enrich inquiries with customer and vehicle info
    const enrichedInquiries = inquiries.map((inq) => {
      const car = cars.find((c) => c.id === inq.carId);
      const cust = customers.find((c) => c.cognitoId === inq.customerId);
      return {
        id: inq.id,
        message: inq.message,
        status: inq.status,
        inquiryDate: inq.inquiryDate,
        carId: inq.carId,
        carName: car ? `${car.year} ${car.make} ${car.model}` : `Car #${inq.carId}`,
        customerName: cust?.name || inq.customerId,
        customerEmail: cust?.email || "",
        customerPhone: cust?.phoneNumber || "",
      };
    });

    // Enrich test drives
    const enrichedTestDrives = testDrives.map((td) => {
      const car = cars.find((c) => c.id === td.carId);
      const cust = customers.find((c) => c.cognitoId === td.customerId);
      return {
        id: td.id,
        scheduledDate: td.scheduledDate,
        completed: td.completed,
        notes: td.notes,
        carName: car ? `${car.year} ${car.make} ${car.model}` : `Car #${td.carId}`,
        customerName: cust?.name || td.customerId,
        customerEmail: cust?.email || "",
        customerPhone: cust?.phoneNumber || "",
      };
    });

    return {
      dealership: {
        name: "AutoFame Dealership Johannesburg South",
        country: "South Africa (ZAR)",
        whatsappProvider: "Whapi.Cloud Channel STARLD-W5LEE (+27 63 199 5124)",
        emailProvider: "Gmail Connected Channel (alexsouthflow3@gmail.com)",
        dealershipPhone: "+27 63 199 5124",
        address: "1 Rifle Range Rd, Baragwanath, Johannesburg South, 2013, South Africa",
      },
      stats: {
        totalInventory: cars.length,
        availableCount: availableCars.length,
        soldCount: soldCars.length,
        inactiveCount: inactiveCars.length,
        maintenanceCount: maintenanceCars.length,
        inRepairCount: repairs.filter((r) => r.status !== "COMPLETED" && r.status !== "COLLECTED").length || maintenanceCars.length,
        pendingFinancingCount: financings.filter((f) => f.status === "PENDING").length,
        inquiriesCount: inquiries.length,
        testDrivesCount: testDrives.length,
        customersCount: customers.length,
        salesCount: sales.length,
        totalShowroomValue,
        averagePrice,
        cheapestCar: cheapestCar ? `${cheapestCar.year} ${cheapestCar.make} ${cheapestCar.model} (R${(cheapestCar.price || 0).toLocaleString()} ZAR)` : null,
        mostExpensiveCar: mostExpensiveCar ? `${mostExpensiveCar.year} ${mostExpensiveCar.make} ${mostExpensiveCar.model} (R${(mostExpensiveCar.price || 0).toLocaleString()} ZAR)` : null,
      },
      sales: enrichedSales,
      cars: cars.map((c) => ({
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
        color: c.exteriorColor || "Standard",
        carType: c.carType || "Vehicle",
      })),
      repairs: repairs.map((r) => {
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
          technicianContact: r.technicianContact,
        };
      }),
      financings: enrichedFinancings,
      inquiries: enrichedInquiries,
      testDrives: enrichedTestDrives,
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phoneNumber,
        city: c.city,
        favoritesCount: Array.isArray(c.favorites) ? c.favorites.length : 0,
      })),
      employees: enrichedEmployees,
      dealershipBranches: dealerships,
      reviews: reviews.map((r) => {
        const car = cars.find((c) => c.id === r.carId);
        return {
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          reviewDate: r.reviewDate,
          carName: car ? `${car.year} ${car.make} ${car.model}` : `Car #${r.carId}`,
        };
      }),
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        published: p.published,
        authorName: p.authorName,
      })),
      crmContacts: crmContacts.slice(0, 50),
      crmEvents: crmEvents.slice(0, 20),
      analytics: {
        totalInventoryValue,
        availableShowroomValue: totalShowroomValue,
        soldInventoryValue: soldCarsValue,
        salesTableRevenue,
        totalGrossRevenue,
        averagePrice,
        avgMileage,
        avgReviewRating,
        reviewsCount: reviews.length,
        postsCount: posts.length,
        employeesCount: employees.length,
        activeEmployeesCount: employees.filter((e) => e.status === "ACTIVE").length,
        crmContactsCount: crmContacts.length,
        crmPipelineValue: crmContacts.reduce((s, c) => s + (c.dealValueZar || 0), 0),
        crmHotLeadsCount: crmContacts.filter((c) => c.priority === "HOT").length,
        crmStageBreakdown,
        makeBreakdown,
        carTypeBreakdown,
        fuelBreakdown,
        transmissionBreakdown,
        priceRangeBuckets: priceRangeBuckets.map((b) => ({ label: b.label, count: b.count })),
        customerCities,
      },
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

// ──────────────────────────────────────────────
// Finance Application Form Container (User Details + Car Details + Financial Details + Proof Documents)
// ──────────────────────────────────────────────

export const saveFinanceApplicationContainer = mutation({
  args: {
    applicationId: v.optional(v.number()),
    // 1. User Details
    firstName: v.string(),
    lastName: v.string(),
    idNumber: v.string(),
    phone: v.string(),
    email: v.string(),
    address: v.string(),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    // 2. Car Details
    carId: v.optional(v.number()),
    carName: v.string(),
    carPrice: v.number(),
    downPaymentAmount: v.number(),
    termMonths: v.number(),
    interestRate: v.optional(v.number()),
    hasTradeIn: v.optional(v.boolean()),
    tradeInDetails: v.optional(v.string()),
    // 3. Financial Details
    employmentStatus: v.string(),
    employerName: v.string(),
    jobTitle: v.string(),
    monthlyIncomeGross: v.number(),
    monthlyExpenses: v.number(),
    creditScoreRange: v.optional(v.string()),
    // 4. Proof Documents (ID, Driver's License, Bank Statements, Payslips, Proof of Address)
    documents: v.optional(
      v.array(
        v.object({
          docType: v.string(),
          originalName: v.string(),
          mime: v.string(),
          size: v.number(),
          url: v.string(),
        })
      )
    ),
    status: v.optional(v.string()),
    sourceChannel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const allApps = await ctx.db.query("financingApplications").collect();
    const allDetails = await ctx.db.query("financingApplicationDetails").collect();
    const allDocs = await ctx.db.query("financingApplicationDocuments").collect();

    const loanAmount = Math.max(0, args.carPrice - args.downPaymentAmount);
    const rate = args.interestRate || 11.75;
    const monthlyRate = rate / 100 / 12;
    const months = args.termMonths || 72;
    const monthlyPayment =
      loanAmount > 0
        ? Math.round(
            (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
              (Math.pow(1 + monthlyRate, months) - 1)
          )
        : 0;

    let numericAppId = args.applicationId;
    let existingApp = numericAppId
      ? allApps.find((a) => a.id === numericAppId)
      : undefined;

    if (existingApp) {
      await ctx.db.patch(existingApp._id, {
        loanAmount,
        interestRate: rate,
        termMonths: months,
        monthlyPayment,
        status: args.status || existingApp.status,
        annualIncome: args.monthlyIncomeGross * 12,
      });
    } else {
      const maxAppId = allApps.reduce((max, a) => Math.max(max, a.id || 0), 100);
      numericAppId = maxAppId + 1;
      await ctx.db.insert("financingApplications", {
        id: numericAppId,
        loanAmount,
        interestRate: rate,
        termMonths: months,
        monthlyPayment,
        status: args.status || "PENDING",
        applicationDate: now,
        approvalDate: null,
        customerId: args.phone || args.email || `WA-${numericAppId}`,
        creditScore: 700,
        annualIncome: args.monthlyIncomeGross * 12,
      });
    }

    const existingDetail = allDetails.find(
      (d) => d.financingApplicationId === numericAppId
    );

    const extraData = {
      carId: args.carId || null,
      carName: args.carName,
      carPrice: args.carPrice,
      idNumber: args.idNumber,
      monthlyExpenses: args.monthlyExpenses,
      sourceChannel: args.sourceChannel || "WHATSAPP_STARLD_W5LEE",
      updatedAt: now,
    };

    if (existingDetail) {
      await ctx.db.patch(existingDetail._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        phone: args.phone,
        idNumber: args.idNumber,
        address: args.address,
        city: args.city || "Johannesburg",
        postalCode: args.postalCode || "2013",
        monthlyHousingPayment: args.monthlyExpenses,
        employmentStatus: args.employmentStatus,
        employerName: args.employerName,
        jobTitle: args.jobTitle,
        monthlyIncomeGross: args.monthlyIncomeGross,
        creditScoreRange: args.creditScoreRange || "GOOD",
        downPaymentAmount: args.downPaymentAmount,
        hasTradeIn: args.hasTradeIn || false,
        tradeInDetails: args.tradeInDetails || null,
        extraData,
      });
    } else {
      const maxDetailId = allDetails.reduce((max, d) => Math.max(max, d.id || 0), 100);
      await ctx.db.insert("financingApplicationDetails", {
        id: maxDetailId + 1,
        financingApplicationId: numericAppId!,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        phone: args.phone,
        idNumber: args.idNumber,
        address: args.address,
        city: args.city || "Johannesburg",
        state: "Gauteng",
        postalCode: args.postalCode || "2013",
        housingStatus: "OWN",
        monthlyHousingPayment: args.monthlyExpenses,
        employmentStatus: args.employmentStatus,
        employerName: args.employerName,
        jobTitle: args.jobTitle,
        employmentYears: 3,
        monthlyIncomeGross: args.monthlyIncomeGross,
        otherIncome: 0,
        otherIncomeSource: null,
        creditScoreRange: args.creditScoreRange || "GOOD",
        downPaymentAmount: args.downPaymentAmount,
        preferredContactMethod: "WHATSAPP",
        hasTradeIn: args.hasTradeIn || false,
        tradeInDetails: args.tradeInDetails || null,
        coApplicantName: null,
        coApplicantIncome: null,
        coApplicantRelationship: null,
        consentCreditCheck: true,
        agreeTerms: true,
        extraData,
        createdAt: now,
      });
    }

    // Save or replace uploaded Proof Documents
    if (args.documents && args.documents.length > 0) {
      let maxDocId = allDocs.reduce((max, d) => Math.max(max, d.id || 0), 500);
      for (const doc of args.documents) {
        // Check if same docType already exists for this application
        const existingDoc = allDocs.find(
          (d) =>
            d.financingApplicationId === numericAppId &&
            d.docType.toUpperCase() === doc.docType.toUpperCase()
        );
        if (existingDoc) {
          await ctx.db.patch(existingDoc._id, {
            originalName: doc.originalName,
            storedName: doc.originalName,
            mime: doc.mime,
            size: doc.size,
            url: doc.url,
            uploadedAt: now,
          });
        } else {
          maxDocId += 1;
          await ctx.db.insert("financingApplicationDocuments", {
            id: maxDocId,
            financingApplicationId: numericAppId!,
            docType: doc.docType.toUpperCase(),
            originalName: doc.originalName,
            storedName: doc.originalName,
            mime: doc.mime,
            size: doc.size,
            url: doc.url,
            uploadedAt: now,
          });
        }
      }
    }

    await ctx.db.insert("crmEvents", {
      eventType: "FINANCE_CONTAINER_SAVED",
      recipient: args.phone || args.email,
      customerName: `${args.firstName} ${args.lastName}`.trim(),
      summary: `Finance Application #${numericAppId} saved for ${args.firstName} ${args.lastName} (${args.carName} - R${args.carPrice.toLocaleString()} ZAR)`,
      status: "SUCCESS",
      createdAt: now,
    });

    return {
      applicationId: numericAppId,
      loanAmount,
      monthlyPayment,
    };
  },
});
