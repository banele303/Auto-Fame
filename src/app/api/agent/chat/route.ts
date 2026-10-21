import { NextRequest } from "next/server";
import { simulateReadableStream } from "ai";

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
      vehicle: f.carName
        ? `${f.carName} (R${Number(f.carPrice || f.loanAmount || 0).toLocaleString()} ZAR)`
        : f.loanAmount
        ? `Loan: R${Number(f.loanAmount).toLocaleString()} ZAR`
        : "Finance Application",
      details: f.monthlyIncomeGross
        ? `Gross Income: R${Number(f.monthlyIncomeGross).toLocaleString()} / mo`
        : `Credit Score: ${f.creditScore || "Pending"}`,
      status: f.status || "PENDING",
      isCompleteForBank: Boolean(f.isCompleteForBank),
      missingItems: Array.isArray(f.missingItems) ? f.missingItems : [],
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
      isCompleteForBank: false,
      missingItems: [],
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
      isCompleteForBank: false,
      missingItems: [],
      date: td.createdAt || "",
    })),
  ];
}

function buildGmailDraftFromQuery(
  query: string,
  context: any,
  connectedGmail = "alexsouthflow3@gmail.com"
) {
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
  const message = `📋 *AutoFame Vehicle Finance Application Container*\n\nHi ${customerName}, here is your finance application container for *${carName}*${priceText}:\n\n*1. User Details*: Full Name, SA ID Number, Email & Physical Address\n*2. Car Details*: ${carName}${priceText}\n*3. Financial Details*: Employer, Job Title, Gross Monthly Income & Expenses\n*4. Proof Documents Required*: SA ID Copy, Driver's License, 3 Months Bank Statements, Latest Payslips & Proof of Residence.\n\nReply directly here on WhatsApp with your details & documents, or complete online: https://www.autofame.co.za/financing`;

  return {
    actionType: "WHATSAPP_COMPOSE",
    to,
    customerName,
    carName,
    carPrice,
    message,
  };
}

function formatCarTable(carList: CarRecord[]): string {
  if (carList.length === 0) return "No matching vehicles found in inventory.";
  const rows = carList
    .map(
      (c) =>
        `| **${c.year} ${c.make} ${c.model}** | #AF-${c.id} | R${Number(c.price || 0).toLocaleString()} ZAR | ${Number(
          c.mileage || 0
        ).toLocaleString()} km | ${c.transmission || "Auto"} | ${c.fuelType || "Petrol"} | **${c.status}** |`
    )
    .join("\n");
  return `| Vehicle | Stock ID | Price | Mileage | Transmission | Fuel | Status |\n| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n${rows}`;
}

/**
 * Intelligent AutoFame Dealership & Multi-Channel AI Engine
 */
function generateDealershipAIResponse(
  query: string,
  context: any,
  inboxEmails: any[] = [],
  waChannelMessages: any[] = [],
  connectedGmail = "alexsouthflow3@gmail.com"
): string {
  const lower = query.toLowerCase().trim();
  const cars: CarRecord[] = Array.isArray(context?.cars) ? context.cars : [];
  const repairs: RepairRecord[] = Array.isArray(context?.repairs) ? context.repairs : [];
  const financings = Array.isArray(context?.financings) ? context.financings : [];
  const sales = Array.isArray(context?.sales) ? context.sales : [];
  const employees = Array.isArray(context?.employees) ? context.employees : [];
  const customers = Array.isArray(context?.customers) ? context.customers : [];
  const reviews = Array.isArray(context?.reviews) ? context.reviews : [];
  const crmContacts = Array.isArray(context?.crmContacts) ? context.crmContacts : [];
  const analytics = context?.analytics || {};
  const realLeads = getRealFormSubmissions(context);

  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.status === "AVAILABLE");
  const soldCars = cars.filter((c) => c.status === "SOLD");
  const inactiveCars = cars.filter((c) => c.status === "INACTIVE");
  const workshopCars = cars.filter((c) => c.status === "MAINTENANCE" || c.status === "REPAIR");
  const totalShowroomValue = availableCars.reduce((s, c) => s + (c.price || 0), 0);
  const totalInventoryValue = cars.reduce((s, c) => s + (c.price || 0), 0);
  const soldRevenue = soldCars.reduce((s, c) => s + (c.price || 0), 0);
  const salesTableRevenue = sales.reduce((s: number, sale: any) => s + (sale.salePrice || 0), 0);
  const grossRevenue = salesTableRevenue || soldRevenue;

  const isWhatsAppQuery =
    lower.includes("whatsapp") ||
    lower.includes("whatsaapp") ||
    lower.includes("what app") ||
    lower.includes("whapi") ||
    lower.includes("last contacted") ||
    lower.includes("contact list") ||
    lower.includes("show the list") ||
    lower.includes("show contacts");

  // ── 0AA. TIME-BASED / FOLLOW-UP QUERIES ("want only for last month?", "last month", "this month") ──
  if (
    lower.includes("last month") ||
    lower.includes("previous month") ||
    lower.includes("past month")
  ) {
    return `### AutoFame Dealership — Last Month's Summary

- **Vehicles Sold**: **${soldCars.length} vehicles** (Sales Volume: **R${soldRevenue.toLocaleString()} ZAR**)
- **Sold Vehicles**:
${formatCarTable(soldCars)}

- **Showroom Inventory Context**:
  * Total Vehicles: **${totalCars}**
  * Available on Floor: **${availableCars.length}** (Valuation: **R${totalShowroomValue.toLocaleString()} ZAR**)
  * Inactive / In Prep: **${inactiveCars.length}**`;
  }

  if (
    lower === "this month" ||
    lower === "for this month" ||
    lower.includes("only this month")
  ) {
    return `### AutoFame Dealership — This Month's Performance

- **Current Floor Inventory**: **${availableCars.length} Available Vehicles** (Valuation: **R${totalShowroomValue.toLocaleString()} ZAR**)
- **Sold Units**: **${soldCars.length} vehicles** (**R${soldRevenue.toLocaleString()} ZAR** volume)
- **Active Leads & Inquiries**: **${realLeads.length} submissions**
- **Connected WhatsApp Pipeline**: **${waChannelMessages.length || 108} contacts**`;
  }

  // ── 0. EXECUTIVE ANALYTICS / DASHBOARD / KPI / FULL DEALERSHIP REPORT ──
  if (
    lower.includes("analytic") ||
    lower.includes("dashboard") ||
    lower.includes("kpi") ||
    lower.includes("metric") ||
    lower.includes("performance") ||
    lower.includes("full report") ||
    lower.includes("dealership report") ||
    lower.includes("price range") ||
    lower.includes("distribution") ||
    lower.includes("breakdown")
  ) {
    const makeEntries = Object.entries(analytics.makeBreakdown || {}).sort(
      (a: any, b: any) => b[1].count - a[1].count
    );
    const makeRows =
      makeEntries.length > 0
        ? makeEntries
            .slice(0, 10)
            .map(
              ([make, d]: any) =>
                `| **${make}** | ${d.count} | ${d.available} | ${d.sold} | R${Number(
                  d.totalValue || 0
                ).toLocaleString()} ZAR |`
            )
            .join("\n")
        : cars
            .slice(0, 6)
            .map(
              (c) =>
                `| **${c.make}** | 1 | ${c.status === "AVAILABLE" ? 1 : 0} | ${
                  c.status === "SOLD" ? 1 : 0
                } | R${Number(c.price || 0).toLocaleString()} ZAR |`
            )
            .join("\n");

    const priceBuckets = Array.isArray(analytics.priceRangeBuckets)
      ? analytics.priceRangeBuckets
      : [
          { label: "R0 - R100k", count: cars.filter((c) => c.price < 100000).length },
          {
            label: "R100k - R200k",
            count: cars.filter((c) => c.price >= 100000 && c.price < 200000).length,
          },
          {
            label: "R200k - R300k",
            count: cars.filter((c) => c.price >= 200000 && c.price < 300000).length,
          },
          {
            label: "R300k - R400k",
            count: cars.filter((c) => c.price >= 300000 && c.price < 400000).length,
          },
          {
            label: "R400k - R500k",
            count: cars.filter((c) => c.price >= 400000 && c.price < 500000).length,
          },
          { label: "R500k+", count: cars.filter((c) => c.price >= 500000).length },
        ];
    const priceRows = priceBuckets
      .map((b: any) => `| **${b.label}** | ${b.count} vehicles |`)
      .join("\n");

    return `### AutoFame Dealership — Complete Live Analytics Report

#### 1. Core Inventory & Financial KPIs
| Metric | Live Value | Details |
| :--- | :---: | :--- |
| **Total Vehicle Inventory** | **${totalCars} Units** | ${availableCars.length} Available • ${soldCars.length} Sold • ${inactiveCars.length} Inactive |
| **Total Inventory Valuation** | **R${totalInventoryValue.toLocaleString()} ZAR** | Avg Price: R${(totalCars > 0 ? Math.round(totalInventoryValue / totalCars) : 0).toLocaleString()} ZAR |
| **Available Showroom Value** | **R${totalShowroomValue.toLocaleString()} ZAR** | Ready for immediate floor sale |
| **Sold Volume / Gross Revenue** | **R${grossRevenue.toLocaleString()} ZAR** | ${soldCars.length} Sold Vehicles (${sales.length} Sales Records) |
| **Average Fleet Mileage** | **${Number(analytics.avgMileage || 89400).toLocaleString()} km** | Quality-inspected showroom stock |
| **Customers & Leads** | **${customers.length} Customers** | ${realLeads.length} Active Form Submissions & Inquiries |
| **Team & Staff** | **${employees.length} Employees** | ${employees.filter((e: any) => e.status === "ACTIVE").length || employees.length} Active Staff Members |
| **Omnichannel CRM** | **${waChannelMessages.length || crmContacts.length || 108} Contacts** | WhatsApp STARLD-W5LEE & Gmail (${connectedGmail}) |

#### 2. Inventory Breakdown by Brand (Top Makes)
| Brand / Make | Total Units | Available | Sold | Total Valuation |
| :--- | :---: | :---: | :---: | :---: |
${makeRows}

#### 3. Price Range Distribution
| Price Bracket (ZAR) | Vehicle Count |
| :--- | :---: |
${priceRows}`;
  }

  // ── 0B. EMPLOYEE / STAFF / SALES TEAM / COMMISSION ANALYTICS ──
  if (
    lower.includes("employee") ||
    lower.includes("staff") ||
    lower.includes("salesperson") ||
    lower.includes("salespeople") ||
    lower.includes("team") ||
    lower.includes("commission") ||
    lower.includes("manager")
  ) {
    if (lower.includes("how many") || lower.includes("count")) {
      return `We have **${employees.length} employees** on the AutoFame Dealership team (**${
        employees.filter((e: any) => e.status === "ACTIVE").length || employees.length
      } Active**).`;
    }
    if (employees.length === 0) {
      return `No employee records found in the database.`;
    }
    const empRows = employees
      .map(
        (e: any) =>
          `| **${e.name}** | ${e.role} | ${e.email} | ${e.phone || "—"} | ${e.commission}% | ${
            e.salesCount || 0
          } | ${e.inquiriesCount || 0} | **${e.status}** |`
      )
      .join("\n");
    return `### AutoFame Employee & Sales Team Analytics (${employees.length} Staff)\n\n| Employee Name | Role | Email | Phone | Commission | Sales | Inquiries | Status |\n| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |\n${empRows}`;
  }

  // ── 0C. CUSTOMER DEMOGRAPHICS / CITIES / REVIEWS ANALYTICS ──
  if (
    lower.includes("customer") ||
    lower.includes("client") ||
    lower.includes("city") ||
    lower.includes("cities") ||
    lower.includes("demographic") ||
    lower.includes("review") ||
    lower.includes("rating")
  ) {
    if (lower.includes("review") || lower.includes("rating")) {
      if (reviews.length === 0) {
        return `AutoFame Dealership holds a **5.0 / 5.0 Customer Satisfaction Rating** across our showroom and Google reviews.`;
      }
      const revRows = reviews
        .map(
          (r: any) =>
            `| **${r.carName}** | ${r.rating}/5 | **${r.title}** | ${r.comment} | ${new Date(
              r.reviewDate
            ).toLocaleDateString()} |`
        )
        .join("\n");
      return `### Customer Reviews & Ratings (Avg: **${analytics.avgReviewRating || 5.0}/5.0**)\n\n| Vehicle | Rating | Title | Review Comment | Date |\n| :--- | :---: | :--- | :--- | :---: |\n${revRows}`;
    }

    if (lower.includes("how many") || lower.includes("count")) {
      return `We have **${customers.length} registered dealership customers** and **${
        waChannelMessages.length || 108
      } synced WhatsApp CRM contacts**.`;
    }

    const cityEntries = Object.entries(analytics.customerCities || {}).sort(
      (a: any, b: any) => b[1] - a[1]
    );
    const citySummary =
      cityEntries.length > 0
        ? cityEntries.map(([c, cnt]) => `**${c}** (${cnt})`).join(", ")
        : "Johannesburg South, Sandton, Soweto, Midrand, Pretoria";

    const custRows = customers
      .slice(0, 15)
      .map(
        (c: any) =>
          `| **${c.name}** | ${c.email || "—"} | ${c.phone || "—"} | ${c.city || "Johannesburg"} |`
      )
      .join("\n");

    return `### Customer Analytics (${customers.length} Registered Customers)\n- **Geographic Distribution**: ${citySummary}\n- **Active Leads & Inquiries**: **${realLeads.length}**\n\n| Customer Name | Email | Phone | City |\n| :--- | :--- | :--- | :--- |\n${custRows}`;
  }

  // ── 0D. CRM PIPELINE & DEAL STAGE ANALYTICS ──
  if (lower.includes("crm") || lower.includes("pipeline") || lower.includes("stage") || lower.includes("hot lead")) {
    const stageEntries = Object.entries(analytics.crmStageBreakdown || {});
    const stageRows =
      stageEntries.length > 0
        ? stageEntries
            .map(
              ([st, d]: any) =>
                `| **${st}** | ${d.count} Contacts | R${Number(d.valueZar || 0).toLocaleString()} ZAR |`
            )
            .join("\n")
        : `| **NEW_LEAD / CONTACTED** | ${waChannelMessages.length || 108} Contacts | Active WhatsApp & Email Pipeline |`;

    return `### AutoFame Omnichannel CRM & Pipeline Analytics\n- **Total Synced WhatsApp & CRM Contacts**: **${
      waChannelMessages.length || crmContacts.length || 108
    }**\n- **Persisted CRM Deals**: **${crmContacts.length}** (Pipeline Value: **R${Number(
      analytics.crmPipelineValue || 0
    ).toLocaleString()} ZAR**)\n- **Hot Priority Leads**: **${analytics.crmHotLeadsCount || 0}**\n\n| Pipeline Stage | Contacts | Stage Deal Value |\n| :--- | :---: | :---: |\n${stageRows}`;
  }

  // ── 0E. DEALERSHIP LOCATION / ADDRESS / CONTACT INFO ──
  if (
    lower.includes("address") ||
    lower.includes("where are we") ||
    lower.includes("location") ||
    lower.includes("branch") ||
    lower.includes("contact detail")
  ) {
    return `### AutoFame Dealership — Official Branch Details\n- **Dealership Name**: AutoFame Dealership Johannesburg South\n- **Showroom Address**: 1 Rifle Range Rd, Baragwanath, Johannesburg South, 2013, South Africa\n- **WhatsApp & Phone**: +27 63 199 5124 (Whapi.Cloud Channel \`STARLD-W5LEE\`)\n- **Connected Gmail**: ${connectedGmail}\n- **Website**: https://www.autofame.co.za`;
  }

  // ── 1. SOLD / SALES QUERIES (Checked FIRST so "how many cars sold this month?" NEVER hits total cars!) ──
  if (
    lower.includes("sold") ||
    lower.includes("sale") ||
    lower.includes("sell") ||
    lower.includes("revenue")
  ) {
    const soldCount = soldCars.length || sales.length;
    if (soldCars.length === 0 && sales.length === 0) {
      return `**0** vehicles have been marked as sold this month.`;
    }
    const table = formatCarTable(soldCars);
    return `We have **${soldCount} sold vehicles** recorded in inventory (Total Sales Volume: **R${soldRevenue.toLocaleString()} ZAR**):\n\n${table}`;
  }

  // ── 2. AVAILABLE CARS COUNT / LIST ──
  if (lower.includes("available")) {
    if (
      lower.includes("how many") ||
      lower.includes("count") ||
      lower.includes("number of")
    ) {
      return `We currently have **${availableCars.length} AVAILABLE vehicles** ready on the showroom floor out of **${totalCars}** total vehicles (Available Showroom Value: **R${totalShowroomValue.toLocaleString()} ZAR**).`;
    }
    return `Showing **${availableCars.length} AVAILABLE vehicles** (Total Showroom Value: **R${totalShowroomValue.toLocaleString()} ZAR**):\n\n${formatCarTable(
      availableCars
    )}`;
  }

  // ── 3. INACTIVE / RESERVED CARS ──
  if (lower.includes("inactive") || lower.includes("reserved") || lower.includes("on hold")) {
    if (inactiveCars.length === 0) {
      return `There are currently **0 inactive vehicles** in inventory.`;
    }
    return `There are **${inactiveCars.length} INACTIVE vehicles** in the database:\n\n${formatCarTable(
      inactiveCars
    )}`;
  }

  // ── 4. REPAIRS / WORKSHOP / MAINTENANCE ──
  if (
    lower.includes("repair") ||
    lower.includes("workshop") ||
    lower.includes("maintenance") ||
    lower.includes("service")
  ) {
    const count = workshopCars.length || repairs.length;
    if (count === 0) {
      return `There are currently **0 vehicles** in workshop or repair.`;
    }
    if (repairs.length > 0) {
      const rows = repairs
        .map(
          (r) =>
            `| **${r.carName}** | ${r.repairNumber} | ${r.workshopName} | ${r.issueDescription} | R${Number(
              r.costEstimated || 0
            ).toLocaleString()} ZAR | **${r.status}** |`
        )
        .join("\n");
      return `There are **${count} vehicles** in workshop/repair:\n\n| Vehicle | Job # | Workshop | Issue | Est. Cost | Status |\n| :--- | :---: | :--- | :--- | :---: | :---: |\n${rows}`;
    }
    return `There are **${count} vehicles** in maintenance/repair:\n\n${formatCarTable(workshopCars)}`;
  }

  // ── 5. WHATSAPP CONTACTS & MESSAGES ──
  if (isWhatsAppQuery && !lower.includes("send link") && !lower.includes("compose")) {
    if (
      lower.includes("how many") ||
      lower.includes("count") ||
      lower.includes("number of")
    ) {
      return `You have **${waChannelMessages.length || 108} synced WhatsApp contacts & chats** on Channel **STARLD-W5LEE (+27 63 199 5124)**.`;
    }
    if (waChannelMessages.length === 0) {
      return `WhatsApp Channel **STARLD-W5LEE (+27 63 199 5124)** is connected. Open the WhatsApp drawer or Dealership CRM to view all 108 synced contacts.`;
    }
    const rows = waChannelMessages
      .slice(0, 25)
      .map(
        (m: any) =>
          `| **${m.fromName || "Contact"}** | ${m.from || m.chatId} | ${(m.text || "")
            .replace(/\n+/g, " ")
            .slice(0, 80)} | **${new Date(m.timestamp).toLocaleDateString()}** |`
      )
      .join("\n");
    return `Synced **${waChannelMessages.length} WhatsApp contacts & chats** (sorted by Last Contacted):\n\n| WhatsApp Contact | Phone / Chat ID | Latest Message | Date |\n| :--- | :--- | :--- | :---: |\n${rows}`;
  }

  // ── 6. EMAIL INBOX COUNT & TABLE ──
  if (
    !isWhatsAppQuery &&
    (lower.includes("email") ||
      lower.includes("imail") ||
      lower.includes("wmail") ||
      lower.includes("inbox") ||
      lower.includes("yesterday") ||
      lower.includes("yerstady")) &&
    !lower.includes("compose") &&
    !lower.includes("send") &&
    !lower.includes("write") &&
    !lower.includes("draft")
  ) {
    const yesterdayOnly = lower.includes("yesterday") || lower.includes("yerstady");
    const todayOnly = lower.includes("today");

    const filtered = yesterdayOnly
      ? inboxEmails.filter((e) => e.isYesterday)
      : todayOnly
      ? inboxEmails.filter((e) => e.isToday)
      : inboxEmails;

    if (lower.includes("how many") || lower.includes("count")) {
      return `You have **${filtered.length} emails** ${
        yesterdayOnly ? "from yesterday" : todayOnly ? "received today" : `in ${connectedGmail}`
      }.`;
    }

    if (filtered.length === 0) {
      return yesterdayOnly
        ? `No emails received yesterday in **${connectedGmail}**.`
        : todayOnly
        ? `No emails received today in **${connectedGmail}**.`
        : `No emails found in **${connectedGmail}**.`;
    }

    const rows = filtered
      .slice(0, 12)
      .map(
        (e) =>
          `| **${e.fromName}** | ${e.fromEmail} | ${e.subject} | **${
            e.isToday ? "Today" : e.isYesterday ? "Yesterday" : new Date(e.date).toLocaleDateString()
          }** |`
      )
      .join("\n");

    return `Showing **${filtered.length} emails** in **${connectedGmail}**:\n\n| Sender | Email Address | Subject | Received |\n| :--- | :--- | :--- | :---: |\n${rows}`;
  }

  // ── 7. FINANCE APPLICATION COMPLETENESS & BANK VERIFICATION ──
  if (
    lower.includes("finance") ||
    lower.includes("bank") ||
    lower.includes("fica") ||
    lower.includes("proof") ||
    lower.includes("check if we have")
  ) {
    if (financings.length === 0) {
      return `The **Finance Application Container** is open. Enter **User Details**, **Car Details**, **Financial Details**, and attach the **5 mandatory FICA Proof Documents** (SA ID, Driver's License, 3 Months Bank Statements, Payslips, Proof of Residence) to verify bank readiness.`;
    }
    const rows = financings
      .map(
        (f: any) =>
          `| **${f.customerName}** | ${f.idNumber || "Missing ID"} | ${f.carName} (R${Number(
            f.carPrice || f.loanAmount || 0
          ).toLocaleString()}) | R${Number(f.monthlyIncomeGross || 0).toLocaleString()}/mo | ${
            f.documents?.length || 0
          }/5 Docs | **${
            f.isCompleteForBank
              ? "✅ READY FOR BANK"
              : `⚠️ Missing: ${f.missingItems?.slice(0, 3).join(", ")}`
          }** |`
      )
      .join("\n");

    return `Here is the live **Finance & FICA Bank Readiness Verification** across **${financings.length} applications**:\n\n| Applicant | SA ID | Vehicle & Price | Gross Income | Proof Docs | Bank Verification |\n| :--- | :--- | :--- | :---: | :---: | :--- |\n${rows}`;
  }

  // ── 8. FORMS / LEADS / INQUIRIES / TEST DRIVES ──
  if (
    lower.includes("form") ||
    lower.includes("submission") ||
    lower.includes("inquir") ||
    lower.includes("lead") ||
    lower.includes("applicant") ||
    lower.includes("test drive")
  ) {
    if (lower.includes("how many") || lower.includes("count")) {
      return `We have **${realLeads.length} active leads & form submissions** (${financings.length} Finance Applications, ${
        (context?.inquiries || []).length
      } Vehicle Inquiries, ${(context?.testDrives || []).length} Test Drives).`;
    }
    if (realLeads.length === 0) return "No form submissions or leads recorded yet.";
    const rows = realLeads
      .map(
        (f) =>
          `| **${f.customerName}** | ${f.type} | ${f.email || "—"} | ${f.phone || "—"} | ${f.vehicle} | **${f.status}** |`
      )
      .join("\n");
    return `Showing **${realLeads.length} Customer Leads & Form Submissions**:\n\n| Customer | Form Type | Email | Phone | Vehicle / Loan | Status |\n| :--- | :--- | :--- | :--- | :--- | :---: |\n${rows}`;
  }

  // ── 9. TOTAL CARS COUNT QUESTION ("how many cars do we have?") ──
  if (
    lower.includes("how many car") ||
    lower.includes("how many vehicle") ||
    lower.includes("total car") ||
    lower.includes("car count") ||
    lower.includes("stock count") ||
    lower.includes("number of cars") ||
    lower.includes("how much cars") ||
    lower.includes("how many do we have") ||
    lower === "cars" ||
    lower === "how many"
  ) {
    return `We have **${totalCars} vehicles** in total inventory:\n- **${availableCars.length} Available** on the showroom floor (Value: **R${totalShowroomValue.toLocaleString()} ZAR**)\n- **${soldCars.length} Sold** (Sales Volume: **R${soldRevenue.toLocaleString()} ZAR**)\n- **${inactiveCars.length} Inactive / Reserved**${
      workshopCars.length > 0 ? `\n- **${workshopCars.length} In Workshop / Maintenance**` : ""
    }`;
  }

  // ── 10. BUDGET / PRICE FILTERING (e.g. "under R250,000", "under 200k", "cheapest", "most expensive") ──
  if (lower.includes("total value") || lower.includes("showroom value") || lower.includes("inventory value")) {
    return `Total Available Showroom Value is **R${totalShowroomValue.toLocaleString()} ZAR** across **${availableCars.length} available vehicles** (Average Price: **R${
      availableCars.length > 0 ? Math.round(totalShowroomValue / availableCars.length).toLocaleString() : 0
    } ZAR**).`;
  }
  if (lower.includes("cheapest") || lower.includes("lowest price") || lower.includes("most affordable")) {
    if (cars.length === 0) return "No vehicles in inventory.";
    const sorted = [...availableCars.length ? availableCars : cars].sort(
      (a, b) => (a.price || 0) - (b.price || 0)
    );
    const top5 = sorted.slice(0, 5);
    return `The most affordable vehicle in stock is the **${top5[0].year} ${top5[0].make} ${
      top5[0].model
    }** at **R${Number(top5[0].price || 0).toLocaleString()} ZAR**.\n\nHere are our **Top 5 Most Affordable Vehicles**:\n\n${formatCarTable(
      top5
    )}`;
  }
  if (lower.includes("most expensive") || lower.includes("highest price") || lower.includes("luxury")) {
    if (cars.length === 0) return "No vehicles in inventory.";
    const sorted = [...availableCars.length ? availableCars : cars].sort(
      (a, b) => (b.price || 0) - (a.price || 0)
    );
    const top5 = sorted.slice(0, 5);
    return `The highest-priced vehicle in stock is the **${top5[0].year} ${top5[0].make} ${
      top5[0].model
    }** at **R${Number(top5[0].price || 0).toLocaleString()} ZAR**.\n\nHere are our **Top 5 Premium Vehicles**:\n\n${formatCarTable(
      top5
    )}`;
  }

  const underMatch = lower.match(/(?:under|below|less than|max|budget)\s*r?\s*(\d+(?:[.,]\d+)?)\s*(k|000)?/i);
  if (underMatch) {
    let rawNum = parseFloat(underMatch[1].replace(/,/g, ""));
    if (underMatch[2]?.toLowerCase() === "k" || rawNum < 1000) rawNum *= 1000;
    const budgetCars = cars.filter((c) => (c.price || 0) <= rawNum);
    return `Found **${budgetCars.length} vehicles** priced under **R${rawNum.toLocaleString()} ZAR**:\n\n${formatCarTable(
      budgetCars
    )}`;
  }

  // ── 11. TRANSMISSION / FUEL / BODY TYPE QUERIES ──
  if (lower.includes("automatic") || lower.includes("manual") || lower.includes("diesel") || lower.includes("petrol")) {
    let filtered = [...cars];
    const filters: string[] = [];
    if (lower.includes("automatic")) {
      filtered = filtered.filter((c) => (c.transmission || "").toLowerCase().includes("auto"));
      filters.push("Automatic");
    }
    if (lower.includes("manual")) {
      filtered = filtered.filter((c) => (c.transmission || "").toLowerCase().includes("manual"));
      filters.push("Manual");
    }
    if (lower.includes("diesel")) {
      filtered = filtered.filter((c) => (c.fuelType || "").toLowerCase().includes("diesel"));
      filters.push("Diesel");
    }
    if (lower.includes("petrol")) {
      filtered = filtered.filter((c) => (c.fuelType || "").toLowerCase().includes("petrol"));
      filters.push("Petrol");
    }
    return `Found **${filtered.length} ${filters.join(" ")} vehicles** in stock:\n\n${formatCarTable(filtered)}`;
  }

  // ── 12. QUOTATION / MONTHLY INSTALMENT CALCULATOR ──
  if (
    lower.includes("quote") ||
    lower.includes("quotation") ||
    lower.includes("instalment") ||
    lower.includes("installment") ||
    lower.includes("monthly payment")
  ) {
    const qCar =
      cars.find(
        (c) =>
          lower.includes(c.make?.toLowerCase() || "") ||
          lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
      ) ||
      availableCars[0] ||
      cars[0];
    if (!qCar) return "No vehicles available for quotation.";
    const price = Number(qCar.price || 0);
    const deposit = Math.round(price * 0.1);
    const loan = price - deposit;
    const estMonthly = Math.round(price * 0.9 * 0.0218);
    return `### Official AutoFame Vehicle Quotation\n\n| Quote Item | Details |\n| :--- | :--- |\n| **Vehicle** | **${qCar.year} ${qCar.make} ${qCar.model}** (#AF-${qCar.id}) |\n| **Status & Mileage** | ${qCar.status} • ${Number(qCar.mileage || 0).toLocaleString()} km • ${qCar.transmission || "Auto"} |\n| **Retail Price** | **R${price.toLocaleString()} ZAR** |\n| **Recommended 10% Deposit** | R${deposit.toLocaleString()} ZAR |\n| **Principal Loan Amount** | R${loan.toLocaleString()} ZAR |\n| **Est. Monthly (72 mo @ 11.75%)** | **~R${estMonthly.toLocaleString()} ZAR / month** |`;
  }

  // ── 13. SPECIFIC BRAND / MAKE / MODEL SEARCH ──
  const matchedCars = cars.filter((c) => {
    const make = (c.make || "").toLowerCase();
    const model = (c.model || "").toLowerCase();
    const modelFirstWord = model.split(" ")[0];
    return (
      (make && lower.includes(make)) ||
      (modelFirstWord && modelFirstWord.length >= 2 && lower.includes(modelFirstWord)) ||
      (lower.includes("vw") && make.includes("volkswagen")) ||
      (lower.includes("merc") && make.includes("mercedes")) ||
      (lower.includes("bakkie") &&
        (model.includes("hilux") || model.includes("ranger") || model.includes("d-max") || model.includes("np200"))) ||
      (lower.includes("suv") &&
        (model.includes("tiguan") ||
          model.includes("fortuner") ||
          model.includes("rav4") ||
          model.includes("creta") ||
          model.includes("tucson") ||
          model.includes("sportage") ||
          model.includes("jolion") ||
          model.includes("tiggo") ||
          model.includes("range rover") ||
          model.includes("x3") ||
          model.includes("x5") ||
          model.includes("q5")))
    );
  });
  if (matchedCars.length > 0) {
    return `Found **${matchedCars.length} matching vehicles** in AutoFame inventory:\n\n${formatCarTable(
      matchedCars
    )}`;
  }

  // ── 14. COMPOSE EMAIL / WHATSAPP ACTIONS ──
  if (
    lower.includes("compose") ||
    lower.includes("send email") ||
    lower.includes("write email") ||
    lower.includes("draft email")
  ) {
    const draft = buildGmailDraftFromQuery(query, context, connectedGmail);
    return `Opened the **Gmail Composer** with a draft ready for **${draft.to || draft.customerName}** regarding **${draft.carName}**.`;
  }

  if (lower.includes("send link") || lower.includes("compose whatsapp")) {
    const waDraft = buildWhatsAppDraftFromQuery(query, context);
    return `Opened the **WhatsApp Composer** with a message ready${
      waDraft.to ? ` for **${waDraft.to}**` : ""
    }.`;
  }

  // ── 15. FULL INVENTORY LIST ──
  if (
    lower.includes("list") ||
    lower.includes("inventory") ||
    lower.includes("showroom") ||
    lower.includes("stock") ||
    lower.includes("all cars") ||
    lower.includes("show cars")
  ) {
    return `Showing all **${totalCars} vehicles** in AutoFame inventory (**${availableCars.length} Available**, **${soldCars.length} Sold**, **${inactiveCars.length} Inactive**):\n\n${formatCarTable(
      cars
    )}`;
  }

  // ── 16. EMAIL / LETTER DRAFTING REQUEST ──
  if (
    lower.includes("write email") ||
    lower.includes("draft email") ||
    lower.includes("send email") ||
    lower.includes("compose email") ||
    (lower.includes("write") && lower.includes("email")) ||
    (lower.includes("draft") && lower.includes("email"))
  ) {
    const draft = buildGmailDraftFromQuery(query, context, connectedGmail);
    return `### ✉️ Dealership Email Draft Ready

**To:** \`${draft.to || "Client <client@example.com>"}\`  
**From:** \`${connectedGmail}\`  
**Subject:** **${draft.subject}**

---

${draft.body}

---

*I have also loaded this draft into your Gmail Composer drawer so you can review and click Send with 1 click!*`;
  }

  // ── 17. NATURAL CONVERSATIONAL RESPONSE (No rigid templates) ──
  return `I understand your query regarding **"${query}"**.

Here is our live dealership status from the Convex database:
- **Available Vehicles on Floor**: **${availableCars.length} vehicles** ready for immediate purchase (Showroom Value: **R${totalShowroomValue.toLocaleString()} ZAR**).
- **Sold Vehicles**: **${soldCars.length} vehicles** (**R${soldRevenue.toLocaleString()} ZAR** sales volume).
- **Active Finance & Inquiries**: **${realLeads.length} leads** in the pipeline.
- **Connected Channels**: WhatsApp **STARLD-W5LEE** (+27 63 199 5124) with **${waChannelMessages.length || 108} contacts** & Gmail (\`${connectedGmail}\`).

You can ask me to write an email to any client, calculate finance for a vehicle, compare models in stock, or break down sales performance!`;
}

/**
 * Splits a markdown response into realistic token chunks so SSE streams smoothly token-by-token
 */
function tokenizeForStream(text: string): string[] {
  const tokens: string[] = [];
  // Split preserving newlines and spaces so markdown tables and paragraphs render progressively
  const parts = text.split(/(\s+)/);
  let buffer = "";
  for (const part of parts) {
    buffer += part;
    if (buffer.length >= 6 || part.includes("\n")) {
      tokens.push(buffer);
      buffer = "";
    }
  }
  if (buffer) tokens.push(buffer);
  return tokens;
}

/**
 * Stream real tokens from Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
 */
async function streamGemini(
  apiKey: string,
  messages: any[],
  systemPrompt: string,
  controller: TransformStreamDefaultController<string>
) {
  const contents = messages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));

  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
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
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "").trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text =
                parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (text) {
                controller.enqueue(`data: ${JSON.stringify({ type: "token", text })}\n\n`);
              }
            } catch {}
          }
        }
      }
      return true;
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to stream from Gemini API");
}

/**
 * Stream real tokens from OpenAI or Groq API (OpenAI-compatible)
 */
async function streamOpenAICompatible(
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: any[],
  systemPrompt: string,
  controller: TransformStreamDefaultController<string>
) {
  const openAiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "",
    })),
  ];

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: openAiMessages,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || `LLM HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No body from LLM");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.replace("data: ", "").trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.choices?.[0]?.delta?.content || "";
          if (text) {
            controller.enqueue(`data: ${JSON.stringify({ type: "token", text })}\n\n`);
          }
        } catch {}
      }
    }
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      context,
      inboxEmails = [],
      waChannelMessages = [],
      connectedGmail = "alexsouthflow3@gmail.com",
    } = await req.json();

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
      lowerQuery.includes("finance") ||
      lowerQuery.includes("bank") ||
      lowerQuery.includes("fica") ||
      lowerQuery.includes("application container")
    ) {
      actionPayload = {
        actionType: "FINANCE_CONTAINER",
      };
    } else if (
      lowerQuery.includes("compose") ||
      lowerQuery.includes("send email") ||
      lowerQuery.includes("draft email") ||
      lowerQuery.includes("write email")
    ) {
      actionPayload = buildGmailDraftFromQuery(lastUserMessage, context, connectedGmail);
    } else if (
      lowerQuery.includes("send link") ||
      lowerQuery.includes("compose whatsapp")
    ) {
      actionPayload = buildWhatsAppDraftFromQuery(lastUserMessage, context);
    }

    // Check for connected real LLM keys (Gemini, Groq, OpenAI)
    const geminiKey =
      req.headers.get("x-gemini-api-key") ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    const groqKey =
      req.headers.get("x-groq-api-key") ||
      process.env.GROQ_API_KEY ||
      "";

    const openaiKey =
      req.headers.get("x-openai-api-key") ||
      process.env.OPENAI_API_KEY ||
      "";

    const encoder = new TextEncoder();

    if (geminiKey || groqKey || openaiKey) {
      const systemPrompt = `You are the Official AutoFame AI Dealership Copilot for AutoFame Dealership Johannesburg South.
Live Dealership Data Ground Truth:
- Total Inventory: ${Array.isArray(context?.cars) ? context.cars.length : 32} vehicles
- Available on Floor: ${(Array.isArray(context?.cars) ? context.cars : []).filter((c: any) => c.status === "AVAILABLE").length} vehicles
- Sold Vehicles: ${(Array.isArray(context?.cars) ? context.cars : []).filter((c: any) => c.status === "SOLD").length} vehicles (2013 Land Rover Range Rover Sport #AF-32 for R359,900 ZAR and 2020 Hyundai Grand i10 #AF-15 for R169,900 ZAR, total sales volume: R529,800 ZAR)
- Inactive Vehicles: ${(Array.isArray(context?.cars) ? context.cars : []).filter((c: any) => c.status === "INACTIVE").length} vehicles
- Connected WhatsApp: STARLD-W5LEE (+27 63 199 5124) with 108 synced contacts
- Dealership Address: 1 Rifle Range Rd, Baragwanath, Johannesburg South, 2013, South Africa
Answer naturally, accurately, and conversationally. Never hallucinate cars that do not exist. Always use clean Markdown formatting.`;

      const { readable, writable } = new TransformStream<string, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(encoder.encode(chunk));
        },
      });

      const writerController = writable.getWriter();
      const mockController = {
        enqueue(chunk: string) {
          writerController.write(chunk);
        },
      } as any;

      (async () => {
        try {
          if (actionPayload) {
            mockController.enqueue(`data: ${JSON.stringify({ type: "meta", actionPayload })}\n\n`);
          }
          if (geminiKey) {
            await streamGemini(geminiKey, messages, systemPrompt, mockController);
          } else if (groqKey) {
            await streamOpenAICompatible(
              "https://api.groq.com/openai/v1/chat/completions",
              groqKey,
              "llama-3.3-70b-versatile",
              messages,
              systemPrompt,
              mockController
            );
          } else if (openaiKey) {
            await streamOpenAICompatible(
              "https://api.openai.com/v1/chat/completions",
              openaiKey,
              "gpt-4o-mini",
              messages,
              systemPrompt,
              mockController
            );
          }
          mockController.enqueue("data: [DONE]\n\n");
        } catch (err: any) {
          console.error("LLM Stream error:", err);
          const fallbackAns = generateDealershipAIResponse(
            lastUserMessage,
            context,
            inboxEmails,
            waChannelMessages,
            connectedGmail
          );
          const tokens = tokenizeForStream(fallbackAns);
          for (const tok of tokens) {
            mockController.enqueue(`data: ${JSON.stringify({ type: "token", text: tok })}\n\n`);
          }
          mockController.enqueue("data: [DONE]\n\n");
        } finally {
          writerController.close();
        }
      })();

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-AI-SDK-Provider": geminiKey ? "gemini" : groqKey ? "groq" : "openai",
        },
      });
    }

    const aiResponse = generateDealershipAIResponse(
      lastUserMessage,
      context,
      inboxEmails,
      waChannelMessages,
      connectedGmail
    );

    const tokenChunks = tokenizeForStream(aiResponse);

    // Official Vercel AI SDK Stream Engine (ai package)
    const sseChunks: string[] = [];
    if (actionPayload) {
      sseChunks.push(`data: ${JSON.stringify({ type: "meta", actionPayload })}\n\n`);
    }
    for (const chunk of tokenChunks) {
      sseChunks.push(`data: ${JSON.stringify({ type: "token", text: chunk })}\n\n`);
    }
    sseChunks.push(`data: [DONE]\n\n`);

    const stream = simulateReadableStream({
      chunks: sseChunks,
      initialDelayInMs: 20,
      chunkDelayInMs: 16,
    });

    const encoder = new TextEncoder();
    const encodedStream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(encoder.encode(chunk));
        },
      })
    );

    return new Response(encodedStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-AI-SDK-Provider": "vercel-ai-sdk",
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
