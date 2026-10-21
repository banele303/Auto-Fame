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
      if (chatId && !chatId.includes("@newsletter")) {
        const cleanDigits = String(chatId).replace(/@.*$/, "");
        const displayPhone = cleanDigits.startsWith("27")
          ? `+27 ${cleanDigits.slice(2, 4)} ${cleanDigits.slice(4, 7)} ${cleanDigits.slice(7)}`
          : `+${cleanDigits}`;
        const senderName =
          newestMsg.from_name && !newestMsg.from_me
            ? newestMsg.from_name
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

      // Only auto-reply in the dedicated AutoFame AI Agent group (120363413508068515@g.us)
      if (chatId !== "120363413508068515@g.us") {
        return new Response(JSON.stringify({ ok: true, syncedToCrm: true, chatId }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // DO NOT reply to messages sent by the agent itself
      if (newestMsg.from_me) {
        return new Response(JSON.stringify({ ok: true, ignored: "Outgoing message from agent" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const lower = incomingText.toLowerCase().trim();

      // STRICT KEYWORD FILTER: Only reply if the message explicitly contains dealership trigger keywords
      const isAgentMentioned =
        lower.includes("@agent") ||
        lower.includes("@ai") ||
        lower.includes("@autofame") ||
        lower.includes("autofame") ||
        lower.includes("bot");

      const isCountQuery =
        lower.includes("how many") ||
        lower.includes("count") ||
        lower.includes("number of cars") ||
        lower.includes("how much cars") ||
        lower === "cars";

      const isStockQuery =
        lower.includes("inventory") ||
        lower.includes("stock") ||
        lower.includes("available cars") ||
        lower.includes("show cars") ||
        lower.includes("list cars") ||
        lower.includes("cars for sale") ||
        lower.includes("all cars");

      const isStatusQuery =
        lower.includes("sold") ||
        lower.includes("sale") ||
        lower.includes("available") ||
        lower.includes("inactive") ||
        lower.includes("repair") ||
        lower.includes("workshop") ||
        lower.includes("maintenance");

      const isFinanceQuoteQuery =
        lower.includes("quote") ||
        lower.includes("quotation") ||
        lower.includes("finance") ||
        lower.includes("deposit") ||
        lower.includes("installment") ||
        lower.includes("instalment") ||
        lower.includes("loan") ||
        lower.includes("fica");

      const isVehicleSearchQuery =
        lower.includes("toyota") ||
        lower.includes("hilux") ||
        lower.includes("volkswagen") ||
        lower.includes("vw") ||
        lower.includes("polo") ||
        lower.includes("ford") ||
        lower.includes("ranger") ||
        lower.includes("bmw") ||
        lower.includes("mercedes") ||
        lower.includes("hyundai") ||
        lower.includes("isuzu") ||
        lower.includes("bakkie") ||
        lower.includes("suv") ||
        lower.includes("hatchback") ||
        lower.includes("sedan") ||
        lower.includes("diesel") ||
        lower.includes("petrol") ||
        lower.includes("automatic") ||
        lower.includes("manual") ||
        lower.includes("price") ||
        lower.includes("budget") ||
        lower.includes("cheapest") ||
        lower.includes("under r");

      const isDealershipInfoQuery =
        lower.includes("address") ||
        lower.includes("location") ||
        lower.includes("where are you") ||
        lower.includes("contact");

      const shouldReply =
        isAgentMentioned ||
        isCountQuery ||
        isStockQuery ||
        isStatusQuery ||
        isFinanceQuoteQuery ||
        isVehicleSearchQuery ||
        isDealershipInfoQuery;

      // If no valid dealership keywords match, DO NOT auto-reply! (Preserves conversation hygiene)
      if (!shouldReply) {
        return new Response(
          JSON.stringify({
            ok: true,
            syncedToCrm: true,
            replied: false,
            reason: "Message does not match dealership query keywords",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const context = await ctx.runQuery(api.agent.getDealershipContext, {});
      const cars = Array.isArray(context?.cars) ? context.cars : [];
      const availableCars = cars.filter((c: any) => c.status === "AVAILABLE");
      const soldCars = cars.filter((c: any) => c.status === "SOLD");
      const inactiveCars = cars.filter((c: any) => c.status === "INACTIVE");
      const repairs = Array.isArray(context?.repairs) ? context.repairs : [];

      let replyBody = "";
      if (
        (lower.includes("how many") || lower.includes("count") || lower.includes("number of")) &&
        (lower.includes("sold") || lower.includes("sale"))
      ) {
        replyBody = `${soldCars.length}`;
      } else if (
        (lower.includes("how many") || lower.includes("count") || lower.includes("number of")) &&
        lower.includes("available")
      ) {
        replyBody = `${availableCars.length}`;
      } else if (
        (lower.includes("how many") || lower.includes("count") || lower.includes("number of")) &&
        lower.includes("inactive")
      ) {
        replyBody = `${inactiveCars.length}`;
      } else if (
        (lower.includes("how many") || lower.includes("count") || lower.includes("number of")) &&
        (lower.includes("repair") || lower.includes("workshop") || lower.includes("maintenance"))
      ) {
        replyBody = `${repairs.length}`;
      } else if (
        lower.includes("how many car") ||
        lower.includes("how many vehicle") ||
        lower.includes("how many do we have") ||
        lower === "cars" ||
        lower === "how many"
      ) {
        replyBody = `${cars.length}`;
      } else if (lower.includes("quote") || lower.includes("quotation")) {
        const qCar =
          cars.find(
            (c: any) =>
              lower.includes(c.make?.toLowerCase() || "") ||
              lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
          ) ||
          availableCars[0] ||
          cars[0];
        const price = Number(qCar?.price || 0);
        const dep = Math.round(price * 0.1);
        const loan = price - dep;
        const est = Math.round(price * 0.9 * 0.0218);
        replyBody = `📄 *AUTOFAME OFFICIAL VEHICLE QUOTATION*\n━━━━━━━━━━━━━━━━━━━━\n\n🚘 *Vehicle:* ${qCar.year} ${qCar.make} ${qCar.model}\n🔢 *Stock ID:* #AF-${qCar.id}\n⚙️ *Specs:* ${Number(qCar.mileage || 0).toLocaleString()} km • ${qCar.transmission || "Auto"} • ${qCar.fuelType || "Petrol"}\n\n💳 *FINANCE BREAKDOWN*\n• *Retail Price:* R${price.toLocaleString()} ZAR\n• *10% Deposit:* R${dep.toLocaleString()} ZAR\n• *Principal Loan:* R${loan.toLocaleString()} ZAR\n• *Monthly (72 mo):* *~R${est.toLocaleString()} ZAR / month*`;
      } else {
        const matched = cars.filter(
          (c: any) =>
            lower.includes(c.make?.toLowerCase() || "") ||
            lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
        );
        const targetList = matched.length > 0 ? matched : cars;
        const items = targetList.slice(0, 12).map((c: any, idx: number) => {
          const price = Number(c.price || 0);
          const est = Math.round(price * 0.9 * 0.0218);
          const badge =
            c.status === "AVAILABLE"
              ? "🟢 *AVAILABLE*"
              : c.status === "SOLD"
              ? "🔴 *SOLD*"
              : `🟡 *${c.status}*`;
          return `*${idx + 1}. ${c.year} ${c.make} ${c.model}*\n💰 *R${price.toLocaleString()} ZAR* (~R${est.toLocaleString()}/mo)\n⚙️ ${Number(c.mileage || 0).toLocaleString()} km • ${c.transmission || "Auto"} • ${c.fuelType || "Petrol"}\n${badge}`;
        });
        replyBody = `🚘 *AUTOFAME SHOWROOM INVENTORY*\n📊 *Showing ${items.length} of ${targetList.length} Vehicles* (${availableCars.length} Available)\n━━━━━━━━━━━━━━━━━━━━\n\n${items.join("\n\n")}`;
      }

      await fetch("https://gate.whapi.cloud/messages/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer ohxDDFSuvqRvl4DKZLu7eEYUfbAEkCil",
        },
        body: JSON.stringify({
          to: "120363413508068515@g.us",
          body: replyBody,
        }),
      });

      return new Response(JSON.stringify({ ok: true, replied: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
