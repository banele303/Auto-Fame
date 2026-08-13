import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// PATCH /api/admin/employees/[id]/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authResult = await verifyAuth(request, ["ADMIN", "SALES_MANAGER"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: "Invalid employee ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;
    if (!status) {
      return NextResponse.json({ message: "Missing status in request body" }, { status: 400 });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { cognitoId: id },
      data: { status },
    });

    return NextResponse.json({ message: "Employee status updated", employee: updatedEmployee });
  } catch (error) {
    console.error("Error updating employee status:", error);
    return NextResponse.json({ error: "Failed to update employee status" }, { status: 500 });
  }
} 