import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// PUT handler for updating employee status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cognitoId, status } = body;

    if (!cognitoId || !status) {
      return NextResponse.json({ message: "Missing required fields: cognitoId and status" }, { status: 400 });
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { cognitoId } });
    if (!existingEmployee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { cognitoId },
      data: { status: status as any },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error("Error updating employee status:", error);
    return NextResponse.json({ message: `Error updating employee status: ${error.message}` }, { status: 500 });
  }
}
