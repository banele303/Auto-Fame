import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_WHAPI_TOKEN = "ohxDDFSuvqRvl4DKZLu7eEYUfbAEkCil";
const DEFAULT_CHANNEL_ID = "STARLD-W5LEE";
const AUTOFAME_AGENT_GROUP_ID = "120363413508068515@g.us";

// Track answered message IDs in memory so we never double-reply
const answeredMessageIds = new Set<string>();

/**
 * Formats any South African phone number to Whapi chat_id (e.g. 074 740 4229 -> 27747404229@s.whatsapp.net)
 */
function normalizeToChatId(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "27" + digits.slice(1);
  }
  return `${digits}@s.whatsapp.net`;
}

/**
 * Clean, modern WhatsApp formatter for a list of vehicles
 */
function formatCarsForWhatsApp(cars: any[], title = "AUTOFAME SHOWROOM INVENTORY", maxShow = 12): string {
  if (!cars || cars.length === 0) {
    return "No matching vehicles found in showroom inventory.";
  }

  const availableCount = cars.filter((c: any) => c.status === "AVAILABLE").length;
  const header = `🚘 *${title}*\n📊 *Showing ${Math.min(cars.length, maxShow)} of ${cars.length} Vehicles* (${availableCount} Available)\n━━━━━━━━━━━━━━━━━━━━`;

  const items = cars.slice(0, maxShow).map((c: any, idx: number) => {
    const price = Number(c.price || 0);
    const estMonthly = Math.round(price * 0.9 * 0.0218);
    const mileage = Number(c.mileage || 0).toLocaleString();
    const trans = c.transmission || "Auto";
    const fuel = c.fuelType || "Petrol";
    const statusBadge =
      c.status === "AVAILABLE"
        ? "🟢 *AVAILABLE*"
        : c.status === "SOLD"
        ? "🔴 *SOLD*"
        : "🟡 *" + (c.status || "IN STOCK") + "*";

    return `*${idx + 1}. ${c.year} ${c.make} ${c.model}*\n💰 *R${price.toLocaleString()} ZAR* (~R${estMonthly.toLocaleString()}/mo)\n⚙️ ${mileage} km • ${trans} • ${fuel}\n${statusBadge}`;
  });

  return `${header}\n\n${items.join("\n\n")}\n\n━━━━━━━━━━━━━━━━━━━━\n💡 _Reply with any car name to generate an official quote or type *FINANCE* to open an application._`;
}

/**
 * Clean, modern WhatsApp formatter for an Official Vehicle Quote
 */
function formatVehicleQuoteForWhatsApp(car: any): string {
  if (!car) {
    return "No vehicle available to quote.";
  }
  const price = Number(car.price || 0);
  const deposit = Math.round(price * 0.1);
  const loanAmount = price - deposit;
  const monthlyRate = 0.1175 / 12;
  const term = 72;
  const monthlyPayment = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
      (Math.pow(1 + monthlyRate, term) - 1)
  );

  return `📄 *AUTOFAME OFFICIAL VEHICLE QUOTATION*\n━━━━━━━━━━━━━━━━━━━━\n\n🚘 *Vehicle:* ${car.year} ${car.make} ${car.model}\n🔢 *Stock ID:* #AF-${car.id}\n⚙️ *Specs:* ${Number(car.mileage || 0).toLocaleString()} km • ${car.transmission || "Automatic"} • ${car.fuelType || "Petrol"}\n\n💳 *FINANCE BREAKDOWN (ESTIMATE)*\n• *Retail Price:* R${price.toLocaleString()} ZAR\n• *10% Deposit:* R${deposit.toLocaleString()} ZAR\n• *Principal Loan:* R${loanAmount.toLocaleString()} ZAR\n• *Term & Rate:* 72 Months @ 11.75% Linked\n• *Monthly Instalment:* *~R${monthlyPayment.toLocaleString()} ZAR / month*\n\n📋 *REQUIRED FICA DOCUMENTS*\n1. Copy of SA ID (Smart Card / Book)\n2. Valid SA Driver's License\n3. 3 Months Stamped Bank Statements\n4. Latest 3 Months Payslips\n5. Proof of Residence (< 3 Months)\n\n📍 *AutoFame Dealership Johannesburg South*\n📞 +27 63 199 5124 | ✉️ alexsouthflow3@gmail.com`;
}

/**
 * Finds a contact in Whapi /contacts and /chats by phone number or fuzzy name match
 */
async function fetchContactMessagesFromWhapi(
  queryText: string,
  token: string,
  fallbackMessages: any[] = []
): Promise<{
  targetChatId: string;
  contactName: string;
  contactPhone: string;
  messages: any[];
}> {
  // 1. Check if a phone number is mentioned in the query
  const phoneMatch = queryText.match(/(?:\+?27|0)\s*\d{2}\s*\d{3}\s*\d{4}|\b27\d{9}\b/);
  if (phoneMatch) {
    const chatId = normalizeToChatId(phoneMatch[0]);
    const res = await fetch(
      `https://gate.whapi.cloud/messages/list/${encodeURIComponent(chatId)}?count=40`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    const data = await res.json().catch(() => ({}));
    const msgs = Array.isArray(data?.messages) ? data.messages : [];
    const incoming = msgs.find((m: any) => !m.from_me) || msgs[0] || {};
    const digits = chatId.replace(/@.*$/, "");
    return {
      targetChatId: chatId,
      contactName: incoming.from_name || `Contact +${digits}`,
      contactPhone: `+${digits}`,
      messages: msgs,
    };
  }

  // 2. Search saved contacts in /contacts?count=500 for name or fuzzy match
  const stopWords = new Set([
    "what",
    "was",
    "my",
    "last",
    "message",
    "messages",
    "with",
    "from",
    "take",
    "all",
    "the",
    "information",
    "info",
    "this",
    "user",
    "contact",
    "and",
    "create",
    "fill",
    "application",
    "form",
    "send",
    "via",
    "email",
    "attachments",
    "chat",
    "show",
  ]);

  const candidateWords = queryText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  const [contactsRes, chatsRes] = await Promise.all([
    fetch("https://gate.whapi.cloud/contacts?count=500", {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch("https://gate.whapi.cloud/chats?count=40", {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  const contactsData = await contactsRes.json().catch(() => ({}));
  const chatsData = await chatsRes.json().catch(() => ({}));
  const contacts = Array.isArray(contactsData?.contacts) ? contactsData.contacts : [];
  const chats = Array.isArray(chatsData?.chats)
    ? chatsData.chats.filter(
        (c: any) =>
          c.type === "contact" &&
          !String(c.id || "").includes("@newsletter") &&
          c.id !== AUTOFAME_AGENT_GROUP_ID
      )
    : [];

  let matchedContact: any = null;
  if (candidateWords.length > 0) {
    // Exact or substring match on contact name / pushname
    matchedContact = contacts.find((c: any) => {
      const fullName = `${c.name || ""} ${c.pushname || ""}`.toLowerCase();
      return candidateWords.some(
        (w) =>
          fullName.includes(w) ||
          (w.length >= 4 &&
            fullName
              .split(/\s+/)
              .some((part) => part.length >= 3 && (w.includes(part) || part.includes(w.slice(0, 4)))))
      );
    });
  }

  if (matchedContact?.id) {
    const chatId = `${String(matchedContact.id).replace(/@.*$/, "")}@s.whatsapp.net`;
    const res = await fetch(
      `https://gate.whapi.cloud/messages/list/${encodeURIComponent(chatId)}?count=30`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    const data = await res.json().catch(() => ({}));
    const msgs = Array.isArray(data?.messages) ? data.messages : [];
    const digits = String(matchedContact.id).replace(/@.*$/, "");
    return {
      targetChatId: chatId,
      contactName: matchedContact.name || matchedContact.pushname || `+${digits}`,
      contactPhone: `+${digits}`,
      messages: msgs,
    };
  }

  const fallbackChat = chats[0];
  if (fallbackChat?.id) {
    const res = await fetch(
      `https://gate.whapi.cloud/messages/list/${encodeURIComponent(fallbackChat.id)}?count=30`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    const data = await res.json().catch(() => ({}));
    const msgs = Array.isArray(data?.messages) ? data.messages : [];
    const digits = String(fallbackChat.id).replace(/@.*$/, "");
    return {
      targetChatId: fallbackChat.id,
      contactName:
        fallbackChat.name ||
        fallbackChat.last_message?.from_name ||
        `+${digits}`,
      contactPhone: `+${digits}`,
      messages: msgs,
    };
  }

  return {
    targetChatId: "",
    contactName: "WhatsApp Contact",
    contactPhone: "",
    messages: fallbackMessages,
  };
}

/**
 * Extracts structured finance fields & all attachments from a WhatsApp contact's messages
 */
function parseWhatsAppFinanceIntake(
  messages: any[],
  cars: any[] = [],
  overridePhone = "",
  overrideName = ""
) {
  const validMsgs = messages.filter((m: any) => m.source !== "api");
  const latestSender = validMsgs.find((m: any) => !m.from_me) || validMsgs[0] || {};
  const rawChatId = latestSender.chat_id || latestSender.from || "";
  const phone =
    overridePhone ||
    (latestSender.from && latestSender.from !== "27631995124"
      ? "+" + String(latestSender.from).replace(/@.*$/, "").replace(/^\+/, "")
      : rawChatId && !rawChatId.includes("@g.us")
      ? "+" + String(rawChatId).replace(/@.*$/, "").replace(/^\+/, "")
      : "+27631995124");

  const combinedText = validMsgs
    .map((m: any) => m.text?.body || m.document?.caption || m.image?.caption || "")
    .join("\n");

  const holderMatch = combinedText.match(
    /(?:account holder|full name|name|applicant)[:\s]+([A-Za-z\s]{3,35})/i
  );
  const detectedName = holderMatch
    ? holderMatch[1].split("\n")[0].trim()
    : overrideName || latestSender.from_name || "WhatsApp Applicant";

  const idMatch = combinedText.match(/\b(\d{13})\b/);
  const emailMatch = combinedText.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const incomeMatch = combinedText.match(/(?:income|salary|earn|gross)[:\s]*r?\s*([\d,\s]{4,9})/i);
  const parsedIncome = incomeMatch
    ? Number(incomeMatch[1].replace(/[,\s]/g, "")) || 0
    : 0;
  const employerMatch = combinedText.match(
    /(?:employer|business name|company|work)[:\s]+([A-Za-z0-9\s&.,-]{2,40})/i
  );
  const bankMatch = combinedText.match(/bank[:\s]+([A-Za-z0-9\s]{2,25})/i);
  const addressMatch = combinedText.match(/(?:address|location|city)[:\s]+([^\n]{5,60})/i);

  const lower = combinedText.toLowerCase();
  const matchedCar = cars.find(
    (c: any) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );

  const extractedDocs: {
    docType: string;
    originalName: string;
    mime: string;
    size: number;
    url: string;
  }[] = [];

  const docOrder = [
    "ID_COPY",
    "DRIVERS_LICENSE",
    "BANK_STATEMENTS",
    "PAYSLIPS",
    "PROOF_OF_ADDRESS",
  ];

  validMsgs.forEach((m: any, idx: number) => {
    const doc = m.document || m.image;
    if (doc && (doc.link || doc.url)) {
      const fileName = (
        doc.filename ||
        doc.caption ||
        (m.type === "image" ? `WhatsApp_Attachment_${idx + 1}.jpg` : `WhatsApp_Document_${idx + 1}.pdf`)
      ).toLowerCase();

      let docType = docOrder[extractedDocs.length % docOrder.length] || "ID_COPY";
      if (fileName.includes("id") || fileName.includes("smart") || fileName.includes("passport")) {
        docType = "ID_COPY";
      } else if (fileName.includes("license") || fileName.includes("licence") || fileName.includes("driver")) {
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
        originalName:
          doc.filename ||
          doc.caption?.slice(0, 32) ||
          (m.type === "image" ? `${docType}.jpg` : `${docType}.pdf`),
        mime: doc.mime_type || (m.type === "image" ? "image/jpeg" : "application/pdf"),
        size: doc.file_size || 102400,
        url: doc.link || doc.url,
      });
    }
  });

  const nameParts = detectedName.replace(/^(MR|MS|MRS|DR)\s+/i, "").trim().split(/\s+/);
  return {
    firstName: nameParts[0] || "Client",
    lastName: nameParts.slice(1).join(" ") || "",
    fullName: detectedName,
    phone,
    email: emailMatch ? emailMatch[1] : "",
    idNumber: idMatch ? idMatch[1] : "",
    address: addressMatch ? addressMatch[1].trim() : "Johannesburg, Gauteng",
    employerName: employerMatch
      ? employerMatch[1].split("\n")[0].trim()
      : bankMatch
      ? `Bank: ${bankMatch[1].split("\n")[0].trim()}`
      : "",
    carId: matchedCar?.id || cars[0]?.id,
    carName: matchedCar
      ? `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}`
      : cars[0]
      ? `${cars[0].year} ${cars[0].make} ${cars[0].model}`
      : "Selected Vehicle",
    carPrice: matchedCar?.price || cars[0]?.price || 0,
    monthlyIncomeGross: parsedIncome,
    rawTranscript: combinedText.slice(0, 1200),
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
      const [groupRes, chatsRes, listRes] = await Promise.all([
        fetch(
          `https://gate.whapi.cloud/messages/list/${encodeURIComponent(AUTOFAME_AGENT_GROUP_ID)}?count=20`,
          {
            method: "GET",
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        ),
        fetch("https://gate.whapi.cloud/chats?count=25", {
          method: "GET",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch("https://gate.whapi.cloud/messages/list?count=25", {
          method: "GET",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);

      const groupData = await groupRes.json().catch(() => ({}));
      const chatsData = await chatsRes.json().catch(() => ({}));
      const listData = await listRes.json().catch(() => ({}));

      const groupMessages = Array.isArray(groupData?.messages) ? groupData.messages : [];
      const contactChatMessages = Array.isArray(chatsData?.chats)
        ? chatsData.chats
            .filter(
              (c: any) =>
                c.type === "contact" &&
                c.last_message &&
                !String(c.id || "").includes("@newsletter")
            )
            .map((c: any) => ({
              ...c.last_message,
              from_name: c.name || c.last_message?.from_name || c.id?.replace(/@.*$/, ""),
            }))
        : [];
      const generalMessages = Array.isArray(listData?.messages)
        ? listData.messages.filter((m: any) => !String(m.chat_id || "").includes("@newsletter"))
        : [];

      const combinedRaw = [...groupMessages, ...contactChatMessages, ...generalMessages].filter(
        (m, idx, arr) => m && m.id && arr.findIndex((x) => x?.id === m.id) === idx
      );

      const formattedMessages = combinedRaw.map((m: any) => ({
        id: m.id,
        fromMe: m.source === "api" || Boolean(m.from_me),
        source: m.source || "mobile",
        from: m.from && m.from !== "27631995124" ? m.from : m.chat_id?.replace(/@.*$/, "") || "",
        fromName:
          m.source === "api"
            ? "AutoFame Agent"
            : m.from_name || m.chat_id?.replace(/@.*$/, "") || "WhatsApp Contact",
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
        connected: groupRes.ok || listRes.ok,
        channelId,
        agentGroupId: AUTOFAME_AGENT_GROUP_ID,
        totalChats: chatsData?.total || formattedMessages.length,
        messages: formattedMessages,
        intakePreview: parseWhatsAppFinanceIntake(combinedRaw),
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
      agentGroupId: AUTOFAME_AGENT_GROUP_ID,
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
      query,
      bankEmail,
      fromEmail,
      appPassword,
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

    // ──────────────────────────────────────────────────────────────
    // ACTION A: Extract Info & Attachments from Any WhatsApp Contact,
    // Fill Application Form Container, and Email with Attachments
    // ──────────────────────────────────────────────────────────────
    if (action === "extract_contact_and_submit") {
      const searchPrompt = query || message || "";
      const contactData = await fetchContactMessagesFromWhapi(searchPrompt, whapiToken);
      const intake = parseWhatsAppFinanceIntake(
        contactData.messages,
        context?.cars || [],
        contactData.contactPhone,
        contactData.contactName
      );

      const shouldSendEmail =
        searchPrompt.toLowerCase().includes("send") ||
        searchPrompt.toLowerCase().includes("email") ||
        searchPrompt.toLowerCase().includes("bank") ||
        Boolean(bankEmail);

      let emailDispatchResult: any = null;
      const targetRecipient =
        bankEmail ||
        (searchPrompt.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[1]) ||
        "alexsouthflow3@gmail.com";

      if (shouldSendEmail) {
        const origin = req.nextUrl.origin || "http://localhost:3000";
        const emailSubject = `VEHICLE FINANCE APPLICATION — ${intake.fullName} (${intake.phone}) — ${intake.carName}`;
        const emailBody = `OFFICIAL DEALERSHIP VEHICLE FINANCE APPLICATION DOSSIER
Extracted from WhatsApp Contact: ${intake.fullName} (${intake.phone})
====================================================================

1. USER DETAILS (EXTRACTED FROM WHATSAPP)
• Applicant Full Name: ${intake.fullName}
• Phone / WhatsApp Number: ${intake.phone}
• SA ID Number: ${intake.idNumber || "Pending Verification"}
• Email Address: ${intake.email || "Provided via WhatsApp"}
• Address: ${intake.address}

2. CAR DETAILS
• Selected Vehicle: ${intake.carName}
• Retail Price: R${Number(intake.carPrice || 0).toLocaleString()} ZAR
• Deposit (10%): R${Math.round(Number(intake.carPrice || 0) * 0.1).toLocaleString()} ZAR
• Loan Amount: R${Math.round(Number(intake.carPrice || 0) * 0.9).toLocaleString()} ZAR

3. FINANCIAL & BANKING DETAILS
• Employer / Business / Bank Info: ${intake.employerName || "See WhatsApp Transcript Below"}
• Gross Monthly Income: ${
          intake.monthlyIncomeGross > 0
            ? `R${intake.monthlyIncomeGross.toLocaleString()} ZAR`
            : "See Attached Statements"
        }

4. WHATSAPP CONVERSATION TRANSCRIPT & NOTES
${intake.rawTranscript || "No text transcript."}

5. ATTACHED PROOF DOCUMENTS (${intake.documents.length} File(s))
${
  intake.documents.length > 0
    ? intake.documents.map((d, i) => `${i + 1}. ${d.docType}: ${d.originalName} (${d.url})`).join("\n")
    : "No media files found in chat history."
}`;

        const emailRes = await fetch(`${origin}/api/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            fromEmail: fromEmail || "alexsouthflow3@gmail.com",
            appPassword: appPassword || "dmjjjsyxcpqpdwlb",
            to: targetRecipient,
            subject: emailSubject,
            body: emailBody,
            attachments: intake.documents.map((d) => ({
              filename: d.originalName,
              url: d.url,
              mime: d.mime,
            })),
          }),
        });
        emailDispatchResult = await emailRes.json().catch(() => ({}));
      }

      return NextResponse.json({
        success: true,
        contactName: contactData.contactName,
        contactPhone: contactData.contactPhone,
        intake,
        emailDispatched: Boolean(emailDispatchResult?.status === "SENT"),
        emailRecipient: targetRecipient,
        emailResult: emailDispatchResult,
      });
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION B: Real-Time Auto-Reply in "AutoFame AI Agent" Group
    // ──────────────────────────────────────────────────────────────
    if (action === "agent_auto_reply") {
      const groupRes = await fetch(
        `https://gate.whapi.cloud/messages/list/${encodeURIComponent(AUTOFAME_AGENT_GROUP_ID)}?count=10`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${whapiToken}`,
          },
          cache: "no-store",
        }
      );
      const groupData = await groupRes.json().catch(() => ({}));
      const groupMessages = Array.isArray(groupData?.messages) ? groupData.messages : [];
      const newestMsg = groupMessages[0];

      if (
        newestMsg &&
        newestMsg.source !== "api" &&
        newestMsg.type !== "action" &&
        !answeredMessageIds.has(newestMsg.id) &&
        (newestMsg.text?.body || newestMsg.document || newestMsg.image)
      ) {
        answeredMessageIds.add(newestMsg.id);

        const incomingText =
          newestMsg.text?.body ||
          newestMsg.document?.caption ||
          newestMsg.image?.caption ||
          "finance";
        const lowerIn = incomingText.toLowerCase().trim();
        const cars = Array.isArray(context?.cars) ? context.cars : [];
        const availableCars = cars.filter((c: any) => c.status === "AVAILABLE");
        const soldCars = cars.filter((c: any) => c.status === "SOLD");
        const repairs = Array.isArray(context?.repairs) ? context.repairs : [];

        let replyBody = "";

        // 1. Extract Contact Info & Fill/Email Application Form
        if (
          (lowerIn.includes("take") ||
            lowerIn.includes("extract") ||
            lowerIn.includes("fill")) &&
          (lowerIn.includes("application") ||
            lowerIn.includes("form") ||
            lowerIn.includes("email") ||
            lowerIn.includes("contact") ||
            /(?:\+?27|0)\s*\d{2}\s*\d{3}\s*\d{4}|\b27\d{9}\b/.test(incomingText))
        ) {
          const contactData = await fetchContactMessagesFromWhapi(incomingText, whapiToken);
          const intake = parseWhatsAppFinanceIntake(
            contactData.messages,
            cars,
            contactData.contactPhone,
            contactData.contactName
          );

          const targetRecipient =
            incomingText.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[1] ||
            "alexsouthflow3@gmail.com";

          const origin = req.nextUrl.origin || "http://localhost:3000";
          const emailSubject = `VEHICLE FINANCE APPLICATION — ${intake.fullName} (${intake.phone}) — ${intake.carName}`;
          const emailBody = `OFFICIAL DEALERSHIP VEHICLE FINANCE APPLICATION DOSSIER
Extracted from WhatsApp Contact: ${intake.fullName} (${intake.phone})
====================================================================

1. USER DETAILS
• Full Name: ${intake.fullName}
• WhatsApp / Phone: ${intake.phone}
• SA ID Number: ${intake.idNumber || "Pending"}
• Email: ${intake.email || "Via WhatsApp"}
• Address: ${intake.address}

2. CAR DETAILS
• Vehicle: ${intake.carName}
• Price: R${Number(intake.carPrice || 0).toLocaleString()} ZAR

3. FINANCIAL & BANK DETAILS
• Employer / Bank Info: ${intake.employerName || "Included in Transcript"}
• Gross Monthly Income: R${Number(intake.monthlyIncomeGross || 0).toLocaleString()} ZAR

4. WHATSAPP TRANSCRIPT
${intake.rawTranscript}

5. ATTACHMENTS (${intake.documents.length})
${intake.documents.map((d, i) => `${i + 1}. ${d.originalName} (${d.docType})`).join("\n")}`;

          await fetch(`${origin}/api/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "send",
              fromEmail: "alexsouthflow3@gmail.com",
              appPassword: "dmjjjsyxcpqpdwlb",
              to: targetRecipient,
              subject: emailSubject,
              body: emailBody,
              attachments: intake.documents.map((d) => ({
                filename: d.originalName,
                url: d.url,
                mime: d.mime,
              })),
            }),
          }).catch(() => {});

          replyBody = `✅ *FINANCE APPLICATION EXTRACTED & EMAILED*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 *Applicant:* ${intake.fullName}\n📞 *Phone:* ${intake.phone}\n🚘 *Vehicle:* ${intake.carName} (R${Number(intake.carPrice || 0).toLocaleString()} ZAR)\n🏦 *Details:* ${intake.employerName || "Transcript captured"}\n📎 *Attachments:* ${intake.documents.length} file(s) attached\n✉️ *Sent To:* ${targetRecipient}`;
        }
        // 2. Ask about last message / conversation with a specific contact (e.g. "What was my last message with Mableza")
        else if (
          lowerIn.includes("last message") ||
          lowerIn.includes("message with") ||
          lowerIn.includes("chat with") ||
          lowerIn.includes("what did")
        ) {
          const contactData = await fetchContactMessagesFromWhapi(incomingText, whapiToken);
          const recentMsgs = contactData.messages.slice(0, 5);
          if (recentMsgs.length === 0) {
            replyBody = `💬 *Chat with ${contactData.contactName} (${contactData.contactPhone})*\n\nNo recent messages found in this chat.`;
          } else {
            const formattedChat = recentMsgs
              .map((m: any) => {
                const who = m.from_me ? "You" : contactData.contactName;
                const text =
                  m.text?.body ||
                  m.document?.caption ||
                  m.image?.caption ||
                  (m.document ? `[Document: ${m.document.filename || "File"}]` : "") ||
                  (m.image ? "[Photo Attachment]" : "[Voice/Media]");
                const time = m.timestamp
                  ? new Date(m.timestamp * 1000).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return `• *${who}* (${time}):\n  "${text}"`;
              })
              .join("\n\n");

            replyBody = `💬 *RECENT MESSAGES WITH ${contactData.contactName.toUpperCase()}*\n📞 *Number:* ${contactData.contactPhone}\n━━━━━━━━━━━━━━━━━━━━\n\n${formattedChat}`;
          }
        }
        // 3. Create / Generate a Quote (e.g. "Create a quote for one of it" or "Quote for Toyota Fortuner")
        else if (lowerIn.includes("quote") || lowerIn.includes("quotation")) {
          const matchedCar =
            cars.find(
              (c: any) =>
                lowerIn.includes(c.make?.toLowerCase() || "") ||
                lowerIn.includes((c.model?.toLowerCase() || "").split(" ")[0])
            ) ||
            availableCars[0] ||
            cars[0];
          replyBody = formatVehicleQuoteForWhatsApp(matchedCar);
        }
        // 4. Exact Count Questions
        else if (
          lowerIn.includes("how many message") ||
          lowerIn.includes("how many whatsapp") ||
          lowerIn.includes("how many chat")
        ) {
          const chatsRes = await fetch("https://gate.whapi.cloud/chats?count=50", {
            method: "GET",
            headers: { Accept: "application/json", Authorization: `Bearer ${whapiToken}` },
          });
          const chatsData = await chatsRes.json().catch(() => ({}));
          replyBody = `${chatsData?.total || (chatsData?.chats || []).length}`;
        } else if (lowerIn.includes("how many available")) {
          replyBody = `${availableCars.length}`;
        } else if (lowerIn.includes("how many sold")) {
          replyBody = `${soldCars.length}`;
        } else if (lowerIn.includes("how many repair")) {
          replyBody = `${repairs.length}`;
        } else if (
          lowerIn.includes("how many car") ||
          lowerIn.includes("how many vehicle") ||
          lowerIn.includes("how many do we have") ||
          lowerIn === "cars" ||
          lowerIn === "how many"
        ) {
          replyBody = `${cars.length}`;
        }
        // 5. List Cars / Showroom Stock
        else if (
          lowerIn.includes("list") ||
          lowerIn.includes("stock") ||
          lowerIn.includes("inventory") ||
          lowerIn.includes("show cars") ||
          lowerIn.includes("all cars")
        ) {
          replyBody = formatCarsForWhatsApp(cars, "AUTOFAME SHOWROOM INVENTORY", 12);
        }
        // 6. Specific Brand / Model Search
        else {
          const matchedCars = cars.filter(
            (c: any) =>
              lowerIn.includes(c.make?.toLowerCase() || "") ||
              lowerIn.includes((c.model?.toLowerCase() || "").split(" ")[0])
          );
          if (matchedCars.length > 0) {
            replyBody = formatCarsForWhatsApp(
              matchedCars,
              `MATCHING VEHICLES (${matchedCars.length})`,
              10
            );
          } else {
            replyBody = formatCarsForWhatsApp(cars, "AUTOFAME SHOWROOM INVENTORY", 10);
          }
        }

        const sendRes = await fetch("https://gate.whapi.cloud/messages/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${whapiToken}`,
          },
          body: JSON.stringify({
            to: AUTOFAME_AGENT_GROUP_ID,
            body: replyBody,
          }),
        });
        const sendData = await sendRes.json();

        return NextResponse.json({
          success: sendRes.ok,
          replied: sendRes.ok,
          recipient: AUTOFAME_AGENT_GROUP_ID,
          incomingText,
          replySent: replyBody,
          data: sendData,
        });
      }

      return NextResponse.json({
        success: true,
        replied: false,
      });
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION C: Direct WhatsApp Message or Document Dispatch
    // ──────────────────────────────────────────────────────────────
    if (!to || !message) {
      return NextResponse.json(
        { error: "Phone number 'to' and 'message' are required." },
        { status: 400 }
      );
    }

    let formattedPhone = String(to).trim();
    if (!formattedPhone.includes("@g.us") && !formattedPhone.includes("@s.whatsapp.net")) {
      formattedPhone = formattedPhone.replace(/\s+/g, "").replace(/[-()]/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "27" + formattedPhone.slice(1);
      } else if (formattedPhone.startsWith("+")) {
        formattedPhone = formattedPhone.slice(1);
      }
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
