import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface CarRecord {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  status: string;
  vin?: string;
  transmission?: string;
  fuelType?: string;
  color?: string;
  carType?: string;
}

interface RepairRecord {
  repairNumber: string;
  carName: string;
  workshopName: string;
  status: string;
  costEstimated: number;
  issueDescription: string;
  dateSent?: string;
  estimatedCompletionDate?: string;
  technicianContact?: string;
}

/**
 * Extract real form submissions & leads from Convex context (zero demo data)
 */
function getRealFormSubmissions(context: any) {
  const financings = Array.isArray(context?.financings) ? context.financings : [];
  const inquiries = Array.isArray(context?.inquiries) ? context.inquiries : [];
  const testDrives = Array.isArray(context?.testDrives) ? context.testDrives : [];

  return [
    ...financings.map((f: any) => ({
      type: "Finance Application",
      customerName: f.customerName || `Applicant #${f.id}`,
      email: f.email || "",
      phone: f.phone || "",
      vehicle: f.loanAmount ? `Loan: R${Number(f.loanAmount).toLocaleString()} ZAR` : "Finance Application",
      details: f.monthlyIncomeGross
        ? `Gross Income: R${Number(f.monthlyIncomeGross).toLocaleString()} / mo`
        : `Credit Score: ${f.creditScore || "Pending"}`,
      status: f.status || "PENDING",
      date: f.applicationDate || "",
    })),
    ...inquiries.map((inq: any) => ({
      type: "Vehicle Inquiry",
      customerName: inq.customerName || "Website Visitor",
      email: inq.customerEmail || "",
      phone: inq.customerPhone || "",
      vehicle: inq.carName || `Car #${inq.carId}`,
      details: inq.message || "Website Inquiry",
      status: inq.status || "NEW",
      date: inq.createdAt || "",
    })),
    ...testDrives.map((td: any) => ({
      type: "Test Drive Booking",
      customerName: td.customerName || "Showroom Client",
      email: td.customerEmail || "",
      phone: td.customerPhone || "",
      vehicle: td.carName || `Car #${td.carId}`,
      details: td.scheduledDate
        ? `Scheduled: ${new Date(td.scheduledDate).toLocaleDateString()}`
        : "Test Drive",
      status: td.completed ? "COMPLETED" : "SCHEDULED",
      date: td.createdAt || "",
    })),
  ];
}

/**
 * Build Gmail Draft Payload using real database records or user prompt
 */
function buildGmailDraftFromQuery(query: string, context: any, connectedGmail = "alexsouthflow3@gmail.com") {
  const lower = query.toLowerCase();
  const cars: CarRecord[] = Array.isArray(context?.cars) ? context.cars : [];
  const realLeads = getRealFormSubmissions(context);

  let to = "";
  let customerName = "Valued Client";
  let carName = cars[0] ? `${cars[0].year} ${cars[0].make} ${cars[0].model}` : "Selected Vehicle";
  let carPrice = cars[0]?.price || 0;

  // 1. Check if user typed an email address in prompt
  const emailMatch = query.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    to = emailMatch[1];
    const namePart = to.split("@")[0].replace(/[._-]/g, " ");
    customerName = namePart.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // 2. Match against real leads from database forms
  const matchedLead = realLeads.find(
    (lead) =>
      (lead.customerName && lower.includes(lead.customerName.toLowerCase())) ||
      (lead.email && lower.includes(lead.email.toLowerCase()))
  );
  if (matchedLead) {
    customerName = matchedLead.customerName;
    if (matchedLead.email) to = matchedLead.email;
  } else if (!to && realLeads.length > 0 && realLeads[0].email) {
    customerName = realLeads[0].customerName;
    to = realLeads[0].email;
  }

  // 3. Match against real cars in database
  const matchedCar = cars.find(
    (c) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );
  if (matchedCar) {
    carName = `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}`;
    carPrice = matchedCar.price || 0;
  }

  const priceLine = carPrice > 0 ? `R${carPrice.toLocaleString()} ZAR` : "Available on request";
  const monthlyEst = carPrice > 0 ? Math.round(carPrice * 0.9 * 0.0218) : 0;

  const subject =
    carPrice > 0
      ? `AutoFame Official Quotation & Finance Details — ${carName}`
      : `AutoFame Dealership — Vehicle Inquiry & Finance Information`;

  const body = `Dear ${customerName},

Thank you for contacting AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South).

Here are the details regarding your inquiry:
• Vehicle: ${carName}
• Retail Price: ${priceLine}${
    monthlyEst > 0
      ? `\n• Estimated Monthly Instalment: ~R${monthlyEst.toLocaleString()} ZAR / month (72 months, 10% deposit)`
      : ""
  }

To proceed with vehicle financing, please reply to this email with your FICA documents:
1. Copy of SA ID (Smart Card or Green Book)
2. Valid South African Driver's License
3. Latest 3 Months Stamped Bank Statements & Payslips
4. Proof of Residence (not older than 3 months)

Or apply online at: https://www.autofame.co.za/financing

Warm regards,
AutoFame Dealership
Email: ${connectedGmail}`;

  return {
    actionType: "GMAIL_COMPOSE",
    from: connectedGmail,
    to,
    cc: "",
    customerName,
    carName,
    carPrice,
    subject,
    body,
  };
}

/**
 * Build WhatsApp Draft Payload using real database records or user prompt
 */
function buildWhatsAppDraftFromQuery(query: string, context: any) {
  const lower = query.toLowerCase();
  const cars: CarRecord[] = Array.isArray(context?.cars) ? context.cars : [];
  const realLeads = getRealFormSubmissions(context);

  let to = "";
  let customerName = "Client";
  let carName = cars[0] ? `${cars[0].year} ${cars[0].make} ${cars[0].model}` : "your selected vehicle";
  let carPrice = cars[0]?.price || 0;

  // Match phone number in query
  const phoneMatch = query.match(/(\+?27|0)\s*\d{2}\s*\d{3}\s*\d{4}/);
  if (phoneMatch) {
    to = phoneMatch[0];
  }

  // Match real lead
  const matchedLead = realLeads.find(
    (lead) =>
      (lead.customerName && lower.includes(lead.customerName.toLowerCase())) ||
      (lead.phone && lower.includes(lead.phone))
  );
  if (matchedLead) {
    customerName = matchedLead.customerName;
    if (matchedLead.phone) to = matchedLead.phone;
  } else if (!to && realLeads.length > 0 && realLeads[0].phone) {
    customerName = realLeads[0].customerName;
    to = realLeads[0].phone;
  }

  // Match real car
  const matchedCar = cars.find(
    (c) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );
  if (matchedCar) {
    carName = `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}`;
    carPrice = matchedCar.price || 0;
  }

  const priceText = carPrice > 0 ? ` (R${carPrice.toLocaleString()} ZAR)` : "";
  const message = `Hi ${customerName}, this is AutoFame Dealership Johannesburg South regarding *${carName}*${priceText}. You can complete your finance application online at https://www.autofame.co.za/financing or reply here with your ID copy, 3 months bank statements, and payslips.`;

  return {
    actionType: "WHATSAPP_COMPOSE",
    to,
    customerName,
    carName,
    carPrice,
    message,
  };
}

/**
 * Build System Prompt from 100% Real Convex Database Context
 */
function buildSystemPrompt(context: any, connectedGmail: string) {
  const cars: CarRecord[] = Array.isArray(context?.cars) ? context.cars : [];
  const repairs: RepairRecord[] = Array.isArray(context?.repairs) ? context.repairs : [];
  const realLeads = getRealFormSubmissions(context);

  const inventorySummary =
    cars.length > 0
      ? cars
          .map(
            (c) =>
              `- [ID #${c.id}] ${c.year} ${c.make} ${c.model}: R${(c.price || 0).toLocaleString()} ZAR, ${(c.mileage || 0).toLocaleString()} km, ${c.color || "Standard"}, ${c.transmission || "Auto"}, Status: ${c.status}`
          )
          .join("\n")
      : "No vehicles currently recorded in the cars database table.";

  const repairSummary =
    repairs.length > 0
      ? repairs
          .map(
            (r) =>
              `- Job #${r.repairNumber}: ${r.carName} at ${r.workshopName} (${r.status}, Est Cost: R${(r.costEstimated || 0).toLocaleString()} ZAR)`
          )
          .join("\n")
      : "No active workshop repair records in the carRepairs database table.";

  const formsSummary =
    realLeads.length > 0
      ? realLeads
          .map(
            (f) =>
              `- [${f.type}] ${f.customerName} (Email: ${f.email || "N/A"}, Phone: ${f.phone || "N/A"}) | ${f.vehicle} | ${f.details} | Status: ${f.status}`
          )
          .join("\n")
      : "No form submissions recorded yet in financingApplications, inquiries, or testDrives tables.";

  return `You are AutoFame Agent, connected to AutoFame Dealership's real Convex database and channels:
1. Gmail Channel: ${connectedGmail} (Real SMTP via smtp.gmail.com:465)
2. WhatsApp Channel: Real Whapi.Cloud / WhatsApp dispatch
3. Live Convex Database (100% real data, zero fake/demo records):

REAL DATABASE INVENTORY (${cars.length} Cars):
${inventorySummary}

REAL WEBSITE FORM SUBMISSIONS (${realLeads.length} Submissions):
${formsSummary}

REAL WORKSHOP REPAIRS (${repairs.length} Repairs):
${repairSummary}

RULES:
- Report ONLY the exact records present in the database above. Never invent demo cars or demo customer names.
- If a table is empty, state clearly that there are 0 records in that table right now.
- Format currency in South African Rand (R... ZAR).`;
}

/**
 * Real-Time Database Query Responder (Zero Demo Data)
 */
function generateDatabaseAnswer(query: string, context: any, connectedGmail = "alexsouthflow3@gmail.com"): string {
  const lower = query.toLowerCase().trim();
  const cars: CarRecord[] = Array.isArray(context?.cars) ? context.cars : [];
  const repairs: RepairRecord[] = Array.isArray(context?.repairs) ? context.repairs : [];
  const realLeads = getRealFormSubmissions(context);

  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.status === "AVAILABLE");
  const soldCars = cars.filter((c) => c.status === "SOLD");
  const workshopCars = cars.filter((c) => c.status === "MAINTENANCE" || c.status === "REPAIR");
  const totalShowroomValue = availableCars.reduce((s, c) => s + (c.price || 0), 0);
  const averagePrice = availableCars.length > 0 ? Math.round(totalShowroomValue / availableCars.length) : 0;

  // 1. GMAIL / EMAIL COMPOSE IN CHAT
  if (
    lower.includes("email") ||
    lower.includes("gmail") ||
    lower.includes("mail") ||
    lower.includes("compose") ||
    lower.includes("imael")
  ) {
    const draft = buildGmailDraftFromQuery(query, context, connectedGmail);
    return `### ✉️ Gmail Channel (\`${connectedGmail}\`) — Compose Email

I have opened the **Gmail Composer** below connected to **\`${connectedGmail}\`**${
      draft.to ? ` addressed to **\`${draft.to}\`**` : ""
    }.

Review the fields below and click **Send with Gmail** to dispatch directly through Google's SMTP server (\`smtp.gmail.com:465\`).`;
  }

  // 2. WHATSAPP COMPOSE IN CHAT
  if (
    lower.includes("whatsapp") ||
    lower.includes("what app") ||
    lower.includes("whapi") ||
    lower.includes("send link")
  ) {
    const waDraft = buildWhatsAppDraftFromQuery(query, context);
    return `### 💬 WhatsApp Channel — Compose Message

I have opened the **WhatsApp Composer** below${
      waDraft.to ? ` for **${waDraft.customerName}** (\`${waDraft.to}\`)` : ""
    }.

Enter or verify the phone number and message below, then click **Send on WhatsApp**.`;
  }

  // 3. WEBSITE FORMS, FINANCING SUBMISSIONS, INQUIRIES & LEADS
  if (
    lower.includes("form") ||
    lower.includes("submission") ||
    lower.includes("inquir") ||
    lower.includes("lead") ||
    lower.includes("applicant") ||
    lower.includes("who applied") ||
    lower.includes("test drive") ||
    lower.includes("customer")
  ) {
    if (realLeads.length === 0) {
      return `### 📋 Website Forms & Customer Submissions (Live Database)

There are currently **0 form submissions** recorded in your Convex database (\`financingApplications\`, \`inquiries\`, and \`testDrives\` tables are empty).

As soon as a customer submits a finance application on \`/financing\`, books a test drive, or sends a vehicle inquiry on the website, their real details will appear here automatically.`;
    }

    const formRows = realLeads
      .map(
        (f) =>
          `| **${f.type}** | **${f.customerName}** | \`${f.email || "—"}\` | \`${f.phone || "—"}\` | **${f.vehicle}** | ${f.details} | **${f.status}** |`
      )
      .join("\n");

    return `### 📋 Live Website Form Submissions (${realLeads.length} Records)

| Form Type | Customer Name | Email | Phone | Vehicle / Loan | Details | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
${formRows}`;
  }

  // 4. WORKSHOP / REPAIRS QUERY
  if (
    lower.includes("repair") ||
    lower.includes("workshop") ||
    lower.includes("service") ||
    lower.includes("job card")
  ) {
    if (repairs.length === 0) {
      return `### 🔧 Workshop & Repair Status (Live Database)

There are currently **0 active repair records** in the \`carRepairs\` database table (${workshopCars.length} vehicles marked as \`MAINTENANCE\` in inventory).`;
    }

    const repairRows = repairs
      .map(
        (r) =>
          `| **${r.repairNumber}** | **${r.carName}** | ${r.workshopName} | **${r.status}** | \`R${(r.costEstimated || 0).toLocaleString()} ZAR\` | ${r.estimatedCompletionDate || "TBD"} |`
      )
      .join("\n");

    return `### 🔧 Live Workshop & Vehicle Repairs (${repairs.length} Records)

| Job Card | Vehicle | Workshop | Status | Est. Cost | Est. Completion |
| :--- | :--- | :--- | :---: | :---: | :---: |
${repairRows}`;
  }

  // 5. CAR COUNT / INVENTORY QUERY
  if (totalCars === 0) {
    return `### 🚗 AutoFame Inventory Database (Live Sync)

There are currently **0 vehicles** in your Convex \`cars\` table. Add vehicles in the Inventory section and they will immediately sync here.`;
  }

  const tableRows = cars
    .map(
      (c) =>
        `| **#${c.id}** | **${c.year} ${c.make} ${c.model}** | \`R${(c.price || 0).toLocaleString()} ZAR\` | ${(c.mileage || 0).toLocaleString()} km | ${c.transmission || "Auto"} | ${c.color || "Standard"} | **${c.status}** |`
    )
    .join("\n");

  return `### 🚗 AutoFame Live Database Inventory (${totalCars} Vehicles)

| Metric | Live Database Value |
| :--- | :--- |
| **Total Cars in Database** | **${totalCars} Cars** |
| **Available for Sale** | **${availableCars.length} Cars** |
| **In Workshop / Maintenance** | **${workshopCars.length} Cars** |
| **Sold Cars** | **${soldCars.length} Cars** |
| **Total Available Showroom Value** | **R${totalShowroomValue.toLocaleString()} ZAR** (Avg: \`R${averagePrice.toLocaleString()} ZAR\`) |
| **Website Form Submissions** | **${realLeads.length} Submissions** |
| **Connected Gmail Account** | \`${connectedGmail}\` |

---

#### 📋 Live Vehicles in \`cars\` Table:

| ID | Vehicle | Price (ZAR) | Mileage | Transmission | Color | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: |
${tableRows}`;
}

async function streamOpenAI(
  apiKey: string,
  messages: any[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const openAiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: any) => ({ role: m.role, content: m.content || "" })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: openAiMessages,
      stream: true,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.error?.message || `OpenAI HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from OpenAI");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed.choices?.[0]?.delta?.content;
          if (chunkText) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", text: chunkText })}\n\n`)
            );
          }
        } catch {}
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context, connectedGmail = "alexsouthflow3@gmail.com" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openaiKey =
      req.headers.get("x-openai-api-key") ||
      process.env.OPENAI_API_KEY ||
      "";

    const systemPrompt = buildSystemPrompt(context, connectedGmail);
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerQuery = lastUserMessage.toLowerCase();

    let actionPayload: any = null;
    if (
      lowerQuery.includes("email") ||
      lowerQuery.includes("gmail") ||
      lowerQuery.includes("mail") ||
      lowerQuery.includes("compose") ||
      lowerQuery.includes("imael")
    ) {
      actionPayload = buildGmailDraftFromQuery(lastUserMessage, context, connectedGmail);
    } else if (
      lowerQuery.includes("whatsapp") ||
      lowerQuery.includes("what app") ||
      lowerQuery.includes("whapi") ||
      lowerQuery.includes("send link")
    ) {
      actionPayload = buildWhatsAppDraftFromQuery(lastUserMessage, context);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        if (actionPayload) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "meta", actionPayload })}\n\n`)
          );
        }

        let aiSuccess = false;
        if (openaiKey) {
          try {
            await streamOpenAI(openaiKey, messages, systemPrompt, controller, encoder);
            aiSuccess = true;
          } catch (openAiErr: any) {
            console.warn("OpenAI stream fallback:", openAiErr.message);
          }
        }

        if (!aiSuccess) {
          const databaseAnswer = generateDatabaseAnswer(lastUserMessage, context, connectedGmail);
          const words = databaseAnswer.split(/(\s+)/);
          for (let i = 0; i < words.length; i++) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", text: words[i] })}\n\n`)
            );
            await new Promise((r) => setTimeout(r, 8));
          }
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI Completion error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
