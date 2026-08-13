import fs from 'fs';

function extractCarInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract gaPageParameters or pageParameters
  const paramMatch = content.match(/window\.gaPageParameters\s*=\s*(\{[\s\S]*?\});/);
  let params = null;
  if (paramMatch) {
    try {
      eval('params = ' + paramMatch[1]);
    } catch(e) {
      console.error('eval error:', e);
    }
  }

  // Extract description tag
  const descMatch = content.match(/<meta name="description" content="([\s\S]*?)">/);
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);

  return { title: titleMatch?.[1], description: descMatch?.[1], params };
}

console.log('=== HYUNDAI I20 ===');
console.log(JSON.stringify(extractCarInfo('C:/Users/Mr Ness/.gemini/antigravity/brain/aa41fa7f-6bac-4608-b6ab-c564cf9792d1/.system_generated/steps/113/content.md'), null, 2));

console.log('\n=== NISSAN NP200 ===');
console.log(JSON.stringify(extractCarInfo('C:/Users/Mr Ness/.gemini/antigravity/brain/aa41fa7f-6bac-4608-b6ab-c564cf9792d1/.system_generated/steps/115/content.md'), null, 2));
