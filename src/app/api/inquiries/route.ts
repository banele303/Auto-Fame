import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for inquiries with filtering
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'SALES_ASSOCIATE']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const employeeId = searchParams.get('employeeId');
    const carId = searchParams.get('carId');
    const dealershipId = searchParams.get('dealershipId');
    const status = searchParams.get('status');

    const query: any = {
      where: {},
      include: { car: true, customer: true, employee: true, dealership: true },
      orderBy: { inquiryDate: 'desc' },
    };

    if (customerId) query.where.customerId = customerId;
    if (employeeId) query.where.employeeId = employeeId;
    if (carId) query.where.carId = parseInt(carId);
    if (dealershipId) query.where.dealershipId = parseInt(dealershipId);
    if (status && status !== 'all') query.where.status = status as any;

    // Role-based access control
    if (authResult.userRole === 'SALES_ASSOCIATE') {
        query.where.employeeId = authResult.userId;
    }

    const inquiries = await prisma.inquiry.findMany(query);
    return NextResponse.json(inquiries);

  } catch (err: any) {
    console.error("Error retrieving inquiries:", err);
    return NextResponse.json({ message: `Error retrieving inquiries: ${err.message}` }, { status: 500 });
  }
}

// POST handler for creating a new inquiry
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { carId, customerId, message, dealershipId, employeeId } = body;

    if (!carId || !customerId || !message || !dealershipId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newInquiry = await prisma.inquiry.create({
      data: {
        carId: parseInt(carId),
        customerId,
        message,
        dealershipId: parseInt(dealershipId),
        employeeId, // Can be null if not assigned immediately
      },
      include: { car: true, customer: true, employee: true, dealership: true },
    });

    return NextResponse.json(newInquiry, { status: 201 });

  } catch (err: any) {
    console.error("Error creating inquiry:", err);
    return NextResponse.json({ message: `Error creating inquiry: ${err.message}` }, { status: 500 });
  }
}
