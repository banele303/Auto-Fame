import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    status: v.optional(v.string()),
    showAll: v.optional(v.boolean()),
    dealershipId: v.optional(v.number()),
    employeeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let cars = await ctx.db.query("cars").collect();

    if (args.featured !== undefined) {
      cars = cars.filter(c => c.featured === args.featured);
    }
    if (args.status !== undefined) {
      cars = cars.filter(c => c.status === args.status);
    } else if (!args.showAll) {
      // Default: only return AVAILABLE or RESERVED cars unless showAll is true
      cars = cars.filter(c => c.status === "AVAILABLE" || c.status === "RESERVED");
    }
    if (args.employeeId !== undefined) {
      cars = cars.filter(c => c.employeeId === args.employeeId);
    }
    if (args.dealershipId !== undefined) {
      cars = cars.filter(c => c.dealershipId === args.dealershipId);
    }

    if (args.status === undefined && !args.showAll && args.employeeId === undefined) {
      // Public users default to AVAILABLE
      cars = cars.filter(c => c.status === "AVAILABLE");
    } else if (args.status !== undefined) {
      cars = cars.filter(c => c.status === args.status);
    }

    // Limit/Pagination
    if (args.limit !== undefined) {
      cars = cars.slice(0, args.limit);
    }

    // Sort by updatedAt descending
    cars.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    // Resolve dealership relations
    const carsWithRelations = [];
    for (const car of cars) {
      const dealership = await ctx.db
        .query("dealerships")
        .withIndex("by_numeric_id", q => q.eq("id", car.dealershipId))
        .first();
      carsWithRelations.push({
        ...car,
        dealership,
      });
    }

    return carsWithRelations;
  },
});

export const get = query({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const car = await ctx.db
      .query("cars")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();

    if (!car) return null;

    const dealership = await ctx.db
      .query("dealerships")
      .withIndex("by_numeric_id", q => q.eq("id", car.dealershipId))
      .first();

    const employee = car.employeeId
      ? await ctx.db
          .query("employees")
          .withIndex("by_cognitoId", q => q.eq("cognitoId", car.employeeId!))
          .first()
      : null;

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_carId", q => q.eq("carId", car.id))
      .collect();

    return {
      ...car,
      dealership,
      employee,
      reviews,
    };
  },
});

export const create = mutation({
  args: {
    vin: v.optional(v.string()),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    price: v.number(),
    mileage: v.number(),
    condition: v.string(),
    carType: v.string(),
    fuelType: v.string(),
    transmission: v.string(),
    engine: v.string(),
    exteriorColor: v.string(),
    interiorColor: v.optional(v.string()),
    description: v.string(),
    features: v.array(v.string()),
    photoUrls: v.array(v.string()),
    status: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    dealershipId: v.number(),
    employeeId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    // Generate simple auto-increment ID
    const lastCar = await ctx.db.query("cars").order("desc").first();
    const nextId = lastCar ? lastCar.id + 1 : 1;

    // Check unique VIN
    const alphabet = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = args.vin;
    if (!vin) {
      let gen = '';
      for (let i = 0; i < 17; i++) gen += alphabet[Math.floor(Math.random() * alphabet.length)];
      vin = gen;
    }

    const existingVin = await ctx.db
      .query("cars")
      .withIndex("by_vin", q => q.eq("vin", vin!))
      .first();
    if (existingVin) {
      throw new Error("A car with this VIN already exists.");
    }

    const postedDate = new Date().toISOString();

    const carId = await ctx.db.insert("cars", {
      id: nextId,
      vin,
      make: args.make,
      model: args.model,
      year: args.year,
      price: args.price,
      mileage: args.mileage,
      condition: args.condition,
      carType: args.carType,
      fuelType: args.fuelType,
      transmission: args.transmission,
      engine: args.engine,
      exteriorColor: args.exteriorColor,
      interiorColor: args.interiorColor || "Not specified",
      description: args.description,
      features: args.features,
      photoUrls: args.photoUrls,
      status: args.status || "AVAILABLE",
      postedDate,
      updatedAt: postedDate,
      featured: args.featured || false,
      dealershipId: args.dealershipId,
      employeeId: args.employeeId || null,
      averageRating: 0,
      numberOfReviews: 0,
    });

    return await ctx.db.get(carId);
  },
});

export const update = mutation({
  args: {
    id: v.number(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    vin: v.optional(v.string()),
    carType: v.optional(v.string()),
    fuelType: v.optional(v.string()),
    condition: v.optional(v.string()),
    transmission: v.optional(v.string()),
    engine: v.optional(v.string()),
    exteriorColor: v.optional(v.string()),
    interiorColor: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    dealershipId: v.optional(v.number()),
    employeeId: v.optional(v.union(v.string(), v.null())),
    mileage: v.optional(v.number()),
    price: v.optional(v.number()),
    year: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    photoUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const car = await ctx.db
      .query("cars")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();

    if (!car) {
      throw new Error("Car not found");
    }

    const { id, ...updateFields } = args;

    // Filter out undefined arguments
    const dataToPatch: any = {};
    for (const [key, val] of Object.entries(updateFields)) {
      if (val !== undefined) {
        dataToPatch[key] = val;
      }
    }

    dataToPatch.updatedAt = new Date().toISOString();

    await ctx.db.patch(car._id, dataToPatch);

    return await ctx.db.get(car._id);
  },
});

export const remove = mutation({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const car = await ctx.db
      .query("cars")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();

    if (!car) {
      throw new Error("Car not found");
    }

    // Check if sales exist
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_carId", q => q.eq("carId", args.id))
      .first();
    if (sales) {
      throw new Error("This car has a sale record and cannot be deleted.");
    }

    // Delete related reviews, inquiries, test drives
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_carId", q => q.eq("carId", args.id))
      .collect();
    for (const r of reviews) {
      await ctx.db.delete(r._id);
    }

    const inquiries = await ctx.db
      .query("inquiries")
      .withIndex("by_carId", q => q.eq("carId", args.id))
      .collect();
    for (const i of inquiries) {
      await ctx.db.delete(i._id);
    }

    const testDrives = await ctx.db
      .query("testDrives")
      .withIndex("by_carId", q => q.eq("carId", args.id))
      .collect();
    for (const td of testDrives) {
      await ctx.db.delete(td._id);
    }

    await ctx.db.delete(car._id);

    return { success: true, id: args.id };
  },
});
