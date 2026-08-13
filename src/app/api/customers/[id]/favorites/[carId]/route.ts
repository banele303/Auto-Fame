import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// POST: add favorite car for customer
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; carId: string }> }) {
  try {
    const { id, carId } = await params;
    if (!id || !carId) {
      return NextResponse.json({ message: 'Invalid customer or car ID' }, { status: 400 });
    }

    const auth = await verifyAuth(request);
    if (!auth.isAuthenticated || (auth.userRole !== 'ADMIN' && auth.userId !== id)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({ where: { cognitoId: id }, select: { id: true } });
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });

    const car = await prisma.car.findUnique({ where: { id: Number(carId) }, select: { id: true } });
    if (!car) return NextResponse.json({ message: 'Car not found' }, { status: 404 });

    await prisma.customer.update({
      where: { cognitoId: id },
      data: { favorites: { connect: { id: Number(carId) } } },
    });

    return NextResponse.json({ message: 'Car added to favorites' });
  } catch (err: any) {
    console.error('Add favorite error:', err);
    return NextResponse.json({ message: 'Failed to add favorite', error: err.message }, { status: 500 });
  }
}

// DELETE: remove favorite car for customer
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; carId: string }> }) {
  try {
    const { id, carId } = await params;
    if (!id || !carId) {
      return NextResponse.json({ message: 'Invalid customer or car ID' }, { status: 400 });
    }

    const auth = await verifyAuth(request);
    if (!auth.isAuthenticated || (auth.userRole !== 'ADMIN' && auth.userId !== id)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // ensure relation exists (not strictly required for disconnect)
    await prisma.customer.update({
      where: { cognitoId: id },
      data: { favorites: { disconnect: { id: Number(carId) } } },
    });

    return NextResponse.json({ message: 'Car removed from favorites' });
  } catch (err: any) {
    console.error('Remove favorite error:', err);
    return NextResponse.json({ message: 'Failed to remove favorite', error: err.message }, { status: 500 });
  }
}
