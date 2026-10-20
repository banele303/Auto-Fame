import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_WHAPI_TOKEN = "ohxDDFSuvqRvl4DKZLu7eEYUfbAEkCil";
const DEFAULT_CHANNEL_ID = "STARLD-W5LEE";

/**
 * Builds an intelligent WhatsApp Agent reply using the live Dealership Database Context
 */
function buildWhatsAppAgentReply(incomingText: string, senderName: string, context: any): string {
  const lower = (incomingText || "").toLowerCase().trim();
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const availableCars = cars.filter((c: any) => c.status === "AVAILABLE");

  // 1. How many cars / stock query
  if (
    lower.includes("how many car") ||
    lower.includes("stock") ||
    lower.includes("inventory") ||
    lower.includes("available")
  ) {
    const sample = availableCars
      .slice(0, 6)
      .map(
        (c: any) =>
          `• *${c.year} ${c.make} ${c.model}* — R${Number(c.price || 0).toLocaleString()} ZAR`
      )
      .join("\n");
    return `Hi ${senderName || "there"}! 👋 Welcome to *AutoFame Dealership Johannesburg South*.\n\nWe currently have *${cars.length} vehicles* in stock (${availableCars.length} ready for immediate delivery):\n${sample}\n\nReply with a car name for full specs or type *FINANCE* to receive our Vehicle Finance Application Form Container.`;
  }

  // 2. Finance application / apply / documents query
  if (
    lower.includes("finance") ||
    lower.includes("apply") ||
    lower.includes("application") ||
    lower.includes("instalment") ||
    lower.includes("loan") ||
    lower.includes("fica") ||
    lower.includes("document")
  ) {
    return `📋 *AutoFame Vehicle Finance Application Container*\n\nHi ${senderName || "Client"}, to apply for vehicle finance on WhatsApp or online, please reply with:\n\n*1. USER DETAILS*\n• Full Name & Surname\n• SA ID Number (13 digits)\n• Email Address & Physical Address\n\n*2. CAR DETAILS*\n• Selected Vehicle (Make/Model)\n• Deposit Amount & Preferred Term (e.g. 72 months)\n\n*3. FINANCIAL DETAILS*\n• Employer Name & Job Title\n• Gross Monthly Income (ZAR) & Monthly Expenses (ZAR)\n\n*4. REQUIRED FICA PROOF DOCUMENTS (Attach here on WhatsApp)*\n✅ Copy of SA ID (Smart Card or Green Book)\n✅ Valid South African Driver's License\n✅ Latest 3 Months Stamped Bank Statements\n✅ Latest 3 Months Payslips\n✅ Proof of Residence (not older than 3 months)\n\n🌐 Or complete the form container at: https://www.autofame.co.za/financing`;
  }

  // 3. Specific Car Make / Model match
  const matchedCars = cars.filter(
    (c: any) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );
  if (matchedCars.length > 0) {
    const carLines = matchedCars
      .slice(0, 5)
      .map((c: any) => {
        const estMonthly = Math.round((c.price || 0) * 0.9 * 0.0218);
        return `🚗 *${c.year} ${c.make} ${c.model}*\n• Price: R${Number(c.price || 0).toLocaleString()} ZAR (~R${estMonthly.toLocaleString()}/mo)\n• Mileage: ${Number(c.mileage || 0).toLocaleString()} km | ${c.transmission || "Auto"} | ${c.fuelType || "Petrol"}\n• Status: ${c.status}`;
      })
      .join("\n\n");
    return `Hi ${senderName || "there"}! Here are the matching vehicles from our live showroom:\n\n${carLines}\n\nReply *FINANCE* to apply for finance on any of these vehicles or send your ID, payslips & 3 months bank statements directly here on WhatsApp!`;
  }

  // 4. Default helpful dealership agent response
  return `Hi ${senderName || "there"}! 👋 I am the *AutoFame Dealership AI Agent* (Channel ${DEFAULT_CHANNEL_ID}).\n\nWe have *${cars.length} vehicles* in our database. You can:\n1️⃣ Ask about any car, price, or mileage in stock\n2️⃣ Reply *FINANCE* to get our Vehicle Finance Application Form Container\n3️⃣ Send your User Details, Car Details, Financial Details, and Proof Documents (ID, Driver's License, 3 Months Bank Statements, Payslips, Proof of Address) right here so we can verify and submit your application to the bank!`;
}

/**
 * Extracts structured finance fields & uploaded documents from WhatsApp conversation messages
 */
function parseWhatsAppFinanceIntake(messages: any[], cars: any[] = []) {
  const incomingMsgs = messages.filter((m: any) => !m.from_me);
  const latestSender = incomingMsgs[0] || messages[0] || {};
  const rawChatId = latestSender.chat_id || latestSender.from || "";
  const phone = rawChatId ? "+" + String(rawChatId).replace(/@.*$/, "").replace(/^\+/, "") : "";
  const senderName = latestSender.from_name || "WhatsApp Applicant";

  const combinedText = incomingMsgs
    .map((m: any) => m.text?.body || m.document?.caption || m.image?.caption || "")
    .join("\n");

  // Extract 13-digit SA ID number if provided
  const idMatch = combinedText.match(/\b(\d{13})\b/);
  // Extract Email if provided
  const emailMatch = combinedText.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  // Extract Income if mentioned (e.g. R35000 or 35000)
  const incomeMatch = combinedText.match(/(?:income|salary|earn|gross)[:\s]*r?\s*([\d,\s]{4,9})/i);
  const parsedIncome = incomeMatch
    ? Number(incomeMatch[1].replace(/[,\s]/g, "")) || 0
    : 0;

  // Match car mentioned in WhatsApp chat
  const lower = combinedText.toLowerCase();
  const matchedCar = cars.find(
    (c: any) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );

  // Extract any media/documents sent by the customer on WhatsApp
  const extractedDocs: {
    docType: string;
    originalName: string;
    mime: string;
    size: number;
    url: string;
  }[] = [];

  incomingMsgs.forEach((m: any) => {
    const doc = m.document || m.image;
    if (doc && (doc.link || doc.url)) {
      const fileName = (
        doc.filename ||
        doc.caption ||
        (m.type === "image" ? "WhatsApp_ID_Photo.jpg" : "WhatsApp_Document.pdf")
      ).toLowerCase();

      let docType = "ID_COPY";
      if (fileName.includes("license") || fileName.includes("licence") || fileName.includes("driver")) {
        docType = "DRIVERS_LICENSE";
      } else if (fileName.includes("bank") || fileName.includes("statement")) {
        docType = "BANK_STATEMENTS";
      } else if (fileName.includes("pay") || fileName.includes("slip") || fileName.includes("salary")) {
        docType = "PAYSLIPS";
      } else if (fileName.includes("address") || fileName.includes("residence") || fileName.includes("utility")) {
        docType = "PROOF_OF_ADDRESS";
      }

      extractedDocs.push({
        docType,
        originalName: doc.filename || doc.caption || `${docType}.pdf`,
        mime: doc.mime_type || "application/pdf",
        size: doc.file_size || 102400,
        url: doc.link || doc.url,
      });
    }
  });

  const nameParts = senderName.split(" ");
  return {
    firstName: nameParts[0] || "Client",
    lastName: nameParts.slice(1).join(" ") || "",
    phone,
    email: emailMatch ? emailMatch[1] : "",
    idNumber: idMatch ? idMatch[1] : "",
    carId: matchedCar?.id,
    carName: matchedCar
      ? `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}`
      : cars[0]
      ? `${cars[0].year} ${cars[0].make} ${cars[0].model}`
      : "Selected Vehicle",
    carPrice: matchedCar?.price || cars[0]?.price || 0,
    monthlyIncomeGross: parsedIncome,
    documents: extractedDocs,
  };
}

export async function GET(req: NextRequest) {
  const token =
    process.env.WHAPI_API_TOKEN ||
    process.env.NEXT_PUBLIC_WHAPI_TOKEN ||
    DEFAULT_WHAPI_TOKEN;
  const channelId = process.env.WHAPI_CHANNEL_ID || DEFAULT_CHANNEL_ID;
  const action = req.nextUrl.searchParams.get("action") || "status";

  try {
    if (action === "messages") {
      const msgRes = await fetch("https://gate.whapi.cloud/messages/list?count=30", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const msgData = await msgRes.json();
      const rawMessages = Array.isArray(msgData?.messages) ? msgData.messages : [];

      const formattedMessages = rawMessages.map((m: any) => ({
        id: m.id,
        fromMe: Boolean(m.from_me),
        from: m.from || m.chat_id?.replace(/@.*$/, "") || "",
        fromName: m.from_name || (m.from_me ? "AutoFame Agent" : "WhatsApp Client"),
        chatId: m.chat_id || "",
        type: m.type || "text",
        text:
          m.text?.body ||
          m.document?.caption ||
          m.image?.caption ||
          (m.document ? `[Document: ${m.document.filename || "File"}]` : "") ||
          (m.image ? "[Image Attachment]" : ""),
        documentUrl: m.document?.link || m.image?.link || null,
        documentName: m.document?.filename || null,
        timestamp: m.timestamp
          ? new Date(m.timestamp * 1000).toISOString()
          : new Date().toISOString(),
      }));

      return NextResponse.json({
        connected: msgRes.ok,
        channelId,
        messages: formattedMessages,
        intakePreview: parseWhatsAppFinanceIntake(rawMessages),
      });
    }

    const healthRes = await fetch("https://gate.whapi.cloud/health?wakeup=true", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const healthData = await healthRes.json();

    return NextResponse.json({
      connected: healthRes.ok,
      channelId,
      status: healthData?.status?.text || "AUTH",
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
      action,
      to,
      message,
      customerName,
      actionType,
      mediaUrl,
      fileName,
      context,
      whapiToken: clientToken,
    } = body;

    const whapiToken =
      clientToken ||
      process.env.WHAPI_API_TOKEN ||
      process.env.NEXT_PUBLIC_WHAPI_TOKEN ||
      DEFAULT_WHAPI_TOKEN;

    // 1. Two-Way WhatsApp AI Agent Auto-Reply / Sync
    if (action === "agent_auto_reply") {
      const msgRes = await fetch("https://gate.whapi.cloud/messages/list?count=15", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${whapiToken}`,
        },
        cache: "no-store",
      });
      const msgData = await msgRes.json();
      const rawMessages = Array.isArray(msgData?.messages) ? msgData.messages : [];

      // Find latest incoming customer message that hasn't been answered yet
      const latestIncoming = rawMessages.find(
        (m: any) => !m.from_me && (m.text?.body || m.document || m.image)
      );

      if (!latestIncoming) {
        return NextResponse.json({
          success: true,
          replied: false,
          reason: "No new incoming customer messages waiting for reply.",
          intake: parseWhatsAppFinanceIntake(rawMessages, context?.cars || []),
        });
      }

      const targetChat = latestIncoming.chat_id || latestIncoming.from;
      const incomingText =
        latestIncoming.text?.body ||
        latestIncoming.document?.caption ||
        "Finance document uploaded";
      const senderName = latestIncoming.from_name || "Valued Client";

      const replyBody = buildWhatsAppAgentReply(incomingText, senderName, context);

      const sendRes = await fetch("https://gate.whapi.cloud/messages/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${whapiToken}`,
        },
        body: JSON.stringify({
          to: targetChat,
          body: replyBody,
        }),
      });
      const sendData = await sendRes.json();

      return NextResponse.json({
        success: sendRes.ok,
        replied: sendRes.ok,
        recipient: targetChat,
        senderName,
        incomingText,
        replySent: replyBody,
        intake: parseWhatsAppFinanceIntake(rawMessages, context?.cars || []),
        data: sendData,
      });
    }

    // 2. Direct WhatsApp Message or Finance Form Container Dispatch
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
