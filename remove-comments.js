import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all .tsx and .ts files
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) {
        findTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to remove JSX comments from a file
function removeJSXComments(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regular expression to match JSX comments: {/* ... */}
    // This handles multi-line comments and comments with various spacing
    const jsxCommentRegex = /\{\s*\/\*[\s\S]*?\*\/\s*\}/g;
    
    const newContent = content.replace(jsxCommentRegex, '');
    
    // Only write if content changed
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✓ Removed comments from: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found!');
    process.exit(1);
  }
  
  console.log('🔍 Finding TypeScript/React files...');
  const tsxFiles = findTsxFiles(srcDir);
  
  console.log(`📁 Found ${tsxFiles.length} files to process`);
  
  let processedCount = 0;
  tsxFiles.forEach(filePath => {
    if (removeJSXComments(filePath)) {
      processedCount++;
    }
  });
  
  console.log(`\n🎉 Complete! Processed ${processedCount} files with JSX comments removed.`);
}

// Run the script
main();
