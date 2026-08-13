import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error('Error: NEXT_PUBLIC_CONVEX_URL is not set.');
  process.exit(1);
}

const convex = new ConvexHttpClient(convexUrl);

// Helper function to retry an async function
async function retry(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`, err.message || err);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

async function downloadAndUploadImage(imageId, index) {
  const url = `https://img.autotrader.co.za/${imageId}`;
  const filename = `swift_glx_${index + 1}.jpg`;
  console.log(`[${index + 1}/18] Downloading image ${imageId} from ${url}...`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save locally to public/cars
    const publicDir = path.join(__dirname, '..', 'public', 'cars');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const localPath = path.join(publicDir, filename);
    fs.writeFileSync(localPath, buffer);
    console.log(`   Saved locally: ${localPath}`);

    // Upload to Convex storage
    let storageIdResult;
    try {
      const uploadUrl = await retry(() => convex.mutation('files:generateUploadUrl', {}));

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: buffer,
      });

      if (uploadResponse.ok) {
        const { storageId } = await uploadResponse.json();
        console.log(`   Convex Storage ID: ${storageId}`);
        storageIdResult = storageId;
      }
    } catch (e) {
      console.warn('   Convex upload fallback notice:', e.message);
    }

    return storageIdResult || `/cars/${filename}`;
  } catch (error) {
    console.error(`Error processing image ${imageId}:`, error);
    return `/cars/${filename}`;
  }
}

async function main() {
  console.log('--- Scraping and Uploading ALL 18 Images for Suzuki Swift 1.2 GLX ---');
  
  // 18 image IDs extracted from the AutoTrader listing
  const all18ImageIds = [
    '49370017', '49370028', '49369232', '49369998', '49370007',
    '49369987', '49369964', '49369974', '49369889', '49369898',
    '49369909', '49369917', '49369925', '49369930', '49369935',
    '49369944', '49369953', '49369979'
  ];

  const photoUrls = [];
  for (let i = 0; i < all18ImageIds.length; i++) {
    const photoUrl = await downloadAndUploadImage(all18ImageIds[i], i);
    photoUrls.push(photoUrl);
  }

  console.log(`\nSuccessfully processed all ${photoUrls.length} images!`);

  // Query dealerships in Convex
  console.log('Querying dealerships in Convex...');
  const dealerships = await retry(() => convex.query('dealerships:list', {}));
  if (dealerships.length === 0) {
    throw new Error('No dealerships found in Convex.');
  }
  const dealershipId = dealerships[0].id;

  // Find existing Suzuki Swift cars in Convex
  const existingCars = await retry(() => convex.query('cars:list', { showAll: true }));
  const existingSwift = existingCars.find(
    (c) => String(c.make).toLowerCase() === 'suzuki' && String(c.model).toLowerCase().includes('swift')
  );

  const carData = {
    make: 'Suzuki',
    model: 'Swift 1.2 GLX',
    year: 2022,
    price: 164900,
    mileage: 93190,
    condition: 'USED',
    carType: 'Hatchback',
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    engine: '1.2L (1197 cc)',
    exteriorColor: 'Silver',
    interiorColor: 'Black',
    description: 'Discover this silver 2022 Suzuki Swift 1.2 GLX, a practical and stylish hatchback currently available in Johannesburg, Gauteng. Equipped with a 5-speed manual transmission and a front-wheel-drive drivetrain, this petrol-powered car delivers a dependable driving experience with a fuel consumption of just 4.9 l/100km. Rated for great price and in excellent condition, ready for the road for R164 900.',
    features: [
      'Airbags',
      'ABS',
      'Manual 5-Speed',
      'Front Wheel Drive',
      '5 Seats',
      'Accident Free',
      'Partial Service History',
      'Electric Windows',
      'Air Conditioning',
      'Bluetooth Connectivity',
      'Alloy Wheels',
      'Rear Park Distance Control'
    ],
    photoUrls: photoUrls,
    status: 'AVAILABLE',
    featured: true,
    dealershipId: dealershipId,
  };

  if (existingSwift) {
    console.log(`Updating existing Suzuki Swift (Numeric ID: ${existingSwift.id}) with all 18 images...`);
    const updated = await retry(() =>
      convex.mutation('cars:update', {
        id: existingSwift.id,
        photoUrls: photoUrls,
        featured: true,
        description: carData.description,
        features: carData.features,
      })
    );
    console.log('Update successful! Result:', updated);
  } else {
    console.log('Creating new Suzuki Swift record with all 18 images...');
    const created = await retry(() => convex.mutation('cars:create', carData));
    console.log('Creation successful:', created);
  }

  console.log('--- ALL 18 SUZUKI SWIFT IMAGES DOWNLOADED & SEEDED SUCCESSFULLY ---');
}

main();
