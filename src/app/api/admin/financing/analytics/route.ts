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
    
    // Get the start date for the last 6 months
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5); // 6 months including current month
    sixMonthsAgo.setDate(1); // Start from the 1st day of that month
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
  // Get all financing applications from the last 6 months (include approvalDate for processing time calc)
  const applications = await prisma.financingApplication.findMany({
      where: {
        applicationDate: {
          gte: sixMonthsAgo
        }
      },
      include: {
        customer: {
          select: {
            dateOfBirth: true
          }
        }
      },
      orderBy: {
        applicationDate: 'asc'
      }
    });
    
    // Prepare data for monthly applications chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let monthlyData: Record<string, { applications: number; approved: number; rejected: number }> = {};
    
    // Initialize the last 6 months with zero values
    for (let i = 0; i < 6; i++) {
      const monthIndex = (today.getMonth() - 5 + i + 12) % 12; // Handle January rollover
      monthlyData[monthNames[monthIndex]] = { applications: 0, approved: 0, rejected: 0 };
    }
    
    // Count applications by month
    applications.forEach(app => {
      const monthName = monthNames[app.applicationDate.getMonth()];
      if (monthlyData[monthName]) {
        monthlyData[monthName].applications++;
        
        if (app.status === 'APPROVED') {
          monthlyData[monthName].approved++;
        } else if (app.status === 'REJECTED') {
          monthlyData[monthName].rejected++;
        }
      }
    });
    
    const monthly = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      applications: data.applications,
      approved: data.approved,
      rejected: data.rejected
    }));
    
    // Prepare data for loan amount ranges chart
    const loanRanges = {
      "0-50k": 0,
      "50k-100k": 0,
      "100k-200k": 0,
      "200k+": 0
    };
    
    applications.forEach(app => {
      const loanAmount = app.loanAmount;
      if (loanAmount < 50000) {
        loanRanges["0-50k"]++;
      } else if (loanAmount < 100000) {
        loanRanges["50k-100k"]++;
      } else if (loanAmount < 200000) {
        loanRanges["100k-200k"]++;
      } else {
        loanRanges["200k+"]++;
      }
    });
    
    const totalLoanApplications = Object.values(loanRanges).reduce((sum, count) => sum + count, 0);
    
    const byLoanRange = Object.entries(loanRanges).map(([range, count]) => ({
      loanRange: range,
      count,
      percentage: Math.round((count / totalLoanApplications) * 100)
    }));
    
    // Prepare data for age groups chart
    const ageGroups = {
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "45+": 0
    };
    
    applications.forEach(app => {
      if (app.customer.dateOfBirth) {
        const age = calculateAge(app.customer.dateOfBirth);
        if (age < 26) {
          ageGroups["18-25"]++;
        } else if (age < 36) {
          ageGroups["26-35"]++;
        } else if (age < 46) {
          ageGroups["36-45"]++;
        } else {
          ageGroups["45+"]++;
        }
      }
    });
    
    const totalByAge = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);
    
    const byAgeGroup = Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: totalByAge > 0 ? Math.round((count / totalByAge) * 100) : 0
    }));
    
    // Prepare data for approval rate timeline
    const approvalRates: Record<string, { total: number; approved: number }> = {};
    
    // Initialize the last 6 months with zero values
    for (let i = 0; i < 6; i++) {
      const monthIndex = (today.getMonth() - 5 + i + 12) % 12; // Handle January rollover
      approvalRates[monthNames[monthIndex]] = { total: 0, approved: 0 };
    }
    
    applications.forEach(app => {
      const monthName = monthNames[app.applicationDate.getMonth()];
      if (approvalRates[monthName]) {
        approvalRates[monthName].total++;
        if (app.status === 'APPROVED') {
          approvalRates[monthName].approved++;
        }
      }
    });
    
    const approvalRateTimeline = Object.entries(approvalRates).map(([month, data]) => ({
      month,
      approvalRate: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0
    }));
    
    // Summary metrics
    const total = applications.length;
    const approved = applications.filter(a => a.status === 'APPROVED').length;
    const rejected = applications.filter(a => a.status === 'REJECTED').length;
    const pending = applications.filter(a => a.status === 'PENDING').length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const averageLoanAmount = total > 0 ? Math.round(applications.reduce((sum, a) => sum + a.loanAmount, 0) / total) : 0;
    const processingDurations: number[] = applications
      .filter(a => a.approvalDate && a.status !== 'PENDING')
      .map(a => (a.approvalDate!.getTime() - a.applicationDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageProcessingDays = processingDurations.length
      ? Number((processingDurations.reduce((s,d)=>s+d,0) / processingDurations.length).toFixed(1))
      : 0;

    return NextResponse.json({
      monthly,
      byLoanRange,
      byAgeGroup,
      approvalRateTimeline,
      summary: {
        total,
        approved,
        rejected,
        pending,
        approvalRate,
        averageLoanAmount,
        averageProcessingDays
      }
    });
    
  } catch (error) {
    console.error('Error fetching financing analytics:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDifference = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}
