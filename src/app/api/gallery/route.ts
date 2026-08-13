import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const gallery = await prisma.gallery.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(gallery);
  } catch (error: any) {
    console.error("[API/gallery] GET error:", error);
    return NextResponse.json({ message: "Failed to fetch gallery", error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req, ["ADMIN", "SALES_MANAGER"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string || "";
    const category = formData.get("category") as string || "2025";

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Upload to S3
    const url = await uploadToS3(file, "gallery");

    // Save to DB
    const galleryItem = await prisma.gallery.create({
      data: {
        url,
        title: title || file.name,
        category
      }
    });

    return NextResponse.json(galleryItem);
  } catch (error: any) {
    console.error("[API/gallery] POST error:", error);
    return NextResponse.json({ message: "Failed to upload to gallery", error: error.message }, { status: 500 });
  }
}
