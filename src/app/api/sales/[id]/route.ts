import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET a specific sale by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'SALES_ASSOCIATE']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid sale ID" }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { car: true, customer: true, employee: true, dealership: true, financing: true },
    });

    if (!sale) {
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });
    }

    // Additional authorization: ensure the user has the right to view this sale
    // For example, a sales associate can only see their own sales.
    if (authResult.userRole === 'SALES_ASSOCIATE' && sale.employeeId !== authResult.userId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(sale);
  } catch (err: any) {
    console.error("Error retrieving sale:", err);
    return NextResponse.json({ message: `Error retrieving sale: ${err.message}` }, { status: 500 });
  }
}

// PUT to update a sale
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid sale ID" }, { status: 400 });
    }

    const existingSale = await prisma.sale.findUnique({ where: { id } });
    if (!existingSale) {
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });
    }

    const body = await request.json();
    const { salePrice, downPayment, tradeInValue, deliveryDate, financingId } = body;

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        downPayment: downPayment ? parseFloat(downPayment) : undefined,
        tradeInValue: tradeInValue ? parseFloat(tradeInValue) : undefined,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        financingId: financingId ? parseInt(financingId) : undefined,
      },
      include: { car: true, customer: true, employee: true, dealership: true, financing: true },
    });

    return NextResponse.json(updatedSale);
  } catch (err: any) {
    console.error("Error updating sale:", err);
    return NextResponse.json({ message: `Error updating sale: ${err.message}` }, { status: 500 });
  }
}

// DELETE a sale (potentially for cancellation/reversal)
// Note: Deleting a sale might have complex business logic, e.g., reverting car status.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid sale ID" }, { status: 400 });
    }

    const existingSale = await prisma.sale.findUnique({ where: { id } });
    if (!existingSale) {
      return NextResponse.json({ message: "Sale not found" }, { status: 404 });
    }

    // Transaction to delete the sale and revert the car's status to AVAILABLE
    const [deletedSale, updatedCar] = await prisma.$transaction([
        prisma.sale.delete({ where: { id } }),
        prisma.car.update({
            where: { id: existingSale.carId },
            data: { status: 'AVAILABLE' },
        })
    ]);

    return NextResponse.json({ message: "Sale deleted and car status reverted successfully", id });
  } catch (err: any) {
    console.error("Error deleting sale:", err);
    return NextResponse.json({ message: `Error deleting sale: ${err.message}` }, { status: 500 });
  }
}
