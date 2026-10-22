import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * REST / Webhook Intake Endpoint
 * Allows mobile PWA, external scripts, or WhatsApp bot services to push vehicle intake
 * directly into Convex without an intermediate Node/Express server.
 */
http.route({
  path: "/webhook/intake",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { vin, dealershipId, photoUrls, videoUrl, sender, price, mileage, make, model, year } = body;

      if (!vin || !photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: 'vin' and at least one 'photoUrls'." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Default to dealership 1 if not specified
      const targetDealership = dealershipId ? Number(dealershipId) : 1;

      // Trigger the intake pipeline via Convex mutation
      const intakeResult = await ctx.runMutation((api as any).omnichannel.startVehicleIntake, {
        vin: String(vin).trim(),
        dealershipId: targetDealership,
        photoUrls,
        videoUrl: videoUrl || undefined,
        price: price ? Number(price) : undefined,
        mileage: mileage ? Number(mileage) : undefined,
        make: make || undefined,
        model: model || undefined,
        year: year ? Number(year) : undefined,
      });

      // Record webhook receipt in database
      await ctx.runMutation((api as any).import_.bulkInsert, {
        table: "intakeWebhooks",
        documents: [
          {
            source: "REST_WEBHOOK",
            sender: sender || "mobile-client",
            vin: String(vin).trim(),
            photoCount: photoUrls.length,
            status: "PROCESSED",
            carId: intakeResult.carId,
            receivedAt: new Date().toISOString(),
          },
        ],
      });

      return new Response(
        JSON.stringify({
          success: true,
          carId: intakeResult.carId,
          vin: intakeResult.vin,
          message: "Vehicle queued for AI enrichment & omnichannel distribution.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      console.error("[Convex HTTP Intake Webhook Error]:", err);
      return new Response(
        JSON.stringify({ error: err.message || "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Twilio / WhatsApp Business Webhook Endpoint
 * Ingests WhatsApp messages containing VIN and vehicle photos.
 */
http.route({
  path: "/webhook/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const formData = await request.formData();
      const from = formData.get("From") as string || "unknown";
      const bodyText = (formData.get("Body") as string || "").trim();
      const numMedia = parseInt(formData.get("NumMedia") as string || "0", 10);

      const mediaUrls: string[] = [];
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = formData.get(`MediaUrl${i}`) as string;
        if (mediaUrl) mediaUrls.push(mediaUrl);
      }

      // Extract VIN (17 alphanumeric chars) from message body
      const vinMatch = bodyText.match(/[A-HJ-NPR-Z0-9]{17}/i);
      const vin = vinMatch ? vinMatch[0].toUpperCase() : `WA-${Date.now().toString().slice(-8)}`;

      if (mediaUrls.length === 0) {
        return new Response(
          `<Response><Message>Thanks! Please send photos of the vehicle along with the VIN to auto-publish.</Message></Response>`,
          { headers: { "Content-Type": "text/xml" } }
        );
      }

      // Trigger Convex intake pipeline
      const result = await ctx.runMutation((api as any).omnichannel.startVehicleIntake, {
        vin,
        dealershipId: 1,
        photoUrls: mediaUrls,
      });

      return new Response(
        `<Response><Message>Vehicle #${result.carId} (VIN: ${vin}) received! Our AI engine is generating vehicle specs and syndicating to Facebook & Website now.</Message></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    } catch (err: any) {
      console.error("[WhatsApp Webhook Error]:", err);
      return new Response(
        `<Response><Message>Error processing intake. Please check the VIN format.</Message></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }
  }),
});

/**
 * Whapi.Cloud Real-Time Push Webhook Endpoint (/webhook/whapi)
 * Zero-polling webhook: Whapi pushes incoming WhatsApp messages here immediately.
 * STRICT POLICY: ZERO auto-replies to users. Passive CRM sync only.
 */
http.route({
  path: "/webhook/whapi",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      const messages = Array.isArray(payload?.messages) ? payload.messages : [];
      if (messages.length === 0) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const newestMsg = messages[0];
      if (!newestMsg || newestMsg.source === "api" || newestMsg.type === "action") {
        return new Response(JSON.stringify({ ok: true, ignored: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const chatId = newestMsg.chat_id || newestMsg.from || "";
      const incomingText = (
        newestMsg.text?.body ||
        newestMsg.document?.caption ||
        newestMsg.image?.caption ||
        (newestMsg.document ? `[Document: ${newestMsg.document.filename || "File"}]` : "") ||
        ""
      ).trim();

      // Automatically sync every WhatsApp contact & latest message into Convex CRM
      if (chatId && !chatId.includes("@newsletter") && !chatId.includes("status@broadcast")) {
        const cleanDigits = String(chatId).replace(/@.*$/, "");
        const displayPhone = cleanDigits.startsWith("27")
          ? `+27 ${cleanDigits.slice(2, 4)} ${cleanDigits.slice(4, 7)} ${cleanDigits.slice(7)}`
          : cleanDigits.length > 12 && chatId.endsWith("@g.us")
          ? `Group (${cleanDigits.slice(-6)})`
          : `+${cleanDigits}`;
        const senderName =
          newestMsg.from_name && !newestMsg.from_me
            ? newestMsg.from_name
            : chatId.endsWith("@g.us")
            ? "AutoFame Dealership Group"
            : `Contact ${displayPhone}`;
        try {
          await ctx.runMutation((api as any).crm.upsertCrmContact, {
            contactKey: cleanDigits,
            chatId: String(chatId),
            name: senderName,
            phone: displayPhone,
            lastMessage: incomingText || "WhatsApp Message",
            lastContactedLabel: "Just Now • Live",
            lastContactedAt: new Date().toISOString(),
            isRecentChat: true,
          });
        } catch {}
      }

      // STRICT PROTECTION: ZERO AUTO-REPLIES TO ANY USERS OR GROUPS!
      // This webhook only ingests contacts into CRM and NEVER sends outgoing messages.
      return new Response(
        JSON.stringify({
          ok: true,
          syncedToCrm: true,
          replied: false,
          message: "Auto-reply strictly disabled. Zero automatic messages dispatched.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
