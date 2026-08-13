/**
 * Resolves a car photo URL to something renderable by Next.js <Image> or standard <img>.
 *
 * URL formats handled:
 *   1. Local blob: or data: URLs (e.g. "blob:https://...")
 *      → used as-is for instant browser previews
 *
 *   2. Direct HTTPS/HTTP URL (including Convex CDN storage URLs like
 *      "https://reliable-sturgeon-574.convex.cloud/api/storage/..."):
 *      → used directly
 *
 *   3. Relative URL (e.g. "/placeholder.svg" or "cars/image.jpg"):
 *      → formatted with leading slash
 *
 *   4. Raw Convex storage ID (e.g. "kg27..."):
 *      → proxied via /api/storage/ID
 */
export function resolveCarImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return "/placeholder.svg";
  }

  const trimmed = url.trim();

  // Local Blob URL or Data URL — return as-is for browser previews
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Direct HTTP or HTTPS URL (Convex CDN, S3, Unsplash, etc.) — return as-is
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }

  // Relative URL — ensure leading slash
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // If path contains a slash or standard image extension (e.g. "cars/bmw.jpg" or "logo.png")
  if (trimmed.includes("/") || /\.(jpg|jpeg|png|webp|svg|gif|avif)$/i.test(trimmed)) {
    return `/${trimmed}`;
  }

  // Raw Convex storage ID — proxy via /api/storage/[id]
  return `/api/storage/${trimmed}`;
}

/**
 * Returns the first resolved image URL from a car's photoUrls array,
 * falling back to /placeholder.svg if none exist.
 */
export function getPrimaryCarImage(photoUrls: string[] | null | undefined): string {
  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return "/placeholder.svg";
  }
  return resolveCarImageUrl(photoUrls[0]);
}
