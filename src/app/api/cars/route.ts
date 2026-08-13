import { NextRequest, NextResponse } from "next/server";
import { convexClient } from "@/lib/convex";
import { uploadToS3 } from "@/lib/s3";
import { CAR_UPLOAD_MAX_FILES, CAR_UPLOAD_SINGLE_MAX_MB, CAR_UPLOAD_TOTAL_MAX_MB, describeCarUploadLimits } from "@/config/uploadLimits";

// Add a GET handler to retrieve all cars from Convex
export async function GET(req: NextRequest) {
  const started = Date.now();
  const { searchParams } = new URL(req.url);
  const takeParam = searchParams.get('limit');
  const featuredParam = searchParams.get('featured');
  const orderParam = searchParams.get('order');
  const showAll = searchParams.get('showAll') === 'true'; // admin: see all statuses
  const statusParam = searchParams.get('status'); // filter by specific status
  const orderDir = orderParam === 'asc' ? 'asc' : 'desc';
  const take = takeParam ? Number(takeParam) : undefined;

  if (take !== undefined && (isNaN(take) || take <= 0)) {
    return NextResponse.json({ message: 'Invalid limit parameter' }, { status: 400 });
  }

  try {
    const cars = await convexClient.query("cars:list", {
      limit: take,
      featured: featuredParam === 'true' ? true : undefined,
      status: statusParam || undefined,
      showAll: showAll,
    });

    // If order direction is ascending, sort in ascending order (default from Convex query is descending)
    if (orderParam === 'asc') {
      cars.sort((a: any, b: any) => a.updatedAt.localeCompare(b.updatedAt));
    }

    // Normalize legacy enum values (GASOLINE -> PETROL for display)
    const normalized = cars.map((c: any) => (String(c.fuelType) === 'GASOLINE' ? { ...c, fuelType: 'PETROL' } : c));

    // Resolve Convex storage IDs to actual image URLs via local proxy
    const withUrls = await Promise.all(
      normalized.map(async (car: any) => {
        if (!car.photoUrls?.length) return car
        const resolved = await Promise.all(
          car.photoUrls.map(async (id: string) => {
          // Already an HTTP URL or a public path — keep as-is
            if (id.startsWith("http://") || id.startsWith("https://") || id.startsWith("/")) return id
            // Convex storage ID — proxy through our endpoint
            return `/api/storage/${id}`
          })
        )
        return { ...car, photoUrls: resolved }
      })
    )

    return NextResponse.json(withUrls, {
      headers: {
        'x-query-time': String(Date.now() - started),
        'x-fueltype-normalized': 'true'
      }
    });
  } catch (error: any) {
    console.error('Error fetching cars from Convex:', error);
    return NextResponse.json({ message: 'Failed to fetch cars', error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const carData: any = {};
    const featureBuffer: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'photos') continue;
      if (key === 'photoUrls') continue;
      if (key === 'photoOrder') continue;
      if (key === 'vin') continue; // ignore client-sent vin (we will generate)
      if (key === 'interiorColor') continue; // interiorColor no longer collected
      if (key === 'features') {
        const raw = String(value).trim();
        if (!raw) continue;
        if (raw.startsWith('[')) {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              arr.forEach(v => {
                const s = String(v).trim();
                if (s) featureBuffer.push(s);
              });
            }
            continue; // handled
          } catch {
            // fall through to simple splitting
          }
        }
        raw.split(',').forEach(tok => {
          const s = tok.replace(/[\[\]"]+/g,'').trim();
          if (s) featureBuffer.push(s);
        });
      } else if (['price','mileage','year','dealershipId'].includes(key)) {
        carData[key] = Number(value);
      } else {
        carData[key] = value as any;
      }
    }
    if (featureBuffer.length) {
      // de-dupe preserving first selection order
      const seen = new Set<string>();
      carData.features = featureBuffer.filter(f => {
        const k = f.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
    }

    // Normalize fuelType for Convex schema
    if (carData.fuelType === 'PETROL' || carData.fuelType === 'FUEL') {
      carData.fuelType = 'GASOLINE';
    }
    
    // Ensure fuel type is valid for enum
    const validFuelTypes = ['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUG_IN_HYBRID', 'HYDROGEN'];
    if (!validFuelTypes.includes(carData.fuelType)) {
      console.warn('[CAR_CREATE_DEBUG] Invalid fuelType:', carData.fuelType, 'defaulting to GASOLINE');
      carData.fuelType = 'GASOLINE';
    }

    const photos = formData.getAll('photos') as File[];
    const MAX_FILES = CAR_UPLOAD_MAX_FILES;
    const MAX_SINGLE_MB = CAR_UPLOAD_SINGLE_MAX_MB;
    const MAX_TOTAL_MB = CAR_UPLOAD_TOTAL_MAX_MB;
    console.log('[CAR_UPLOAD_DEBUG][CREATE] photos:', photos.length, describeCarUploadLimits());
    if (photos.length > MAX_FILES) {
      return NextResponse.json({ message: `Too many photos: ${photos.length} > ${MAX_FILES}` }, { status: 400 });
    }
    let totalBytes = 0;
    for (const p of photos) {
      totalBytes += p.size;
      const mb = p.size / (1024*1024);
      if (mb > MAX_SINGLE_MB) {
        return NextResponse.json({ message: `File ${p.name} is ${mb.toFixed(1)}MB > ${MAX_SINGLE_MB}MB limit` }, { status: 400 });
      }
    }
    const totalMb = totalBytes / (1024*1024);
    if (MAX_TOTAL_MB > 0 && totalMb > MAX_TOTAL_MB) {
      return NextResponse.json({ message: `Total upload ${totalMb.toFixed(1)}MB exceeds ${MAX_TOTAL_MB}MB limit`, totalMb, MAX_TOTAL_MB }, { status: 413, headers: { 'x-car-upload-total-mb': totalMb.toFixed(2), 'x-car-upload-max-total-mb': String(MAX_TOTAL_MB), 'x-car-upload-max-single-mb': String(MAX_SINGLE_MB) } });
    }
    const photoUrls: string[] = [];
    for (const photo of photos) {
      try {
        const url = await uploadToS3(photo, 'cars');
        photoUrls.push(url);
      } catch (err) {
        console.error('S3 upload error:', err);
      }
    }
    carData.photoUrls = photoUrls.filter(u => typeof u === 'string' && !u.startsWith('blob:') && !u.startsWith('data:'));
    if (typeof carData.featured === 'string') {
      carData.featured = carData.featured === 'true';
    }

    // Verify Dealership in Convex
    if (carData.dealershipId) {
      if (isNaN(carData.dealershipId)) {
        return NextResponse.json({ message: 'Invalid dealershipId supplied.' }, { status: 400 });
      }
      const dealershipExists = await convexClient.query("dealerships:get", { id: carData.dealershipId });
      if (!dealershipExists) {
        return NextResponse.json({ message: `Dealership ${carData.dealershipId} not found.` }, { status: 404 });
      }
    } else {
      delete carData.dealershipId;
    }

    // Resolve employeeId in Convex
    if (carData.employeeId) {
      const suppliedEmp = String(carData.employeeId).trim();
      let employee = await (convexClient as any).query("users:getEmployee", { cognitoId: suppliedEmp });
      if (!employee && /^\d+$/.test(suppliedEmp)) {
        const idNum = parseInt(suppliedEmp, 10);
        if (!isNaN(idNum)) {
          employee = await (convexClient as any).query("users:getEmployeeDetails", { id: idNum });
        }
      }
      if (employee) {
        carData.employeeId = employee.cognitoId;
      } else {
        delete carData.employeeId;
      }
    } else if (carData.employeeId === '') {
      delete carData.employeeId;
    }

    // Auto-generate VIN if not provided
    if (!carData.vin) {
      const alphabet = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
      let gen = '';
      for (let i = 0; i < 17; i++) gen += alphabet[Math.floor(Math.random() * alphabet.length)];
      carData.vin = gen;
    }
    
    if (!carData.interiorColor) {
      carData.interiorColor = 'Not specified';
    }

    try {
      const newCar = await (convexClient as any).mutation("cars:create", {
        vin: carData.vin,
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        condition: carData.condition,
        carType: carData.carType,
        fuelType: carData.fuelType,
        transmission: carData.transmission,
        engine: carData.engine,
        exteriorColor: carData.exteriorColor,
        interiorColor: carData.interiorColor,
        description: carData.description,
        features: carData.features || [],
        photoUrls: carData.photoUrls || [],
        status: carData.status || "AVAILABLE",
        featured: carData.featured || false,
        dealershipId: carData.dealershipId || 1,
        employeeId: carData.employeeId || null,
      });

      return NextResponse.json(newCar, { status: 201, headers: {
        'x-car-upload-files': String(photos.length),
        'x-car-upload-total-mb': totalMb.toFixed(2),
        'x-car-upload-max-single-mb': String(MAX_SINGLE_MB),
        'x-car-upload-max-total-mb': String(MAX_TOTAL_MB)
      }});
    } catch (convexError: any) {
      const msg = convexError?.message || String(convexError);
      if (msg.includes('already exists')) {
        return NextResponse.json({ message: 'A car with this VIN already exists. Please use a unique VIN.' }, { status: 409 });
      }
      console.error(convexError);
      return NextResponse.json({ message: 'Failed to create car in Convex.', error: msg }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to create car.' }, { status: 500 });
  }
}
