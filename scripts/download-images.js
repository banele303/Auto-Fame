import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Ensure directories exist
const publicDir = path.join(__dirname, '..', 'public');
const uploadsDir = path.join(publicDir, 'uploads');
const carsDir = path.join(uploadsDir, 'cars');
const blogDir = path.join(uploadsDir, 'blog');
const galleryDir = path.join(uploadsDir, 'gallery');
const financingDir = path.join(uploadsDir, 'financing');

[uploadsDir, carsDir, blogDir, galleryDir, financingDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function downloadFile(url, destDir) {
  if (!url || !url.startsWith('http')) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const filename = `${Date.now()}-${path.basename(urlObj.pathname)}`;
    const destPath = path.join(destDir, filename);

    console.log(`Downloading: ${url} -> ${destPath}`);

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 10000 // 10s timeout
    });

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        // Return public relative path
        const relativePath = path.relative(publicDir, destPath).replace(/\\/g, '/');
        resolve('/' + relativePath);
      });
      writer.on('error', (err) => {
        console.error(`Write error for ${filename}:`, err.message);
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
    return null; // Return null so we know download failed
  }
}

async function main() {
  console.log('--- Starting AWS S3 Image Downloader ---');

  try {
    // 1. Process Cars
    console.log('\n1. Processing Cars...');
    const cars = await prisma.car.findMany();
    for (const car of cars) {
      console.log(`Car ID ${car.id}: ${car.make} ${car.model}`);
      const updatedUrls = [];
      let changed = false;

      for (const url of car.photoUrls) {
        if (url.includes('amazonaws.com')) {
          const localPath = await downloadFile(url, carsDir);
          if (localPath) {
            updatedUrls.push(localPath);
            changed = true;
          } else {
            updatedUrls.push(url); // Keep original if download failed
          }
        } else {
          updatedUrls.push(url);
        }
      }

      if (changed) {
        await prisma.car.update({
          where: { id: car.id },
          data: { photoUrls: updatedUrls }
        });
        console.log(`Updated Car ${car.id} in DB.`);
      }
    }

    // 2. Process Posts (Blog coverImage)
    console.log('\n2. Processing Blog Posts...');
    const posts = await prisma.post.findMany();
    for (const post of posts) {
      if (post.coverImage && post.coverImage.includes('amazonaws.com')) {
        console.log(`Post ID ${post.id}: ${post.title}`);
        const localPath = await downloadFile(post.coverImage, blogDir);
        if (localPath) {
          await prisma.post.update({
            where: { id: post.id },
            data: { coverImage: localPath }
          });
          console.log(`Updated Post ${post.id} in DB.`);
        }
      }
    }

    // 3. Process Gallery
    console.log('\n3. Processing Gallery...');
    const galleries = await prisma.gallery.findMany();
    for (const item of galleries) {
      if (item.url && item.url.includes('amazonaws.com')) {
        console.log(`Gallery ID ${item.id}: ${item.title || 'Untitled'}`);
        const localPath = await downloadFile(item.url, galleryDir);
        if (localPath) {
          await prisma.gallery.update({
            where: { id: item.id },
            data: { url: localPath }
          });
          console.log(`Updated Gallery ${item.id} in DB.`);
        }
      }
    }

    // 4. Process FinancingApplicationDocument
    console.log('\n4. Processing Financing Documents...');
    const docs = await prisma.financingApplicationDocument.findMany();
    for (const doc of docs) {
      if (doc.url && doc.url.includes('amazonaws.com')) {
        console.log(`Doc ID ${doc.id}: ${doc.originalName}`);
        const localPath = await downloadFile(doc.url, financingDir);
        if (localPath) {
          await prisma.financingApplicationDocument.update({
            where: { id: doc.id },
            data: { url: localPath }
          });
          console.log(`Updated Document ${doc.id} in DB.`);
        }
      }
    }

    console.log('\n--- AWS S3 Image Downloader Completed! ---');
  } catch (error) {
    console.error('Fatal error during download/update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
