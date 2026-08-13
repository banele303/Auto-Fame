import fs from 'fs';

const content = fs.readFileSync('C:/Users/Mr Ness/.gemini/antigravity/brain/aa41fa7f-6bac-4608-b6ab-c564cf9792d1/.system_generated/steps/139/content.md', 'utf8');

// Match hrefs containing /car-for-sale/
const regex = /href=["'](\/car-for-sale\/[^"']+)["']/g;
const hrefs = [];
let match;
while ((match = regex.exec(content)) !== null) {
  if (!hrefs.includes(match[1])) {
    hrefs.push(match[1]);
  }
}

console.log('--- FOUND LISTING HREF PATHS (' + hrefs.length + ') ---');
console.log(hrefs);
