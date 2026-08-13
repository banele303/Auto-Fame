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

async function downloadAndUploadImage(imageId, filePrefix, index, totalCount) {
  const url = `https://img.autotrader.co.za/${imageId}`;
  const filename = `${filePrefix}_${index + 1}.jpg`;
  console.log(`[${index + 1}/${totalCount}] Downloading ${filePrefix} image ${imageId}...`);
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

async function seedCar(carData, imageIds, filePrefix) {
  console.log(`\n======================================================`);
  console.log(`Processing: ${carData.make} ${carData.model} (${imageIds.length} images)`);
  console.log(`======================================================`);

  const photoUrls = [];
  for (let i = 0; i < imageIds.length; i++) {
    const pUrl = await downloadAndUploadImage(imageIds[i], filePrefix, i, imageIds.length);
    photoUrls.push(pUrl);
  }

  // Get Dealership ID
  const dealerships = await retry(() => convex.query('dealerships:list', {}));
  if (dealerships.length === 0) {
    throw new Error('No dealerships found in Convex.');
  }
  const dealershipId = dealerships[0].id;

  const fullCarData = {
    ...carData,
    photoUrls,
    dealershipId,
  };

  // Check if car already exists by make and model
  const existingCars = await retry(() => convex.query('cars:list', { showAll: true }));
  const existingCar = existingCars.find(
    (c) => String(c.make).toLowerCase() === carData.make.toLowerCase() &&
           String(c.model).toLowerCase().includes(carData.model.split(' ')[0].toLowerCase())
  );

  if (existingCar) {
    console.log(`Updating existing car (Numeric ID: ${existingCar.id}) in Convex...`);
    const updated = await retry(() =>
      convex.mutation('cars:update', {
        id: existingCar.id,
        photoUrls: photoUrls,
        featured: true,
        price: carData.price,
        mileage: carData.mileage,
        description: carData.description,
        features: carData.features,
      })
    );
    console.log(`Success! Updated ${carData.make} ${carData.model} in Convex.`);
  } else {
    console.log(`Creating new car record in Convex...`);
    const created = await retry(() => convex.mutation('cars:create', fullCarData));
    console.log(`Success! Created ${carData.make} ${carData.model} in Convex.`);
  }
}

async function main() {
  console.log('--- Starting Multi-Car Scraper & Seeder ---');

  // 1. HYUNDAI I20 1.4 MOTION AUTO
  const hyundaiImageIds = [
    '49356594', '49356605', '49356612', '49356467', '49356487',
    '49356510', '49356579', '49356565', '49356521', '49356528',
    '49356535', '49356542', '49356544', '49356552', '49356557',
    '49356623', '49356629', '49356633'
  ];

  const hyundaiData = {
    make: 'Hyundai',
    model: 'i20 1.4 Motion Auto',
    year: 2022,
    price: 219900,
    mileage: 61014,
    condition: 'USED',
    carType: 'Hatchback',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    engine: '1.4L (1368 cc)',
    exteriorColor: 'Grey',
    interiorColor: 'Black',
    description: 'Discover this sleek grey 2022 Hyundai i20 1.4 Motion Auto, a stylish hatchback in Aeroton, Johannesburg. Features a smooth automatic transmission, 1.4L petrol engine, front-wheel drive, accident-free history, partial service history, and pristine interior. Excellent value for R219 900.',
    features: [
      'Airbags',
      'ABS',
      'Automatic Transmission',
      'Front Wheel Drive',
      '5 Seats',
      'Accident Free',
      'Partial Service History',
      'Electric Windows',
      'Air Conditioning',
      'Bluetooth Connectivity',
      'Alloy Wheels'
    ],
    status: 'AVAILABLE',
    featured: true,
  };

  await seedCar(hyundaiData, hyundaiImageIds, 'hyundai_i20');

  // 2. NISSAN NP200 1.6i SINGLE CAB
  const nissanImageIds = [
    '49322374', '49322424', '49322391', '49322467', '49322327',
    '49322286', '49322316', '49322516', '49322552', '49322562',
    '49322609', '49322638', '49322655', '49322331', '49322341',
    '49322583'
  ];

  const nissanData = {
    make: 'Nissan',
    model: 'NP200 1.6i Single Cab',
    year: 2015,
    price: 99900,
    mileage: 184305,
    condition: 'USED',
    carType: 'Bakkie',
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    engine: '1.6L (1598 cc)',
    exteriorColor: 'White',
    interiorColor: 'Black',
    description: 'Dependable 2015 Nissan NP200 1.6i Single Cab bakkie in Aeroton, Johannesburg. Features a reliable 1.6L petrol engine, 5-speed manual transmission, air conditioning, rubberized load bin, and great fuel efficiency. Available for R99 900.',
    features: [
      'Air Conditioning',
      'Power Steering',
      '5-Speed Manual',
      'Front Wheel Drive',
      '2 Seats',
      'Rubberized Load Bin',
      'Towbar',
      'CD/Radio',
      'Great Price Rating'
    ],
    status: 'AVAILABLE',
    featured: true,
  };

  await seedCar(nissanData, nissanImageIds, 'nissan_np200');

  console.log('\n--- ALL VEHICLES AND IMAGES SEEDED SUCCESSFULLY ---');
}

main();
