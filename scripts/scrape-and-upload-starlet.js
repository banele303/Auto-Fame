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

async function downloadAndUploadImage(url, filename) {
  console.log(`Downloading image from ${url}...`);
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

    // Save locally first for backup/public directory
    const publicDir = path.join(__dirname, '..', 'public', 'cars');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const localPath = path.join(publicDir, filename);
    fs.writeFileSync(localPath, buffer);
    console.log(`Saved locally to ${localPath}`);

    // Generate upload URL with retry
    console.log(`Generating Convex upload URL...`);
    const uploadUrl = await retry(() => convex.mutation('files:generateUploadUrl', {}));

    // Upload to Convex
    console.log(`Uploading to Convex storage...`);
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to Convex: ${uploadResponse.statusText}`);
    }

    const { storageId } = await uploadResponse.json();
    console.log(`Uploaded to Convex. Storage ID: ${storageId}`);

    // Get public URL with retry
    let publicUrl;
    try {
      publicUrl = await retry(() => convex.query('files:getUrl', { storageId }));
    } catch (queryErr) {
      console.warn('Convex query files:getUrl failed. Constructing URL manually as fallback.');
      // Extract deployment name from URL: e.g. https://frugal-zebra-890.convex.cloud -> frugal-zebra-890
      const match = convexUrl.match(/https:\/\/([^.]+)\.convex\.(?:cloud|site)/);
      if (match) {
        publicUrl = `https://${match[1]}.convex.site/api/storage/${storageId}`;
      } else {
        throw queryErr;
      }
    }
    
    console.log(`Convex Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`Error processing image ${url}:`, error);
    throw error;
  }
}

async function main() {
  console.log('--- Scraping and Uploading Toyota Starlet ---');
  try {
    // 1. Download and upload the two images
    const img1Url = 'https://img.autotrader.co.za/48774711';
    const img2Url = 'https://img.autotrader.co.za/48774655';

    const p1 = await downloadAndUploadImage(img1Url, 'starlet_1.png');
    const p2 = await downloadAndUploadImage(img2Url, 'starlet_2.png');

    const photoUrls = [p1, p2];

    // 2. Query dealerships to get a valid dealership ID
    console.log('Querying dealerships...');
    const dealerships = await retry(() => convex.query('dealerships:list', {}));
    if (dealerships.length === 0) {
      throw new Error('No dealerships found in Convex. Cannot create car.');
    }
    const dealershipId = dealerships[0].id;
    console.log(`Using Dealership ID: ${dealershipId} (${dealerships[0].name})`);

    // 3. Create the car in Convex
    console.log('Creating car in Convex...');
    const carData = {
      make: 'Toyota',
      model: 'Starlet',
      year: 2024,
      price: 199900,
      mileage: 198126,
      condition: 'USED',
      carType: 'Hatchback',
      fuelType: 'PETROL',
      transmission: 'MANUAL',
      engine: '1.5',
      exteriorColor: 'Grey',
      interiorColor: 'Black',
      description: 'Discover this grey 2024 Toyota Starlet 1.5, a practical and stylish hatchback currently available in Gleneagles, Johannesburg, Gauteng. Equipped with a manual transmission and a front-wheel-drive drivetrain, this petrol-powered car delivers a dependable driving experience. Highly rated for its market price, this accident-free vehicle is ready for the road for R199 900.',
      features: [
        'Airbags',
        'ABS',
        'Manual transmission',
        'Front Wheel Drive',
        '5 Seats',
        'Accident Free',
        'Full Service History',
        'Electric Windows',
        'Air Conditioning',
        'Bluetooth Connectivity'
      ],
      photoUrls: photoUrls,
      status: 'AVAILABLE',
      featured: true,
      dealershipId: dealershipId,
    };

    const newCar = await retry(() => convex.mutation('cars:create', carData));
    console.log('Car created successfully in Convex:', newCar);
  } catch (error) {
    console.error('Error in main flow:', error);
  }
}

main();
