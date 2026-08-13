import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for all employees (admin or sales manager only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const employees = await prisma.employee.findMany({
      include: { dealership: true },
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

// POST handler for creating an employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cognitoId, email, name, phoneNumber, role, dealershipId, commission } = body;

    // First check if this is a self-registration (user creating their own record)
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Allow self-registration for employees, or admin/sales manager creating any employee
    const isSelfRegistration = authResult.userId === cognitoId;
    const isAuthorizedAdmin = ['ADMIN', 'SALES_MANAGER'].includes(authResult.userRole || '');
    
    if (!isSelfRegistration && !isAuthorizedAdmin) {
      return NextResponse.json({ message: 'Unauthorized: Can only create your own employee record or must be admin/sales manager' }, { status: 401 });
    }

    if (!cognitoId || !email || !name) {
      return NextResponse.json({ message: "Missing required fields: cognitoId, email, name" }, { status: 400 });
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { cognitoId } });
    if (existingEmployee) {
      return NextResponse.json({ message: "Employee already exists" }, { status: 409 });
    }

    // For self-registration, provide default values if not specified
    const employeeData = {
      cognitoId,
      email,
      name,
      phoneNumber: phoneNumber || '',
      role: role || 'SALES_ASSOCIATE',
      dealershipId: dealershipId ? parseInt(dealershipId) : 1, // Default to first dealership
      commission: commission ? parseFloat(commission) : 0,
      status: 'ACTIVE' as const,
      hireDate: new Date(),
    };

    const newEmployee = await prisma.employee.create({
      data: employeeData,
      include: { dealership: true },
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
