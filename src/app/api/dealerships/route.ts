import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET handler for all dealerships
export async function GET(request: NextRequest) {
  try {
    const dealerships = await prisma.dealership.findMany({
      include: {
        _count: {
          select: {
            cars: true,
            employees: true,
            sales: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(dealerships);
  } catch (error: any) {
    console.error("Error retrieving dealerships:", error);
    return NextResponse.json(
      { message: `Error retrieving dealerships: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating new dealerships (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, city, state, country, postalCode, phoneNumber, email, website } = body;

    // Validate required fields
    if (!name || !address || !city || !state || !country || !postalCode || !phoneNumber || !email) {
      return NextResponse.json(
        { message: 'Missing required fields: name, address, city, state, country, postalCode, phoneNumber, email' },
        { status: 400 }
      );
    }

    // Check if dealership with this email already exists
    const existingDealership = await prisma.dealership.findFirst({
      where: { 
        OR: [
          { email },
          { name }
        ]
      }
    });

    if (existingDealership) {
      return NextResponse.json(
        { message: 'Dealership with this name or email already exists' },
        { status: 409 }
      );
    }

    // Create coordinates for the dealership (you might want to use a geocoding service)
    // For now, we'll skip coordinates due to the Unsupported type in Prisma
    // const coordinates = `POINT(0 0)`;

    // Create the dealership
    const newDealership = await (prisma.dealership as any).create({
      data: {
        name,
        address,
        city,
        state,
        country,
        postalCode,
        phoneNumber,
        email,
        website: website || null,
        // coordinates: coordinates as any // Removed due to Unsupported type
      },
      include: {
        _count: {
          select: {
            cars: true,
            employees: true,
            sales: true
          }
        }
      }
    });

    return NextResponse.json(newDealership, { status: 201 });
  } catch (error: any) {
    console.error("Error creating dealership:", error);
    return NextResponse.json(
      { message: `Error creating dealership: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT handler for updating dealerships (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, address, city, state, country, postalCode, phoneNumber, email, website } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Dealership ID is required' },
        { status: 400 }
      );
    }

    // Check if dealership exists
    const existingDealership = await prisma.dealership.findUnique({
      where: { id: Number(id) }
    });

    if (!existingDealership) {
      return NextResponse.json(
        { message: 'Dealership not found' },
        { status: 404 }
      );
    }

    // Update the dealership
    const updatedDealership = await prisma.dealership.update({
      where: { id: Number(id) },
      data: {
        name: name || existingDealership.name,
        address: address || existingDealership.address,
        city: city || existingDealership.city,
        state: state || existingDealership.state,
        country: country || existingDealership.country,
        postalCode: postalCode || existingDealership.postalCode,
        phoneNumber: phoneNumber || existingDealership.phoneNumber,
        email: email || existingDealership.email,
        website: website !== undefined ? website : existingDealership.website,
      },
      include: {
        _count: {
          select: {
            cars: true,
            employees: true,
            sales: true
          }
        }
      }
    });

    return NextResponse.json(updatedDealership);
  } catch (error: any) {
    console.error("Error updating dealership:", error);
    return NextResponse.json(
      { message: `Error updating dealership: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting dealerships (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Dealership ID is required' },
        { status: 400 }
      );
    }

    // Check if dealership has associated records
    const dealershipWithCounts = await prisma.dealership.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            cars: true,
            employees: true,
            sales: true
          }
        }
      }
    });

    if (!dealershipWithCounts) {
      return NextResponse.json(
        { message: 'Dealership not found' },
        { status: 404 }
      );
    }

    // Check if dealership has associated data
    if (dealershipWithCounts._count.cars > 0 || 
        dealershipWithCounts._count.employees > 0 || 
        dealershipWithCounts._count.sales > 0) {
      return NextResponse.json(
        { message: 'Cannot delete dealership with associated cars, employees, or sales. Please reassign or remove them first.' },
        { status: 400 }
      );
    }

    // Delete the dealership
    await prisma.dealership.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ message: 'Dealership deleted successfully' });
  } catch (error: any) {
    console.error("Error deleting dealership:", error);
    return NextResponse.json(
      { message: `Error deleting dealership: ${error.message}` },
      { status: 500 }
    );
  }
}
