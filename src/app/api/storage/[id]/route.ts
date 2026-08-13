import { NextRequest, NextResponse } from "next/server"

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://frugal-zebra-890.convex.cloud"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!id || id.startsWith("blob:") || id.startsWith("data:")) {
    return NextResponse.json({ error: "Invalid storage ID" }, { status: 404 })
  }

  try {
    // 1. If full URL is passed
    if (id.startsWith("http://") || id.startsWith("https://")) {
      return NextResponse.redirect(decodeURIComponent(id), 307)
    }

    // 2. Query Convex files:getUrl to get the official CDN URL
    try {
      const queryResp = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "files:getUrl", args: { storageId: id } }),
      })
      if (queryResp.ok) {
        const queryData = await queryResp.json()
        const resolvedUrl = queryData.value || queryData.result
        if (resolvedUrl && typeof resolvedUrl === "string" && resolvedUrl.startsWith("http")) {
          return NextResponse.redirect(resolvedUrl, 307)
        }
      }
    } catch {
      // Fall through to fallback
    }

    // 3. Fallback directly to Convex storage URL
    return NextResponse.redirect(`${CONVEX_URL}/api/storage/${id}`, 307)
  } catch (err) {
    console.error("Storage proxy error:", err)
    return NextResponse.redirect("/placeholder.jpg", 307)
  }
}
