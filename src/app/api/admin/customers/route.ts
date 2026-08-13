import { verifyAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true,
        phoneNumber: true,
        favorites: {
          select: {
            id: true
          }
        },
        inquiries: {
          select: {
            id: true
          }
        },
        sales: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    const formattedCustomers = customers.map((customer) => ({
      id: customer.id,
      cognitoId: customer.cognitoId,
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber || "",
      favoriteCarsCount: customer.favorites.length,
      inquiryCount: customer.inquiries.length,
      salesCount: customer.sales.length
    }));
    
    return NextResponse.json(formattedCustomers);
  } catch (error) {
    console.error("Admin customers - GET: Error fetching customers", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
