import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for validating test drive request
const testDriveSchema = z.object({
  carId: z.number().int().positive(),
  customerId: z.string().min(1, "Customer ID is required"),
  scheduledDate: z.string().datetime(),
  dealershipId: z.number().int().positive(),
  notes: z.string().optional().nullable(),
  contactInfo: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone number is required"),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = testDriveSchema.parse(body);

    // Check if the car exists and is available
    const car = await prisma.car.findUnique({
      where: { id: validatedData.carId },
      include: { dealership: true },
    });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    if (car.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Car is not available for test drive" }, { status: 400 });
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
          }
        });
        customerId = newCustomer.cognitoId;
      }
    }

    // Create the test drive record
    const testDrive = await prisma.testDrive.create({
      data: {
        carId: validatedData.carId,
        customerId: customerId,
        scheduledDate: new Date(validatedData.scheduledDate),
        dealershipId: validatedData.dealershipId,
        notes: validatedData.notes,
        completed: false,
      },
      include: {
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            price: true,
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

    return NextResponse.json({
      message: "Test drive scheduled successfully",
      testDrive,
    });
  } catch (error) {
    console.error("Error scheduling test drive:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to schedule test drive" },
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

    const testDrives = await prisma.testDrive.findMany({
      where: whereClause,
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
      orderBy: {
        scheduledDate: "desc",
      },
    });

    return NextResponse.json(testDrives);
  } catch (error) {
    console.error("Error fetching test drives:", error);
    return NextResponse.json(
      { error: "Failed to fetch test drives" },
      { status: 500 }
    );
  }
}
