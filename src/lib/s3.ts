import { convexClient } from "./convex";

/**
 * Uploads a file/buffer directly to Convex CDN storage as clean raw binary
 */
export async function uploadToConvex(
  file: File | Blob | Buffer | Uint8Array,
  mimeType = "image/jpeg"
): Promise<string> {
  try {
    const postUrl = await (convexClient as any).mutation("files:generateUploadUrl");

    let bodyData: any;
    let contentType = mimeType;

    if (file instanceof Buffer) {
      bodyData = file;
    } else if (file instanceof Uint8Array) {
      bodyData = file;
    } else if (typeof (file as any).arrayBuffer === "function") {
      bodyData = await (file as any).arrayBuffer();
      if ((file as any).type) {
        contentType = (file as any).type;
      }
    } else {
      bodyData = file;
    }

    const response = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType || "image/jpeg",
      },
      body: bodyData,
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

    const convexUrl =
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      process.env.CONVEX_URL ||
      "https://reliable-sturgeon-574.convex.cloud";
    return `${convexUrl}/api/storage/${storageId}`;
  } catch (error: any) {
    console.error("Error uploading file to Convex:", error);
    throw error;
  }
}

/**
 * Upload helper - uploads to Convex storage
 */
export async function uploadToS3(
  file: File | Blob | Buffer | Uint8Array,
  _folder = "cars"
): Promise<string> {
  return await uploadToConvex(file);
}
