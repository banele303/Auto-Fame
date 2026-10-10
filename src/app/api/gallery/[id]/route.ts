import { NextRequest, NextResponse } from "next/server";
import { convexClient } from "@/lib/convex";
import { verifyAuth } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * DELETE /api/gallery/[id]
 * Deletes gallery item exclusively from Convex database.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(req, ["ADMIN", "SALES_MANAGER"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const id = decodeURIComponent(params.id || "");
    if (!id) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    // Delete exclusively from Convex
    let deleted = false;
    try {
      const numId = parseInt(id, 10);
      deleted = await convexClient.mutation("gallery:remove", {
        id: isNaN(numId) ? id : numId,
      });
    } catch (cvxErr) {
      console.warn(`[API/gallery/${id}] Convex delete error:`, cvxErr);
    }

    return NextResponse.json({
      message: "Item deleted successfully",
      success: deleted,
      id,
    });
  } catch (error: any) {
    console.error(`[API/gallery/${params?.id}] DELETE error:`, error);
    return NextResponse.json({ message: "Failed to delete item", error: error.message }, { status: 500 });
  }
}
