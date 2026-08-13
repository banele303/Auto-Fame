import { verifyAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const authResult = await verifyAuth(request, ['ADMIN', 'SALES_MANAGER']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const customer = await prisma.customer.findUnique({
      where: {
        cognitoId: id
      },
      include: {
        favorites: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            dealership: {
              select: {
                name: true
              }
            }
          }
        },
        inquiries: {
          select: {
            id: true,
            status: true,
            inquiryDate: true,
            car: {
              select: {
                id: true,
                make: true,
                model: true,
                dealership: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        sales: {
          select: {
            id: true,
            saleDate: true,
            salePrice: true,
            car: {
              select: {
                id: true,
                make: true,
                model: true,
                dealership: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    
    // Define interfaces for the structured data
    interface CustomerInfo {
      id: number;
      cognitoId: string;
      name: string;
      email: string;
      phoneNumber: string;
    }

    interface FavoriteCar {
      id: number;
      make: string;
      model: string;
      year: number;
      dealership: string;
    }

    interface CustomerInquiry {
      id: number;
      car: string;
      carId: number;
      dealership: string;
      status: string;
      date: string;
    }

    interface CustomerSale {
      id: number;
      car: string;
      carId: number;
      dealership: string;
      saleDate: string;
      salePrice: number;
    }

    interface FormattedCustomer {
      customerInfo: CustomerInfo;
      favoriteCars: FavoriteCar[];
      inquiries: CustomerInquiry[];
      sales: CustomerSale[];
    }

    // Define interfaces for Prisma return types
    interface PrismaCustomer {
      id: string;
      cognitoId: string;
      name: string;
      email: string;
      phoneNumber?: string | null;
      favorites: PrismaFavoriteCar[];
      inquiries: PrismaInquiry[];
      sales: PrismaSale[];
    }

    interface PrismaFavoriteCar {
      id: number;
      make: string;
      model: string;
      year: number;
      dealership: {
        name: string;
      };
    }

    interface PrismaInquiry {
      id: number;
      status: string;
      inquiryDate: Date;
      car: {
        id: number;
        make: string;
        model: string;
        dealership: {
          name: string;
        };
      };
    }

    interface PrismaSale {
      id: number;
      saleDate: Date;
      salePrice: number;
      car: {
        id: number;
        make: string;
        model: string;
        dealership: {
          name: string;
        };
      };
    }

    const formattedCustomer: FormattedCustomer = {
      customerInfo: {
      id: customer.id,
      cognitoId: customer.cognitoId,
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber || ""
      },
      favoriteCars: customer.favorites.map((car: PrismaFavoriteCar) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      dealership: car.dealership.name,
      })),
      inquiries: customer.inquiries.map((inquiry: PrismaInquiry) => ({
      id: inquiry.id,
      car: `${inquiry.car.make} ${inquiry.car.model}`,
      carId: inquiry.car.id,
      dealership: inquiry.car.dealership.name,
      status: inquiry.status,
      date: inquiry.inquiryDate.toISOString().split('T')[0]
      })),
      sales: customer.sales.map((sale: PrismaSale) => ({
      id: sale.id,
      car: `${sale.car.make} ${sale.car.model}`,
      carId: sale.car.id,
      dealership: sale.car.dealership.name,
      saleDate: sale.saleDate.toISOString().split('T')[0],
      salePrice: sale.salePrice,
      }))
    };
    
    return NextResponse.json(formattedCustomer);
  } catch (error) {
    console.error("Admin customer details - GET: Error fetching customer details", error);
    return NextResponse.json(
      { error: "Failed to fetch customer details" },
      { status: 500 }
    );
  }
}
