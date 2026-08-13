import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET a specific inquiry by ID
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'SALES_ASSOCIATE', 'USER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid inquiry ID" }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { car: true, customer: true, employee: true, dealership: true },
    });

    if (!inquiry) {
      return NextResponse.json({ message: "Inquiry not found" }, { status: 404 });
    }

    // Authorization: Only admin, sales manager, the assigned employee, or the customer who made the inquiry can view
    if (authResult.userRole === 'SALES_ASSOCIATE' && inquiry.employeeId !== authResult.userId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (authResult.userRole === 'USER' && inquiry.customerId !== authResult.userId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(inquiry);
  } catch (err: any) {
    console.error("Error retrieving inquiry:", err);
    return NextResponse.json({ message: `Error retrieving inquiry: ${err.message}` }, { status: 500 });
  }
}

// PUT to update an inquiry
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'SALES_ASSOCIATE']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid inquiry ID" }, { status: 400 });
    }

    const existingInquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!existingInquiry) {
      return NextResponse.json({ message: "Inquiry not found" }, { status: 404 });
    }

    // Authorization: Only admin, sales manager, or the assigned employee can update
    if (authResult.userRole === 'SALES_ASSOCIATE' && existingInquiry.employeeId !== authResult.userId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { message, status, followUpDate, employeeId } = body;

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        message: message || undefined,
        status: status || undefined,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        employeeId: employeeId || undefined,
      },
      include: { car: true, customer: true, employee: true, dealership: true },
    });

    return NextResponse.json(updatedInquiry);
  } catch (err: any) {
    console.error("Error updating inquiry:", err);
    return NextResponse.json({ message: `Error updating inquiry: ${err.message}` }, { status: 500 });
  }
}

// PATCH to partially update an inquiry
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'SALES_ASSOCIATE']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid inquiry ID" }, { status: 400 });
    }

    const existingInquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!existingInquiry) {
      return NextResponse.json({ message: "Inquiry not found" }, { status: 404 });
    }

    // Authorization: Only admin, sales manager, or the assigned employee can update
    if (authResult.userRole === 'SALES_ASSOCIATE' && existingInquiry.employeeId !== authResult.userId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { message, status, followUpDate, employeeId } = body;

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        message: message !== undefined ? message : undefined,
        status: status !== undefined ? status : undefined,
        followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : undefined,
        employeeId: employeeId !== undefined ? employeeId : undefined,
      },
      include: { car: true, customer: true, employee: true, dealership: true },
    });

    return NextResponse.json(updatedInquiry);
  } catch (err: any) {
    console.error("Error updating inquiry:", err);
    return NextResponse.json({ message: `Error updating inquiry: ${err.message}` }, { status: 500 });
  }
}

// DELETE an inquiry
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid inquiry ID" }, { status: 400 });
    }

    const existingInquiry = await prisma.inquiry.findUnique({ where: { id } });
    if (!existingInquiry) {
      return NextResponse.json({ message: "Inquiry not found" }, { status: 404 });
    }

    await prisma.inquiry.delete({ where: { id } });

    return NextResponse.json({ message: "Inquiry deleted successfully", id });
  } catch (err: any) {
    console.error("Error deleting inquiry:", err);
    return NextResponse.json({ message: `Error deleting inquiry: ${err.message}` }, { status: 500 });
  }
}
