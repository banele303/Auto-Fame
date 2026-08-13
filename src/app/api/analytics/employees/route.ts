import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ["ADMIN", "SALES_MANAGER", "FINANCE_MANAGER"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get time frame from query parameter
    const searchParams = new URL(request.url).searchParams;
    const timeFrame = searchParams.get("timeFrame") || "month";
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    if (timeFrame === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeFrame === "quarter") {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (timeFrame === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Get employees with their sales performance
    const employees = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        cognitoId: true,
        name: true,
        email: true,
        role: true,
        sales: {
          where: {
            saleDate: {
              gte: startDate,
              lte: endDate,
            }
          },
          include: {
            customer: true,
          }
        }
      }
    });

    // Transform data to calculate metrics
    const employeeData = employees.map(employee => {
      // Get unique customers
      const customerIds = new Set();
      employee.sales.forEach(sale => {
        if (sale.customer) {
          customerIds.add(sale.customer.cognitoId);
        }
      });

      // Calculate total revenue
      const totalRevenue = employee.sales.reduce((sum, sale) => sum + sale.salePrice, 0);

      return {
        id: employee.cognitoId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        sales: employee.sales.length,
        revenue: totalRevenue,
        customers: customerIds.size,
      };
    });

    // Sort by sales or revenue
    employeeData.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json(employeeData);
  } catch (error) {
    console.error("Error fetching employee analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee analytics" },
      { status: 500 }
    );
  }
}
