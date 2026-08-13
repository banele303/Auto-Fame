import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// GET /api/admin/employees/[id]
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = context.params;
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Employee ID is cognitoId (string)
    if (!id) {
      return NextResponse.json({ message: "Invalid employee ID" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { cognitoId: id },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    // Fetch cars managed by this employee
    const managedCars = await prisma.car.findMany({
      where: { employeeId: id },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        sales: {
          select: {
            id: true,
            customer: {
              select: {
                cognitoId: true,
                name: true,
                email: true,
              },
            },
            salePrice: true,
          },
        },
      },
    });

    // Transform cars to include customer count and total sales value
    interface Customer {
      cognitoId: string;
      name: string;
      email: string;
    }

    interface Sale {
      id: number;
      customer: Customer | null;
      salePrice: number;
    }

    // Update interface to match Prisma's return type
    interface ManagedCar {
      id: number;
      make: string;
      model: string;
      year: number;
      sales: Sale[] | Sale | null;
    }

    interface TransformedCar {
      id: number;
      make: string;
      model: string;
      year: number;
      customerCount: number;
      totalSalesValue: number;
    }

    const transformedCars: TransformedCar[] = managedCars.map((car) => {
      const customerSet = new Set<string>();
      let totalSalesValue = 0;
      
      // Handle case when sales might be null
      if (car.sales) {
        if (Array.isArray(car.sales)) {
          car.sales.forEach((sale) => {
            if (sale.customer) {
              customerSet.add(sale.customer.cognitoId);
              totalSalesValue += sale.salePrice;
            }
          });
        } else {
          // Handle single sale object
          if (car.sales.customer) {
            customerSet.add(car.sales.customer.cognitoId);
            totalSalesValue += car.sales.salePrice;
          }
        }
      }

      return {
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        customerCount: customerSet.size,
        totalSalesValue: totalSalesValue,
      };
    });

    // Get all customers associated with this employee's sales
    const customers: Customer[] = managedCars.flatMap((car) => 
      Array.isArray(car.sales) ? car.sales.map((sale) => sale.customer) : 
      car.sales ? [car.sales.customer] : []
    ).filter(Boolean) as Customer[];

    // Remove duplicates
    const uniqueCustomers = Array.from(
      new Map(customers.map(customer => [customer.cognitoId, customer])).values()
    );

    // Map customers to include car information
    const customersWithCars = [];
    for (const customer of uniqueCustomers) {
      for (const car of managedCars) {
        // Handle both array and single object cases for sales
        const hasCustomer = Array.isArray(car.sales) 
          ? car.sales.some(
              (sale): boolean => sale.customer !== null && sale.customer.cognitoId === customer.cognitoId
            )
          : car.sales && car.sales.customer !== null && car.sales.customer.cognitoId === customer.cognitoId;
        
        if (hasCustomer) {
          customersWithCars.push({
            cognitoId: customer.cognitoId,
            name: customer.name,
            email: customer.email,
            car: `${car.year} ${car.make} ${car.model}`,
          });
        }
      }
    }

    // Calculate statistics
    const totalCarsManaged = transformedCars.length;
    const totalCustomersServed = uniqueCustomers.length;
    const totalSales: number = managedCars.reduce((acc: number, car) => {
      // Handle both array and single object cases
      if (Array.isArray(car.sales)) {
        return acc + car.sales.length;
      } else if (car.sales) {
        return acc + 1; // Count as one sale if it's a single object
      }
      return acc; // No sales
    }, 0);
    const totalRevenue: number = managedCars.reduce((acc: number, car) => 
      acc + transformedCars.find((tc: TransformedCar) => tc.id === car.id)!.totalSalesValue, 0
    );

    const employeeDetails = {
      cognitoId: employee.cognitoId,
      name: employee.name,
      email: employee.email,
      phoneNumber: employee.phoneNumber || "",
      role: employee.role,
      status: employee.status,
      dealershipId: employee.dealershipId,
      managedCars: transformedCars,
      customers: customersWithCars,
      stats: {
        carsManaged: totalCarsManaged,
        customersServed: totalCustomersServed,
        totalSales: totalSales,
        totalRevenue: totalRevenue,
      }
    };

    return NextResponse.json(employeeDetails);

  } catch (error) {
    console.error("Error fetching employee details:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch employee details" }),
      { status: 500 }
    );
  }
}

// DELETE /api/admin/employees/[id]
export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const { id } = context.params;
    const authResult = await verifyAuth(request, ["ADMIN"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: "Invalid employee ID" }, { status: 400 });
    }

    // Delete the employee
    await prisma.employee.delete({
      where: { cognitoId: id },
    });

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ success: false, message: "Failed to delete employee" }, { status: 500 });
  }
}

 