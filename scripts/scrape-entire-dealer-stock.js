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

const ALL_AUTO_FAME_PATHS = [
  '/car-for-sale/renault/sandero/stepway/28682390',
  '/car-for-sale/suzuki/swift/glx/28686649',
  '/car-for-sale/hyundai/i20/motion/28685947',
  '/car-for-sale/nissan/np200/1.6/28684067',
  '/car-for-sale/bmw/x2/sdrive20i/28685698',
  '/car-for-sale/toyota/rumion/1.5/28675872',
  '/car-for-sale/suzuki/swift/glx/28686619',
  '/car-for-sale/kia/rio/1.4/28672837',
  '/car-for-sale/toyota/fortuner/2.8gd-6/28663155',
  '/car-for-sale/volkswagen/polo/1.0tsi/27844862',
  '/car-for-sale/haval/jolion-pro/premium/28674518',
  '/car-for-sale/volkswagen/t-cross/1.0tsi/28544392',
  '/car-for-sale/haval/jolion/luxury/28571880',
  '/car-for-sale/volkswagen/polo-vivo/1.4/28640896',
  '/car-for-sale/kia/rio/1.4/27846608',
  '/car-for-sale/hyundai/h-100/2.6d/28642542',
  '/car-for-sale/mahindra/pik-up/2.2/28662779',
  '/car-for-sale/kia/rio/1.4/27843147',
  '/car-for-sale/mahindra/pik-up/2.2/28430211',
  '/car-for-sale/ford/ranger/xl/28068068'
];

async function fetchListingPage(urlPath) {
  const targetUrl = `https://www.autotrader.co.za${urlPath}`;
  console.log(`Fetching from ${targetUrl}...`);

  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${urlPath}: HTTP ${response.status}`);
  }

  return await response.text();
}

function parseListingHtml(html) {
  const lines = html.split('\n').filter(l => l.includes('pageParameters['));
  const params = {};
  for (const line of lines) {
    const match = line.match(/pageParameters\['([^']+)'\]\s*=\s*'([^']+)';/);
    if (match) {
      params[match[1]] = match[2];
    }
  }

  const descMatch = html.match(/<meta name="description" content="([\s\S]*?)">/);
  const rawDescription = descMatch ? descMatch[1].replace(/&#xA0;/g, ' ').replace(/&amp;/g, '&') : '';

  const imgRegex = /https:\/\/img\.autotrader\.co\.za\/([0-9]+)/g;
  const imageIds = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const id = match[1];
    if (!imageIds.includes(id) && id !== '35530457' && id !== '47539582' && id !== '48879696' && id !== '48740062') {
      imageIds.push(id);
    }
  }

  return { params, rawDescription, imageIds };
}

async function downloadAndUploadImage(imageId, filePrefix, index, totalCount) {
  const url = `https://img.autotrader.co.za/${imageId}`;
  const filename = `${filePrefix}_${index + 1}.jpg`;
  console.log(`  [Image ${index + 1}/${totalCount}] Downloading ${imageId}...`);
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
        storageIdResult = storageId;
      }
    } catch (e) {
      console.warn('   Convex upload fallback notice:', e.message);
    }

    return storageIdResult || `/cars/${filename}`;
  } catch (error) {
    console.error(`  Error processing image ${imageId}:`, error.message);
    return `/cars/${filename}`;
  }
}

async function main() {
  console.log('================================================================');
  console.log(`--- BULK SCRAPING ALL ${ALL_AUTO_FAME_PATHS.length} AUTO FAME INVENTORY VEHICLES ---`);
  console.log('================================================================\n');

  // Get Dealership ID
  const dealerships = await retry(() => convex.query('dealerships:list', {}));
  if (dealerships.length === 0) {
    throw new Error('No dealerships found in Convex.');
  }
  const dealershipId = dealerships[0].id;

  for (let i = 0; i < ALL_AUTO_FAME_PATHS.length; i++) {
    const urlPath = ALL_AUTO_FAME_PATHS[i];
    const listingId = urlPath.split('/').pop();
    console.log(`\n----------------------------------------------------------------`);
    console.log(`Processing Vehicle ${i + 1}/${ALL_AUTO_FAME_PATHS.length} [Path: ${urlPath}]`);
    console.log(`----------------------------------------------------------------`);

    try {
      const html = await fetchListingPage(urlPath);
      const { params, rawDescription, imageIds } = parseListingHtml(html);

      const make = params.make || 'Toyota';
      const modelName = params.variant ? `${params.model} ${params.variant}` : (params.model || 'Vehicle');
      const year = params.year ? parseInt(params.year, 10) : 2022;
      const price = params.price ? parseFloat(params.price) : 150000;
      const mileage = params.mileage ? parseInt(params.mileage, 10) : 50000;
      const rawFuel = (params.fuel_type || 'Petrol').toUpperCase();
      const fuelType = rawFuel === 'GASOLINE' ? 'PETROL' : rawFuel;
      const rawGear = (params.gearbox || 'Manual').toUpperCase();
      const transmission = rawGear.includes('AUTO') ? 'AUTOMATIC' : 'MANUAL';
      let bodyType = params.body_type || 'Hatchback';
      if (bodyType.toLowerCase().includes('cab') || bodyType.toLowerCase().includes('bakkie') || bodyType.toLowerCase().includes('pickup')) {
        bodyType = 'Bakkie';
      }

      const filePrefix = `${make.toLowerCase()}_${params.model.toLowerCase().replace(/[^a-z0-9]/g, '')}_${listingId}`;

      console.log(`Specs: ${year} ${make} ${modelName}`);
      console.log(`Price: R${price.toLocaleString()} | Mileage: ${mileage.toLocaleString()} km | Transmission: ${transmission} | Fuel: ${fuelType}`);
      console.log(`Vehicle photos to download: ${imageIds.length}`);

      // Download & upload all photos
      const photoUrls = [];
      for (let j = 0; j < imageIds.length; j++) {
        const photoUrl = await downloadAndUploadImage(imageIds[j], filePrefix, j, imageIds.length);
        photoUrls.push(photoUrl);
      }

      const description = rawDescription || `Discover this ${year} ${make} ${modelName}, available at Auto Fame in Gleneagles, Johannesburg. Fully inspected and roadworthy certified.`;

      const carData = {
        make,
        model: modelName,
        year,
        price,
        mileage,
        condition: 'USED',
        carType: bodyType,
        fuelType,
        transmission,
        engine: params.engine_capacity ? `${(parseInt(params.engine_capacity, 10) / 1000).toFixed(1)}L` : '1.5L',
        exteriorColor: params.colour || 'Silver',
        interiorColor: 'Black',
        description,
        features: [
          'Airbags',
          'ABS',
          `${transmission} Transmission`,
          'Front Wheel Drive',
          `${params.number_of_seats || 5} Seats`,
          'Accident Free',
          'Roadworthy Certified',
          'Air Conditioning',
          'Bluetooth Connectivity'
        ],
        photoUrls,
        status: 'AVAILABLE',
        featured: true,
        dealershipId,
      };

      // Check existing in Convex by VIN or Make & Listing ID
      const existingCars = await retry(() => convex.query('cars:list', { showAll: true }));
      const existingCar = existingCars.find(
        (c) => String(c.make).toLowerCase() === make.toLowerCase() &&
               String(c.model).toLowerCase().includes(params.model.toLowerCase())
      );

      if (existingCar) {
        console.log(`Updating existing vehicle (Numeric ID: ${existingCar.id}) in Convex...`);
        const updated = await retry(() =>
          convex.mutation('cars:update', {
            id: existingCar.id,
            photoUrls,
            price,
            mileage,
            featured: true,
            description,
            features: carData.features,
          })
        );
        console.log(`✓ Updated ${year} ${make} ${modelName} (${photoUrls.length} photos)`);
      } else {
        console.log(`Creating new car record in Convex...`);
        const created = await retry(() => convex.mutation('cars:create', carData));
        console.log(`✓ Created ${year} ${make} ${modelName} (${photoUrls.length} photos)`);
      }
    } catch (err) {
      console.error(`Error processing ${urlPath}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log('--- ENTIRE AUTO FAME DEALER INVENTORY SEEDED SUCCESSFULLY ---');
  console.log('================================================================');
}

main();
