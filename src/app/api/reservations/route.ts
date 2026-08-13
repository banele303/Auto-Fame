import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating car reservation request
const reservationSchema = z.object({
  carId: z.number().int().positive(),
  customerId: z.string().min(1, "Customer ID is required"),
  dealershipId: z.number().int().positive(),
  employeeId: z.string().optional(),
  contactInfo: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }),
  financing: z.object({
    financingOption: z.enum(["cash", "financing", "lease"]),
    downPayment: z.number().min(0).optional(),
    monthlyIncome: z.number().min(0).optional(),
    employmentStatus: z.string().optional(),
  }).optional(),
  tradeIn: z.object({
    hasTradeIn: z.boolean(),
    tradeInDetails: z.string().optional(),
  }).optional(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const validatedData = reservationSchema.parse(body);

    // Check if the car exists and is available
    const car = await prisma.car.findUnique({
      where: { id: validatedData.carId },
      include: { dealership: true },
    });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Car is not available for reservation" }, { status: 400 });
    }

    // Create or find customer record
    let customerId = validatedData.customerId;
    
    // If contact info is provided, create a customer record
    if (validatedData.contactInfo) {
      const { firstName, lastName, email, phone } = validatedData.contactInfo;
      
      // Generate a unique customer ID from email
      const generatedCustomerId = `customer_${email.replace(/[@.]/g, '_')}`;
      
      // Try to find existing customer by email or create new one
      const existingCustomer = await prisma.customer.findFirst({
        where: { email: email }
      });
      
      if (existingCustomer) {
        customerId = existingCustomer.cognitoId;
      } else {
        // Create new customer record
        const newCustomer = await prisma.customer.create({
          data: {
            cognitoId: generatedCustomerId,
            name: `${firstName} ${lastName}`,
            email: email,
            phoneNumber: phone,
            address: validatedData.contactInfo.address,
            city: validatedData.contactInfo.city,
            state: validatedData.contactInfo.state,
            postalCode: validatedData.contactInfo.zipCode,
          }
        });
        customerId = newCustomer.cognitoId;
      }
    }

    // Create an inquiry record to track the reservation interest
    const inquiry = await prisma.inquiry.create({
      data: {
        carId: validatedData.carId,
        customerId: customerId,
        dealershipId: validatedData.dealershipId,
        employeeId: validatedData.employeeId,
        message: `Car reservation request: ${validatedData.notes || "No additional notes"}`,
        status: "NEW",
      },
      include: {
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            price: true,
            photoUrls: true,
          },
        },
        dealership: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Update car status to reserved
    await prisma.car.update({
      where: { id: validatedData.carId },
      data: { status: "RESERVED" },
    });

    return NextResponse.json({
      message: "Car reserved successfully",
      inquiry,
      contactInfo: validatedData.contactInfo,
      financing: validatedData.financing,
      tradeIn: validatedData.tradeIn,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");
    const carId = url.searchParams.get("carId");

    const whereClause: any = {};
    
    if (customerId) {
      whereClause.customerId = customerId;
    }
    
    if (carId) {
      whereClause.carId = parseInt(carId);
    }

    // Get inquiries that are effectively reservations
    const reservations = await prisma.inquiry.findMany({
      where: {
        ...whereClause,
        message: {
          startsWith: "Car reservation request:",
        },
      },
      include: {
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            price: true,
            photoUrls: true,
            status: true,
          },
        },
        dealership: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        inquiryDate: "desc",
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
