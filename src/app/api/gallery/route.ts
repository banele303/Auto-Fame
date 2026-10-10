import { NextRequest, NextResponse } from "next/server";
import { convexClient } from "@/lib/convex";
import { uploadToConvex } from "@/lib/s3";
import { verifyAuth } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/gallery
 * Retrieves all gallery items exclusively from Convex database.
 */
export async function GET() {
  try {
    const items = await convexClient.query("gallery:list", {});
    return NextResponse.json(Array.isArray(items) ? items : []);
  } catch (error: any) {
    console.error("[API/gallery] GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch gallery from Convex", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gallery
 * Uploads an image exclusively to Convex Cloud Storage and saves record to Convex database.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req, ["ADMIN", "SALES_MANAGER"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "";
    const category = (formData.get("category") as string) || "showroom";

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload exclusively to Convex Cloud Storage CDN
    let url = "";
    try {
      url = await uploadToConvex(buffer, file.type || "image/jpeg");
    } catch (cvxUploadErr: any) {
      console.error("[API/gallery] Convex storage upload failed:", cvxUploadErr);
      return NextResponse.json(
        { message: "Failed to upload image to Convex storage", error: cvxUploadErr?.message || String(cvxUploadErr) },
        { status: 500 }
      );
    }

    if (!url) {
      return NextResponse.json({ message: "Failed to get image CDN URL from Convex storage" }, { status: 500 });
    }

    const cleanTitle = title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    // 2. Save metadata exclusively to Convex DB
    const galleryItem = await convexClient.mutation("gallery:create", {
      url,
      title: formattedTitle,
      category,
    });

    return NextResponse.json(galleryItem || {
      url,
      title: formattedTitle,
      category,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API/gallery] POST error:", error);
    return NextResponse.json({ message: "Failed to save gallery item", error: error.message }, { status: 500 });
  }
}
