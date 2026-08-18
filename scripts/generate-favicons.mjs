import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// --- CRC32 calculation for PNG chunks ---
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const toCrc = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(toCrc), 8 + len);
  return buf;
}

// --- PNG Encoder ---
function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[dstOffset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      scanlines[dstOffset++] = rgbaBuffer[srcOffset++];
      scanlines[dstOffset++] = rgbaBuffer[srcOffset++];
      scanlines[dstOffset++] = rgbaBuffer[srcOffset++];
      scanlines[dstOffset++] = rgbaBuffer[srcOffset++];
    }
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// --- ICO Generator ---
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  let headerSize = 6 + count * 16;
  let currentOffset = headerSize;

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(count, 4);

  const dirEntries = [];
  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    dirEntries.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([icoHeader, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
}

// --- High Precision Signed Distance Field for Rounded Box ---
function sdRoundBox(px, py, w, h, r) {
  const qx = Math.abs(px - w / 2) - (w / 2 - r);
  const qy = Math.abs(py - h / 2) - (h / 2 - r);
  return Math.min(Math.max(qx, qy), 0.0) + Math.hypot(Math.max(qx, 0.0), Math.max(qy, 0.0)) - r;
}

// --- Render RGBA Pixel Buffer ---
function renderFaviconRGBA(size) {
  const buf = Buffer.alloc(size * size * 4);
  const scale = size / 512;
  const radius = 96 * scale; // Sleek modern squircle radius
  const badgeMargin = 12 * scale;
  const badgeW = size - badgeMargin * 2;
  const badgeH = size - badgeMargin * 2;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Coordinate relative to badge box
      const bx = x - badgeMargin;
      const by = y - badgeMargin;
      const d = sdRoundBox(bx, by, badgeW, badgeH, radius);

      if (d > 1.2) {
        // Transparent pixel outside rounded badge
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }

      // Smooth anti-aliased edge alpha
      let alpha = 1.0;
      if (d > -1.2) {
        alpha = Math.max(0, Math.min(1, (-d + 1.2) / 2.4));
      }

      // Background color: Deep obsidian & carbon dark luxury (#070B09 to #030504)
      const gradT = (x + y) / (size * 2);
      let r = Math.round(11 * (1 - gradT) + 3 * gradT);
      let g = Math.round(18 * (1 - gradT) + 5 * gradT);
      let b = Math.round(14 * (1 - gradT) + 4 * gradT);

      // Emerald Rim Glow Border
      const rimWidth = Math.max(2, 8 * scale);
      if (d > -rimWidth && d <= 1.2) {
        const rimFactor = Math.sin(((-d + 1.2) / (rimWidth + 1.2)) * Math.PI);
        r = Math.min(255, Math.round(r + 0 * rimFactor));
        g = Math.min(255, Math.round(g + 230 * rimFactor));
        b = Math.min(255, Math.round(b + 118 * rimFactor));
      }

      // Inner Ambient Glow Behind Car Silhouette
      const egx = (x - cx) / (160 * scale);
      const egy = (y - (cy - 10 * scale)) / (80 * scale);
      const egDist = egx * egx + egy * egy;
      if (egDist < 1.0) {
        const glowFactor = (1.0 - egDist) * 0.22;
        g = Math.min(255, g + Math.round(230 * glowFactor));
        b = Math.min(255, b + Math.round(118 * glowFactor));
      }

      // Normalized coordinates (0 to 512)
      const nx = x / scale;
      const ny = y / scale;

      // 1. Aerodynamic Roofline & Windshield (Chrome White #FFFFFF)
      // Arch peaking at (290, 185) from nx: 140 to 415
      const roofX = (nx - 280) / 140;
      const expectedRoofY = 185 + roofX * roofX * 75;
      const roofDist = Math.abs(ny - expectedRoofY);
      if (nx >= 140 && nx <= 415 && roofDist < (16 * (1 - Math.abs(roofX) * 0.35))) {
        const intensity = Math.max(0, 1 - roofDist / 16);
        r = Math.min(255, Math.round(r * (1 - intensity) + 255 * intensity));
        g = Math.min(255, Math.round(g * (1 - intensity) + 255 * intensity));
        b = Math.min(255, Math.round(b * (1 - intensity) + 255 * intensity));
      }

      // 2. Primary Neon Supercar Shoulder Line (#00FFA2 to #00E676)
      const bodyX = (nx - 260) / 175;
      const expectedBodyY = 215 + bodyX * bodyX * 85;
      const bodyDist = Math.abs(ny - expectedBodyY);
      if (nx >= 95 && nx <= 435 && bodyDist < (14 * (1 - Math.abs(bodyX) * 0.25))) {
        const intensity = Math.max(0, 1 - bodyDist / 14);
        r = Math.min(255, Math.round(r * (1 - intensity) + 0 * intensity));
        g = Math.min(255, Math.round(g * (1 - intensity) + 245 * intensity));
        b = Math.min(255, Math.round(b * (1 - intensity) + 120 * intensity));
      }

      // 3. Dynamic Headlamp Claw & Front Splitter (Left: 70..130)
      if (nx >= 70 && nx <= 145 && ny >= 280 && ny <= 335) {
        const hDist = Math.abs(ny - (310 - (nx - 70) * 0.2));
        if (hDist < 10) {
          const intensity = Math.max(0, 1 - hDist / 10);
          r = Math.min(255, Math.round(r * (1 - intensity) + 255 * intensity));
          g = Math.min(255, Math.round(g * (1 - intensity) + 255 * intensity));
          b = Math.min(255, Math.round(b * (1 - intensity) + 255 * intensity));
        }
      }

      // 4. Main Body Profile Line (Emerald Green)
      const lowerX = (nx - 250) / 185;
      const expectedLowerY = 275 + lowerX * lowerX * 45;
      const lowerDist = Math.abs(ny - expectedLowerY);
      if (nx >= 70 && nx <= 435 && lowerDist < 12) {
        const intensity = Math.max(0, 1 - lowerDist / 12);
        r = Math.min(255, Math.round(r * (1 - intensity) + 0 * intensity));
        g = Math.min(255, Math.round(g * (1 - intensity) + 230 * intensity));
        b = Math.min(255, Math.round(b * (1 - intensity) + 118 * intensity));
      }

      // 5. Front Wheel Arch (Center: 165, 320) & Rear Wheel Arch (Center: 380, 320)
      const fw = Math.sqrt(Math.pow((nx - 165) / 45, 2) + Math.pow((ny - 325) / 26, 2));
      if (fw >= 0.7 && fw <= 1.0 && ny <= 340) {
        const ring = Math.sin((fw - 0.7) / 0.3 * Math.PI);
        r = Math.min(255, Math.round(r + 210 * ring));
        g = Math.min(255, Math.round(g + 245 * ring));
        b = Math.min(255, Math.round(b + 225 * ring));
      }

      const rw = Math.sqrt(Math.pow((nx - 380) / 45, 2) + Math.pow((ny - 325) / 26, 2));
      if (rw >= 0.7 && rw <= 1.0 && ny <= 340) {
        const ring = Math.sin((rw - 0.7) / 0.3 * Math.PI);
        r = Math.min(255, Math.round(r + 210 * ring));
        g = Math.min(255, Math.round(g + 245 * ring));
        b = Math.min(255, Math.round(b + 225 * ring));
      }

      // 6. Ground-Effect Aero Skirt Blade (Emerald Neon)
      if (nx >= 90 && nx <= 435 && ny >= 352 && ny <= 366) {
        const skDist = Math.abs(ny - 359);
        const intensity = Math.max(0, 1 - skDist / 7);
        r = Math.min(255, Math.round(r * (1 - intensity) + 0 * intensity));
        g = Math.min(255, Math.round(g * (1 - intensity) + 245 * intensity));
        b = Math.min(255, Math.round(b * (1 - intensity) + 120 * intensity));
      }

      // 7. Rear GT Spoiler Wing (Right top: 405..445, 195..215)
      if (nx >= 400 && nx <= 445 && ny >= 195 && ny <= 218) {
        const wDist = Math.abs(ny - (206 + (nx - 420) * 0.15));
        if (wDist < 6) {
          const intensity = Math.max(0, 1 - wDist / 6);
          r = Math.min(255, Math.round(r * (1 - intensity) + 0 * intensity));
          g = Math.min(255, Math.round(g * (1 - intensity) + 255 * intensity));
          b = Math.min(255, Math.round(b * (1 - intensity) + 162 * intensity));
        }
      }

      // 8. "AUTOFAME" Performance Monogram "AF" at Bottom Center
      // Letter 'A' (nx: 215..265, ny: 388..438)
      if (ny >= 388 && ny <= 438 && nx >= 215 && nx <= 265) {
        const dyA = ny - 388; // 0 to 50
        const leftLeg = 240 - (dyA / 50) * 22;
        const rightLeg = 240 + (dyA / 50) * 22;
        const onLeg1 = Math.abs(nx - leftLeg) < 5.5;
        const onLeg2 = Math.abs(nx - rightLeg) < 5.5;
        const onBar = (ny >= 416 && ny <= 423 && nx >= leftLeg && nx <= rightLeg);
        if (onLeg1 || onLeg2 || onBar) {
          r = Math.min(255, 255);
          g = Math.min(255, 255);
          b = Math.min(255, 255);
        }
      }

      // Letter 'F' (nx: 275..310, ny: 388..438)
      if (ny >= 388 && ny <= 438 && nx >= 275 && nx <= 310) {
        const onBack = Math.abs(nx - 280) < 5.5;
        const onTop = (ny >= 388 && ny <= 398 && nx >= 280 && nx <= 310);
        const onMid = (ny >= 412 && ny <= 421 && nx >= 280 && nx <= 304);
        if (onBack || onTop || onMid) {
          r = Math.min(255, 0);
          g = Math.min(255, 230);
          b = Math.min(255, 118);
        }
      }

      // Speed accent lines flanking AF
      if (ny >= 413 && ny <= 417) {
        if ((nx >= 175 && nx <= 200) || (nx >= 325 && nx <= 350)) {
          r = Math.min(255, 0);
          g = Math.min(255, 230);
          b = Math.min(255, 118);
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = Math.round(alpha * 255);
    }
  }

  return buf;
}

// Master Vector SVG content
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Dark Luxury Obsidian Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1713" />
      <stop offset="45%" stop-color="#060A07" />
      <stop offset="100%" stop-color="#020403" />
    </linearGradient>

    <!-- Emerald Primary Neon Gradient -->
    <linearGradient id="emeraldNeon" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#00FFA2" />
      <stop offset="35%" stop-color="#00E676" />
      <stop offset="70%" stop-color="#00C853" />
      <stop offset="100%" stop-color="#009624" />
    </linearGradient>

    <!-- White Chrome Gradient -->
    <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#E2FBEA" />
      <stop offset="100%" stop-color="#80E2A7" />
    </linearGradient>

    <!-- Outer Rim Glow -->
    <linearGradient id="rimGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00E676" stop-opacity="0.95" />
      <stop offset="50%" stop-color="#00C853" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#004D25" stop-opacity="0.8" />
    </linearGradient>

    <!-- Ambient Shadow / Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Base Rounded Squircle Badge -->
  <rect x="12" y="12" width="488" height="488" rx="96" fill="url(#bgGrad)" stroke="url(#rimGlow)" stroke-width="10" />
  
  <!-- Subtle Inner Carbon Line -->
  <rect x="22" y="22" width="468" height="468" rx="88" fill="none" stroke="#00E676" stroke-width="1.5" stroke-opacity="0.25" />

  <!-- Ambient Green Underglow -->
  <ellipse cx="256" cy="270" rx="170" ry="65" fill="#00E676" opacity="0.18" filter="url(#glow)" />

  <!-- AERO SUPERCAR SILHOUETTE (Vivid Emerald + Chrome White) -->
  <g filter="url(#glow)">
    <!-- Aerodynamic Roofline / Windshield Contour -->
    <path d="M 140 245 C 180 195 240 162 335 175 C 375 180 405 200 422 230 C 408 222 372 208 335 202 C 255 192 195 225 162 255 Z" 
          fill="url(#chromeGrad)" />

    <!-- Upper Neon Body Profile Line -->
    <path d="M 95 295 C 122 252 185 188 300 172 C 368 162 405 190 432 230 C 422 222 390 202 342 196 C 225 185 152 248 122 298 Z" 
          fill="url(#emeraldNeon)" />

    <!-- Aggressive Headlight Claw -->
    <path d="M 72 308 C 96 302 140 298 180 304 C 156 298 118 298 88 314 C 78 318 68 316 72 308 Z" 
          fill="#FFFFFF" />

    <!-- Dynamic Mid-Body Contour -->
    <path d="M 70 312 C 85 270 140 252 205 256 C 282 260 375 234 438 260 C 418 262 380 266 332 278 C 240 298 162 304 108 328 C 84 336 66 330 70 312 Z" 
          fill="url(#emeraldNeon)" />

    <!-- Front & Rear Wheel Flares -->
    <path d="M 120 338 C 128 308 158 290 188 294 C 212 298 226 318 228 340 C 218 325 200 312 182 310 C 155 308 132 322 120 338 Z" 
          fill="url(#chromeGrad)" />
    <path d="M 340 340 C 346 308 376 290 406 292 C 428 294 442 312 446 338 C 438 322 422 308 404 308 C 378 308 355 322 340 340 Z" 
          fill="url(#chromeGrad)" />

    <!-- Ground Aero Skirt Blade -->
    <path d="M 95 352 L 435 352 C 442 352 448 358 442 363 C 408 368 345 372 265 372 C 185 372 125 366 90 362 C 84 358 90 352 95 352 Z" 
          fill="url(#emeraldNeon)" />

    <!-- Rear GT Wing / Spoiler -->
    <path d="M 405 210 C 420 204 440 204 450 214 C 438 217 425 220 412 228 Z" 
          fill="#00FFA2" />
  </g>

  <!-- LUXURY MONOGRAM "AF" -->
  <g transform="translate(0, 12)">
    <!-- Letter A (Chrome White) -->
    <path d="M 215 438 L 235 385 L 250 385 L 270 438 L 254 438 L 248 423 L 236 423 L 231 438 Z M 240 408 L 245 394 L 245 394 L 247 408 Z" 
          fill="#FFFFFF" />
    
    <!-- Letter F (Emerald Neon) -->
    <path d="M 278 385 L 305 385 L 305 397 L 292 397 L 292 408 L 302 408 L 302 420 L 292 420 L 292 438 L 278 438 Z" 
          fill="url(#emeraldNeon)" />

    <!-- Side Speed Lines -->
    <line x1="175" y1="412" x2="202" y2="412" stroke="#00E676" stroke-width="3.5" stroke-linecap="round" />
    <line x1="318" y1="412" x2="345" y2="412" stroke="#00E676" stroke-width="3.5" stroke-linecap="round" />
  </g>
</svg>`;

const publicDir = path.resolve('public');
const appDir = path.resolve('src/app');

// Generate all sizes
const sizes = [16, 32, 48, 96, 180, 192, 512];
const generatedPNGs = {};
const icoEntries = [];

for (const s of sizes) {
  console.log(`Generating RGBA PNG ${s}x${s}...`);
  const rgba = renderFaviconRGBA(s);
  const png = encodePNG(s, s, rgba);
  generatedPNGs[s] = png;
  if ([16, 32, 48, 96].includes(s)) {
    icoEntries.push({ width: s, height: s, buffer: png });
  }
}

// Write SVG icons
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(appDir, 'favicon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(appDir, 'apple-icon.svg'), svgContent, 'utf8');

// Write PNG icons
fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), generatedPNGs[16]);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), generatedPNGs[32]);
fs.writeFileSync(path.join(publicDir, 'favicon-96x96.png'), generatedPNGs[96]);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatedPNGs[180]);
fs.writeFileSync(path.join(publicDir, 'web-app-manifest-192x192.png'), generatedPNGs[192]);
fs.writeFileSync(path.join(publicDir, 'web-app-manifest-512x512.png'), generatedPNGs[512]);

fs.writeFileSync(path.join(appDir, 'favicon.png'), generatedPNGs[96]);
fs.writeFileSync(path.join(appDir, 'icon.png'), generatedPNGs[192]);
fs.writeFileSync(path.join(appDir, 'apple-icon.png'), generatedPNGs[180]);

// Write ICO icons
const icoBuffer = createIco(icoEntries);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);

console.log('SUCCESS: All AutoFame favicons generated cleanly!');
