import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin', 'manager']);
    
    // Check if user is authenticated and has required role
    if (!authResult.isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: authResult.message || 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get limit from query parameters with a default of 5
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    
    // Get page from query parameters with a default of 1
    const pageParam = url.searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    
    // Get search term and status filter
    const searchTerm = url.searchParams.get('search') || '';
    const statusFilter = url.searchParams.get('status') || '';
    
    // Build the filter object
    const filters: any = {};
    
    // Add status filter if provided and not 'all'
    if (statusFilter && statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    
    // Add search filter if provided
    if (searchTerm) {
      filters.OR = [
        {
          customer: {
            name: { contains: searchTerm, mode: 'insensitive' }
          }
        },
        {
          details: {
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }
    
    // Get recent financing applications with related data; tolerate missing documents table
    let applications;
    try {
      applications = await prisma.financingApplication.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: filters,
        orderBy: { applicationDate: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          details: { select: { firstName: true, lastName: true, extraData: true } },
          sale: { include: { car: { select: { make: true, model: true, year: true } } } },
          documents: true,
        }
      });
    } catch (err: any) {
      const code = err?.code;
      if (code === 'P2021' || code === 'P2022') {
        console.warn('[Admin Financing] Documents relation unavailable, retrying without it. Code:', code);
        applications = await prisma.financingApplication.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where: filters,
          orderBy: { applicationDate: 'desc' },
          include: {
            customer: { select: { name: true, email: true } },
            details: { select: { firstName: true, lastName: true, extraData: true } },
            sale: { include: { car: { select: { make: true, model: true, year: true } } } },
          }
        });
      } else {
        throw err;
      }
    }
    
    // Transform the data for the frontend
    const formattedApplications = applications.map(app => {
      // Get customer name from details if available, otherwise from customer record
      const customerName = app.details 
        ? `${app.details.firstName || ''} ${app.details.lastName || ''}`.trim()
        : app.customer.name || 'Unknown Customer';
      
      // Create comprehensive vehicle information
      let carModel = '';
      
      // First check if vehicle info is in the sale relationship
      if (app.sale?.car) {
        const { make, model, year } = app.sale.car;
        carModel = `${year || ''} ${make || ''} ${model || ''}`.trim();
      }
      
      // If no vehicle in sale, check extraData for vehicle details
      if (!carModel && app.details?.extraData) {
        const extraData = app.details.extraData as any;
        
        // Check for various vehicle field formats in extraData
        const vehicleMake = extraData.vehicleMake || extraData.vehicle_make || extraData.make;
        const vehicleModel = extraData.vehicleModel || extraData.vehicle_model || extraData.model;
        const vehicleYear = extraData.vehicleYear || extraData.vehicle_year || extraData.year;
        
        if (vehicleMake || vehicleModel || vehicleYear) {
          carModel = `${vehicleYear || ''} ${vehicleMake || ''} ${vehicleModel || ''}`.trim();
        }
      }
      
      const docCount = (app as any).documents ? (app as any).documents.length || 0 : 0;
      return {
        id: app.id,
        customerName,
        customerEmail: app.customer.email,
        applicationDate: app.applicationDate.toISOString(),
        amount: app.loanAmount,
        status: app.status,
        creditScore: app.creditScore || null,
        termMonths: app.termMonths,
        monthlyPayment: app.monthlyPayment,
        interestRate: app.interestRate,
        carModel: carModel || 'Vehicle not specified',
        documentCount: docCount
      };
    });

    return NextResponse.json(formattedApplications);
    
  } catch (error) {
    console.error('Error fetching financing applications:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', detail: process.env.NODE_ENV !== 'production' ? (error as any)?.message : undefined }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['admin', 'manager']);
    
    // Check if user is authenticated and has required role
    if (!authResult.isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: authResult.message || 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const {
      customerId,
      loanAmount,
      termMonths,
      interestRate,
      monthlyPayment,
      creditScore,
      annualIncome,
      applicationDate,
      status
    } = body;
    
    // Validate required fields
    if (!customerId || !loanAmount || !termMonths || !interestRate || !monthlyPayment) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }
    
    // Create the financing application
    const financingApplication = await prisma.financingApplication.create({
      data: {
        customerId,
        loanAmount,
        termMonths,
        interestRate,
        monthlyPayment,
        creditScore,
        annualIncome,
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
        status: status || 'PENDING'
      }
    });
    
    return NextResponse.json(financingApplication, { status: 201 });
    
  } catch (error) {
    console.error('Error creating financing application:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
