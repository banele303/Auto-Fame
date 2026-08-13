import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = new ConvexHttpClient(convexUrl);

async function main() {
  try {
    const cars = await convex.query('cars:list', { showAll: true });
    console.log('Total cars in Convex:', cars.length);
    const empty = cars.filter(c => !c.photoUrls || c.photoUrls.length === 0);
    console.log('Cars with empty/missing photoUrls count:', empty.length);
    if (empty.length > 0) {
      console.log('Sample empty cars:', empty.slice(0, 10).map(c => `${c.id}: ${c.make} ${c.model}`));
    }
  } catch (err) {
    console.error(err);
  }
}

main();
