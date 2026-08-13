import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cars: defineTable({
    id: v.number(), // Keep original numeric ID for API compatibility
    vin: v.string(),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    price: v.number(),
    mileage: v.number(),
    condition: v.string(), // "NEW", "USED", "CERTIFIED_PRE_OWNED", "DEALER_DEMO"
    carType: v.string(), // "SEDAN", "SUV", etc.
    fuelType: v.string(), // "PETROL", "DIESEL", "HYBRID", "ELECTRIC", "PLUG_IN_HYBRID", "HYDROGEN"
    transmission: v.string(), // "MANUAL", "AUTOMATIC", "CVT", "DUAL_CLUTCH"
    engine: v.string(),
    exteriorColor: v.string(),
    interiorColor: v.string(),
    description: v.string(),
    features: v.array(v.string()),
    photoUrls: v.array(v.string()),
    status: v.string(), // "AVAILABLE", "SOLD", "RESERVED", "PENDING", "MAINTENANCE", "INACTIVE"
    postedDate: v.string(), // ISO String
    updatedAt: v.string(), // ISO String
    averageRating: v.optional(v.number()),
    numberOfReviews: v.optional(v.number()),
    dealershipId: v.number(), // references dealerships.id
    employeeId: v.optional(v.union(v.string(), v.null())), // references employees.cognitoId
    featured: v.boolean(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_vin", ["vin"])
  .index("by_status", ["status"])
  .index("by_featured", ["featured"])
  .index("by_dealershipId", ["dealershipId"])
  .index("by_employeeId", ["employeeId"]),

  dealerships: defineTable({
    id: v.number(), // Keep original numeric ID
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    postalCode: v.string(),
    phoneNumber: v.string(),
    email: v.string(),
    website: v.optional(v.union(v.string(), v.null())),
    createdAt: v.string(),
    updatedAt: v.string(),
    latitude: v.optional(v.union(v.number(), v.null())),
    longitude: v.optional(v.union(v.number(), v.null())),
  })
  .index("by_numeric_id", ["id"]),

  employees: defineTable({
    id: v.number(),
    cognitoId: v.string(),
    name: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    role: v.string(), // "SALES_MANAGER", "SALES_ASSOCIATE", etc.
    status: v.string(), // "ACTIVE", "INACTIVE", "SUSPENDED"
    hireDate: v.string(),
    commission: v.number(),
    dealershipId: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_cognitoId", ["cognitoId"])
  .index("by_dealershipId", ["dealershipId"]),

  customers: defineTable({
    id: v.number(),
    cognitoId: v.string(),
    name: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    address: v.optional(v.union(v.string(), v.null())),
    city: v.optional(v.union(v.string(), v.null())),
    state: v.optional(v.union(v.string(), v.null())),
    postalCode: v.optional(v.union(v.string(), v.null())),
    dateOfBirth: v.optional(v.union(v.string(), v.null())),
    createdAt: v.string(),
    updatedAt: v.string(),
    favorites: v.array(v.number()), // array of car.id
  })
  .index("by_numeric_id", ["id"])
  .index("by_cognitoId", ["cognitoId"]),

  admins: defineTable({
    id: v.number(),
    cognitoId: v.string(),
    name: v.string(),
    email: v.string(),
    phoneNumber: v.optional(v.union(v.string(), v.null())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_cognitoId", ["cognitoId"]),

  inquiries: defineTable({
    id: v.number(),
    message: v.string(),
    status: v.string(), // "NEW", "CONTACTED", "SCHEDULED", "COMPLETED", "CANCELLED"
    inquiryDate: v.string(),
    followUpDate: v.optional(v.union(v.string(), v.null())),
    carId: v.number(),
    customerId: v.string(), // references customers.cognitoId
    employeeId: v.optional(v.union(v.string(), v.null())),
    dealershipId: v.number(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_customerId", ["customerId"])
  .index("by_carId", ["carId"])
  .index("by_dealershipId", ["dealershipId"]),

  testDrives: defineTable({
    id: v.number(),
    scheduledDate: v.string(),
    actualDate: v.optional(v.union(v.string(), v.null())),
    duration: v.optional(v.union(v.number(), v.null())),
    notes: v.optional(v.union(v.string(), v.null())),
    completed: v.boolean(),
    carId: v.number(),
    customerId: v.string(),
    employeeId: v.optional(v.union(v.string(), v.null())),
    dealershipId: v.number(),
    createdAt: v.string(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_customerId", ["customerId"])
  .index("by_carId", ["carId"]),

  sales: defineTable({
    id: v.number(),
    salePrice: v.number(),
    downPayment: v.number(),
    tradeInValue: v.number(),
    saleDate: v.string(),
    deliveryDate: v.optional(v.union(v.string(), v.null())),
    carId: v.number(),
    customerId: v.string(),
    employeeId: v.string(),
    dealershipId: v.number(),
    financingId: v.optional(v.union(v.number(), v.null())),
  })
  .index("by_numeric_id", ["id"])
  .index("by_carId", ["carId"])
  .index("by_customerId", ["customerId"]),

  financingApplications: defineTable({
    id: v.number(),
    loanAmount: v.number(),
    interestRate: v.number(),
    termMonths: v.number(),
    monthlyPayment: v.number(),
    status: v.string(), // "PENDING", "APPROVED", "REJECTED", "COMPLETED"
    applicationDate: v.string(),
    approvalDate: v.optional(v.union(v.string(), v.null())),
    customerId: v.string(),
    creditScore: v.optional(v.union(v.number(), v.null())),
    annualIncome: v.optional(v.union(v.number(), v.null())),
  })
  .index("by_numeric_id", ["id"])
  .index("by_customerId", ["customerId"]),

  financingApplicationDetails: defineTable({
    id: v.number(),
    financingApplicationId: v.number(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.optional(v.union(v.string(), v.null())),
    idNumber: v.optional(v.union(v.string(), v.null())),
    address: v.optional(v.union(v.string(), v.null())),
    city: v.optional(v.union(v.string(), v.null())),
    state: v.optional(v.union(v.string(), v.null())),
    postalCode: v.optional(v.union(v.string(), v.null())),
    housingStatus: v.optional(v.union(v.string(), v.null())),
    monthlyHousingPayment: v.optional(v.union(v.number(), v.null())),
    employmentStatus: v.optional(v.union(v.string(), v.null())),
    employerName: v.optional(v.union(v.string(), v.null())),
    jobTitle: v.optional(v.union(v.string(), v.null())),
    employmentYears: v.optional(v.union(v.number(), v.null())),
    monthlyIncomeGross: v.optional(v.union(v.number(), v.null())),
    otherIncome: v.optional(v.union(v.number(), v.null())),
    otherIncomeSource: v.optional(v.union(v.string(), v.null())),
    creditScoreRange: v.optional(v.union(v.string(), v.null())),
    downPaymentAmount: v.optional(v.union(v.number(), v.null())),
    preferredContactMethod: v.optional(v.union(v.string(), v.null())),
    hasTradeIn: v.boolean(),
    tradeInDetails: v.optional(v.union(v.string(), v.null())),
    coApplicantName: v.optional(v.union(v.string(), v.null())),
    coApplicantIncome: v.optional(v.union(v.number(), v.null())),
    coApplicantRelationship: v.optional(v.union(v.string(), v.null())),
    consentCreditCheck: v.boolean(),
    agreeTerms: v.boolean(),
    extraData: v.optional(v.any()), // JSON extra data
    createdAt: v.string(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_financingApplicationId", ["financingApplicationId"]),

  financingApplicationDocuments: defineTable({
    id: v.number(),
    financingApplicationId: v.number(),
    docType: v.string(),
    originalName: v.string(),
    storedName: v.string(),
    mime: v.string(),
    size: v.number(),
    url: v.string(),
    uploadedAt: v.string(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_financingApplicationId", ["financingApplicationId"]),

  reviews: defineTable({
    id: v.number(),
    rating: v.number(),
    title: v.string(),
    comment: v.string(),
    reviewDate: v.string(),
    carId: v.number(),
    customerId: v.string(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_carId", ["carId"])
  .index("by_carId_customerId", ["carId", "customerId"]),

  posts: defineTable({
    id: v.number(),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.optional(v.union(v.string(), v.null())),
    coverImage: v.optional(v.union(v.string(), v.null())),
    tags: v.array(v.string()),
    published: v.boolean(),
    metaTitle: v.optional(v.union(v.string(), v.null())),
    metaDescription: v.optional(v.union(v.string(), v.null())),
    metaKeywords: v.array(v.string()),
    authorId: v.optional(v.union(v.string(), v.null())),
    authorName: v.optional(v.union(v.string(), v.null())),
    publishedAt: v.optional(v.union(v.string(), v.null())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_slug", ["slug"]),

  gallery: defineTable({
    id: v.number(),
    url: v.string(),
    title: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.union(v.string(), v.null())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
  .index("by_numeric_id", ["id"])
  .index("by_url", ["url"]),

  // ── Convex Auth Tables ──
  authUsers: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
  .index("by_email", ["email"]),

  authSessions: defineTable({
    userId: v.id("authUsers"),
    token: v.string(),
    createdAt: v.string(),
    expiresAt: v.string(),
  })
  .index("by_token", ["token"])
  .index("by_userId", ["userId"]),
  });
