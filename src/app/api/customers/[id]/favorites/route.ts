import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'Invalid customer ID' }, { status: 400 });

    const auth = await verifyAuth(request);
    if (!auth.isAuthenticated || (auth.userRole !== 'ADMIN' && auth.userId !== id)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { cognitoId: id },
      include: { favorites: true },
    });
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });

    return NextResponse.json(customer.favorites);
  } catch (err: any) {
    console.error('Get favorites error:', err);
    return NextResponse.json({ message: 'Failed to load favorites', error: err.message }, { status: 500 });
  }
}
