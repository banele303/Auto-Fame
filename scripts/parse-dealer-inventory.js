import fs from 'fs';

const content = fs.readFileSync('C:/Users/Mr Ness/.gemini/antigravity/brain/aa41fa7f-6bac-4608-b6ab-c564cf9792d1/.system_generated/steps/139/content.md', 'utf8');

// Match listing links like /car-for-sale/... or /car-for-sale/make/model/.../28686649
const regex = /\/car-for-sale\/[a-zA-Z0-9\-\/]+\/([0-9]{8})/g;
const listingIds = [];
let match;
while ((match = regex.exec(content)) !== null) {
  if (!listingIds.includes(match[1])) {
    listingIds.push(match[1]);
  }
}

// Also match full listing URLs
const urlRegex = /https:\/\/www\.autotrader\.co\.za\/car-for-sale\/[a-zA-Z0-9\-\/]+\/[0-9]{8}/g;
const urls = [...new Set(content.match(urlRegex) || [])];

console.log('--- AUTO FAME DEALER INVENTORY ---');
console.log('Found Listing IDs (' + listingIds.length + '):', listingIds);
console.log('Found URLs (' + urls.length + '):', urls);
