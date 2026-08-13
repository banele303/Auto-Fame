import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for all customers (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const customers = await prisma.customer.findMany();
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Error retrieving customers:", error);
    return NextResponse.json(
      { message: `Error retrieving customers: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating a customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cognitoId, email, name, phoneNumber, address, city, state, postalCode, dateOfBirth } = body;

    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Allow self-registration for customers, or admin/sales manager creating any customer
    const isSelfRegistration = authResult.userId === cognitoId;
    const isAuthorizedAdmin = ['ADMIN', 'SALES_MANAGER'].includes(authResult.userRole || '');
    
    if (!isSelfRegistration && !isAuthorizedAdmin) {
      return NextResponse.json({ message: 'Unauthorized: Can only create your own customer record or must be admin/sales manager' }, { status: 401 });
    }

    if (!cognitoId || !email || !name) {
      return NextResponse.json({ message: "Missing required fields: cognitoId, email, and name are required." }, { status: 400 });
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { cognitoId },
    });

    if (existingCustomer) {
      return NextResponse.json({ message: "Customer already exists", customer: existingCustomer }, { status: 409 });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        cognitoId,
        email,
        name,
        phoneNumber,
        address,
        city,
        state,
        postalCode,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { message: `Error creating customer: ${error.message}` },
      { status: 500 }
    );
  }
}
