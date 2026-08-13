import { convexClient } from "./convex";

/**
 * Uploads a file directly to Convex CDN storage as clean raw binary
 */
export async function uploadToConvex(file: File): Promise<string> {
  try {
    const postUrl = await (convexClient as any).mutation("files:generateUploadUrl");

    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Convex storage returned HTTP ${response.status}: ${errText}`);
    }

    const { storageId } = await response.json();
    try {
      const cdnUrl = await (convexClient as any).query("files:getUrl", { storageId });
      if (cdnUrl && typeof cdnUrl === "string" && cdnUrl.startsWith("http")) {
        return cdnUrl;
      }
    } catch {}

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://reliable-sturgeon-574.convex.cloud";
    return `${convexUrl}/api/storage/${storageId}`;
  } catch (error: any) {
    console.error("Error uploading file to Convex:", error);
    throw error;
  }
}

/**
 * Upload helper - uploads to Convex storage
 */
export async function uploadToS3(file: File, _folder = "cars"): Promise<string> {
  return await uploadToConvex(file);
}
