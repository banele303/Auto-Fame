import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']); // adjust roles as needed
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current date and date ranges for calculations
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);
    
    // Get financing application statistics
    const [
      totalApplications,
      approvedApplications,
      rejectedApplications,
      pendingApplications,
      totalFinancingAmount,
      currentMonthApplications,
      previousMonthApplications,
  currentMonthApproved,
  previousMonthApproved
    ] = await Promise.all([
      // Total applications
      prisma.financingApplication.count(),
      
      // Approved applications
      prisma.financingApplication.count({
        where: { status: 'APPROVED' }
      }),
      
      // Rejected applications
      prisma.financingApplication.count({
        where: { status: 'REJECTED' }
      }),
      
      // Pending applications
      prisma.financingApplication.count({
        where: { status: 'PENDING' }
      }),
      
      // Total financing amount for approved applications
      prisma.financingApplication.aggregate({
        where: { status: 'APPROVED' },
        _sum: { loanAmount: true }
      }),
      
      // Current month applications
      prisma.financingApplication.count({
        where: {
          applicationDate: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Previous month applications
      prisma.financingApplication.count({
        where: {
          applicationDate: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      
      // Current month approved applications
      prisma.financingApplication.count({
        where: {
          applicationDate: {
            gte: thirtyDaysAgo
          },
          status: 'APPROVED'
        }
      }),
      
      // Previous month approved applications
      prisma.financingApplication.count({
        where: {
          applicationDate: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          },
          status: 'APPROVED'
        }
      }),
      
    ]);

    // NOTE: Schema has no decisionDate / rejection date field. We'll compute processing time only for approved apps using approvalDate.
    const approvedAppsWithDates = await prisma.financingApplication.findMany({
      where: { status: 'APPROVED', approvalDate: { not: null } },
      select: { applicationDate: true, approvalDate: true }
    });
    const totalProcessingDays = approvedAppsWithDates.reduce((acc, app) => {
      if (app.approvalDate) {
        const days = Math.ceil((app.approvalDate.getTime() - app.applicationDate.getTime()) / (1000 * 60 * 60 * 24));
        return acc + (days > 0 ? days : 0);
      }
      return acc;
    }, 0);
    const averageProcessingDays = approvedAppsWithDates.length > 0
      ? totalProcessingDays / approvedAppsWithDates.length
      : 0;
    
    // Calculate growth percentages
    const applicationsGrowth = previousMonthApplications > 0
      ? ((currentMonthApplications - previousMonthApplications) / previousMonthApplications) * 100
      : (currentMonthApplications > 0 ? 100 : 0);
      
    const currentApprovalRate = currentMonthApplications > 0
      ? (currentMonthApproved / currentMonthApplications) * 100
      : 0;
      
    const previousApprovalRate = previousMonthApplications > 0
      ? (previousMonthApproved / previousMonthApplications) * 100
      : 0;
      
    const approvalRateGrowth = previousApprovalRate > 0
      ? ((currentApprovalRate - previousApprovalRate) / previousApprovalRate) * 100
      : (currentApprovalRate > 0 ? 100 : 0);

    return NextResponse.json({
      total: totalApplications,
      approved: approvedApplications,
      rejected: rejectedApplications,
      pending: pendingApplications,
      averageProcessingDays,
  totalFinancingAmount: (totalFinancingAmount as any)._sum?.loanAmount || 0,
      monthlyGrowth: {
        applications: Math.round(applicationsGrowth * 10) / 10, // Round to 1 decimal place
        approvalRate: Math.round(approvalRateGrowth * 10) / 10,
      },
  // NSFAS metrics removed: field isNSFASAccredited not present in current schema
    });
    
  } catch (error) {
    console.error('Error fetching financing statistics:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
