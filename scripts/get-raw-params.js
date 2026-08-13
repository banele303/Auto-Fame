import fs from 'fs';

function getRawParams(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.includes('pageParameters['));
  const kv = {};
  for (const line of lines) {
    const match = line.match(/pageParameters\['([^']+)'\]\s*=\s*'([^']+)';/);
    if (match) {
      kv[match[1]] = match[2];
    }
  }
  return kv;
}

console.log('=== HYUNDAI I20 PARAMS ===');
console.log(getRawParams('C:/Users/Mr Ness/.gemini/antigravity/brain/aa41fa7f-6bac-4608-b6ab-c564cf9792d1/.system_generated/steps/113/content.md'));

console.log('\n=== NISSAN NP200 PARAMS ===');
console.log(getRawParams('C:/Users/Mr Ness/.gemini/antigravity/brain/aa41fa7f-6bac-4608-b6ab-c564cf9792d1/.system_generated/steps/115/content.md'));
