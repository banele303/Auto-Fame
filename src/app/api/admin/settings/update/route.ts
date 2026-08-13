import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to update admin user settings
 * POST /api/admin/settings/update
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
