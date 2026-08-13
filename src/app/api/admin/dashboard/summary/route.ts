import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    
    // Check if user is authenticated and is an admin
    if (!authResult.isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get current date and date 30 days ago for monthly calculations
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);
    
    // Fetch overall stats
    const [
      salesCount,
      totalSales,
      currentMonthSales,
      previousMonthSales,
      customerCount,
      currentMonthCustomers,
      previousMonthCustomers,
      inventory,
      inquiryCount,
      testDriveCount,
      financingCount
    ] = await Promise.all([
      // Total sales count
      prisma.sale.count(),
      
      // Total sales revenue
      prisma.sale.aggregate({
        _sum: {
          salePrice: true
        }
      }),
      
      // Current month sales
      prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: thirtyDaysAgo
          }
        },
        _count: true,
        _sum: {
          salePrice: true
        }
      }),
      
      // Previous month sales
      prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        },
        _count: true,
        _sum: {
          salePrice: true
        }
      }),
      
      // Total customers
      prisma.customer.count(),
      
      // Current month new customers
      prisma.customer.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Previous month new customers
      prisma.customer.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Current inventory
      prisma.car.count({
        where: {
          status: 'AVAILABLE'
        }
      }),
      
      // Active inquiries (statuses considered active: NEW, CONTACTED, SCHEDULED)
      prisma.inquiry.count({
        where: {
          status: { in: ['NEW','CONTACTED','SCHEDULED'] }
        }
      }),
      
      // Upcoming test drives
      prisma.testDrive.count({
        where: {
          scheduledDate: {
            gte: currentDate,
            lte: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }
      }),
      
      // Pending financing applications
      prisma.financingApplication.count({
        where: {
          status: 'PENDING'
        }
      })
    ]);

    // Normalize aggregate outputs (Prisma returns null when no rows match)
    const currentMonthSaleCount = (currentMonthSales as any)._count || 0;
    const previousMonthSaleCount = (previousMonthSales as any)._count || 0;
    const currentMonthRevenue = (currentMonthSales as any)._sum?.salePrice || 0;
    const previousMonthRevenue = (previousMonthSales as any)._sum?.salePrice || 0;

    // Calculate growth percentages with safe division
    const salesGrowth = previousMonthSaleCount > 0
      ? ((currentMonthSaleCount - previousMonthSaleCount) / previousMonthSaleCount) * 100
      : (currentMonthSaleCount > 0 ? 100 : 0);
    
    const revenueGrowth = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : (currentMonthRevenue > 0 ? 100 : 0);
    
    const customerGrowth = previousMonthCustomers > 0
      ? ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100
      : (currentMonthCustomers > 0 ? 100 : 0);

    return NextResponse.json({
  salesCount,
  revenue: (totalSales as any)._sum?.salePrice || 0,
      customers: customerCount,
      inventory,
      monthlyGrowth: {
        sales: Math.round(salesGrowth * 10) / 10, // Round to 1 decimal place
        revenue: Math.round(revenueGrowth * 10) / 10,
        customers: Math.round(customerGrowth * 10) / 10,
      },
      inquiries: inquiryCount,
      testDrives: testDriveCount,
      financingApplications: financingCount,
    });
    
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
