import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET all financing applications
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

  const financingApplications = await prisma.financingApplication.findMany({
      where: whereClause,
      include: {
        customer: true,
        sale: {
          include: {
            car: true,
            employee: true,
            dealership: true
          }
    },
    documents: true
      },
      orderBy: {
        applicationDate: 'desc'
      }
    });

    return NextResponse.json(financingApplications);
  } catch (err: any) {
    console.error("Error fetching financing applications:", err);
    return NextResponse.json({ message: `Error fetching financing applications: ${err.message}` }, { status: 500 });
  }
}

// POST create new financing application
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER', 'SALES_ASSOCIATE']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      loanAmount, 
      interestRate, 
      termMonths, 
      monthlyPayment, 
      customerId, 
      creditScore, 
      annualIncome 
    } = body;

    // Validate required fields
    if (!loanAmount || !interestRate || !termMonths || !monthlyPayment || !customerId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { cognitoId: customerId }
    });

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const financingApplication = await prisma.financingApplication.create({
      data: {
        loanAmount: parseFloat(loanAmount),
        interestRate: parseFloat(interestRate),
        termMonths: parseInt(termMonths),
        monthlyPayment: parseFloat(monthlyPayment),
        customerId,
        creditScore: creditScore ? parseInt(creditScore) : null,
        annualIncome: annualIncome ? parseFloat(annualIncome) : null,
        status: 'PENDING'
      },
      include: {
        customer: true,
        sale: {
          include: {
            car: true,
            employee: true,
            dealership: true
          }
        }
      }
    });

    return NextResponse.json(financingApplication, { status: 201 });
  } catch (err: any) {
    console.error("Error creating financing application:", err);
    return NextResponse.json({ message: `Error creating financing application: ${err.message}` }, { status: 500 });
  }
}
