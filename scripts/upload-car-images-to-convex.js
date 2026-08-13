import { ConvexHttpClient } from 'convex/browser';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
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

async function uploadFile(filePath, mimeType) {
  const absolutePath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File does not exist: ${absolutePath}`);
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  
  // 1. Generate upload URL
  console.log(`Generating upload URL for ${filePath}...`);
  const uploadUrl = await convex.mutation('files:generateUploadUrl', {});

  // 2. Upload the file
  console.log(`Uploading ${filePath} to Convex storage...`);
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': mimeType },
    body: fileBuffer,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  const { storageId } = await response.json();
  console.log(`Uploaded successfully. Storage ID: ${storageId}`);

  // 3. Get the public URL
  const publicUrl = await convex.query('files:getUrl', { storageId });
  console.log(`Public URL: ${publicUrl}`);
  return publicUrl;
}

async function main() {
  console.log('--- Uploading generated images to Convex ---');
  
  try {
    // Upload sedan images
    const sedan1 = await uploadFile('public/cars/sedan_1.png', 'image/png');
    const sedan2 = await uploadFile('public/cars/sedan_2.png', 'image/png');
    
    // Upload SUV images
    const suv1 = await uploadFile('public/cars/suv_1.png', 'image/png');
    const suv2 = await uploadFile('public/cars/suv_2.png', 'image/png');
    
    // Upload sports images
    const sports1 = await uploadFile('public/cars/sports_1.png', 'image/png');
    const sports2 = await uploadFile('public/cars/sports_2.png', 'image/png');

    // Upload pickup images
    const pickup1 = await uploadFile('public/cars/pickup_1.png', 'image/png');
    const pickup2 = await uploadFile('public/cars/pickup_2.png', 'image/png');

    const imageMap = {
      sedan: [sedan1, sedan2],
      suv: [suv1, suv2],
      sports: [sports1, sports2],
      pickup: [pickup1, pickup2]
    };

    console.log('\n--- Updating Cars in Convex ---');
    const cars = await convex.query('cars:list', { showAll: true });
    console.log(`Found ${cars.length} cars in Convex.`);

    let count = 0;
    for (const car of cars) {
      const type = (car.carType || '').toUpperCase();
      let category = 'sedan';

      if (type.includes('SUV')) {
        category = 'suv';
      } else if (type.includes('SPORT') || type.includes('COUPE') || type.includes('CONVERTIBLE')) {
        category = 'sports';
      } else if (type.includes('TRUCK') || type.includes('PICKUP')) {
        category = 'pickup';
      }

      const photoUrls = imageMap[category];
      
      console.log(`Updating Car ID ${car.id} (${car.make} ${car.model} - ${car.carType}) with ${category} images...`);
      await convex.mutation('cars:update', {
        id: car.id,
        photoUrls: photoUrls
      });
      count++;
    }

    console.log(`\nSuccessfully updated ${count} cars with realistic Convex storage URLs!`);
  } catch (error) {
    console.error('Error during image upload/update:', error);
  }
}

main();
