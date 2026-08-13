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

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://frugal-zebra-890.convex.cloud";
    return `${convexUrl}/api/storage/${storageId}`;
  } catch (error: any) {
    console.error("Error uploading file to Convex:", error);
    throw error;
  }
}

/**
 * Compatibility wrapper - uploads to Convex storage (with S3 fallback)
 */
export async function uploadToS3(file: File, folder = "cars"): Promise<string> {
  try {
    return await uploadToConvex(file);
  } catch (err: any) {
    console.warn("Convex upload failed, checking S3 credentials...", err?.message);
    
    const bucket = process.env.AWS_BUCKET_NAME?.trim();
    const region = process.env.AWS_REGION?.trim();
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

    if (bucket && region && accessKeyId && secretAccessKey) {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `${folder}/${Date.now()}-${file.name}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: fileName,
          Body: buffer,
          ContentType: file.type || "image/jpeg",
        })
      );

      return `https://${bucket}.s3.${region}.amazonaws.com/${fileName}`;
    }

    throw new Error(`Failed to upload photo: ${err?.message || "Storage unavailable"}`);
  }
}
