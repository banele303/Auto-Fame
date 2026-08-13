import { NextRequest, NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';

const VALID_STATUSES = ['AVAILABLE', 'SOLD', 'RESERVED', 'PENDING', 'MAINTENANCE', 'INACTIVE'];

// PATCH /api/cars/[id]/status — quick status toggle (activate, deactivate, mark sold, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const carId = parseInt(id, 10);
    if (isNaN(carId)) {
      return NextResponse.json({ message: 'Invalid car ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify car exists
    const car = await convexClient.query("cars:get", { id: carId });
    if (!car) {
      return NextResponse.json({ message: 'Car not found' }, { status: 404 });
    }

    // Update the status in Convex
    const updated = await convexClient.mutation("cars:update", {
      id: carId,
      status: status
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      message: `Car status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('Error updating car status:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to update car status' },
      { status: 500 }
    );
  }
}
