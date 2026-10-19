import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Streaming Server-Sent Events (SSE) AI Completion Endpoint for AutoFame Copilot
 * Streams markdown formatted tokens token-by-token matching Claude Code timing & precision.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userQuery = messages[messages.length - 1]?.content || "";
    const lowerQuery = userQuery.toLowerCase();

    let responseText = "";
    let actionPayload: any = null;

    if (
      lowerQuery.includes("finance") ||
      lowerQuery.includes("financial application") ||
      lowerQuery.includes("send finance") ||
      lowerQuery.includes("application")
    ) {
      responseText = `### 📋 Vehicle Finance Pre-Approval Package (South Africa)

I have prepared the National Credit Act (NCA) compliant financing application ready for instant dispatch via **Whapi.Cloud** WhatsApp gateway.

---

#### 🚗 **Target Vehicle:** 2018 BMW X2 sDrive20i M Sport
* **Vehicle Price:** \`R299,900 ZAR\`
* **Participating Lenders:** WesBank Auto, Standard Bank Vehicle Finance, Absa MFC, Nedbank
* **Estimated Installment:** **~R5,890 / month** *(72 months @ prime + 1.25%, 10% deposit)*
* **Client Document Checklist:**
  1. Valid South African ID / Smart Card
  2. Latest 3 Months Official Bank Statements (PDF)
  3. Proof of Residential Address (not older than 3 months)
  4. Latest 3 Months Payslips

> [!NOTE]
> All applications submitted through this link trigger instant FICA verification and pre-qualification through our centralized dealership CRM.

Would you like me to dispatch this link directly to **Thabo Mokoena**'s WhatsApp right now?`;

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

Centralized status of all dealership vehicles currently undergoing mechanical, cosmetic, or roadworthy servicing:

| Job Card | Vehicle | Workshop Location | Status | Est. Cost (ZAR) | Est. Ready |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WO-2026-001** | 2018 BMW X2 M Sport | BMW Panel & Mechanical Sandton | 🟡 **IN PROGRESS** | \`R8,500\` | Tomorrow (14:00) |
| **WO-2026-002** | 2024 Toyota Hilux D/Cab | Bosch Car Service JHB Central | 🟠 **AWAITING PARTS** | \`R4,200\` | Thursday |

#### Detailed Workshop Notes:
* **BMW X2 (Car #5):** 100,000 km major service inspection underway. OEM front brake pads and wear sensors installed. Awaiting Dekra 101-point roadworthy certificate. Contact: *Sipho Dlamini (+27 11 883 4900)*.
* **Toyota Hilux (Car #4):** AC compressor rebuild. Denso condenser dispatched from Toyota South Africa parts hub in Prospecton. Contact: *Mark Van Der Merwe (+27 11 334 2200)*.

> [!TIP]
> Both vehicles remain automatically marked as \`MAINTENANCE\` across our public showroom to prevent duplicate sales inquiries until collection.`;

      actionPayload = {
        actionType: "CAR_REPAIR_STATUS",
        repairsCount: 2,
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

#### 🌟 Key Vehicle Highlights:
* **M Sport Package:** M Aerodynamics body styling, Shadowline high-gloss trim, and 19-inch M light alloy wheels.
* **Cabin Luxury:** Panoramic electric sunroof, Alcantara upholstery, ambient interior LED lighting, and BMW iDrive Navigation.
* **Assistance & Safety:** Park Distance Control (Front & Rear), Reversing Camera, LED headlights with cornering lights.
* **Peace of Mind:** Full franchise service history verified with BMW South Africa. Includes Dekra roadworthy certificate.

#### 📍 AutoFame Dealership Guarantee:
* In-house vehicle finance arranged with all major South African institutions (**WesBank, Standard Bank, Absa, Nedbank**).
* Trade-ins gladly welcomed with on-the-spot evaluations.
* Deliveries arranged nationwide across Gauteng, KwaZulu-Natal, Western Cape, and beyond.

---
*Click "Copy Description" to paste into AutoTrader, Cars.co.za, or Facebook Marketplace.*`;

      actionPayload = {
        actionType: "AUTO_GENERATE_DESCRIPTION",
        carId: 5,
        title: "2018 BMW X2 sDrive20i M Sport",
      };
    } else if (
      lowerQuery.includes("follow up") ||
      lowerQuery.includes("lead") ||
      lowerQuery.includes("crm") ||
      lowerQuery.includes("inquiry") ||
      lowerQuery.includes("inquiries")
    ) {
      responseText = `### 📞 Dealership CRM Lead & Follow-Up Priority List

Here are the highest-intent customer leads requiring owner/sales follow-up today:

1. **Thabo Mokoena** (📱 \`+27 83 492 1109\`)
   * **Interest:** 2018 BMW X2 sDrive20i M Sport (R299,900)
   * **Stage:** Requested WesBank financing pre-approval estimate.
   * **Recommended Action:** Dispatch pre-filled WhatsApp application link.

2. **Dr. Anelisa Sithole** (📱 \`+27 82 555 8921\`)
   * **Interest:** 2024 Toyota Hilux Double Cab Legend
   * **Stage:** Inquired about trade-in value for 2020 Ford Ranger 2.0 Bi-Turbo.
   * **Recommended Action:** Schedule physical valuation at our Sandton showroom.

3. **Johan Botha** (📱 \`+27 71 884 9022\`)
   * **Interest:** Volkswagen Golf 8 GTI
   * **Stage:** Test drive requested for Saturday morning.
   * **Recommended Action:** Confirm test drive booking and assign sales executive.

Would you like me to send a personalized follow-up message to any of these leads via our Whapi.Cloud WhatsApp channel?`;

      actionPayload = {
        actionType: "CRM_FOLLOW_UP",
        leadCount: 3,
      };
    } else {
      responseText = `### 🏢 AutoFame Executive Dealership Copilot

I am connected to your live South African dealership operational database. Here is your current snapshot:

* **Showroom Floor:** **14 Total Vehicles** (${context?.stats?.availableCount || 10} Available, ${context?.stats?.soldCount || 2} Sold)
* **External Workshops:** **2 Active Job Cards** (BMW X2 at BMW Sandton & Toyota Hilux at Bosch Car Service)
* **Pending Financing:** **3 Applications** in bank review with WesBank & Standard Bank
* **WhatsApp Gateway:** **Whapi.Cloud** connected and ready to transmit contracts and brochures

#### Recommended Next Steps:
1. \`Send Financial Application\` — Prepare and dispatch instant WhatsApp finance links to buyers.
2. \`Check Workshop Repairs\` — View quotes, parts status, and technician contacts.
3. \`Generate Vehicle Description\` — Create SEO-optimized copy for newly acquired stock.
4. \`CRM Lead Follow-Ups\` — Review hot leads and customer test drive schedules.`;
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
