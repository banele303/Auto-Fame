import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAuthUser = mutation({
  args: {
    cognitoId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(), // "customer" | "employee" | "admin"
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { cognitoId, email, name, role, phoneNumber } = args;

    if (role === "admin") {
      let admin = await ctx.db
        .query("admins")
        .withIndex("by_cognitoId", q => q.eq("cognitoId", cognitoId))
        .first();

      if (!admin) {
        const lastAdmin = await ctx.db.query("admins").order("desc").first();
        const nextId = lastAdmin ? lastAdmin.id + 1 : 1;

        const id = await ctx.db.insert("admins", {
          id: nextId,
          cognitoId,
          name,
          email,
          phoneNumber: phoneNumber || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        admin = await ctx.db.get(id);
      }

      return {
        userInfo: admin,
        userRole: "admin",
      };
    } else if (role === "employee") {
      let employee = await ctx.db
        .query("employees")
        .withIndex("by_cognitoId", q => q.eq("cognitoId", cognitoId))
        .first();

      if (!employee) {
        const lastEmp = await ctx.db.query("employees").order("desc").first();
        const nextId = lastEmp ? lastEmp.id + 1 : 1;

        // Resolve or default dealership
        const dealership = await ctx.db.query("dealerships").first();
        const dealershipId = dealership ? dealership.id : 1;

        const id = await ctx.db.insert("employees", {
          id: nextId,
          cognitoId,
          name,
          email,
          phoneNumber: phoneNumber || "Not specified",
          role: "SALES_ASSOCIATE",
          status: "ACTIVE",
          hireDate: new Date().toISOString(),
          commission: 0,
          dealershipId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        employee = await ctx.db.get(id);
      }

      return {
        userInfo: employee,
        userRole: "employee",
      };
    } else {
      // Customer role
      let customer = await ctx.db
        .query("customers")
        .withIndex("by_cognitoId", q => q.eq("cognitoId", cognitoId))
        .first();

      if (!customer) {
        const lastCust = await ctx.db.query("customers").order("desc").first();
        const nextId = lastCust ? lastCust.id + 1 : 1;

        const id = await ctx.db.insert("customers", {
          id: nextId,
          cognitoId,
          name,
          email,
          phoneNumber: phoneNumber || "Not specified",
          address: null,
          city: null,
          state: null,
          postalCode: null,
          dateOfBirth: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          favorites: [],
        });
        customer = await ctx.db.get(id);
      }

      return {
        userInfo: customer,
        userRole: "customer",
      };
    }
  },
});

export const updateCustomerSettings = mutation({
  args: {
    cognitoId: v.string(),
    name: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    address: v.optional(v.union(v.string(), v.null())),
    city: v.optional(v.union(v.string(), v.null())),
    state: v.optional(v.union(v.string(), v.null())),
    postalCode: v.optional(v.union(v.string(), v.null())),
    dateOfBirth: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();

    if (!customer) throw new Error("Customer not found");

    const { cognitoId, ...fields } = args;
    const patch: any = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    patch.updatedAt = new Date().toISOString();

    await ctx.db.patch(customer._id, patch);
    return await ctx.db.get(customer._id);
  },
});

export const updateEmployeeSettings = mutation({
  args: {
    cognitoId: v.string(),
    name: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();

    if (!employee) throw new Error("Employee not found");

    const { cognitoId, ...fields } = args;
    const patch: any = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    patch.updatedAt = new Date().toISOString();

    await ctx.db.patch(employee._id, patch);
    return await ctx.db.get(employee._id);
  },
});

export const updateAdminSettings = mutation({
  args: {
    cognitoId: v.string(),
    name: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();

    if (!admin) throw new Error("Admin not found");

    const { cognitoId, ...fields } = args;
    const patch: any = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    patch.updatedAt = new Date().toISOString();

    await ctx.db.patch(admin._id, patch);
    return await ctx.db.get(admin._id);
  },
});

export const getCustomer = query({
  args: { cognitoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();
  },
});

export const getEmployee = query({
  args: { cognitoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("employees")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();
  },
});

export const getAdmin = query({
  args: { cognitoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admins")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();
  },
});

export const getAllCustomers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("customers").collect();
  },
});

export const getAllEmployees = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("employees").collect();
  },
});

export const getEmployeeDetails = query({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const emp = await ctx.db
      .query("employees")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
    if (!emp) return null;
    const dealership = await ctx.db
      .query("dealerships")
      .withIndex("by_numeric_id", q => q.eq("id", emp.dealershipId))
      .first();
    return { ...emp, dealership };
  },
});

export const getCustomerDetails = query({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
  },
});

export const updateEmployeeStatus = mutation({
  args: { id: v.number(), status: v.string() },
  handler: async (ctx, args) => {
    const emp = await ctx.db
      .query("employees")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
    if (!emp) throw new Error("Employee not found");
    await ctx.db.patch(emp._id, { status: args.status, updatedAt: new Date().toISOString() });
    return await ctx.db.get(emp._id);
  },
});

export const deleteEmployee = mutation({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const emp = await ctx.db
      .query("employees")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
    if (!emp) throw new Error("Employee not found");
    await ctx.db.delete(emp._id);
    return { success: true };
  },
});

// Favorites management
export const getCurrentFavorites = query({
  args: { cognitoId: v.string() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();
    if (!customer) return [];
    
    const favs = [];
    for (const carId of (customer.favorites || [])) {
      const car = await ctx.db
        .query("cars")
        .withIndex("by_numeric_id", q => q.eq("id", carId))
        .first();
      if (car) favs.push(car);
    }
    return favs;
  },
});

export const addFavoriteCar = mutation({
  args: { cognitoId: v.string(), carId: v.number() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();
    if (!customer) throw new Error("Customer not found");
    
    const currentFavs = customer.favorites || [];
    if (!currentFavs.includes(args.carId)) {
      const updated = [...currentFavs, args.carId];
      await ctx.db.patch(customer._id, { favorites: updated });
    }
    return { success: true };
  },
});

export const removeFavoriteCar = mutation({
  args: { cognitoId: v.string(), carId: v.number() },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_cognitoId", q => q.eq("cognitoId", args.cognitoId))
      .first();
    if (!customer) throw new Error("Customer not found");
    
    const currentFavs = customer.favorites || [];
    const updated = currentFavs.filter(id => id !== args.carId);
    await ctx.db.patch(customer._id, { favorites: updated });
    return { success: true };
  },
});
