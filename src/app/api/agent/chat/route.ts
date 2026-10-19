import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Build rich South African dealership context for AutoFame Copilot AI System Prompt
 */
function buildSystemPrompt(context: any, attachments: any[]) {
  const cars = context?.cars || [];
  const repairs = context?.repairs || [];
  const stats = context?.stats || {};

  const inventorySummary =
    cars.length > 0
      ? cars
          .map(
            (c: any) =>
              `- ${c.year || 2022} ${c.make} ${c.model}: R${(c.price || 0).toLocaleString()} ZAR, ${(c.mileage || 0).toLocaleString()} km, Status: ${c.status || "AVAILABLE"}`
          )
          .join("\n")
      : `- 2018 BMW X2 sDrive20i M Sport: R299,900 ZAR, 106,908 km, Alpine White (AVAILABLE)
- 2024 Toyota Hilux 2.8 GD-6 Legend 4x4: R649,900 ZAR, 14,200 km, Glacier White (AVAILABLE)
- 2021 Volkswagen Golf 8 GTI: R489,000 ZAR, 48,000 km, Moonstone Grey (AVAILABLE)
- 2020 Mercedes-Benz C200 AMG Line: R419,000 ZAR, 62,000 km, Obsidian Black (AVAILABLE)
- 2019 Ford Everest 3.2 TDCi XLT 4WD: R410,000 ZAR, 89,000 km, Moondust Silver (AVAILABLE)`;

  const repairSummary =
    repairs.length > 0
      ? repairs
          .map(
            (r: any) =>
              `- Job #${r.repairNumber}: ${r.carName} at ${r.workshopName} (${r.status}, Est Cost: R${(r.estimatedCost || 0).toLocaleString()} ZAR)`
          )
          .join("\n")
      : `- Job #WO-2026-001: 2018 BMW X2 M Sport at BMW Panel & Mechanical Sandton (Status: IN PROGRESS, Est: R8,500 ZAR)
- Job #WO-2026-002: 2024 Toyota Hilux D/Cab at Bosch Car Service (Status: AWAITING PARTS, Est: R4,200 ZAR)`;

  return `You are AutoFame Copilot, the autonomous AI Dealership Copilot for AutoFame, a premier pre-owned vehicle dealership in Baragwanath / Johannesburg South, South Africa.

DEALERSHIP KNOWLEDGE BASE & CONTEXT:
1. Location: 1 Rifle Range Rd, Baragwanath, Johannesburg South, South Africa.
2. Official Currency: South African Rand (ZAR, format as e.g. R299,900 ZAR).
3. Live Inventory Context:
${inventorySummary}

4. Workshop Repairs Pipeline:
${repairSummary}

5. Vehicle Finance & South African Banking Integration:
   - Lending Partners: WesBank Auto, Standard Bank Vehicle Finance, Absa MFC, Nedbank MFC.
   - Prime Lending Rate: 11.25% (typical vehicle finance rate prime + 1.15% to prime + 2.0%).
   - Terms: 60 to 72 months, typically 10% deposit or zero-deposit subject to credit rating.
   - Required FICA/NCA Documentation: Valid South African Green Barcoded ID or Smart Card, valid Code B/EB driver's license, latest 3 months official payslips, latest 3 months stamped bank statements, proof of residential address (utility bill / account not older than 3 months).
   - Vehicle Finance Application Link: https://www.autofame.co.za/financing

6. CRM & WhatsApp Gateway (Whapi):
   - Direct customer outreach via WhatsApp.
   - Fast dispatch of finance pre-approval forms, vehicle brochures, and test-drive appointment confirmations.

FORMATTING & INTERACTION RULES:
- Format all financial figures in ZAR (e.g. R299,900 ZAR).
- Use clean Markdown tables with bold column headers when presenting comparisons, finance quotes, or inventory.
- When generating vehicle sales descriptions, create high-converting copy with highlights, specifications, Dekra assurance, and financing options.
- If the user asks for a WhatsApp message or finance link, formulate the exact message text ready to dispatch.
- Keep the tone professional, authoritative, and focused on South African automotive excellence.`;
}

/**
 * Stream real tokens from Google Gemini API
 */
async function streamGemini(
  apiKey: string,
  messages: any[],
  systemPrompt: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const contents = messages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  // Try gemini-1.5-flash first, fallback to gemini-2.0-flash or gemini-pro
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error?.message || `Gemini HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body from Gemini API");

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
            if (!jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "token", text: textChunk })}\n\n`)
                );
              }
            } catch {
              // ignore partial line chunks
            }
          }
        }
      }

      return; // Successfully completed streaming
    } catch (err: any) {
      console.warn(`Gemini model ${model} failed, trying fallback:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to stream from Gemini API");
}

/**
 * Stream real tokens from OpenAI API
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

    // Retrieve API Keys (From request headers, env.local, or process.env)
    const geminiKey =
      req.headers.get("x-gemini-api-key") ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    const openaiKey =
      req.headers.get("x-openai-api-key") ||
      process.env.OPENAI_API_KEY ||
      "";

    const systemPrompt = buildSystemPrompt(context, attachments || []);
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerQuery = lastUserMessage.toLowerCase();

    // Determine metadata action payload if appropriate
    let actionPayload: any = null;
    if (lowerQuery.includes("finance") || lowerQuery.includes("wesbank") || lowerQuery.includes("pre-approval")) {
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

        // 2. Execute Real AI Engine if API Key is Present
        let aiSuccess = false;

        if (geminiKey) {
          try {
            await streamGemini(geminiKey, messages, systemPrompt, controller, encoder);
            aiSuccess = true;
          } catch (geminiErr: any) {
            console.error("Gemini stream error:", geminiErr.message);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "token",
                  text: `\n\n> ⚠️ **Gemini API Error:** ${geminiErr.message}\n\nFalling back to contextual dealership intelligence...\n\n`,
                })}\n\n`
              )
            );
          }
        } else if (openaiKey) {
          try {
            await streamOpenAI(openaiKey, messages, systemPrompt, controller, encoder);
            aiSuccess = true;
          } catch (openAiErr: any) {
            console.error("OpenAI stream error:", openAiErr.message);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "token",
                  text: `\n\n> ⚠️ **OpenAI API Error:** ${openAiErr.message}\n\nFalling back to contextual dealership intelligence...\n\n`,
                })}\n\n`
              )
            );
          }
        }

        // 3. Fallback Contextual Response if no external AI key is yet configured
        if (!aiSuccess) {
          let fallbackText = "";

          if (lowerQuery.includes("follow up") || lowerQuery.includes("crm") || lowerQuery.includes("lead")) {
            fallbackText = `### 📞 Dealership Priority Follow-Up Matrix

| Priority | Customer Name | Phone Number | Vehicle Interest | Current Stage | Recommended Action |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 🔴 **URGENT** | **Thabo Mokoena** | \`+27 83 492 1109\` | **2018 BMW X2 M Sport** *(R299,900)* | Pre-Approval Requested | Dispatch WesBank & MFC Form Link |
| 🟠 **HIGH** | **Dr. Anelisa Sithole** | \`+27 82 555 8921\` | **2024 Toyota Hilux Legend** *(R649,900)* | Trade-in Valuation Pending | Schedule Physical Appraisal |
| 🟡 **MEDIUM** | **Johan Botha** | \`+27 71 884 9022\` | **Volkswagen Golf 8 GTI** *(R489,000)* | Test Drive Booked | Confirm Appointment |
| 🟢 **NEW** | **Kagiso Ndlovu** | \`+27 79 312 8844\` | **Mercedes-Benz C200 AMG** *(R419,000)* | Online Inquiry | Send FICA Checklist & Monthly Quote |

> [!TIP]
> **To enable 100% unrestricted live AI answers**, click the **"Connect Gemini AI"** button in the top bar and paste your free Google Gemini API key!`;
          } else if (lowerQuery.includes("finance") || lowerQuery.includes("wesbank") || lowerQuery.includes("application")) {
            fallbackText = `### 📋 Multi-Lender South African Vehicle Finance Structure

Target Vehicle: **2018 BMW X2 sDrive20i M Sport** (\`R299,900 ZAR\`)

| Lending Institution | Est. Monthly | Interest Rate | Term | Deposit | Fast-Track Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **WesBank Auto** | **~R5,890 / mo** | Prime + 1.25% *(12.50%)* | 72 Mos | 10% (R29,990) | 🟢 Approved |
| **Standard Bank Auto** | **~R5,940 / mo** | Prime + 1.40% *(12.65%)* | 72 Mos | 10% (R29,990) | 🟢 Approved |
| **Absa MFC** | **~R5,860 / mo** | Prime + 1.15% *(12.40%)* | 72 Mos | 10% (R29,990) | 🟡 In Review |
| **Nedbank MFC** | **~R6,020 / mo** | Prime + 1.75% *(13.00%)* | 60 Mos | 10% (R29,990) | 🟢 Approved |

#### 📑 Mandatory FICA Checklist:
- SA Smart ID / Green ID Book
- Valid South African Driver's License
- Latest 3-Month Payslips
- Latest 3-Month Stamped Bank Statements
- Proof of Residential Address (< 3 months old)`;
          } else if (lowerQuery.includes("repair") || lowerQuery.includes("workshop")) {
            fallbackText = `### 🔧 Workshop & Vehicle Repair Operational Status

| Job Card | Vehicle | Workshop Location | Current Status | Est. Cost (ZAR) | Est. Completion | Technician |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **WO-2026-001** | **2018 BMW X2 M Sport** | BMW Panel & Mechanical Sandton | 🟡 **IN PROGRESS** | \`R8,500\` | Tomorrow (14:00) | Sipho Dlamini |
| **WO-2026-002** | **2024 Toyota Hilux D/Cab** | Bosch Car Service JHB Central | 🟠 **AWAITING PARTS** | \`R4,200\` | Thursday | Mark Van Der Merwe |`;
          } else if (lowerQuery.includes("description") || lowerQuery.includes("copy") || lowerQuery.includes("bmw")) {
            fallbackText = `### ✨ Auto-Generated Vehicle Description: 2018 BMW X2 M Sport

\`\`\`markdown
# 2018 BMW X2 sDrive20i M Sport (Sports-Auto) — Alpine White
R299,900 ZAR | 106,908 km | 2.0L TwinPower Turbo (141 kW / 280 Nm) | 7-Speed Steptronic Dual-Clutch

Turn heads wherever you go. This immaculate BMW X2 sDrive20i combines coupe athleticism with elevated crossover luxury.

HIGHLIGHTS & SPECIFICATIONS:
• Engine: 2.0-Litre BMW TwinPower Turbo (141 kW / 280 Nm)
• Transmission: 7-Speed Steptronic Dual-Clutch with Driving Modes
• Fuel Economy: 5.9 L / 100 km (Combined cycle)
• Equipment: Panoramic Sunroof, M Aerodynamics Package, 19" M Light Alloys, Alcantara Sport Seats
• Certification: Dekra 101-Point Roadworthy Certificate, Full Service History

FINANCING & PURCHASE OPTIONS:
In-house financing arranged with WesBank, Standard Bank, Absa, and Nedbank. Trade-ins welcomed. Nationwide delivery arranged across South Africa.
\`\`\``;
          } else {
            fallbackText = `### ⚡ AutoFame AI Copilot

I received your prompt: **"${lastUserMessage}"**

To enable **Google Gemini live AI** to answer any custom request in real time:

#### 🔑 Connect Google Gemini in 30 Seconds:
1. Click the **"Connect Gemini AI"** button in the top bar.
2. Get your free key at **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**.
3. Paste it in and click **Save**. *(Or set \`GEMINI_API_KEY=...\` in your \`.env.local\` file)*.

Once connected, I will generate unrestricted custom responses, vehicle valuations, financial simulations, and WhatsApp marketing campaigns dynamically!`;
          }

          // Stream fallback tokens smoothly
          const words = fallbackText.split(/(\s+)/);
          for (let i = 0; i < words.length; i++) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", text: words[i] })}\n\n`)
            );
            await new Promise((r) => setTimeout(r, 12));
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
