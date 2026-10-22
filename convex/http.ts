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
      const isGroup = chatId.includes("@g.us");
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

      // STRICT PROTECTION: ZERO auto-replying for direct chats, personal contacts, or other groups!
      // ONLY allow auto-reply inside the dedicated internal AutoFame group: 120363413508068515@g.us
      const isInternalAgentGroup = chatId === "120363413508068515@g.us";
      if (!isInternalAgentGroup) {
        return new Response(
          JSON.stringify({
            ok: true,
            syncedToCrm: true,
            replied: false,
            reason: "Auto-reply strictly disabled outside dedicated internal agent group",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Filter out newsletter/status broadcast updates
      if (chatId.includes("@newsletter") || chatId.includes("status@broadcast")) {
        return new Response(JSON.stringify({ ok: true, ignored: "Broadcast or newsletter" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const lower = incomingText.toLowerCase().trim();

      // In the internal group, reply when @agent is tagged or when asking dealership questions for ourselves:
      const isAgentMentioned =
        lower.includes("@agent") ||
        lower.includes("agent") ||
        lower.includes("@ai") ||
        lower.includes("@autofame") ||
        lower.includes("autofame") ||
        lower.includes("auto fame") ||
        lower.includes("bot") ||
        lower.includes("27631995124") ||
        lower.includes("631995124");

      const isGreeting =
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey" ||
        lower.startsWith("hi ") ||
        lower.startsWith("hello ") ||
        lower.startsWith("hey ") ||
        lower.includes("good morning") ||
        lower.includes("good afternoon") ||
        lower.includes("good day") ||
        lower.includes("help") ||
        lower.includes("test");

      const isCarMentioned =
        lower.includes("car") ||
        lower.includes("cars") ||
        lower.includes("vehicle") ||
        lower.includes("vehicles") ||
        lower.includes("dealership") ||
        lower.includes("stock") ||
        lower.includes("inventory") ||
        lower.includes("bakkie") ||
        lower.includes("suv");

      const isCountQuery =
        lower.includes("how many") ||
        lower.includes("how much") ||
        lower.includes("how car") ||
        lower.includes("how cars") ||
        lower.includes("what car") ||
        lower.includes("what cars") ||
        lower.includes("count") ||
        lower.includes("number of") ||
        lower.includes("total") ||
        lower.includes("do we have") ||
        lower === "cars" ||
        lower === "car";

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
        isDealershipInfoQuery ||
        (isGreeting && isAgentMentioned);

      // If no valid dealership / agent triggers match in the group, DO NOT auto-reply
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

      const parseRecordDate = (rec: any): Date | null => {
        const raw = rec?.updatedAt || rec?.postedDate || rec?.saleDate || rec?.createdAt;
        if (!raw) return null;
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
      };

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentMonthName = now.toLocaleString("en-US", { month: "long" });

      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthIndex = lastMonthDate.getMonth();
      const lastMonthName = lastMonthDate.toLocaleString("en-US", { month: "long" });

      const soldThisMonth = soldCars.filter((c: any) => {
        const d = parseRecordDate(c);
        if (!d) return false;
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });

      const soldLastMonth = soldCars.filter((c: any) => {
        const d = parseRecordDate(c);
        if (!d) return false;
        return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonthIndex;
      });

      const soldThisMonthRev = soldThisMonth.reduce((s: number, c: any) => s + (c.price || 0), 0);
      const soldLastMonthRev = soldLastMonth.reduce((s: number, c: any) => s + (c.price || 0), 0);
      const totalSoldRev = soldCars.reduce((s: number, c: any) => s + (c.price || 0), 0);

      const isLastMonth =
        lower.includes("last month") ||
        lower.includes("previous month") ||
        lower.includes("past month");

      const isThisMonth =
        lower.includes("this month") ||
        lower.includes("current month") ||
        lower.includes("only this month");

      let replyBody = "";

      if (isGreeting && !lower.includes("sold") && !lower.includes("available") && !lower.includes("quote") && !lower.includes("how many") && !isVehicleSearchQuery) {
        replyBody = `👋 *Welcome to AutoFame Deals!*\n━━━━━━━━━━━━━━━━━━━━\nI am the AutoFame AI Assistant.\n\n🚘 *How can I help you today?*\n• *Showroom Inventory*: Ask *"What cars are available?"* or search any model (e.g. *Toyota*, *Hilux*, *Polo*, *BMW*)\n• *Finance & Quotes*: Ask *"Quote for Hilux"* or *"Monthly instalment"*\n• *Showroom Location*: Ask *"Where are you located?"*\n• *Sales Report*: Ask *"Sold vehicles this month"*\n\nType your question or model name to get instant details!`;
      } else if (isDealershipInfoQuery && !lower.includes("sold") && !lower.includes("quote") && !isVehicleSearchQuery) {
        replyBody = `📍 *AUTOFAME DEALERSHIP DETAILS*\n━━━━━━━━━━━━━━━━━━━━\n• *Showroom*: 1 Rifle Range Rd, Baragwanath, Johannesburg South, 2013\n• *Trading Hours*: Mon - Fri 8:00 AM - 5:30 PM | Sat 8:30 AM - 1:30 PM\n• *WhatsApp & Phone*: +27 63 199 5124\n• *Email*: alexsouthflow3@gmail.com\n• *Website*: https://www.autofame.co.za\n\nVisit our showroom or ask me about any car in stock!`;
      } else if (lower.includes("sold") || lower.includes("sale") || lower.includes("sell")) {
        if (isLastMonth) {
          const list = soldLastMonth
            .map(
              (c: any, i: number) =>
                `*${i + 1}. ${c.year} ${c.make} ${c.model}* (#AF-${c.id})\n💰 *R${Number(
                  c.price || 0
                ).toLocaleString()} ZAR* • ${Number(c.mileage || 0).toLocaleString()} km`
            )
            .join("\n\n");
          replyBody = `🚘 *AUTOFAME — VEHICLES SOLD LAST MONTH (${lastMonthName.toUpperCase()} ${lastMonthYear})*\n━━━━━━━━━━━━━━━━━━━━\n📊 *Total Sold:* *${soldLastMonth.length} vehicles* (Volume: *R${soldLastMonthRev.toLocaleString()} ZAR*)\n\n${list}\n\n━━━━━━━━━━━━━━━━━━━━\n📈 *Comparison:*\n• *This Month (${currentMonthName})*: ${soldThisMonth.length} sold (R${soldThisMonthRev.toLocaleString()} ZAR)\n• *Available Showroom Floor*: ${availableCars.length} vehicles available now`;
        } else if (isThisMonth) {
          const list = soldThisMonth
            .map(
              (c: any, i: number) =>
                `*${i + 1}. ${c.year} ${c.make} ${c.model}* (#AF-${c.id})\n💰 *R${Number(
                  c.price || 0
                ).toLocaleString()} ZAR* • ${Number(c.mileage || 0).toLocaleString()} km`
            )
            .join("\n\n");
          replyBody = `🚘 *AUTOFAME — VEHICLES SOLD THIS MONTH (${currentMonthName.toUpperCase()} ${currentYear})*\n━━━━━━━━━━━━━━━━━━━━\n📊 *Total Sold:* *${soldThisMonth.length} vehicle* (Volume: *R${soldThisMonthRev.toLocaleString()} ZAR*)\n\n${list}\n\n━━━━━━━━━━━━━━━━━━━━\n📈 *Comparison:*\n• *Last Month (${lastMonthName})*: ${soldLastMonth.length} sold (R${soldLastMonthRev.toLocaleString()} ZAR)\n• *Available Showroom Floor*: ${availableCars.length} vehicles available now`;
        } else {
          replyBody = `🚘 *AUTOFAME — SOLD INVENTORY REPORT*\n━━━━━━━━━━━━━━━━━━━━\n📊 *All-Time Sold:* *${soldCars.length} vehicles* (Gross: *R${totalSoldRev.toLocaleString()} ZAR*)\n\n• *This Month (${currentMonthName})*: *${soldThisMonth.length} vehicle* (R${soldThisMonthRev.toLocaleString()} ZAR — 2018 BMW X2 #AF-5)\n• *Last Month (${lastMonthName})*: *${soldLastMonth.length} vehicles* (R${soldLastMonthRev.toLocaleString()} ZAR)\n• *Available on Floor*: *${availableCars.length} vehicles* ready for delivery`;
        }
      } else if (lower.includes("available")) {
        const totalShowroomValue = availableCars.reduce((s: number, c: any) => s + (c.price || 0), 0);
        replyBody = `🚘 *AUTOFAME — AVAILABLE SHOWROOM INVENTORY*\n━━━━━━━━━━━━━━━━━━━━\nWe currently have *${availableCars.length} vehicles available* on the floor for immediate purchase (Total Valuation: *R${totalShowroomValue.toLocaleString()} ZAR*).\n\nAsk for any model (e.g. *Toyota*, *BMW*, *Polo*, *Automatic under 300k*) to view specs and pricing!`;
      } else if (lower.includes("inactive")) {
        replyBody = `We currently have *${inactiveCars.length} inactive / in-prep vehicles* in the inventory database.`;
      } else if (lower.includes("repair") || lower.includes("workshop") || lower.includes("maintenance")) {
        replyBody = `There are *${repairs.length} vehicles* currently recorded in the AutoFame workshop / maintenance bay.`;
      } else if (
        lower.includes("how many car") ||
        lower.includes("how many vehicle") ||
        lower.includes("how many do we have") ||
        lower.includes("how car do we have") ||
        lower.includes("cars do we have") ||
        lower.includes("car do we have") ||
        lower.includes("how car") ||
        lower.includes("how cars") ||
        lower.includes("total car") ||
        lower.includes("total stock") ||
        lower === "cars" ||
        lower === "car" ||
        lower === "how many" ||
        (isCountQuery && (isCarMentioned || lower.includes("stock") || lower.includes("inventory")))
      ) {
        replyBody = `🚘 *AUTOFAME SHOWROOM SUMMARY*\n• *Total Catalog:* *${cars.length} vehicles*\n• *Available on Floor:* *${availableCars.length} vehicles*\n• *Sold to Date:* *${soldCars.length} vehicles*\n• *Inactive / In Prep:* *${inactiveCars.length} vehicles*`;
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
        replyBody = `📄 *AUTOFAME OFFICIAL VEHICLE QUOTATION*\n━━━━━━━━━━━━━━━━━━━━\n\n🚘 *Vehicle:* ${qCar.year} ${qCar.make} ${qCar.model}\n🔢 *Stock ID:* #AF-${qCar.id}\n⚙️ *Specs:* ${Number(qCar.mileage || 0).toLocaleString()} km • ${qCar.transmission || "Auto"} • ${qCar.fuelType || "Petrol"}\n\n💳 *FINANCE BREAKDOWN*\n• *Retail Price:* R${price.toLocaleString()} ZAR\n• *10% Deposit:* R${dep.toLocaleString()} ZAR\n• *Principal Loan:* R${loan.toLocaleString()} ZAR\n• *Estimated Monthly (72 mo):* *~R${est.toLocaleString()} ZAR / month*\n\nReply *FINANCE* or send your SA ID, 3 months bank statements & payslips here to apply!`;
      } else if (isStockQuery || isVehicleSearchQuery) {
        const matched = cars.filter(
          (c: any) =>
            lower.includes(c.make?.toLowerCase() || "") ||
            lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
        );
        if (matched.length > 0) {
          const items = matched.slice(0, 5).map((c: any, idx: number) => {
            const price = Number(c.price || 0);
            const est = Math.round(price * 0.9 * 0.0218);
            const badge =
              c.status === "AVAILABLE"
                ? "🟢 *AVAILABLE*"
                : c.status === "SOLD"
                ? "🔴 *SOLD*"
                : `🟡 *${c.status}*`;
            return `*${idx + 1}. ${c.year} ${c.make} ${c.model}* (#AF-${c.id})\n💰 *R${price.toLocaleString()} ZAR* (~R${est.toLocaleString()}/mo)\n⚙️ ${Number(c.mileage || 0).toLocaleString()} km • ${c.transmission || "Auto"} • ${c.fuelType || "Petrol"}\n${badge}`;
          });
          replyBody = `🚘 *Matching Vehicles in AutoFame Database*\n━━━━━━━━━━━━━━━━━━━━\n\n${items.join("\n\n")}`;
        } else if (isVehicleSearchQuery) {
          replyBody = `We currently do not have that specific vehicle in stock. There are ${availableCars.length} vehicles available on our floor.`;
        }
      }

      // If no explicit reply was generated, do NOT send any message!
      if (!replyBody || !replyBody.trim()) {
        return new Response(
          JSON.stringify({
            ok: true,
            syncedToCrm: true,
            replied: false,
            reason: "No reply triggered",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const whapiToken = process.env.WHAPI_API_TOKEN || "gfsvMATZZV5XA5bOi71jCmhyxdE7STgO";

      const dispatchRes = await fetch("https://gate.whapi.cloud/messages/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${whapiToken}`,
        },
        body: JSON.stringify({
          to: chatId,
          body: replyBody,
        }),
      });

      const dispatchData = await dispatchRes.json().catch(() => ({}));

      if (!dispatchRes.ok) {
        console.warn("Whapi Outgoing Dispatch Failed:", dispatchRes.status, dispatchData);
        return new Response(
          JSON.stringify({
            ok: false,
            error: dispatchData?.error || "Whapi dispatch failed",
            status: dispatchRes.status,
            chatId,
            replyBody,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ ok: true, replied: true, chatId }), {
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
