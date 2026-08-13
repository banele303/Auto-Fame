import { NextRequest, NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex';
import { verifyAuth } from '@/lib/auth';
import { uploadToConvex } from '@/lib/s3';
import { CAR_UPLOAD_SINGLE_MAX_MB, CAR_UPLOAD_TOTAL_MAX_MB, describeCarUploadLimits } from '@/config/uploadLimits';

// Helper to delete a file (no-op for Convex storage)
async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // Convex storage manages files automatically
}

// GET a specific car by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid car ID" }, { status: 400 });
    }
    
    const car = await convexClient.query("cars:get", { id });

    if (!car) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }
    
    // Normalize legacy fuel type before returning
    let normalized = String(car.fuelType) === 'GASOLINE' ? { ...car, fuelType: 'PETROL' } : car;

    // Resolve Convex storage IDs to full HTTPS CDN URLs
    if (normalized.photoUrls?.length) {
      const convexCloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://frugal-zebra-890.convex.cloud";
      const resolved = normalized.photoUrls.map((id: string) => {
        if (id.startsWith("http://") || id.startsWith("https://")) return id;
        if (id.startsWith("/")) return `${convexCloudUrl}${id}`;
        return `${convexCloudUrl}/api/storage/${id}`;
      });
      normalized = { ...normalized, photoUrls: resolved };
    }

    return NextResponse.json(normalized, { headers: { 'x-fueltype-normalized': String(car.fuelType) === 'GASOLINE' ? 'true' : 'false' } });
  } catch (err: any) {
    console.error("Error retrieving car:", err);
    return NextResponse.json({ message: `Error retrieving car: ${err.message}` }, { status: 500 });
  }
}

// PUT to update a car
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['SALES_MANAGER', 'ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid car ID" }, { status: 400 });
    }

    const existingCar = await convexClient.query("cars:get", { id });
    if (!existingCar) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const raw: Record<string, any> = {};
    const featureBuffer: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'photos') continue;
      if (key === 'features') {
        const rawVal = String(value).trim();
        if (!rawVal) continue;
        if (rawVal.startsWith('[')) {
          try {
            const parsed = JSON.parse(rawVal);
            if (Array.isArray(parsed)) parsed.forEach(v=>{ const s=String(v).trim(); if(s) featureBuffer.push(s); });
            continue;
          } catch {}
        }
        rawVal.split(',').forEach(tok => { const s = tok.replace(/[\[\]"]+/g,'').trim(); if (s) featureBuffer.push(s); });
      } else {
        raw[key] = value;
      }
    }
    if (featureBuffer.length) {
      const seen = new Set<string>();
      raw.features = featureBuffer.filter(f=>{ const k=f.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; });
    }
    const photoUrlsRaw = typeof raw.photoUrls === 'string' ? raw.photoUrls : undefined;
    const photoOrderRaw = typeof raw.photoOrder === 'string' ? raw.photoOrder : undefined;
    delete raw.photoUrls; delete raw.photoOrder;
    if (typeof raw.featured === 'string') raw.featured = raw.featured === 'true';

    // Whitelist fields
    const allowed = ['make','model','vin','carType','fuelType','condition','transmission','engine','exteriorColor','interiorColor','description','status','featured','dealershipId','employeeId','mileage','price','year','features'];
    const data: any = {};
    allowed.forEach(k=>{ if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') data[k]=raw[k]; });
    if (data.year) data.year = parseInt(data.year);
    if (data.price) data.price = parseFloat(data.price);
    if (data.mileage) data.mileage = parseInt(data.mileage);
    if (data.dealershipId) data.dealershipId = parseInt(data.dealershipId);
    if (data.employeeId === '' || data.employeeId === undefined) data.employeeId = null;

    // Optional employeeId handling
    if (data.employeeId) {
      const suppliedEmp = String(data.employeeId).trim();
      let employee = await convexClient.query("users:getEmployee", { cognitoId: suppliedEmp });
      if (!employee && /^\d+$/.test(suppliedEmp)) {
        const idNum = parseInt(suppliedEmp, 10);
        if (!isNaN(idNum)) {
          employee = await convexClient.query("users:getEmployeeDetails", { id: idNum });
        }
      }
      if (employee) data.employeeId = employee.cognitoId; else data.employeeId = null;
    }

    // Existing photos kept
    let keptExisting: string[] = (existingCar.photoUrls || []).filter((u: string) => typeof u === 'string' && !u.startsWith('blob:') && !u.startsWith('data:'));
    if (photoUrlsRaw) {
      try {
        const parsed = JSON.parse(photoUrlsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validParsed = parsed.filter((u: any) => typeof u === 'string' && !u.startsWith('blob:') && !u.startsWith('data:'));
          if (validParsed.length > 0) {
            const convexCloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://frugal-zebra-890.convex.cloud";
            keptExisting = validParsed.map((url: string) => {
              if (url.startsWith("http://") || url.startsWith("https://")) return url;
              if (url.startsWith("/")) return `${convexCloudUrl}${url}`;
              return `${convexCloudUrl}/api/storage/${url}`;
            });
          }
        }
      } catch {}
    }
    const newFiles: File[] = formData.getAll('photos') as File[];
    const MAX_SINGLE_MB = CAR_UPLOAD_SINGLE_MAX_MB;
    const MAX_TOTAL_MB = CAR_UPLOAD_TOTAL_MAX_MB;
    console.log('[CAR_UPLOAD_DEBUG][UPDATE]', { newCount: newFiles.length, ...describeCarUploadLimits() });
    let totalBytes = 0;
    for (const nf of newFiles) {
      totalBytes += nf.size;
      const mb = nf.size / (1024*1024);
      if (mb > MAX_SINGLE_MB) {
        return NextResponse.json({ message: `File ${nf.name} is ${mb.toFixed(1)}MB > ${MAX_SINGLE_MB}MB limit` }, { status: 400 });
      }
    }
    if (MAX_TOTAL_MB > 0) {
      const totalMb = totalBytes / (1024*1024);
      if (totalMb > MAX_TOTAL_MB) {
        return NextResponse.json({ message: `Total new upload ${totalMb.toFixed(1)}MB exceeds ${MAX_TOTAL_MB}MB limit. Upload fewer or smaller images.` }, { status: 413 });
      }
    }
    let uploadedNew: string[] = [];
    if (newFiles.length) {
      uploadedNew = await Promise.all(newFiles.map(async f => {
        return uploadToConvex(f);
      }));
    }

    const finalPhotos = [...keptExisting, ...uploadedNew].filter((u: string) => typeof u === 'string' && !u.startsWith('blob:') && !u.startsWith('data:'));
    data.photoUrls = finalPhotos;

    if (data.fuelType === 'PETROL' || data.fuelType === 'FUEL') {
      data.fuelType = 'GASOLINE';
    }

    const updatedCar = await convexClient.mutation("cars:update", {
      id,
      ...data
    });
    
    return NextResponse.json(updatedCar, { headers: {
      'x-car-upload-new-files': String(newFiles.length),
      'x-car-upload-max-single-mb': String(MAX_SINGLE_MB),
      'x-car-upload-max-total-mb': String(MAX_TOTAL_MB)
    }});
  } catch (err: any) {
    console.error("Error updating car:", err);
    return NextResponse.json({ message: `Error updating car: ${err.message}` }, { status: 500 });
  }
}

// DELETE a car
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAuth(request, ['SALES_MANAGER', 'ADMIN']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid car ID" }, { status: 400 });
    }

    const existingCar = await convexClient.query("cars:get", { id });
    if (!existingCar) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }

    // Delete S3 photos
    if (existingCar.photoUrls && existingCar.photoUrls.length > 0) {
      await Promise.all(existingCar.photoUrls.map(deleteFileFromS3));
    }

    // Remove via Convex mutation (which handles verification and cascaded deletes)
    try {
      await convexClient.mutation("cars:remove", { id });
      return NextResponse.json({ message: "Car deleted successfully", id });
    } catch (convexError: any) {
      const msg = convexError?.message || String(convexError);
      return NextResponse.json(
        { message: msg.includes('sale record') ? 'This car has a sale record and cannot be deleted. Use "Mark as Sold" or "Deactivate" instead.' : msg },
        { status: 409 }
      );
    }
  } catch (err: any) {
    console.error("Error deleting car:", err);
    return NextResponse.json({ message: `Error deleting car: ${err.message}` }, { status: 500 });
  }
}
