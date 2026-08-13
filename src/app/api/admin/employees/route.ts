import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for all employees (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const employees = await prisma.employee.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error("Error retrieving employees:", error);
    return NextResponse.json(
      { message: `Error retrieving employees: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating new employees (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phoneNumber, role, dealershipId, commission } = body;

    // Validate required fields
    if (!name || !email || !phoneNumber || !role || !dealershipId) {
      return NextResponse.json(
        { message: 'Missing required fields: name, email, phoneNumber, role, dealershipId' },
        { status: 400 }
      );
    }

    // Check if employee with this email already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: { email }
    });

    if (existingEmployee) {
      return NextResponse.json(
        { message: 'Employee with this email already exists' },
        { status: 409 }
      );
    }

    // Generate a unique cognitoId (for now, we'll use a UUID-like string)
    const cognitoId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the employee
    const newEmployee = await prisma.employee.create({
      data: {
        cognitoId,
        name,
        email,
        phoneNumber,
        role: role as any, // Cast to enum type
        dealershipId: Number(dealershipId),
        commission: Number(commission) || 0,
        status: 'ACTIVE'
      },
      include: {
        dealership: true
      }
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { message: `Error creating employee: ${error.message}` },
      { status: 500 }
    );
  }
}
