import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for a specific customer
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 });
    }

    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated || (authResult.userRole !== 'ADMIN' && authResult.userId !== id)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { cognitoId: id },
      include: {
        favorites: true,
        inquiries: true,
        testDrives: true,
        sales: true,
        reviews: true,
        financingApps: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (err: any) {
    console.error("Error retrieving customer:", err);
    return NextResponse.json({ message: `Error retrieving customer: ${err.message}` }, { status: 500 });
  }
}

// PUT handler for updating a customer
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 });
    }

    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated || (authResult.userRole !== 'ADMIN' && authResult.userId !== id)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { cognitoId: id } });
    if (!existingCustomer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const body = await request.json();
    const { email, name, phoneNumber, address, city, state, postalCode, dateOfBirth } = body;

    const updatedCustomer = await prisma.customer.update({
      where: { cognitoId: id },
      data: {
        email,
        name,
        phoneNumber,
        address,
        city,
        state,
        postalCode,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (err: any) {
    console.error("Error updating customer:", err);
    return NextResponse.json({ message: `Error updating customer: ${err.message}` }, { status: 500 });
  }
}

// DELETE handler for deleting a customer (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 });
    }

    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { cognitoId: id } });
    if (!existingCustomer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    await prisma.customer.delete({ where: { cognitoId: id } });

    return NextResponse.json({ message: "Customer deleted successfully", id });
  } catch (err: any) {
    console.error("Error deleting customer:", err);
    return NextResponse.json({ message: `Error deleting customer: ${err.message}` }, { status: 500 });
  }
}
