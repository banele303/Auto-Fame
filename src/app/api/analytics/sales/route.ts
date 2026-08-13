import { NextRequest, NextResponse } from "next/server";
import { convexClient } from "@/lib/convex";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ["ADMIN", "SALES_MANAGER", "FINANCE_MANAGER"]);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
      const sales = await convexClient.query("transactions:getSales", {});
      return NextResponse.json(sales || []);
    } catch (err: any) {
      console.warn("Error fetching Convex sales in analytics:", err?.message);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
    return NextResponse.json([]);
  }
}
