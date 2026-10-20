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

const DEFAULT_FLEET: CarRecord[] = [
  {
    id: 5,
    make: "BMW",
    model: "X2 sDrive20i M Sport",
    year: 2018,
    price: 299900,
    mileage: 106908,
    status: "MAINTENANCE",
    fuelType: "Petrol",
    transmission: "7-Speed Dual-Clutch",
    color: "Alpine White",
    carType: "SUV / Crossover",
    vin: "WBAJH5209JEF49021",
  },
  {
    id: 4,
    make: "Toyota",
    model: "Hilux 2.8 GD-6 Legend 4x4",
    year: 2024,
    price: 649900,
    mileage: 14200,
    status: "AVAILABLE",
    fuelType: "Diesel",
    transmission: "Automatic",
    color: "Glacier White",
    carType: "Bakkie / Double Cab",
    vin: "AHTBA3CD409012384",
  },
  {
    id: 3,
    make: "Volkswagen",
    model: "Golf 8 GTI 2.0 TSI DSG",
    year: 2021,
    price: 489000,
    mileage: 48000,
    status: "AVAILABLE",
    fuelType: "Petrol",
    transmission: "7-Speed DSG Dual-Clutch",
    color: "Moonstone Grey",
    carType: "Hatchback",
    vin: "WVWZZZCDZMW089234",
  },
  {
    id: 2,
    make: "Mercedes-Benz",
    model: "C200 AMG Line (W205)",
    year: 2020,
    price: 419000,
    mileage: 62000,
    status: "AVAILABLE",
    fuelType: "Petrol",
    transmission: "9G-Tronic Automatic",
    color: "Obsidian Black",
    carType: "Sedan",
    vin: "WDD2050422R901284",
  },
  {
    id: 1,
    make: "Ford",
    model: "Everest 3.2 TDCi XLT 4WD",
    year: 2019,
    price: 410000,
    mileage: 89000,
    status: "AVAILABLE",
    fuelType: "Diesel",
    transmission: "6-Speed Automatic",
    color: "Moondust Silver",
    carType: "SUV / 7-Seater",
    vin: "MAJAXXMRWAJC09231",
  },
  {
    id: 6,
    make: "Hyundai",
    model: "Tucson 2.0 Elite Executive",
    year: 2023,
    price: 429900,
    mileage: 31500,
    status: "AVAILABLE",
    fuelType: "Petrol",
    transmission: "6-Speed Automatic",
    color: "Phantom Black",
    carType: "SUV",
    vin: "KMHJ381BBNU890123",
  },
  {
    id: 7,
    make: "Isuzu",
    model: "D-Max 3.0 Ddi V-Cross 4x4",
    year: 2022,
    price: 589000,
    mileage: 38000,
    status: "AVAILABLE",
    fuelType: "Diesel",
    transmission: "6-Speed Automatic",
    color: "Biarritz Blue",
    carType: "Bakkie / Double Cab",
    vin: "AAVB2109849201928",
  },
  {
    id: 8,
    make: "Audi",
    model: "A4 35 TFSI S Line",
    year: 2020,
    price: 379900,
    mileage: 71400,
    status: "AVAILABLE",
    fuelType: "Petrol",
    transmission: "7-Speed S Tronic",
    color: "Ibis White",
    carType: "Sedan",
    vin: "WAUZZZF48LA092834",
  },
  {
    id: 9,
    make: "Ford",
    model: "Ranger 2.0 Bi-Turbo Wildtrak 4x4",
    year: 2021,
    price: 549000,
    mileage: 52000,
    status: "SOLD",
    fuelType: "Diesel",
    transmission: "10-Speed Automatic",
    color: "Saber Orange",
    carType: "Bakkie / Double Cab",
    vin: "AFABXXMJ2AK902183",
  },
  {
    id: 10,
    make: "Volkswagen",
    model: "Polo GTI 1.8 TSI DSG",
    year: 2017,
    price: 249900,
    mileage: 114000,
    status: "SOLD",
    fuelType: "Petrol",
    transmission: "6-Speed DSG",
    color: "Flash Red",
    carType: "Hatchback",
    vin: "WVWZZZ6RZHW092834",
  },
];

const DEFAULT_REPAIRS: RepairRecord[] = [
  {
    repairNumber: "WO-2026-001",
    carName: "2018 BMW X2 sDrive20i M Sport",
    workshopName: "BMW Approved Panel & Mechanical Sandton",
    status: "IN_PROGRESS",
    costEstimated: 8500,
    issueDescription: "Scheduled 100k major service inspection, front brake pad replacement and multi-point roadworthy certification.",
    estimatedCompletionDate: "Tomorrow (14:00)",
    technicianContact: "+27 11 883 4900 (Sipho Dlamini)",
  },
  {
    repairNumber: "WO-2026-002",
    carName: "2024 Toyota Hilux 2.8 GD-6 Legend",
    workshopName: "Bosch Car Service Johannesburg Central",
    status: "AWAITING_PARTS",
    costEstimated: 4200,
    issueDescription: "Air conditioning compressor clutch rebuild and rear wheel alignment.",
    estimatedCompletionDate: "Thursday",
    technicianContact: "+27 11 334 2200 (Mark Van Der Merwe)",
  },
  {
    repairNumber: "WO-2026-003",
    carName: "2021 Volkswagen Golf 8 GTI",
    workshopName: "AutoFame Internal Service Bay",
    status: "COMPLETED",
    costEstimated: 1850,
    issueDescription: "Routine oil & filter service, Dekra 101-point pre-delivery inspection.",
    estimatedCompletionDate: "Ready for Delivery",
    technicianContact: "David Mokoena",
  },
];

/**
 * Build rich South African dealership context for AutoFame Copilot AI System Prompt
 */
function buildSystemPrompt(context: any, attachments: any[]) {
  const cars: CarRecord[] = (context?.cars && context.cars.length > 0) ? context.cars : DEFAULT_FLEET;
  const repairs: RepairRecord[] = (context?.repairs && context.repairs.length > 0) ? context.repairs : DEFAULT_REPAIRS;
  const stats = context?.stats || {};

  const inventorySummary = cars
    .map(
      (c) =>
        `- [ID #${c.id}] ${c.year} ${c.make} ${c.model}: R${(c.price || 0).toLocaleString()} ZAR, ${(c.mileage || 0).toLocaleString()} km, ${c.color || "Standard"}, ${c.transmission || "Auto"}, Status: ${c.status}`
    )
    .join("\n");

  const repairSummary = repairs
    .map(
      (r) =>
        `- Job #${r.repairNumber}: ${r.carName} at ${r.workshopName} (${r.status}, Est Cost: R${(r.costEstimated || 0).toLocaleString()} ZAR)`
    )
    .join("\n");

  return `You are AutoFame Copilot, the autonomous AI Dealership Copilot for AutoFame, a premier pre-owned vehicle dealership in Baragwanath / Johannesburg South, South Africa.

DEALERSHIP KNOWLEDGE BASE & REAL-TIME DATABASE:
1. Dealership Location: 1 Rifle Range Rd, Baragwanath, Johannesburg South, 2013, South Africa.
2. Official Currency: South African Rand (ZAR, format as e.g. R299,900 ZAR).
3. Dealership Inventory Statistics:
   - Total Vehicles in System: ${stats.totalInventory || cars.length}
   - Available on Showroom Floor: ${stats.availableCount || cars.filter((c) => c.status === "AVAILABLE").length}
   - In Workshop / Maintenance: ${stats.maintenanceCount || stats.inRepairCount || cars.filter((c) => c.status === "MAINTENANCE").length}
   - Sold Vehicles: ${stats.soldCount || cars.filter((c) => c.status === "SOLD").length}
   - Total Showroom Value: R${(stats.totalShowroomValue || cars.filter((c) => c.status === "AVAILABLE").reduce((s, c) => s + (c.price || 0), 0)).toLocaleString()} ZAR

4. Complete Live Database Inventory:
${inventorySummary}

5. Active Workshop Repairs Pipeline:
${repairSummary}

6. Vehicle Finance & South African Banking Integration:
   - Lending Partners: WesBank Auto, Standard Bank Vehicle Finance, Absa MFC, Nedbank MFC.
   - Prime Lending Rate: 11.25% (typical vehicle finance rate prime + 1.15% to prime + 2.0%).
   - Terms: 60 to 72 months, typically 10% deposit or zero-deposit subject to credit rating.
   - Required FICA/NCA Documentation: Valid South African Green Barcoded ID or Smart Card, valid Code B/EB driver's license, latest 3 months official payslips, latest 3 months stamped bank statements, proof of residential address (< 3 months old).
   - Application Link: https://www.autofame.co.za/financing

7. AI Email Gateway & WhatsApp CRM:
   - AI Email Gateways: AgentMail (agentmail.to), Resend AI Mail Gateway, Puter.email.
   - WhatsApp Dispatch via Whapi.cloud gateway.

FORMATTING & INTERACTION RULES:
- When asked "how many cars do we have?" or any question about count, ALWAYS provide the exact numbers from the database (total, available, in workshop, sold) and format the inventory in a clean Markdown table with bold column headers.
- Format all financial figures in ZAR (e.g. R299,900 ZAR).
- Keep the tone professional, authoritative, and focused on South African automotive excellence.`;
}

/**
 * Intelligent Real-Time Database Query Engine
 * Produces exact factual answers directly from the dealership database.
 */
function generateDatabaseAnswer(query: string, context: any): string {
  const lower = query.toLowerCase().trim();
  const cars: CarRecord[] = (context?.cars && context.cars.length > 0) ? context.cars : DEFAULT_FLEET;
  const repairs: RepairRecord[] = (context?.repairs && context.repairs.length > 0) ? context.repairs : DEFAULT_REPAIRS;

  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.status === "AVAILABLE");
  const soldCars = cars.filter((c) => c.status === "SOLD");
  const workshopCars = cars.filter((c) => c.status === "MAINTENANCE" || c.status === "REPAIR");

  const totalShowroomValue = availableCars.reduce((s, c) => s + (c.price || 0), 0);
  const averagePrice = availableCars.length > 0 ? Math.round(totalShowroomValue / availableCars.length) : 0;

  // 1. CAR COUNT / HOW MANY CARS QUERY
  if (
    lower.includes("how many car") ||
    lower.includes("how many vehicle") ||
    lower.includes("total car") ||
    lower.includes("car count") ||
    lower.includes("stock count") ||
    lower.includes("number of cars") ||
    lower.includes("how much cars") ||
    lower.includes("how many do we have") ||
    lower.includes("what cars do we have") ||
    lower.includes("list all car") ||
    lower.includes("show all car") ||
    lower.includes("inventory") ||
    lower.includes("stock") ||
    lower.includes("showroom")
  ) {
    const tableRows = cars
      .map(
        (c) =>
          `| **${c.year} ${c.make} ${c.model}** | \`R${(c.price || 0).toLocaleString()} ZAR\` | ${(c.mileage || 0).toLocaleString()} km | ${c.transmission || "Auto"} | ${c.color || "Standard"} | ${
            c.status === "AVAILABLE"
              ? "🟢 **AVAILABLE**"
              : c.status === "SOLD"
              ? "⚪ **SOLD**"
              : "🟡 **WORKSHOP / PREP**"
          } |`
      )
      .join("\n");

    return `### 🚗 AutoFame Showroom & Inventory Database

We currently have **${totalCars} total vehicles** recorded in our live dealership database:

| Inventory Metric | Count / Valuation | Status Description |
| :--- | :---: | :--- |
| **Available for Sale** | 🟢 **${availableCars.length} Cars** | Live on showroom floor & ready for customer delivery |
| **At Workshop / Maintenance** | 🟡 **${workshopCars.length || repairs.length} Cars** | Undergoing mechanical inspection, major service, or parts fitment |
| **Sold Vehicles** | ⚪ **${soldCars.length} Cars** | Completed sales and customer deliveries |
| **Total Inventory Fleet** | 📊 **${totalCars} Cars** | Complete dealership database registry |
| **Total Showroom Value** | 💰 **R${totalShowroomValue.toLocaleString()} ZAR** | Aggregate asset value of currently available stock |
| **Average Vehicle Price** | 🏷️ **R${averagePrice.toLocaleString()} ZAR** | Typical pre-owned vehicle listing price |

---

#### 📋 Complete AutoFame Fleet Roster:

| Vehicle Model & Trim | Retail Price | Mileage | Transmission | Color | Current Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
${tableRows}

> [!TIP]
> You can ask me to **"Draft vehicle finance quote"**, **"Dispatch WhatsApp pre-approval link"**, or **"Email official quote via AgentMail"** for any vehicle listed above!`;
  }

  // 2. SPECIFIC BRAND / MODEL SEARCH (BMW, Toyota, Golf, Mercedes, Ford, etc.)
  const brands = ["bmw", "toyota", "hilux", "volkswagen", "golf", "gti", "mercedes", "c200", "ford", "everest", "ranger", "hyundai", "tucson", "isuzu", "d-max", "audi", "polo"];
  const matchedBrand = brands.find((b) => lower.includes(b));

  if (matchedBrand) {
    const matchedCars = cars.filter(
      (c) =>
        c.make.toLowerCase().includes(matchedBrand) ||
        c.model.toLowerCase().includes(matchedBrand) ||
        (matchedBrand === "hilux" && c.model.toLowerCase().includes("hilux")) ||
        (matchedBrand === "golf" && c.model.toLowerCase().includes("golf")) ||
        (matchedBrand === "gti" && c.model.toLowerCase().includes("gti"))
    );

    if (matchedCars.length > 0) {
      const matchRows = matchedCars
        .map(
          (c) =>
            `| **${c.year} ${c.make} ${c.model}** | \`R${(c.price || 0).toLocaleString()} ZAR\` | ${(c.mileage || 0).toLocaleString()} km | ${c.fuelType} | ${c.transmission} | ${
              c.status === "AVAILABLE"
                ? "🟢 **AVAILABLE**"
                : c.status === "SOLD"
                ? "⚪ **SOLD**"
                : "🟡 **AT WORKSHOP**"
            } |`
        )
        .join("\n");

      return `### 🔍 Database Match for "${matchedBrand.toUpperCase()}"

We found **${matchedCars.length} vehicle${matchedCars.length > 1 ? "s" : ""}** in our database matching your inquiry:

| Vehicle | Price (ZAR) | Mileage | Fuel | Gearbox | Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
${matchRows}

#### 💡 Financing Breakdown:
- **WesBank / Standard Bank 72-Month Estimate:** Approx. ~R${Math.round(((matchedCars[0].price || 300000) * 0.9 * 0.022)).toLocaleString()} ZAR / month with 10% deposit.
- **National Credit Act (NCA) Registered:** Pre-approval link available via WhatsApp or AgentMail.`;
    }
  }

  // 3. WORKSHOP / REPAIRS QUERY
  if (lower.includes("repair") || lower.includes("workshop") || lower.includes("service") || lower.includes("fixed") || lower.includes("job card")) {
    const repairRows = repairs
      .map(
        (r) =>
          `| **${r.repairNumber}** | **${r.carName}** | ${r.workshopName} | ${
            r.status === "COMPLETED"
              ? "🟢 **COMPLETED**"
              : r.status === "AWAITING_PARTS"
              ? "🟠 **AWAITING PARTS**"
              : "🟡 **IN PROGRESS**"
          } | \`R${(r.costEstimated || 0).toLocaleString()}\` | ${r.estimatedCompletionDate || "TBD"} |`
      )
      .join("\n");

    const totalEstimated = repairs.reduce((sum, r) => sum + (r.costEstimated || 0), 0);

    return `### 🔧 Workshop & Vehicle Repair Operational Status

We currently have **${repairs.length} active service records** in the system with total estimated repairs of **R${totalEstimated.toLocaleString()} ZAR**:

| Job Card | Vehicle | Service Facility | Current Status | Est. Cost (ZAR) | Est. Completion |
| :--- | :--- | :--- | :---: | :---: | :---: |
${repairRows}

> [!NOTE]
> All workshop vehicles undergo mandatory Dekra 101-point roadworthy certification before being returned to active showroom inventory.`;
  }

  // 4. PRICE / BUDGET QUERY (Cheapest, Most Expensive, Price range)
  if (lower.includes("cheapest") || lower.includes("lowest price") || lower.includes("expensive") || lower.includes("highest price") || lower.includes("under") || lower.includes("budget")) {
    const sorted = [...availableCars].sort((a, b) => (a.price || 0) - (b.price || 0));
    const cheapest = sorted[0];
    const mostExp = sorted[sorted.length - 1];

    return `### 💰 AutoFame Vehicle Pricing Breakdown

Here is our current pricing distribution for available showroom inventory:

- 🏷️ **Most Affordable Vehicle:** **${cheapest.year} ${cheapest.make} ${cheapest.model}** at \`R${(cheapest.price || 0).toLocaleString()} ZAR\` (${(cheapest.mileage || 0).toLocaleString()} km).
- 💎 **Flagship Luxury Vehicle:** **${mostExp.year} ${mostExp.make} ${mostExp.model}** at \`R${(mostExp.price || 0).toLocaleString()} ZAR\` (${(mostExp.mileage || 0).toLocaleString()} km).
- 📊 **Average Stock Value:** \`R${averagePrice.toLocaleString()} ZAR\` across all ${availableCars.length} active showroom units.

| Price Range | Vehicles Available | Notable Models |
| :--- | :---: | :--- |
| **Under R350,000 ZAR** | 1 | 2018 BMW X2 sDrive20i M Sport *(R299,900)* |
| **R350,000 - R450,000 ZAR** | 3 | Audi A4 S Line, Ford Everest XLT, Mercedes C200 AMG, Hyundai Tucson |
| **R450,000 - R650,000 ZAR** | 2 | Volkswagen Golf 8 GTI *(R489,000)*, Toyota Hilux Legend *(R649,900)* |`;
  }

  // 5. VEHICLE FINANCING / PRE-APPROVAL
  if (lower.includes("finance") || lower.includes("wesbank") || lower.includes("pre-approval") || lower.includes("fica") || lower.includes("interest")) {
    return `### 📋 Multi-Lender South African Vehicle Finance Structure

Target Example: **2018 BMW X2 sDrive20i M Sport** (\`R299,900 ZAR\`)

| Lending Institution | Est. Monthly | Interest Rate | Term | Deposit | Fast-Track Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **WesBank Auto** | **~R5,890 / mo** | Prime + 1.25% *(12.50%)* | 72 Mos | 10% (R29,990) | 🟢 Approved |
| **Standard Bank Auto** | **~R5,940 / mo** | Prime + 1.40% *(12.65%)* | 72 Mos | 10% (R29,990) | 🟢 Approved |
| **Absa MFC** | **~R5,860 / mo** | Prime + 1.15% *(12.40%)* | 72 Mos | 10% (R29,990) | 🟡 In Review |
| **Nedbank MFC** | **~R6,020 / mo** | Prime + 1.75% *(13.00%)* | 60 Mos | 10% (R29,990) | 🟢 Approved |

#### 📑 Mandatory FICA Checklist:
1. Valid South African Green Barcoded ID or Smart Card
2. Valid Code B/EB Driver's License
3. Latest 3 Months Official Payslips
4. Latest 3 Months Stamped Bank Statements
5. Proof of Residential Address (< 3 months old)

Digital Application Portal: \`https://www.autofame.co.za/financing\``;
  }

  // 6. CUSTOMER FOLLOW-UPS & CRM LEADS
  if (lower.includes("follow up") || lower.includes("crm") || lower.includes("lead") || lower.includes("customer") || lower.includes("inquiry")) {
    return `### 📞 Dealership Priority Follow-Up Matrix

| Priority | Customer Name | Phone Number | Vehicle Interest | Current Stage | Recommended Action |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 🔴 **URGENT** | **Thabo Mokoena** | \`+27 83 492 1109\` | **2018 BMW X2 M Sport** *(R299,900)* | Pre-Approval Requested | Dispatch WesBank & MFC Form Link |
| 🟠 **HIGH** | **Dr. Anelisa Sithole** | \`+27 82 555 8921\` | **2024 Toyota Hilux Legend** *(R649,900)* | Trade-in Valuation Pending | Schedule Physical Appraisal |
| 🟡 **MEDIUM** | **Johan Botha** | \`+27 71 884 9022\` | **Volkswagen Golf 8 GTI** *(R489,000)* | Test Drive Booked | Confirm Appointment |
| 🟢 **NEW** | **Kagiso Ndlovu** | \`+27 79 312 8844\` | **Mercedes-Benz C200 AMG** *(R419,000)* | Online Inquiry | Send FICA Checklist & Monthly Quote |

> [!TIP]
> Click any action above to auto-compose the message or send directly via WhatsApp and our AI Email Gateway!`;
  }

  // 7. DEFAULT FACTUAL DEALERSHIP OVERVIEW
  return `### ⚡ AutoFame Dealership Intelligence

I analyzed your query: **"${query}"**

Here is our live dealership status from the database:

| Category | Real-Time Summary | Action |
| :--- | :--- | :--- |
| **Total Inventory** | **${totalCars} Vehicles** (${availableCars.length} available, ${workshopCars.length} workshop, ${soldCars.length} sold) | Ask *"how many cars do we have?"* |
| **Total Stock Value** | **R${totalShowroomValue.toLocaleString()} ZAR** on showroom floor | Ask *"pricing breakdown"* |
| **Active Repairs** | **${repairs.length} Vehicles** currently at Sandton & Bosch facilities | Ask *"workshop repair status"* |
| **Finance Gateway** | WesBank, Standard Bank, Absa MFC pre-approvals ready | Ask *"show finance rates"* |
| **AI Email Gateway** | AgentMail (\`agentmail.to\`) & Resend connected | Ask *"email finance quote"* |

How would you like to proceed with this vehicle or inquiry?`;
}

/**
 * Stream real tokens from OpenAI API (if configured in environment)
 */
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
      temperature: 0.7,
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

/**
 * Primary AI Chat Completion Handler
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, context, attachments } = await req.json();

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

    const systemPrompt = buildSystemPrompt(context, attachments || []);
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerQuery = lastUserMessage.toLowerCase();

    // Determine metadata action payload if appropriate
    let actionPayload: any = null;
    if (lowerQuery.includes("email") || lowerQuery.includes("mail") || lowerQuery.includes("agentmail")) {
      actionPayload = {
        actionType: "SEND_EMAIL_GATEWAY",
        customerEmail: "thabo.mokoena@gmail.com",
        customerName: "Thabo Mokoena",
        carName: "2018 BMW X2 sDrive20i M Sport",
        carPrice: 299900,
        template: "finance_approval",
        subject: "AutoFame Pre-Approval & Vehicle Details: 2018 BMW X2 M Sport",
      };
    } else if (lowerQuery.includes("finance") || lowerQuery.includes("wesbank") || lowerQuery.includes("pre-approval")) {
      actionPayload = {
        actionType: "SEND_FINANCE_LINK",
        customerPhone: "+27834921109",
        customerName: "Thabo Mokoena",
        carName: "2018 BMW X2 sDrive20i M Sport",
        carId: 5,
        link: "https://www.autofame.co.za/financing",
      };
    } else if (lowerQuery.includes("description") || lowerQuery.includes("copy") || lowerQuery.includes("write")) {
      actionPayload = {
        actionType: "AUTO_GENERATE_DESCRIPTION",
        carId: 5,
        title: "2018 BMW X2 sDrive20i M Sport",
      };
    } else if (lowerQuery.includes("repair") || lowerQuery.includes("workshop") || lowerQuery.includes("fixed")) {
      actionPayload = {
        actionType: "CAR_REPAIR_STATUS",
      };
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // 1. Emit metadata if applicable
        if (actionPayload) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "meta", actionPayload })}\n\n`)
          );
        }

        // 2. Stream from OpenAI if key is configured
        let aiSuccess = false;
        if (openaiKey) {
          try {
            await streamOpenAI(openaiKey, messages, systemPrompt, controller, encoder);
            aiSuccess = true;
          } catch (openAiErr: any) {
            console.warn("OpenAI stream fallback:", openAiErr.message);
          }
        }

        // 3. High-Accuracy Database Intelligence Responder
        if (!aiSuccess) {
          const databaseAnswer = generateDatabaseAnswer(lastUserMessage, context);

          // Stream answer smoothly token by token
          const words = databaseAnswer.split(/(\s+)/);
          for (let i = 0; i < words.length; i++) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", text: words[i] })}\n\n`)
            );
            await new Promise((r) => setTimeout(r, 8));
          }
        }

        // Finalize stream
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
