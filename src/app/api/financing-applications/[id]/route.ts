import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET a specific financing application by ID
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid financing application ID" }, { status: 400 });
    }

    const financingApplication = await prisma.financingApplication.findUnique({
      where: { id },
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

    if (!financingApplication) {
      return NextResponse.json({ message: "Financing application not found" }, { status: 404 });
    }

    return NextResponse.json(financingApplication);
  } catch (err: any) {
    console.error("Error retrieving financing application:", err);
    return NextResponse.json({ message: `Error retrieving financing application: ${err.message}` }, { status: 500 });
  }
}

// PATCH to update a financing application
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid financing application ID" }, { status: 400 });
    }

    const existingApplication = await prisma.financingApplication.findUnique({ where: { id } });
    if (!existingApplication) {
      return NextResponse.json({ message: "Financing application not found" }, { status: 404 });
    }

    const body = await request.json();
    const { 
      loanAmount, 
      interestRate, 
      termMonths, 
      monthlyPayment, 
      status, 
      creditScore, 
      annualIncome,
      approvalDate 
    } = body;

    const updateData: any = {};
    if (loanAmount !== undefined) updateData.loanAmount = parseFloat(loanAmount);
    if (interestRate !== undefined) updateData.interestRate = parseFloat(interestRate);
    if (termMonths !== undefined) updateData.termMonths = parseInt(termMonths);
    if (monthlyPayment !== undefined) updateData.monthlyPayment = parseFloat(monthlyPayment);
    if (status !== undefined) updateData.status = status;
    if (creditScore !== undefined) updateData.creditScore = creditScore ? parseInt(creditScore) : null;
    if (annualIncome !== undefined) updateData.annualIncome = annualIncome ? parseFloat(annualIncome) : null;
    if (approvalDate !== undefined) updateData.approvalDate = approvalDate ? new Date(approvalDate) : null;

    // If status is being set to APPROVED, set approval date
    if (status === 'APPROVED' && !approvalDate) {
      updateData.approvalDate = new Date();
    }

    const updatedApplication = await prisma.financingApplication.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedApplication);
  } catch (err: any) {
    console.error("Error updating financing application:", err);
    return NextResponse.json({ message: `Error updating financing application: ${err.message}` }, { status: 500 });
  }
}

// DELETE a financing application
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid financing application ID" }, { status: 400 });
    }

    const existingApplication = await prisma.financingApplication.findUnique({ where: { id } });
    if (!existingApplication) {
      return NextResponse.json({ message: "Financing application not found" }, { status: 404 });
    }

    await prisma.financingApplication.delete({ where: { id } });

    return NextResponse.json({ message: "Financing application deleted successfully", id });
  } catch (err: any) {
    console.error("Error deleting financing application:", err);
    return NextResponse.json({ message: `Error deleting financing application: ${err.message}` }, { status: 500 });
  }
}
