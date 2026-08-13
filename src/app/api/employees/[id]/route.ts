import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for a specific employee
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "Invalid employee ID" }, { status: 400 });
    }

    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Allow admins, sales managers, or the employee themselves to access the data
    if (authResult.userRole !== 'ADMIN' && authResult.userRole !== 'SALES_MANAGER' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({
      where: { cognitoId: id },
      include: { dealership: true, managedCars: true, inquiries: true, testDrives: true, sales: true },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (err: any) {
    console.error("Error retrieving employee:", err);
    return NextResponse.json({ message: `Error retrieving employee: ${err.message}` }, { status: 500 });
  }
}

// PUT handler for updating an employee
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "Invalid employee ID" }, { status: 400 });
    }

    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (authResult.userRole !== 'ADMIN' && authResult.userRole !== 'SALES_MANAGER' && authResult.userId !== id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { cognitoId: id } });
    if (!existingEmployee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const body = await request.json();
    const { email, name, phoneNumber, role, status, commission, dealershipId } = body;

    const updatedEmployee = await prisma.employee.update({
      where: { cognitoId: id },
      data: {
        email,
        name,
        phoneNumber,
        role,
        status,
        commission: commission ? parseFloat(commission) : undefined,
        dealershipId: dealershipId ? parseInt(dealershipId) : undefined,
      },
      include: { dealership: true },
    });

    return NextResponse.json(updatedEmployee);
  } catch (err: any) {
    console.error("Error updating employee:", err);
    return NextResponse.json({ message: `Error updating employee: ${err.message}` }, { status: 500 });
  }
}

// DELETE handler for deleting an employee (admin or sales manager only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "Invalid employee ID" }, { status: 400 });
    }

    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { cognitoId: id } });
    if (!existingEmployee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    await prisma.employee.delete({ where: { cognitoId: id } });

    return NextResponse.json({ message: "Employee deleted successfully", id });
  } catch (err: any) {
    console.error("Error deleting employee:", err);
    return NextResponse.json({ message: `Error deleting employee: ${err.message}` }, { status: 500 });
  }
}
