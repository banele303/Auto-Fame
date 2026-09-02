import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const dbItems: any[] = [];
    try {
      const items = await prisma.gallery.findMany({
        orderBy: { createdAt: 'desc' }
      });
      dbItems.push(...items);
    } catch (dbErr) {
      console.warn("[API/gallery] DB query skipped or failed:", dbErr);
    }

    const localGalleryItems: any[] = [];

    // Scan public/gallery folder for local images
    try {
      const galleryDir = path.join(process.cwd(), "public", "gallery");
      if (fs.existsSync(galleryDir)) {
        const files = fs.readdirSync(galleryDir);
        files.forEach((file) => {
          if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
            const url = `/gallery/${file}`;
            let category = "showroom";
            let title = file.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");

            if (file.includes("commercial") || file.includes("bakkie") || file.includes("truck")) {
              category = "commercial";
            } else if (file.includes("inventory") || file.includes("car")) {
              category = "inventory";
            }

            if (file === "gallery-1.jpg") {
              title = "Mahindra PikUp Commercial Bakkies";
              category = "commercial";
            } else if (file === "gallery-2.jpg") {
              title = "Auto Fame Showroom Canopy & Main Entrance";
              category = "showroom";
            } else if (file === "gallery-3.jpg") {
              title = "Auto Fame Display Lot & Canopy";
              category = "showroom";
            } else if (file === "gallery-4.jpg") {
              title = "Showroom Frontage Vehicle Display";
              category = "inventory";
            } else if (file === "gallery-5.jpg") {
              title = "Commercial & Bakkie Fleet Lineup";
              category = "commercial";
            } else if (file === "gallery-6.jpg") {
              title = "Auto Fame Showroom Frontage & Vehicles";
              category = "showroom";
            } else if (file === "gallery-7.jpg") {
              title = "Quality Used Hatchback & Sedan Lineup";
              category = "inventory";
            } else if (file === "gallery-8.jpg") {
              title = "Auto Fame Used Vehicle Display";
              category = "inventory";
            } else if (file === "gallery-9.jpg") {
              title = "Featured Volkswagen Sedan";
              category = "inventory";
            } else if (file === "gallery-10.jpg") {
              title = "Happy Customer Delivery & Handover";
              category = "deliveries";
            } else if (file === "gallery-11.jpg") {
              title = "Auto Fame Main Display Lot & Vehicle Lineup";
              category = "inventory";
            } else if (file === "gallery-12.jpg") {
              title = "Comfortable & Stylish Interior View";
              category = "showroom";
            } else if (file === "gallery-13.jpg") {
              title = "Nissan Key Handover with Green Ribbon";
              category = "deliveries";
            } else if (file === "gallery-14.jpg") {
              title = "Proud Customer Handover - Silver Hyundai";
              category = "deliveries";
            }

            localGalleryItems.push({
              id: `local-${file}`,
              url,
              title: title.charAt(0).toUpperCase() + title.slice(1),
              category,
              createdAt: new Date().toISOString()
            });
          }
        });
      }

      // Also scan public/ for WhatsApp stock photos (IMG-2025*)
      const publicDir = path.join(process.cwd(), "public");
      if (fs.existsSync(publicDir)) {
        const files = fs.readdirSync(publicDir);
        files.forEach((file) => {
          if (/^IMG-2025.*\.jpg$/i.test(file)) {
            localGalleryItems.push({
              id: `local-wa-${file}`,
              url: `/${file}`,
              title: "Showroom Vehicle Stock",
              category: "inventory",
              createdAt: new Date().toISOString()
            });
          }
        });
      }
    } catch (fsErr) {
      console.warn("[API/gallery] Local filesystem scan error:", fsErr);
    }

    const existingUrls = new Set(dbItems.map((item) => item.url));
    const combined = [...dbItems];

    for (const item of localGalleryItems) {
      if (!existingUrls.has(item.url)) {
        existingUrls.add(item.url);
        combined.push(item);
      }
    }

    return NextResponse.json(combined);
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
    const category = formData.get("category") as string || "showroom";

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Save locally to public/gallery/ (NO S3)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const galleryDir = path.join(process.cwd(), "public", "gallery");
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }

    const safeFileName = `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(galleryDir, safeFileName);
    await fs.promises.writeFile(filePath, buffer);

    const url = `/gallery/${safeFileName}`;

    // Optionally save to DB if available
    let galleryItem;
    try {
      galleryItem = await prisma.gallery.create({
        data: {
          url,
          title: title || file.name,
          category
        }
      });
    } catch (dbErr) {
      console.warn("[API/gallery] Saved locally, but DB write failed:", dbErr);
      galleryItem = {
        id: `local-${safeFileName}`,
        url,
        title: title || file.name,
        category,
        createdAt: new Date()
      };
    }

    return NextResponse.json(galleryItem);
  } catch (error: any) {
    console.error("[API/gallery] POST error:", error);
    return NextResponse.json({ message: "Failed to save gallery item", error: error.message }, { status: 500 });
  }
}
