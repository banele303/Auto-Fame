import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(req, ["ADMIN", "SALES_MANAGER"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const galleryId = parseInt(id);

    if (isNaN(galleryId)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    // Get the item from DB to get the URL
    const item = await prisma.gallery.findUnique({
      where: { id: galleryId }
    });

    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    // Delete from S3 if it's an S3 URL
    if (item.url.includes(process.env.AWS_BUCKET_NAME!)) {
      try {
        const urlParts = new URL(item.url);
        const key = urlParts.pathname.substring(1); // remove leading /
        
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: key,
        }));
        console.log(`Deleted from S3: ${key}`);
      } catch (s3Error) {
        console.error("Failed to delete from S3:", s3Error);
      }
    }

    // Delete from DB
    await prisma.gallery.delete({
      where: { id: galleryId }
    });

    return NextResponse.json({ message: "Item deleted" });
  } catch (error: any) {
    console.error(`[API/gallery/${params?.id}] DELETE error:`, error);
    return NextResponse.json({ message: "Failed to delete item", error: error.message }, { status: 500 });
  }
}
