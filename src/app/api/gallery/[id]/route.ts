import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export const runtime = "nodejs";

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
