import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

interface SummaryResponse {
  stats: {
    totalCars: number;
    monthlySales: number;
    monthlyRevenue: number;
    activeCustomers: number;
    weekTestDrives: number;
    weekInquiries: number;
    financingApplications: number;
    avgRating: number;
  };
  salesTrend: { month: string; sales: number; revenue: number }[];
  inventoryDistribution: { category: string; count: number; color: string }[];
  weeklyActivity: { day: string; inquiries: number; testDrives: number }[];
  topPerformers: { name: string; sales: number; revenue: number }[];
}

const INVENTORY_COLORS = ['#00acee','#0099d4','#0066cc','#004499','#003366','#001a33'];

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ["ADMIN","SALES_MANAGER","FINANCE_MANAGER"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59,999);

    // Week (Mon-Sun)
    const weekStart = new Date(now);
    const day = weekStart.getDay(); // 0=Sun
    const diffToMonday = (day === 0 ? -6 : 1) - day; // adjust to Monday
    weekStart.setDate(weekStart.getDate() + diffToMonday);
    weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);

    // Parallel DB queries
    const [
      totalCars, monthlySalesRows, prevMonthlySalesRows, customersCount,
      weekTestDrives, weekInquiries, financingApplicationsMonth, reviewAgg,
      salesLast6Months, carsByType, inquiriesWeekRows, testDrivesWeekRows, employeesWithSales
    ] = await Promise.all([
      prisma.car.count({ where: { status: 'AVAILABLE' } }),
      prisma.sale.findMany({ where: { saleDate: { gte: startOfMonth } }, select:{ salePrice:true } }),
      prisma.sale.findMany({ where: { saleDate: { gte: startOfPrevMonth, lte: endOfPrevMonth } }, select:{ salePrice:true } }),
      prisma.customer.count(),
      prisma.testDrive.count({ where: { scheduledDate: { gte: weekStart, lte: weekEnd } } }),
      prisma.inquiry.count({ where: { inquiryDate: { gte: weekStart, lte: weekEnd } } }),
      prisma.financingApplication.count({ where: { applicationDate: { gte: startOfMonth } } }),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.sale.findMany({
        where: { saleDate: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
        select: { saleDate: true, salePrice: true }
      }),
      prisma.car.groupBy({ by:['carType'], _count:{ carType:true }, where:{ status:'AVAILABLE' } }),
      prisma.inquiry.findMany({ where:{ inquiryDate:{ gte: weekStart, lte: weekEnd } }, select:{ inquiryDate:true } }),
      prisma.testDrive.findMany({ where:{ scheduledDate:{ gte: weekStart, lte: weekEnd } }, select:{ scheduledDate:true } }),
      prisma.employee.findMany({
        where:{ status:'ACTIVE' },
        select:{ name:true, sales:{ where:{ saleDate:{ gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }, }, select:{ salePrice:true, saleDate:true } } }
      })
    ]);

    const monthlySales = monthlySalesRows.length;
    const monthlyRevenue = monthlySalesRows.reduce((s,r)=>s + r.salePrice,0);
    const prevMonthlySales = prevMonthlySalesRows.length;
    const prevMonthlyRevenue = prevMonthlySalesRows.reduce((s,r)=>s + r.salePrice,0);

    // Sales trend (last 6 months including current)
    const monthLabels: string[] = [];
    for (let i=5;i>=0;i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      monthLabels.push(d.toLocaleString('default',{ month:'short' }));
    }
    const salesTrendMap: Record<string,{ sales:number; revenue:number }> = {};
    monthLabels.forEach(m=>{ salesTrendMap[m] = { sales:0, revenue:0 }; });
    salesLast6Months.forEach(s => {
      const label = s.saleDate.toLocaleString('default',{ month:'short' });
      if (salesTrendMap[label]) { salesTrendMap[label].sales++; salesTrendMap[label].revenue += s.salePrice; }
    });
    const salesTrend = monthLabels.map(m => ({ month:m, sales: salesTrendMap[m].sales, revenue: salesTrendMap[m].revenue }));

    const inventoryDistribution = carsByType.map((c,i)=>({ category: c.carType, count: c._count.carType, color: INVENTORY_COLORS[i % INVENTORY_COLORS.length] }));

    // Weekly activity
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const inquiriesByDay: Record<string,number> = {}; const testDrivesByDay: Record<string,number> = {};
    days.forEach(d=>{ inquiriesByDay[d]=0; testDrivesByDay[d]=0; });
    inquiriesWeekRows.forEach(i => { const d = days[(i.inquiryDate.getDay()+6)%7]; inquiriesByDay[d]++; });
    testDrivesWeekRows.forEach(t => { const d = days[(t.scheduledDate.getDay()+6)%7]; testDrivesByDay[d]++; });
    const weeklyActivity = days.map(d => ({ day:d, inquiries: inquiriesByDay[d], testDrives: testDrivesByDay[d] }));

    // Top performers (last 6 months revenue)
    const topPerformers = employeesWithSales.map(e => ({
      name: e.name,
      sales: e.sales.length,
      revenue: e.sales.reduce((s,r)=>s + r.salePrice,0)
    })).sort((a,b)=> b.revenue - a.revenue).slice(0,4);

    const avgRating = reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : 0;

    const response: SummaryResponse = {
      stats: {
        totalCars,
        monthlySales,
        monthlyRevenue,
        activeCustomers: customersCount,
        weekTestDrives,
        weekInquiries,
        financingApplications: financingApplicationsMonth,
        avgRating
      },
      salesTrend,
      inventoryDistribution,
      weeklyActivity,
      topPerformers
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating analytics summary:', error);
    return NextResponse.json({ error: 'Failed to load analytics summary' }, { status: 500 });
  }
}
