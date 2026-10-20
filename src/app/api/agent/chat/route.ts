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

function buildGmailDraftFromQuery(query: string, context: any, connectedGmail = "alexsouthflow3@gmail.com") {
  const lower = query.toLowerCase();
  const cars: CarRecord[] = Array.isArray(context?.cars) ? context.cars : [];
  const realLeads = getRealFormSubmissions(context);

  let to = "";
  let customerName = "Valued Client";
  let carName = cars[0] ? `${cars[0].year} ${cars[0].make} ${cars[0].model}` : "Selected Vehicle";
  let carPrice = cars[0]?.price || 0;

  const emailMatch = query.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    to = emailMatch[1];
    const namePart = to.split("@")[0].replace(/[._-]/g, " ");
    customerName = namePart.replace(/\b\w/g, (l) => l.toUpperCase());
  }

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

function buildWhatsAppDraftFromQuery(query: string, context: any) {
  const lower = query.toLowerCase();
  const cars: CarRecord[] = Array.isArray(context?.cars) ? context.cars : [];
  const realLeads = getRealFormSubmissions(context);

  let to = "";
  let customerName = "Client";
  let carName = cars[0] ? `${cars[0].year} ${cars[0].make} ${cars[0].model}` : "your selected vehicle";
  let carPrice = cars[0]?.price || 0;

  const phoneMatch = query.match(/(\+?27|0)\s*\d{2}\s*\d{3}\s*\d{4}/);
  if (phoneMatch) {
    to = phoneMatch[0];
  }

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
      : "0 vehicles";

  const repairSummary =
    repairs.length > 0
      ? repairs
          .map(
            (r) =>
              `- Job #${r.repairNumber}: ${r.carName} at ${r.workshopName} (${r.status}, Est Cost: R${(r.costEstimated || 0).toLocaleString()} ZAR)`
          )
          .join("\n")
      : "0 repairs";

  const formsSummary =
    realLeads.length > 0
      ? realLeads
          .map(
            (f) =>
              `- [${f.type}] ${f.customerName} (Email: ${f.email || "N/A"}, Phone: ${f.phone || "N/A"}) | ${f.vehicle} | ${f.details} | Status: ${f.status}`
          )
          .join("\n")
      : "0 form submissions";

  return `You are AutoFame Agent.
DATABASE FACTS:
- Total Cars: ${cars.length}
- Available Cars: ${cars.filter((c) => c.status === "AVAILABLE").length}
- Sold Cars: ${cars.filter((c) => c.status === "SOLD").length}
- Workshop Cars: ${cars.filter((c) => c.status === "MAINTENANCE" || c.status === "REPAIR").length}
- Form Leads: ${realLeads.length}
- Connected Gmail: ${connectedGmail}

INVENTORY:
${inventorySummary}

LEADS:
${formsSummary}

REPAIRS:
${repairSummary}

STRICT OUTPUT RULE:
- Give ONLY the direct answer to what the user asked. Do NOT include any extra commentary, greetings, tables, or explanations.
- For example, if the user asks "how many cars" or "how many cars do we have", respond with ONLY the number: ${cars.length}`;
}

/**
 * Direct Answer Engine — Gives ONLY the exact answer requested
 */
function generateDirectDatabaseAnswer(query: string, context: any, connectedGmail = "alexsouthflow3@gmail.com"): string {
  const lower = query.toLowerCase().trim();
  const cars: CarRecord[] = Array.isArray(context?.cars) ? context.cars : [];
  const repairs: RepairRecord[] = Array.isArray(context?.repairs) ? context.repairs : [];
  const realLeads = getRealFormSubmissions(context);

  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.status === "AVAILABLE");
  const soldCars = cars.filter((c) => c.status === "SOLD");
  const workshopCars = cars.filter((c) => c.status === "MAINTENANCE" || c.status === "REPAIR");
  const totalShowroomValue = availableCars.reduce((s, c) => s + (c.price || 0), 0);

  // 1. EXACT COUNT QUESTIONS -> Return ONLY the number
  if (
    lower.includes("how many available") ||
    lower.includes("available car count")
  ) {
    return `${availableCars.length}`;
  }

  if (
    lower.includes("how many sold") ||
    lower.includes("sold car count")
  ) {
    return `${soldCars.length}`;
  }

  if (
    lower.includes("how many repair") ||
    lower.includes("how many in workshop") ||
    lower.includes("how many maintenance")
  ) {
    return `${workshopCars.length || repairs.length}`;
  }

  if (
    lower.includes("how many form") ||
    lower.includes("how many lead") ||
    lower.includes("how many inquir") ||
    lower.includes("how many application")
  ) {
    return `${realLeads.length}`;
  }

  if (
    lower.includes("how many car") ||
    lower.includes("how many vehicle") ||
    lower.includes("total car") ||
    lower.includes("car count") ||
    lower.includes("stock count") ||
    lower.includes("number of cars") ||
    lower.includes("how much cars") ||
    lower.includes("how many do we have")
  ) {
    return `${totalCars}`;
  }

  // 2. VALUE / PRICE QUESTIONS -> Return ONLY the price/car
  if (lower.includes("total value") || lower.includes("showroom value") || lower.includes("inventory value")) {
    return `R${totalShowroomValue.toLocaleString()} ZAR`;
  }

  if (lower.includes("cheapest") || lower.includes("lowest price")) {
    if (cars.length === 0) return "0 cars in database";
    const cheapest = [...cars].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
    return `${cheapest.year} ${cheapest.make} ${cheapest.model} — R${(cheapest.price || 0).toLocaleString()} ZAR`;
  }

  if (lower.includes("most expensive") || lower.includes("highest price")) {
    if (cars.length === 0) return "0 cars in database";
    const mostExp = [...cars].sort((a, b) => (b.price || 0) - (a.price || 0))[0];
    return `${mostExp.year} ${mostExp.make} ${mostExp.model} — R${(mostExp.price || 0).toLocaleString()} ZAR`;
  }

  // 3. GMAIL / EMAIL COMPOSE
  if (
    lower.includes("email") ||
    lower.includes("gmail") ||
    lower.includes("mail") ||
    lower.includes("compose") ||
    lower.includes("imael")
  ) {
    const draft = buildGmailDraftFromQuery(query, context, connectedGmail);
    return `Opened Gmail composer in Canvas (${connectedGmail}${draft.to ? ` → ${draft.to}` : ""}).`;
  }

  // 4. WHATSAPP COMPOSE
  if (
    lower.includes("whatsapp") ||
    lower.includes("what app") ||
    lower.includes("whapi") ||
    lower.includes("send link")
  ) {
    const waDraft = buildWhatsAppDraftFromQuery(query, context);
    return `Opened WhatsApp composer in Canvas${waDraft.to ? ` (${waDraft.to})` : ""}.`;
  }

  // 5. FORMS / LEADS
  if (
    lower.includes("form") ||
    lower.includes("submission") ||
    lower.includes("inquir") ||
    lower.includes("lead") ||
    lower.includes("applicant") ||
    lower.includes("test drive") ||
    lower.includes("customer")
  ) {
    if (realLeads.length === 0) return "0 form submissions.";
    return realLeads
      .map((f) => `${f.customerName} (${f.type}) — ${f.email || f.phone || "No contact"} — ${f.status}`)
      .join("\n");
  }

  // 6. BRAND / MODEL MATCH
  const matchedCars = cars.filter(
    (c) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );
  if (matchedCars.length > 0) {
    return matchedCars
      .map((c) => `${c.year} ${c.make} ${c.model} — R${(c.price || 0).toLocaleString()} ZAR (${c.status})`)
      .join("\n");
  }

  // 7. LIST CARS
  if (lower.includes("list") || lower.includes("inventory") || lower.includes("stock") || lower.includes("cars")) {
    if (cars.length === 0) return "0";
    return cars
      .map((c) => `${c.year} ${c.make} ${c.model} — R${(c.price || 0).toLocaleString()} ZAR (${c.status})`)
      .join("\n");
  }

  return `${totalCars}`;
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

    const directAnswer = generateDirectDatabaseAnswer(lastUserMessage, context, connectedGmail);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        if (actionPayload) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "meta", actionPayload })}\n\n`)
          );
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "token", text: directAnswer })}\n\n`)
        );
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
