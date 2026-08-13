// Robust in-browser image compression utility.
// Uses canvas to resize large images and compress to WebP for optimal file sizes.
// Falls back to original file if anything fails.
// Designed to handle up to 34+ large images without crashing the browser.

export interface CompressOptions {
  maxWidth?: number;        // target maximum width in pixels
  maxHeight?: number;       // target maximum height in pixels
  quality?: number;         // WebP/JPEG quality 0-1
  mimeType?: string;        // override output mime type (default: webp)
  minCompressBytes?: number;// only attempt if file size >= this (default 200KB)
}

const isImageType = (type: string) => /image\/(jpeg|jpg|png|webp|avif|heic|heif|bmp|tiff)/i.test(type);

/**
 * Compress a single image file using canvas.
 * Outputs WebP by default for best compression.
 * Includes explicit cleanup of canvas / bitmap to prevent memory leaks.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  try {
    if (!isImageType(file.type)) return file;
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.80,
      mimeType = 'image/webp',          // WebP gives ~30-50% smaller than JPEG
      minCompressBytes = 200 * 1024,     // compress anything 200KB+
    } = opts;
    if (file.size < minCompressBytes) return file;

    // --- Load image ---
    let bitmap: ImageBitmap | null = null;
    let imgEl: HTMLImageElement | null = null;
    let srcW: number;
    let srcH: number;

    try {
      bitmap = await createImageBitmap(file);
      srcW = bitmap.width;
      srcH = bitmap.height;
    } catch {
      // Fallback: load into an image element (handles HEIC on some browsers)
      const dataUrl = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result as string);
        fr.onerror = () => rej(fr.error);
        fr.readAsDataURL(file);
      });
      imgEl = await new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = (e) => rej(e);
        img.src = dataUrl;
      });
      srcW = imgEl.naturalWidth || imgEl.width;
      srcH = imgEl.naturalHeight || imgEl.height;
    }

    // --- Calculate target dimensions ---
    let targetW = srcW;
    let targetH = srcH;
    if (srcW > maxWidth || srcH > maxHeight) {
      const ratio = Math.min(maxWidth / srcW, maxHeight / srcH);
      targetW = Math.round(srcW * ratio);
      targetH = Math.round(srcH * ratio);
    }

    // If no dimension change and file already small, skip (avoid quality loss)
    if (targetW === srcW && targetH === srcH && file.size < 1 * 1024 * 1024) {
      cleanup();
      return file;
    }

    // --- Draw & compress ---
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) { cleanup(); return file; }
    (ctx as any).imageSmoothingQuality = 'high';

    const drawSource = bitmap || imgEl!;
    ctx.drawImage(drawSource as any, 0, 0, targetW, targetH);

    // Try WebP first, fall back to JPEG if browser doesn't support WebP encoding
    let blob: Blob | null = null;
    let finalMime = mimeType;

    blob = await new Promise<Blob | null>(res => canvas.toBlob(res, mimeType, quality));

    // Some browsers (older Safari) don't support WebP encoding — fall back to JPEG
    if (!blob && mimeType === 'image/webp') {
      finalMime = 'image/jpeg';
      blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
    }

    // --- Clean up memory immediately ---
    cleanup();
    canvas.width = 0;
    canvas.height = 0;

    if (!blob) return file;
    // Only keep if actually smaller
    if (blob.size >= file.size * 0.95) return file;

    const ext = finalMime === 'image/webp' ? '.webp' : '.jpg';
    const newName = file.name.replace(/(\.[a-z0-9]+)?$/i, ext);
    return new File([blob], newName, { type: finalMime, lastModified: Date.now() });

    function cleanup() {
      if (bitmap) { bitmap.close(); bitmap = null; }
      if (imgEl) { imgEl.src = ''; imgEl = null; }
    }
  } catch {
    return file; // fallback: return original on any error
  }
}

/**
 * Compress a batch of image files.
 * Processes in small batches (default 3 at a time) to keep memory usage low
 * when handling up to 34+ large images.
 */
export async function batchCompress(
  files: File[],
  onProgress?: (done: number, total: number, name: string) => void,
  opts?: CompressOptions,
  batchSize: number = 3    // how many images to compress in parallel
): Promise<File[]> {
  const out: File[] = [];
  let done = 0;

  // Process in small batches to avoid OOM on large photo sets
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (f) => {
        const compressed = await compressImage(f, opts);
        done++;
        onProgress?.(done, files.length, f.name);
        return compressed;
      })
    );
    out.push(...results);

    // Yield to the main thread between batches to keep UI responsive
    if (i + batchSize < files.length) {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  return out;
}
