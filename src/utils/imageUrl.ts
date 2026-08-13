/**
 * Resolves a car photo URL to something renderable by Next.js <Image> or standard <img>.
 *
 * URL formats handled:
 *   1. Local blob: or data: URLs (e.g. "blob:https://...")
 *      → used as-is for instant browser previews
 *
 *   2. Direct HTTPS/HTTP URL (including Convex CDN storage URLs like
 *      "https://reliable-sturgeon-574.convex.cloud/api/storage/..."):
 *      → redirects legacy "frugal-zebra-890" to "reliable-sturgeon-574"
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

  let trimmed = url.trim();

  // Local Blob URL or Data URL — return as-is for browser previews
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // Direct HTTP or HTTPS URL
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    // Legacy Convex instance redirect
    if (trimmed.includes("frugal-zebra-890.convex.cloud")) {
      trimmed = trimmed.replace(
        "frugal-zebra-890.convex.cloud",
        "reliable-sturgeon-574.convex.cloud"
      );
    }
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
 * Known local image fallbacks by vehicle model/make
 */
const MODEL_FALLBACK_IMAGES: Record<string, string> = {
  "polo vivo": "/cars/volkswagen_polovivo_28640896_1.jpg",
  polo: "/cars/volkswagen_polo_27844862_1.jpg",
  "t-cross": "/cars/volkswagen_tcross_28544392_1.jpg",
  jolion: "/cars/haval_jolionpro_28674518_1.jpg",
  fortuner: "/cars/toyota_fortuner_28663155_1.jpg",
  rio: "/cars/kia_rio_28672837_1.jpg",
  rumion: "/cars/toyota_rumion_28675872_1.jpg",
  x2: "/cars/bmw_x2_28685698_1.jpg",
  swift: "/cars/suzuki_swift_28686619_1.jpg",
  hilux: "/cars/toyota_fortuner_28663155_1.jpg",
  np200: "/cars/nissan_np200_28684067_1.jpg",
  i20: "/cars/hyundai_i20_28685947_1.jpg",
  ranger: "/cars/ford_ranger_28068068_1.jpg",
  sandero: "/cars/renault_sandero_28682390_1.jpg",
};

/**
 * Returns a high-quality model-matched fallback image if a photo fails to load
 */
export function getFallbackImageForCar(make?: string, model?: string): string {
  const combined = `${make || ""} ${model || ""}`.toLowerCase();
  for (const [key, path] of Object.entries(MODEL_FALLBACK_IMAGES)) {
    if (combined.includes(key)) {
      return path;
    }
  }
  return "/placeholder.svg";
}

/**
 * Returns the first resolved image URL from a car's photoUrls array,
 * falling back to model match or /placeholder.svg if none exist.
 */
export function getPrimaryCarImage(
  photoUrls: string[] | null | undefined,
  make?: string,
  model?: string
): string {
  if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
    return getFallbackImageForCar(make, model);
  }
  return resolveCarImageUrl(photoUrls[0]);
}
