import { NextRequest, NextResponse } from "next/server";

/**
 * Real Whapi.Cloud WhatsApp API Gateway
 * Sends real WhatsApp messages when WHAPI_API_TOKEN is provided,
 * and returns a direct wa.me deep link if no API token is set (zero fake demo queuing).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message, customerName, actionType, whapiToken: clientToken } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: "Phone number 'to' and 'message' are required." },
        { status: 400 }
      );
    }

    let formattedPhone = String(to).replace(/\s+/g, "").replace(/[-()]/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "27" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    const whapiToken =
      clientToken || process.env.WHAPI_API_TOKEN || process.env.NEXT_PUBLIC_WHAPI_TOKEN;
    const whapiGateUrl =
      process.env.WHAPI_GATEWAY_URL || "https://gate.whapi.cloud/messages/text";

    if (!whapiToken || whapiToken === "YOUR_WHAPI_TOKEN") {
      return NextResponse.json(
        {
          error:
            "WHAPI_API_TOKEN is required for automated API dispatch, or use 'Open in WhatsApp' to send directly via WhatsApp Web/App.",
          requiresToken: true,
          waMeUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
        },
        { status: 401 }
      );
    }

    const response = await fetch(whapiGateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${whapiToken}`,
      },
      body: JSON.stringify({
        to: formattedPhone,
        body: message,
      }),
    });

    const dispatchResult = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: dispatchResult?.error?.message || "Whapi.Cloud API returned an error",
          details: dispatchResult,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "live",
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
