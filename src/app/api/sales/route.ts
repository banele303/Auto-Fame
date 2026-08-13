import { NextRequest, NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';
import { verifyAuth } from '@/lib/auth';

// GET handler for sales with filtering
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'SALES_ASSOCIATE']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;
    const carIdStr = searchParams.get('carId');
    const dealershipIdStr = searchParams.get('dealershipId');

    const carId = carIdStr ? parseInt(carIdStr) : undefined;
    const dealershipId = dealershipIdStr ? parseInt(dealershipIdStr) : undefined;

    try {
      const sales = await convexClient.query("transactions:getSales", {
        customerId,
        employeeId,
        carId,
        dealershipId,
      });
      return NextResponse.json(sales || []);
    } catch (convexErr: any) {
      console.warn("Convex getSales error, returning empty array:", convexErr?.message);
      return NextResponse.json([]);
    }
  } catch (err: any) {
    console.error("Error retrieving sales:", err);
    return NextResponse.json([]);
  }
}

// POST handler for creating a new sale
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'SALES_ASSOCIATE']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { carId, customerId, employeeId, dealershipId, salePrice, downPayment, tradeInValue, financingId } = body;

    if (!carId || !customerId || !employeeId || !dealershipId || !salePrice) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newSale = await convexClient.mutation("transactions:createSale", {
      carId: parseInt(carId),
      customerId,
      employeeId,
      dealershipId: parseInt(dealershipId),
      salePrice: parseFloat(salePrice),
      downPayment: downPayment ? parseFloat(downPayment) : 0,
      tradeInValue: tradeInValue ? parseFloat(tradeInValue) : 0,
      financingId: financingId ? parseInt(financingId) : undefined,
    });

    return NextResponse.json(newSale, { status: 201 });
  } catch (err: any) {
    console.error("Error creating sale:", err);
    return NextResponse.json({ message: `Error creating sale: ${err.message}` }, { status: 500 });
  }
}
