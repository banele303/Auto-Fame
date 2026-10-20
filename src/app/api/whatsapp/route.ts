import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_WHAPI_TOKEN = "ohxDDFSuvqRvl4DKZLu7eEYUfbAEkCil";
const DEFAULT_CHANNEL_ID = "STARLD-W5LEE";

/**
 * Real Whapi.Cloud WhatsApp Gateway (Channel: STARLD-W5LEE)
 * Supports:
 * - GET /api/whatsapp -> Live channel status & recent incoming/outgoing WhatsApp messages
 * - POST /api/whatsapp -> Real live WhatsApp message dispatch via https://gate.whapi.cloud/messages/text
 */
export async function GET(req: NextRequest) {
  const token =
    process.env.WHAPI_API_TOKEN ||
    process.env.NEXT_PUBLIC_WHAPI_TOKEN ||
    DEFAULT_WHAPI_TOKEN;
  const channelId = process.env.WHAPI_CHANNEL_ID || DEFAULT_CHANNEL_ID;
  const action = req.nextUrl.searchParams.get("action") || "status";

  try {
    if (action === "messages") {
      const msgRes = await fetch("https://gate.whapi.cloud/messages/list?count=20", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const msgData = await msgRes.json();
      return NextResponse.json({
        connected: msgRes.ok,
        channelId,
        messages: msgData?.messages || [],
      });
    }

    const healthRes = await fetch("https://gate.whapi.cloud/health?wakeup=true", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const healthData = await healthRes.json();

    return NextResponse.json({
      connected: healthRes.ok,
      channelId,
      status: healthData?.status?.text || "CONNECTED",
      user: healthData?.user || null,
      raw: healthData,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        channelId,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      message,
      customerName,
      actionType,
      mediaUrl,
      fileName,
      whapiToken: clientToken,
    } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: "Phone number 'to' and 'message' are required." },
        { status: 400 }
      );
    }

    // Format South African local numbers (082... -> 2782...) or international numbers
    let formattedPhone = String(to).replace(/\s+/g, "").replace(/[-()]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "27" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    const whapiToken =
      clientToken ||
      process.env.WHAPI_API_TOKEN ||
      process.env.NEXT_PUBLIC_WHAPI_TOKEN ||
      DEFAULT_WHAPI_TOKEN;

    const endpoint = mediaUrl
      ? "https://gate.whapi.cloud/messages/document"
      : "https://gate.whapi.cloud/messages/text";

    const payload = mediaUrl
      ? {
          to: formattedPhone,
          media: mediaUrl,
          caption: message,
          filename: fileName || "AutoFame_Document.pdf",
        }
      : {
          to: formattedPhone,
          body: message,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${whapiToken}`,
      },
      body: JSON.stringify(payload),
    });

    const dispatchResult = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            dispatchResult?.error?.message ||
            dispatchResult?.message ||
            "Whapi.Cloud API error",
          details: dispatchResult,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "live",
      channelId: DEFAULT_CHANNEL_ID,
      formattedPhone,
      recipient: formattedPhone,
      customerName: customerName || "Customer",
      actionType: actionType || "WHATSAPP_MESSAGE",
      data: dispatchResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("API /api/whatsapp error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process WhatsApp dispatch" },
      { status: 500 }
    );
  }
}
