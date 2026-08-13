import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for review creation
const createReviewSchema = z.object({
  carId: z.number().int().positive("Car ID must be a positive integer"),
  customerId: z.string().min(1, "Customer ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().min(1, "Title is required"),
  comment: z.string().min(1, "Comment is required"),
  customerName: z.string().min(1, "Customer name is required").optional(),
  customerEmail: z.string().email("Valid email is required").optional(),
});

// GET all reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get("carId");
    const customerId = searchParams.get("customerId");
    const rating = searchParams.get("rating");

    const whereClause: any = {};
    
    if (carId) {
      whereClause.carId = parseInt(carId);
    }
    if (customerId) {
      whereClause.customerId = customerId;
    }
    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            dealership: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        reviewDate: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Reviews GET: Error fetching reviews", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST create a new review
export async function POST(request: NextRequest) {
  try {
    console.log("Review POST: Request received");
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Check content type
    const contentType = request.headers.get('content-type');
    console.log("Content-Type:", contentType);
    
    // Read the request body
    const text = await request.text();
    console.log("Raw request body:", text);
    console.log("Request body length:", text.length);
    
    if (!text || text.length === 0) {
      console.log("Empty request body detected");
      return NextResponse.json(
        { error: "Request body is empty" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = JSON.parse(text);
      console.log("Parsed JSON body:", body);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed to parse text:", text);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    // Validate the request body
    const validatedData = createReviewSchema.parse(body);
    console.log("Validated data:", validatedData);
    
    let customerId = validatedData.customerId;
    
    // Handle temporary customer creation if needed
    if (validatedData.customerId.startsWith("temp-customer-")) {
      // For temporary customers, we'll create a customer record first
      if (!validatedData.customerName || !validatedData.customerEmail) {
        return NextResponse.json(
          { error: "Customer name and email are required for new customers" },
          { status: 400 }
        );
      }
      
      // Check if customer with this email already exists
      const existingCustomer = await prisma.customer.findFirst({
        where: { email: validatedData.customerEmail },
      });
      
      if (existingCustomer) {
        customerId = existingCustomer.cognitoId;
      } else {
        // Create a new customer
        const newCustomer = await prisma.customer.create({
          data: {
            cognitoId: `guest-${Date.now()}`, // Generate a unique ID for guest customers
            name: validatedData.customerName,
            email: validatedData.customerEmail,
            phoneNumber: "", // Default empty phone number
            address: "", // Default empty address
            city: "", // Default empty city
            state: "", // Default empty state
            postalCode: "", // Default empty postal code
          },
        });
        customerId = newCustomer.cognitoId;
      }
    } else {
      // Check if customer exists for non-temporary customers
      const customer = await prisma.customer.findUnique({
        where: { cognitoId: validatedData.customerId },
      });
      
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }
    }

    // Check if car exists
    const car = await prisma.car.findUnique({
      where: { id: validatedData.carId },
    });
    
    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    // Check if customer has already reviewed this car
    const existingReview = await prisma.review.findUnique({
      where: {
        carId_customerId: {
          carId: validatedData.carId,
          customerId: customerId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this car" },
        { status: 400 }
      );
    }

    // Create the review
    const newReview = await prisma.review.create({
      data: {
        carId: validatedData.carId,
        customerId: customerId,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
      },
      include: {
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            dealership: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update car's average rating and review count
    const reviews = await prisma.review.findMany({
      where: { carId: validatedData.carId },
      select: { rating: true },
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await prisma.car.update({
      where: { id: validatedData.carId },
      data: {
        averageRating: averageRating,
        numberOfReviews: reviews.length,
      },
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error("Reviews POST: Error creating review", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
