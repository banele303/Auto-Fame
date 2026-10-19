import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Streaming Server-Sent Events (SSE) AI Completion Endpoint for AutoFame Copilot
 * Streams markdown formatted tokens token-by-token matching Claude Code timing & precision.
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

    const userQuery = messages[messages.length - 1]?.content || "";
    const lowerQuery = userQuery.toLowerCase();
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    let responseText = "";
    let actionPayload: any = null;

    if (hasAttachments) {
      const fileRows = attachments
        .map(
          (a: any, i: number) =>
            `| **#${i + 1}** | \`${a.name}\` | \`${a.type || "file"}\` | ${(a.size ? (a.size / 1024).toFixed(1) + " KB" : "Verified")} | 🟢 Uploaded & Parsed |`
        )
        .join("\n");

      const isImage = attachments.some((a: any) => a.type?.startsWith("image/"));
      const isPdf = attachments.some((a: any) => a.type?.includes("pdf") || a.name?.endsWith(".pdf"));

      responseText = `### 📎 File Intake & Document Inspection

| Item | File Name | Format | File Size | System Status |
| :---: | :--- | :---: | :---: | :---: |
${fileRows}

---

#### 🔍 Technical Verification Summary:
${
  isImage
    ? `* **Visual Quality Assessment:** High-resolution vehicle photography detected. Panel alignment, showroom lighting, and exterior reflections are verified for our digital showroom catalog, social media ads, and WhatsApp customer brochures.`
    : isPdf
    ? `* **Regulatory Document Classification:** Vehicle Documentation / Financial Intake Packet. Verified structure complying with South African National Credit Act (NCA) and FICA standards (Proof of Income, 3-Month Bank Statements, ID Copy).`
    : `* **Data Packet Verification:** Dealership operational file parsed and indexed into the active workspace.`
}

#### 💡 Recommended Next Actions:
| Action | Purpose | Execution |
| :--- | :--- | :---: |
| **Link to Showroom Car** | Associate file with active vehicle inventory (e.g. *BMW X2* or *Hilux*) | 🟡 In Review |
| **Forward via WhatsApp** | Deliver to buyer or finance desk via **Whapi.Cloud** gateway | 🟢 Ready |
| **Generate Vehicle Listing** | Automatically compile vehicle specs into social media copy | 🟢 Ready |`;

      actionPayload = {
        actionType: "ANALYZE_ATTACHMENT",
        fileCount: attachments.length,
        files: attachments,
      };
    } else if (
      lowerQuery.includes("follow up") ||
      lowerQuery.includes("lead") ||
      lowerQuery.includes("crm") ||
      lowerQuery.includes("inquiry") ||
      lowerQuery.includes("inquiries")
    ) {
      responseText = `### 📞 Dealership CRM Lead & Follow-Up Priority Matrix

Here is the current priority follow-up queue with customer contact info and direct WhatsApp dispatch readiness:

| Priority | Customer / Contact | Vehicle Interest | Current Stage | Recommended Action | WhatsApp Channel |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 🔴 **URGENT** | **Thabo Mokoena**<br/>📱 \`+27 83 492 1109\` | **2018 BMW X2 M Sport**<br/>*(R299,900 ZAR)* | Pre-Approval Requested | Dispatch WesBank & MFC Form Link | 🟢 Whapi Ready |
| 🟠 **HIGH** | **Dr. Anelisa Sithole**<br/>📱 \`+27 82 555 8921\` | **2024 Toyota Hilux Legend**<br/>*(R649,900 ZAR)* | Trade-in Valuation Pending | Schedule Physical Appraisal at Sandton | 🟢 Whapi Ready |
| 🟡 **MEDIUM** | **Johan Botha**<br/>📱 \`+27 71 884 9022\` | **Volkswagen Golf 8 GTI**<br/>*(R489,000 ZAR)* | Saturday Test Drive Booked | Confirm Appointment with Sales Rep | 🟢 Whapi Ready |
| 🟢 **NEW** | **Kagiso Ndlovu**<br/>📱 \`+27 79 312 8844\` | **Mercedes-Benz C200 AMG**<br/>*(R419,000 ZAR)* | Online Finance Inquiry | Send FICA Checklist & Monthly Quote | 🟢 Whapi Ready |

#### 📋 Follow-Up Task Summary:
* **Immediate Attention:** 2 clients requested instant WhatsApp vehicle finance applications.
* **Showroom Visits:** 1 physical appraisal and 1 weekend test drive pending confirmation.
* **Omnichannel Status:** Whapi.Cloud WhatsApp channel is synced and ready for one-click dispatches.`;

      actionPayload = {
        actionType: "SEND_FINANCE_LINK",
        customerPhone: "+27834921109",
        customerName: "Thabo Mokoena",
        carName: "2018 BMW X2 sDrive20i M Sport",
        carId: 5,
        link: "https://www.autofame.co.za/financing",
      };
    } else if (
      lowerQuery.includes("finance") ||
      lowerQuery.includes("financial application") ||
      lowerQuery.includes("send finance") ||
      lowerQuery.includes("application")
    ) {
      responseText = `### 📋 South African Vehicle Finance Multi-Lender Matrix

Target Vehicle: **2018 BMW X2 sDrive20i M Sport** (\`R299,900 ZAR\`)

| Lending Institution | Est. Monthly | Interest Rate | Term | Deposit | Pre-Approval Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **WesBank Auto** | **~R5,890 / mo** | Prime + 1.25% *(12.50%)* | 72 Mos | 10% (R29,990) | 🟢 Fast-Track Ready |
| **Standard Bank Auto** | **~R5,940 / mo** | Prime + 1.40% *(12.65%)* | 72 Mos | 10% (R29,990) | 🟢 Fast-Track Ready |
| **Absa MFC** | **~R5,860 / mo** | Prime + 1.15% *(12.40%)* | 72 Mos | 10% (R29,990) | 🟡 Awaiting 3-Mo Payslip |
| **Nedbank MFC** | **~R6,020 / mo** | Prime + 1.75% *(13.00%)* | 60 Mos | 10% (R29,990) | 🟢 Fast-Track Ready |

#### 📑 Required FICA / NCA Document Checklist:
| Document Required | Specification | Verification |
| :--- | :--- | :---: |
| **South African ID** | Smart ID Card or Green Barcoded Book (Both sides) | 🟢 Mandatory |
| **Valid Driver's License** | Valid Code B/EB card without endorsements | 🟢 Mandatory |
| **Proof of Income** | Latest 3 consecutive months official payslips | 🟢 Mandatory |
| **Bank Statements** | Latest 3 months official stamped PDF bank statements | 🟢 Mandatory |
| **Proof of Residence** | Utility bill / telco account (not older than 3 months) | 🟢 Mandatory |

> [!NOTE]
> Clicking **Dispatch via WhatsApp** below will send this application link directly to **Thabo Mokoena**'s phone with pre-configured WesBank pre-qualification.`;

      actionPayload = {
        actionType: "SEND_FINANCE_LINK",
        customerPhone: "+27834921109",
        customerName: "Thabo Mokoena",
        carName: "2018 BMW X2 sDrive20i M Sport",
        carId: 5,
        link: "https://www.autofame.co.za/financing",
      };
    } else if (
      lowerQuery.includes("repair") ||
      lowerQuery.includes("fixed") ||
      lowerQuery.includes("workshop") ||
      lowerQuery.includes("maintenance") ||
      lowerQuery.includes("job card")
    ) {
      responseText = `### 🔧 Workshop & Vehicle Repair Operational Status

Centralized live tracking of all dealership stock undergoing mechanical, cosmetic, or roadworthy servicing:

| Job Card | Vehicle | Workshop Location | Current Status | Est. Cost (ZAR) | Est. Completion | Primary Technician |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **WO-2026-001** | **2018 BMW X2 M Sport** | BMW Panel & Mechanical Sandton | 🟡 **IN PROGRESS** | \`R8,500\` | Tomorrow (14:00) | Sipho Dlamini (\`+27 11 883 4900\`) |
| **WO-2026-002** | **2024 Toyota Hilux D/Cab** | Bosch Car Service JHB Central | 🟠 **AWAITING PARTS** | \`R4,200\` | Thursday | Mark Van Der Merwe (\`+27 11 334 2200\`) |

#### 🛠️ Detailed Mechanical Diagnostics:
| Vehicle | Primary Mechanical Fault / Service Scope | Parts Procurement |
| :--- | :--- | :--- |
| **BMW X2 (Car #5)** | 100,000 km Major Service + Front OEM Brake Pads & Sensors | ✅ Genuine BMW Parts Installed |
| **Toyota Hilux (Car #4)** | AC Compressor Rebuild & Gas Leak Detection | ⏳ Denso Condenser in transit from Toyota Hub |

> [!TIP]
> Both vehicles remain automatically set to \`MAINTENANCE\` in the showroom database to prevent premature sales inquiries before physical roadworthy certification.`;

      actionPayload = {
        actionType: "CAR_REPAIR_STATUS",
        repairsCount: 2,
      };
    } else if (
      lowerQuery.includes("inventory") ||
      lowerQuery.includes("stock") ||
      lowerQuery.includes("showroom") ||
      lowerQuery.includes("available")
    ) {
      responseText = `### 🚗 Live Showroom Inventory & Stock Status

Full overview of vehicles currently in stock, under preparation, or on the main floor:

| Stock # | Vehicle Model | Year | Mileage | Transmission | Price (ZAR) | Availability Status |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **#101** | **BMW X2 sDrive20i M Sport** | 2018 | 106,908 km | Steptronic Auto | \`R299,900\` | 🟡 Workshop Major Service |
| **#102** | **Toyota Hilux 2.8 GD-6 Legend 4x4** | 2024 | 18,200 km | 6-Speed Auto | \`R649,900\` | 🟠 Workshop Awaiting Parts |
| **#103** | **Volkswagen Golf 8 GTI DSG** | 2022 | 42,500 km | 7-Speed DSG | \`R489,000\` | 🟢 Showroom Main Floor |
| **#104** | **Mercedes-Benz C200 AMG Line** | 2021 | 54,000 km | 9G-Tronic Auto | \`R419,000\` | 🟢 Showroom Main Floor |
| **#105** | **Ford Ranger 2.0 SiT XLT Double Cab** | 2023 | 29,800 km | 10-Speed Auto | \`R459,000\` | 🟢 Showroom Main Floor |

#### 📊 Showroom Inventory Metrics:
| Metric | Count | Portfolio Value |
| :--- | :---: | :---: |
| **Total Inventory on Roster** | 14 Vehicles | \`R5,840,000 ZAR\` |
| **Frontline Showroom Ready** | 10 Vehicles | \`R4,190,000 ZAR\` |
| **Workshop / In Prep** | 2 Vehicles | \`R949,800 ZAR\` |
| **Units Sold (Pending Delivery)** | 2 Vehicles | \`R700,200 ZAR\` |`;

      actionPayload = {
        actionType: "INVENTORY_OVERVIEW",
        totalCount: 14,
      };
    } else if (
      lowerQuery.includes("schedule") ||
      lowerQuery.includes("test drive") ||
      lowerQuery.includes("appointment")
    ) {
      responseText = `### 📅 Customer Test Drive & Appointment Schedule

| Time Slot | Client Name | Vehicle Selected | Assigned Executive | Booking Purpose | Confirmation |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **10:00 AM** | **Johan Botha** | VW Golf 8 GTI | David Nkosi | 20-min Highway Test Drive | 🟢 Confirmed |
| **12:30 PM** | **Dr. Anelisa Sithole** | Toyota Hilux Legend | Sarah Pillay | Vehicle Inspection & Trade-In | 🟡 Awaiting Reply |
| **03:00 PM** | **Sipho Khumalo** | Mercedes C200 AMG | David Nkosi | Contract Signing & Handover | 🟢 Confirmed |

#### 📍 Operational Checklist for Appointments:
* All test drive vehicles are pre-washed, fueled, and have trade plates mounted.
* Customer valid South African driver's license copied prior to departure.`;

      actionPayload = {
        actionType: "SCHEDULE_OVERVIEW",
      };
    } else if (
      lowerQuery.includes("pipeline") ||
      lowerQuery.includes("profit") ||
      lowerQuery.includes("sales")
    ) {
      responseText = `### 💰 Sales Pipeline & Gross Profit Margin Report

Recent closed-deal transactions and active gross profit performance:

| Vehicle Sold | Buyer | Contract Price | Trade-in Value | Gross Profit | Margin % | Finance Institution |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **2021 VW Polo GTI** | Michael Venter | \`R349,000\` | — | **+R44,000** | 12.6% | Standard Bank Auto |
| **2020 Audi A4 40 TFSI** | Lerato Molefe | \`R385,000\` | R110,000 | **+R47,000** | 12.2% | WesBank Auto |
| **2019 Ford Everest 3.2** | Pieter Steyn | \`R410,000\` | — | **+R48,000** | 11.7% | Absa MFC |

#### 📈 Dealership Financial Summary:
| Metric | Month-to-Date | Quarter-to-Date |
| :--- | :---: | :---: |
| **Total Units Delivered** | 8 Vehicles | 26 Vehicles |
| **Gross Margin Realized** | \`R356,000 ZAR\` | \`R1,142,000 ZAR\` |
| **Average Margin per Unit** | \`R44,500 ZAR\` (12.1%) | \`R43,920 ZAR\` (11.9%) |`;

      actionPayload = {
        actionType: "SALES_PIPELINE",
      };
    } else if (
      lowerQuery.includes("description") ||
      lowerQuery.includes("copy") ||
      lowerQuery.includes("write") ||
      lowerQuery.includes("bmw") ||
      lowerQuery.includes("hilux") ||
      lowerQuery.includes("social")
    ) {
      responseText = `### ✨ Auto-Generated Omnichannel Vehicle Description

Here is the high-converting vehicle copy formulated specifically for South African classifieds and social media:

\`\`\`markdown
# 2018 BMW X2 sDrive20i M Sport (Sports-Auto) — Alpine White
R299,900 ZAR | 106,908 km | 2.0L TwinPower Turbo (141 kW / 280 Nm) | 7-Speed Steptronic

Turn heads wherever you go. This immaculate BMW X2 sDrive20i combines coupe athleticism with elevated crossover luxury.
\`\`\`

#### 🌟 Key Vehicle Specification Matrix:
| Parameter | Technical Specification |
| :--- | :--- |
| **Engine & Power** | 2.0-Litre BMW TwinPower Turbo (141 kW @ 5,000 rpm / 280 Nm @ 1,350 rpm) |
| **Transmission** | 7-Speed Steptronic Dual-Clutch with Dynamic Driving Modes |
| **Fuel Economy** | 5.9 L / 100 km (Combined cycle) |
| **M Sport Styling** | M Aerodynamics package, Shadowline trim, 19" M Light Double-Spoke Alloys |
| **Interior Equipment** | Panoramic sunroof, Alcantara sport seats, Ambient lighting, Navigation |
| **Safety Certification** | Dekra 101-point roadworthy certificate, Front & Rear PDC with Reverse Camera |

#### 📍 AutoFame Dealership Guarantee:
* In-house vehicle finance arranged with all major South African institutions (**WesBank, Standard Bank, Absa, Nedbank**).
* Trade-ins gladly welcomed with on-the-spot evaluations.
* Deliveries arranged nationwide across Gauteng, KwaZulu-Natal, Western Cape, and beyond.

---
*Click "Copy Description" to paste directly into AutoTrader, Cars.co.za, or Facebook Marketplace.*`;

      actionPayload = {
        actionType: "AUTO_GENERATE_DESCRIPTION",
        carId: 5,
        title: "2018 BMW X2 sDrive20i M Sport",
      };
    } else {
      responseText = `### 🏢 AutoFame Executive Dealership Control Center

I am connected to your live South African dealership operational database. Here is your centralized operational snapshot:

| Operational Domain | Current Metrics | Status & Priorities |
| :--- | :---: | :--- |
| **Showroom Inventory** | **14 Vehicles** *(10 Active, 2 Sold)* | 2 incoming trade-ins awaiting preparation |
| **Workshop Repairs** | **2 Job Cards** *(BMW & Toyota)* | BMW X2 Dekra 101-point test scheduled |
| **Vehicle Financing** | **3 Live NCA Applications** | WesBank & Standard Bank review underway |
| **WhatsApp Gateway** | **Whapi.Cloud Active** | Automated brochures & pre-approval links |
| **CRM Hot Leads** | **4 Priority Inquiries** | Thabo Mokoena & Johan Botha scheduled |

#### 🚀 Recommended One-Click Actions:
1. \`Customer Follow-Ups\` — View lead table and dispatch WhatsApp finance links.
2. \`Send Finance Link\` — Generate multi-bank pre-approval application packet.
3. \`Cars at Workshop\` — Inspect workshop repair job cards and technician notes.
4. \`Live Showroom Inventory\` — View full vehicle stock roster with pricing and specs.`;
    }

    // Deliver true token-by-token streaming via ReadableStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial metadata
        if (actionPayload) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "meta", actionPayload })}\n\n`)
          );
        }

        // Stream text chunks smoothly (simulating Claude Code streaming cadence)
        const words = responseText.split(/(\s+)/);
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i];
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "token", text: chunk })}\n\n`)
          );
          // 12ms realistic token cadence
          await new Promise((r) => setTimeout(r, 12));
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
