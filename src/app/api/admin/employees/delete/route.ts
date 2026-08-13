import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Handler for deleting employees (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const cognitoId = url.searchParams.get('cognitoId');
    
    console.log(`Attempting to delete employee with cognitoId: ${cognitoId}`);

    if (!cognitoId) {
      return NextResponse.json({ 
        message: "Missing required cognitoId parameter"
      }, { status: 400 });
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { cognitoId },
      select: { cognitoId: true, dealershipId: true, name: true, email: true },
    });

    if (!existingEmployee) {
      return NextResponse.json({ 
        message: "Employee not found"
      }, { status: 404 });
    }

    console.log(`Deleting employee ${existingEmployee.name} (${cognitoId}) with email ${existingEmployee.email}`);
    
    // Find any cars managed by this employee
    const cars = await prisma.car.findMany({
      where: { employeeId: cognitoId },
      select: { id: true }
    });
    
    console.log(`Found ${cars.length} cars to clean up`);
    
    // For each car, remove the employeeId (set to null) or reassign if necessary
    // For simplicity, we'll set employeeId to null. In a real app, you might reassign.
    for (const car of cars) {
      try {
        await prisma.car.update({
          where: { id: car.id },
          data: { employeeId: null }
        });
      } catch (carError) {
        console.error(`Error cleaning up car ${car.id}:`, carError);
      }
    }

    // Find any sales associated with this employee
    const sales = await prisma.sale.findMany({
        where: { employeeId: cognitoId },
        select: { id: true }
    });

    // For each sale, reassign to a different employee or handle as needed
    // Since employeeId is required, we need to assign them to another employee
    // For now, let's get the first available employee from the same dealership
    const firstAvailableEmployee = await prisma.employee.findFirst({
        where: { 
            dealershipId: existingEmployee.dealershipId,
            cognitoId: { not: cognitoId }
        },
        select: { cognitoId: true }
    });

    if (firstAvailableEmployee) {
        for (const sale of sales) {
            try {
                await prisma.sale.update({
                    where: { id: sale.id },
                    data: { employeeId: firstAvailableEmployee.cognitoId }
                });
            } catch (saleError) {
                console.error(`Error reassigning sale ${sale.id}:`, saleError);
            }
        }
    } else {
        // If no other employee available, we can't delete this employee
        return NextResponse.json(
            { error: "Cannot delete employee: no other employee available to reassign sales" },
            { status: 400 }
        );
    }

    // Find any inquiries associated with this employee
    const inquiries = await prisma.inquiry.findMany({
        where: { employeeId: cognitoId },
        select: { id: true }
    });

    // For each inquiry, remove the employeeId (set to null) or reassign if necessary
    for (const inquiry of inquiries) {
        try {
            await prisma.inquiry.update({
                where: { id: inquiry.id },
                data: { employeeId: null }
            });
        } catch (inquiryError) {
            console.error(`Error cleaning up inquiry ${inquiry.id}:`, inquiryError);
        }
    }

    // Finally delete the employee
    try {
      const deletedEmployee = await prisma.employee.delete({
        where: { cognitoId }
      });
      
      console.log(`Successfully deleted employee ${deletedEmployee.name}`);
      
      return NextResponse.json({ 
        success: true,
        message: `Employee ${deletedEmployee.name} successfully deleted`,
        deletedEmployee
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      return NextResponse.json(
        { message: `Error deleting employee: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unhandled error in employee deletion:", error);
    return NextResponse.json(
      { message: `Error deleting employee: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
