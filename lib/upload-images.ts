"use server";

import { convexClient } from "@/lib/convex";

// This server action uploads car images to Convex storage properly
// It runs inside the project so the Convex SDK works correctly
export async function uploadCarImages(carId: number, imageUrls: string[]) {
  const storageIds: string[] = [];

  for (const url of imageUrls) {
    try {
      // 1. Get upload URL from Convex
      const uploadUrl = await convexClient.mutation("files:generateUploadUrl");

      // 2. Fetch image from URL 
      const resp = await fetch(url);
      const blob = await resp.blob();

      // 3. Upload to Convex
      const formData = new FormData();
      formData.append("file", blob, `car_${carId}_${Date.now()}.jpg`);
      const uploadResp = await fetch(uploadUrl, { method: "POST", body: formData });
      const { storageId } = await uploadResp.json();
      storageIds.push(storageId!);

      // 4. Get the CDN URL
      const cdnUrl = await convexClient.query("files:getUrl", { storageId });
      console.log(`Uploaded: ${cdnUrl}`);
    } catch (e) {
      console.error(`Failed to upload: ${e}`);
    }
  }

  // 5. Update the car with storage IDs
  await convexClient.mutation("cars:update", {
    id: carId,
    photoUrls: storageIds,
    status: "AVAILABLE",
  });

  return storageIds;
}
