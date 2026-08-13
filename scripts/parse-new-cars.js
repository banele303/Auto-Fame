import fs from 'fs';
import path from 'path';

function parsePage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract LD JSON block
  const startIdx = content.indexOf('<script type="application/ld+json">');
  let jsonLd = null;
  if (startIdx !== -1) {
    const endIdx = content.indexOf('</script>', startIdx);
    const jsonStr = content.slice(startIdx + '<script type="application/ld+json">'.length, endIdx).trim();
    try {
      jsonLd = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse LD+JSON:', e.message);
    }
  }

  // Extract all img.autotrader.co.za image IDs
  const regex = /https:\/\/img\.autotrader\.co\.za\/([0-9]+)/g;
  const imageIds = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!imageIds.includes(match[1])) {
      imageIds.push(match[1]);
    }
  }

  return { jsonLd, imageIds };
}

const hyundai = parsePage('C:/Users/Mr Ness/.gemini/antigravity/brain/aa41fa7f-6bac-4608-b6ab-c564cf9792d1/.system_generated/steps/113/content.md');
const nissan = parsePage('C:/Users/Mr Ness/.gemini/antigravity/brain/aa41fa7f-6bac-4608-b6ab-c564cf9792d1/.system_generated/steps/115/content.md');

console.log('--- HYUNDAI I20 ---');
console.log('Specs:', JSON.stringify(hyundai.jsonLd, null, 2));
console.log('Image IDs (' + hyundai.imageIds.length + '):', hyundai.imageIds);

console.log('\n--- NISSAN NP200 ---');
console.log('Specs:', JSON.stringify(nissan.jsonLd, null, 2));
console.log('Image IDs (' + nissan.imageIds.length + '):', nissan.imageIds);
