import { NextRequest, NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';
import { verifyAuth } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { CAR_UPLOAD_SINGLE_MAX_MB } from '@/config/uploadLimits';

// POST /api/cars/:id/photos  (single photo per request)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(req, ['SALES_MANAGER', 'ADMIN', 'EMPLOYEE', 'SALES_REP']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) return NextResponse.json({ message: 'Invalid car id' }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get('photo');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'Missing photo file "photo"' }, { status: 400 });
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > CAR_UPLOAD_SINGLE_MAX_MB) {
      return NextResponse.json({ message: `File ${file.name} is ${sizeMb.toFixed(1)}MB > ${CAR_UPLOAD_SINGLE_MAX_MB}MB limit` }, { status: 400 });
    }

    // Fetch existing car from Convex
    const car = await convexClient.query("cars:get", { id });
    if (!car) return NextResponse.json({ message: 'Car not found' }, { status: 404 });

    let url: string | null = null;
    try {
      url = await uploadToS3(file, 'cars');
    } catch (e: any) {
      return NextResponse.json({ message: 'Failed to upload to storage', error: e?.message }, { status: 500 });
    }

    // Append photo URL and update Convex
    const currentList = car.photoUrls || [];
    if (!currentList.includes(url)) {
      const nextList = [...currentList, url];
      await convexClient.mutation("cars:update", {
        id,
        photoUrls: nextList
      });
      return NextResponse.json({ carId: car.id, url, count: nextList.length });
    }

    return NextResponse.json({ carId: car.id, url, count: currentList.length });
  } catch (err: any) {
    console.error('[CAR PHOTO UPLOAD ERROR]', err);
    return NextResponse.json({ message: 'Photo upload failed', error: err?.message }, { status: 500 });
  }
}
