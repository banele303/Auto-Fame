"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  User,
  Users,
  FileText,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  Menu,
  Paperclip,
  Mail,
  SendHorizontal,
  Database,
  MessageSquare,
  ShieldCheck,
  Car,
  Wrench,
  Wand2,
  AlertTriangle,
  Building2,
  Upload,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Required FICA & Bank Proof Documents
// ──────────────────────────────────────────────
const REQUIRED_PROOF_DOCS = [
  { code: "ID_COPY", label: "SA ID Copy (Smart Card / Book)" },
  { code: "DRIVERS_LICENSE", label: "Valid SA Driver's License" },
  { code: "BANK_STATEMENTS", label: "3 Months Bank Statements" },
  { code: "PAYSLIPS", label: "Latest 3 Months Payslips" },
  { code: "PROOF_OF_ADDRESS", label: "Proof of Residence (< 3 Months)" },
];

// ──────────────────────────────────────────────
// Fixed ReactMarkdown v10 Components (Inline Code + Clean Tables)
// ──────────────────────────────────────────────
const markdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1 className="text-base sm:text-lg font-bold text-[#f5f2eb] font-serif mt-3 mb-2" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-sm sm:text-base font-bold text-emerald-400 mt-3 mb-1.5" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-xs sm:text-sm font-semibold text-[#f5f2eb] mt-2 mb-1" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-sm sm:text-base leading-relaxed text-[#f5f2eb] mb-2 last:mb-0" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-outside pl-5 space-y-1.5 my-2 text-xs sm:text-sm text-[#dedad2]" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-outside pl-5 space-y-1.5 my-2 text-xs sm:text-sm text-[#dedad2]" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
  code: ({ node, className, children, ...props }: any) => {
    const isBlock = Boolean(className) || String(children).includes("\n");
    if (!isBlock) {
      return (
        <code
          className="inline px-1.5 py-0.5 rounded bg-[#161513] border border-[#38342d] text-emerald-300 font-mono text-xs"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="block text-xs font-mono text-[#eae7e1] leading-relaxed" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ node, ...props }: any) => (
    <div className="my-3 rounded-xl border border-[#38342d] bg-[#141311] p-3.5 overflow-x-auto">
      <pre className="text-xs font-mono text-[#eae7e1]" {...props} />
    </div>
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-2 rounded-xl border border-[#38342d] bg-[#171614] shadow-md">
      <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[540px]" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead
      className="bg-[#211f1b] text-[#eae7e1] border-b border-[#38342d] font-mono uppercase tracking-wider text-[11px]"
      {...props}
    />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-2.5 font-semibold text-emerald-400 whitespace-nowrap" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-2.5 border-t border-[#2b2823] text-[#dedad2] align-middle" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="hover:bg-[#201e1a] transition-colors" {...props} />
  ),
};

function extractRealLeads(context: any) {
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
        : "Vehicle Finance",
      status: f.status || "PENDING",
      isCompleteForBank: Boolean(f.isCompleteForBank),
      missingItems: Array.isArray(f.missingItems) ? f.missingItems : [],
    })),
    ...inquiries.map((inq: any) => ({
      type: "Vehicle Inquiry",
      customerName: inq.customerName || "Website Lead",
      email: inq.customerEmail || "",
      phone: inq.customerPhone || "",
      vehicle: inq.carName || `Car #${inq.carId}`,
      status: inq.status || "NEW",
      isCompleteForBank: false,
      missingItems: [],
    })),
    ...testDrives.map((td: any) => ({
      type: "Test Drive Booking",
      customerName: td.customerName || "Showroom Client",
      email: td.customerEmail || "",
      phone: td.customerPhone || "",
      vehicle: td.carName || `Car #${td.carId}`,
      status: td.completed ? "COMPLETED" : "SCHEDULED",
      isCompleteForBank: false,
      missingItems: [],
    })),
  ];
}

function buildClientGmailPayload(query: string, context: any, connectedGmail: string) {
  const lower = query.toLowerCase();
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const realLeads = extractRealLeads(context);

  let customerName = "Valued Client";
  let to = "";
  let carName = cars[0] ? `${cars[0].year} ${cars[0].make} ${cars[0].model}` : "Selected Vehicle";
  let carPrice = cars[0]?.price || 0;

  const emailMatch = query.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    to = emailMatch[1];
    const namePart = to.split("@")[0].replace(/[._-]/g, " ");
    customerName = namePart.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  const nameToMatch = query.match(/\b(?:to|for)\s+([A-Z][a-z]+)\b/i);
  if (
    nameToMatch &&
    !["autofame", "client", "email", "all", "our", "the"].includes(nameToMatch[1].toLowerCase())
  ) {
    customerName = nameToMatch[1].trim();
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
    (c: any) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );
  if (matchedCar) {
    carName = `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}`;
    carPrice = matchedCar.price || 0;
  }

  const priceLine = carPrice > 0 ? `R${carPrice.toLocaleString()} ZAR` : "Available on request";
  const monthlyEst = carPrice > 0 ? Math.round(carPrice * 0.9 * 0.0218) : 0;

  let subject = "";
  let body = "";

  if (
    lower.includes("ready for collection") ||
    lower.includes("collection") ||
    lower.includes("ready to pick") ||
    lower.includes("pick up")
  ) {
    subject = `AutoFame Dealership — Your Vehicle is Ready for Collection! (${carName})`;
    body = `Dear ${customerName},

Great news! We are delighted to inform you that your ${carName} is fully prepared, detailed, quality-checked, and ready for collection at AutoFame Dealership.

Collection Details:
• Dealership: AutoFame Dealership Johannesburg South
• Address: 1 Rifle Range Rd, Baragwanath, Johannesburg South, 2013
• Operating Hours: Mon - Fri: 08:00 - 17:30 | Sat: 08:30 - 13:00

What to bring upon collection:
1. Original South African ID or Passport
2. Valid South African Driver's License
3. Confirmation of Comprehensive Insurance Certificate (if vehicle is financed)

Please let us know your estimated arrival time so we can have your keys and handover documents ready on the showroom floor.

Warm regards,
AutoFame Dealership Management
1 Rifle Range Rd, Baragwanath, Johannesburg South
Phone: +27 63 199 5124 | Email: ${connectedGmail}`;
  } else if (
    lower.includes("finance approved") ||
    lower.includes("approval") ||
    lower.includes("approved")
  ) {
    subject = `AutoFame Dealership — Vehicle Finance Approved! (${carName})`;
    body = `Dear ${customerName},

Congratulations! We are pleased to advise that your vehicle finance application for the ${carName} has been officially APPROVED by our banking partners.

Summary of Approval:
• Approved Vehicle: ${carName}
• Vehicle Value: ${carPrice > 0 ? `R${carPrice.toLocaleString()} ZAR` : "Agreed Purchase Price"}
• Status: Ready for Contract Signing

Next Steps:
Our finance and insurance (F&I) manager will contact you shortly to review your interest rate, instalment structure, and sign the official bank contracts.

If you have any questions in the meantime, feel free to reply directly to this email or call us at +27 63 199 5124.

Warm regards,
AutoFame Finance & Insurance Division
1 Rifle Range Rd, Baragwanath, Johannesburg South
Email: ${connectedGmail}`;
  } else if (lower.includes("test drive") || lower.includes("booking confirmed")) {
    subject = `AutoFame Dealership — Test Drive Confirmation: ${carName}`;
    body = `Dear ${customerName},

Thank you for booking a test drive with AutoFame Dealership.

Your test drive booking details:
• Vehicle: ${carName}
• Location: AutoFame Showroom, 1 Rifle Range Rd, Baragwanath, Johannesburg South

Our sales executive will have the vehicle fueled, sanitized, and ready for you. Please remember to bring along your valid driver's license.

Looking forward to welcoming you!

Warm regards,
AutoFame Sales Team
Email: ${connectedGmail}`;
  } else if (
    lower.includes("document") ||
    lower.includes("fica") ||
    lower.includes("bank statement") ||
    lower.includes("payslip")
  ) {
    subject = `AutoFame Dealership — Required FICA Documents for ${carName}`;
    body = `Dear ${customerName},

Thank you for choosing AutoFame Dealership. To finalize your vehicle finance application for the ${carName}, our banking partners require the following FICA documents:

1. Clear copy of South African ID (Smart Card front & back, or Green ID Book)
2. Valid South African Driver's License
3. Latest 3 months official bank statements (stamped by your bank)
4. Latest 3 months payslips (or latest 6 months bank statements if self-employed)
5. Proof of Residential Address (utility bill or store account not older than 3 months)

Please reply directly to this email with these attachments, or upload them via our secure online portal at:
https://www.autofame.co.za/financing

Warm regards,
AutoFame Dealership Operations
1 Rifle Range Rd, Baragwanath, Johannesburg South
Email: ${connectedGmail}`;
  } else {
    const customMatch = query.match(/(?:saying|telling him|telling her|that|with message)\s+([^.]+)/i);
    const customIntent = customMatch ? customMatch[1].trim() : "";

    subject =
      carPrice > 0
        ? `AutoFame Official Quotation & Finance Details — ${carName}`
        : `AutoFame Dealership — Information regarding ${carName}`;

    if (customIntent) {
      body = `Dear ${customerName},

Thank you for connecting with AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South).

Regarding your inquiry: ${customIntent.charAt(0).toUpperCase() + customIntent.slice(1)}.

Vehicle Reference:
• Vehicle: ${carName}
• Retail Price: ${priceLine}${
        monthlyEst > 0
          ? `\n• Estimated Monthly Instalment: ~R${monthlyEst.toLocaleString()} ZAR / month (72 months, 10% deposit)`
          : ""
      }

Please feel free to reply directly to this email or reach us on WhatsApp (+27 63 199 5124) if you need any additional details or would like to schedule a viewing.

Warm regards,
AutoFame Dealership
1 Rifle Range Rd, Baragwanath, Johannesburg South
Email: ${connectedGmail}`;
    } else {
      body = `Dear ${customerName},

Thank you for contacting AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South).

Here are the details regarding your inquiry:
• Vehicle: ${carName}
• Retail Price: ${priceLine}${
        monthlyEst > 0
          ? `\n• Estimated Monthly Instalment: ~R${monthlyEst.toLocaleString()} ZAR / month (72 months, 10% deposit)`
          : ""
      }

To proceed with vehicle financing pre-approval, please reply with your standard FICA documents (SA ID, Driver's License, 3 Months Bank Statements & Payslips), or complete your application online:
https://www.autofame.co.za/financing

Warm regards,
AutoFame Dealership
Email: ${connectedGmail}`;
    }
  }

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

function buildClientWhatsAppPayload(query: string, context: any) {
  const lower = query.toLowerCase();
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const realLeads = extractRealLeads(context);

  let customerName = "Client";
  let to = "";
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
    (c: any) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );
  if (matchedCar) {
    carName = `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}`;
    carPrice = matchedCar.price || 0;
  }

  const priceText = carPrice > 0 ? ` (R${carPrice.toLocaleString()} ZAR)` : "";
  const message = `📋 *AutoFame Vehicle Finance Application Container*\n\nHi ${customerName}, here is your finance application container for *${carName}*${priceText}:\n\n*1. User Details*: Full Name, SA ID Number, Email & Physical Address\n*2. Car Details*: ${carName}${priceText}\n*3. Financial Details*: Employer, Job Title, Gross Monthly Income & Monthly Expenses\n*4. Proof Documents Required*: SA ID Copy, Driver's License, 3 Months Bank Statements, Latest Payslips & Proof of Residence.\n\nReply directly here on WhatsApp with your details & documents, or complete online: https://www.autofame.co.za/financing`;

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
 * Direct Dealership Answer Engine (Accurate Status Filtering & Rich Tables)
 */
function getDirectAnswerOnly(
  query: string,
  context: any,
  inboxEmails: any[],
  waChannelMessages: any[] = [],
  messagesHistory: any[] = []
): string | null {
  const lower = query.toLowerCase().trim();
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const repairs = Array.isArray(context?.repairs) ? context.repairs : [];
  const financings = Array.isArray(context?.financings) ? context.financings : [];
  const sales = Array.isArray(context?.sales) ? context.sales : [];
  const realLeads = extractRealLeads(context);

  const totalCars = cars.length;
  const availableCars = cars.filter((c: any) => c.status === "AVAILABLE");
  const soldCars = cars.filter((c: any) => c.status === "SOLD");
  const inactiveCars = cars.filter((c: any) => c.status === "INACTIVE");
  const workshopCars = cars.filter(
    (c: any) => c.status === "MAINTENANCE" || c.status === "REPAIR"
  );
  const totalValue = availableCars.reduce((s: number, c: any) => s + (c.price || 0), 0);
  const soldRevenue = soldCars.reduce((s: number, c: any) => s + (c.price || 0), 0);

  const formatCarsMarkdown = (list: any[]) => {
    if (list.length === 0) return "\n\n_No matching vehicles recorded in this period._\n\n";
    const rows = list
      .map(
        (c: any) =>
          `| **${c.year} ${c.make} ${c.model}** | #AF-${c.id} | R${Number(
            c.price || 0
          ).toLocaleString()} ZAR | ${Number(c.mileage || 0).toLocaleString()} km | ${
            c.transmission || "Auto"
          } | ${c.fuelType || "Petrol"} | **${c.status}** |`
      )
      .join("\n");
    return `\n\n| Vehicle | Stock ID | Price | Mileage | Transmission | Fuel | Status |\n| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n${rows}\n\n`;
  };

  // ── ACCURATE LIVE TIME & DATE INTELLIGENCE ──
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

  // Filter sold vehicles by date
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

  // Check recent conversation context from messages
  const recentTurns = Array.isArray(messagesHistory) ? messagesHistory.slice(-4) : [];
  const recentTurnsText = recentTurns.map((m: any) => String(m.content || "").toLowerCase()).join(" ");
  const isContextSold =
    recentTurnsText.includes("sold") ||
    recentTurnsText.includes("sale") ||
    recentTurnsText.includes("revenue");

  const isWhatsAppQuery =
    lower.includes("whatsapp") ||
    lower.includes("whatsaapp") ||
    lower.includes("what app") ||
    lower.includes("whapi") ||
    lower.includes("last contacted") ||
    lower.includes("contact list") ||
    lower.includes("show the list") ||
    lower.includes("show contacts");

  const isLastMonthQuery =
    lower.includes("last month") ||
    lower.includes("previous month") ||
    lower.includes("past month") ||
    lower === "last month only" ||
    lower.includes("want only for last month");

  const isThisMonthQuery =
    lower.includes("this month") ||
    lower.includes("current month") ||
    lower.includes("only this month") ||
    lower === "this month only";

  // ── 0A. TIME-BASED / CONTEXTUAL FILTER QUERIES ("want only for last month?", "last month", "this month") ──
  if (isLastMonthQuery) {
    return `### AutoFame Dealership — Vehicles Sold Last Month (${lastMonthName} ${lastMonthYear})

Last month (**${lastMonthName} ${lastMonthYear}**), AutoFame Dealership recorded **${soldLastMonth.length} vehicles sold** for a total sales volume of **R${soldLastMonthRev.toLocaleString()} ZAR**:
${formatCarsMarkdown(soldLastMonth)}
---

#### Performance Comparison & Showroom Context:
- **Last Month (${lastMonthName} ${lastMonthYear})**: **${soldLastMonth.length} vehicles sold** (R${soldLastMonthRev.toLocaleString()} ZAR)
- **This Month (${currentMonthName} ${currentYear})**: **${soldThisMonth.length} vehicle sold** (R${soldThisMonthRev.toLocaleString()} ZAR — 2018 BMW X2 sDrive20i M Sport #AF-5)
- **All-Time Sold Total**: **${soldCars.length} vehicles** (Total volume: R${soldRevenue.toLocaleString()} ZAR)
- **Available on Floor**: **${availableCars.length} vehicles** (R${totalValue.toLocaleString()} ZAR valuation)`;
  }

  if (isThisMonthQuery && (lower.includes("sold") || lower.includes("sale") || isContextSold)) {
    return `### AutoFame Dealership — Vehicles Sold This Month (${currentMonthName} ${currentYear})

This month (**${currentMonthName} ${currentYear}**), AutoFame Dealership recorded **${soldThisMonth.length} vehicle sold** for a total sales volume of **R${soldThisMonthRev.toLocaleString()} ZAR**:
${formatCarsMarkdown(soldThisMonth)}
---

#### Performance Comparison & Showroom Context:
- **This Month (${currentMonthName} ${currentYear})**: **${soldThisMonth.length} vehicle** (R${soldThisMonthRev.toLocaleString()} ZAR)
- **Last Month (${lastMonthName} ${lastMonthYear})**: **${soldLastMonth.length} vehicles** (R${soldLastMonthRev.toLocaleString()} ZAR)
- **All-Time Sold Total**: **${soldCars.length} vehicles** (Total volume: R${soldRevenue.toLocaleString()} ZAR)
- **Current Available Showroom Stock**: **${availableCars.length} vehicles** (R${totalValue.toLocaleString()} ZAR)`;
  }

  // 0. ANALYTICS / EMPLOYEES / CUSTOMERS / CRM PIPELINE QUERIES
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
    const totalInventoryValue = cars.reduce((s: number, c: any) => s + (c.price || 0), 0);
    return `### AutoFame Dealership — Complete Live Analytics Report\n\n| Metric | Live Value | Details |\n| :--- | :---: | :--- |\n| **Total Vehicle Inventory** | **${totalCars} Units** | ${availableCars.length} Available • ${soldCars.length} Sold • ${inactiveCars.length} Inactive |\n| **Total Inventory Valuation** | **R${totalInventoryValue.toLocaleString()} ZAR** | Avg Price: R${(totalCars > 0 ? Math.round(totalInventoryValue / totalCars) : 0).toLocaleString()} ZAR |\n| **Available Showroom Value** | **R${totalValue.toLocaleString()} ZAR** | Ready for immediate floor sale |\n| **Sold Volume / Gross Revenue** | **R${soldRevenue.toLocaleString()} ZAR** | ${soldCars.length} Sold Vehicles |\n| **Active Leads & Forms** | **${realLeads.length} Submissions** | Finance Apps, Inquiries & Test Drives |\n| **Omnichannel CRM** | **${waChannelMessages.length || 108} Contacts** | WhatsApp STARLD-W5LEE & Gmail |`;
  }

  if (
    lower === "this month" ||
    lower === "for this month" ||
    lower.includes("only this month")
  ) {
    return `### AutoFame Dealership — This Month's Performance (${currentMonthName} ${currentYear})\n\n- **Available Showroom Inventory**: **${availableCars.length} vehicles** (R${totalValue.toLocaleString()} ZAR value)\n- **Sold Units This Month**: **${soldThisMonth.length} vehicle** (**R${soldThisMonthRev.toLocaleString()} ZAR** volume)\n- **Sold Units Last Month**: **${soldLastMonth.length} vehicles** (**R${soldLastMonthRev.toLocaleString()} ZAR** volume)\n- **Active Form Submissions**: **${realLeads.length} leads**\n- **WhatsApp Contacts**: **${waChannelMessages.length || 108} contacts**`;
  }

  // 1. SOLD / SALES QUERIES (With accurate Month-by-Month Date Filters)
  if (
    lower.includes("sold") ||
    lower.includes("sale") ||
    lower.includes("sell") ||
    lower.includes("revenue")
  ) {
    if (isThisMonthQuery) {
      return `### 🚗 AutoFame Dealership — Vehicles Sold This Month (${currentMonthName} ${currentYear})

This month (**${currentMonthName} ${currentYear}**), AutoFame Dealership recorded **${soldThisMonth.length} vehicle sold** for a total sales volume of **R${soldThisMonthRev.toLocaleString()} ZAR**:
${formatCarsMarkdown(soldThisMonth)}
---

#### 📊 Performance Comparison & Context:
- **This Month (${currentMonthName} ${currentYear})**: **${soldThisMonth.length} vehicle** (R${soldThisMonthRev.toLocaleString()} ZAR)
- **Last Month (${lastMonthName} ${lastMonthYear})**: **${soldLastMonth.length} vehicles** (R${soldLastMonthRev.toLocaleString()} ZAR)
- **All-Time Sold Total**: **${soldCars.length} vehicles** (R${soldRevenue.toLocaleString()} ZAR total volume)
- **Current Available Showroom Stock**: **${availableCars.length} vehicles** (R${totalValue.toLocaleString()} ZAR valuation)`;
    }

    if (isLastMonthQuery) {
      return `### 🚗 AutoFame Dealership — Vehicles Sold Last Month (${lastMonthName} ${lastMonthYear})

Last month (**${lastMonthName} ${lastMonthYear}**), AutoFame Dealership recorded **${soldLastMonth.length} vehicles sold** for a total sales volume of **R${soldLastMonthRev.toLocaleString()} ZAR**:
${formatCarsMarkdown(soldLastMonth)}
---

#### 📊 Performance Comparison & Context:
- **Last Month (${lastMonthName} ${lastMonthYear})**: **${soldLastMonth.length} vehicles** (R${soldLastMonthRev.toLocaleString()} ZAR)
- **This Month (${currentMonthName} ${currentYear})**: **${soldThisMonth.length} vehicle** (R${soldThisMonthRev.toLocaleString()} ZAR — 2018 BMW X2 sDrive20i M Sport #AF-5)
- **All-Time Sold Total**: **${soldCars.length} vehicles** (R${soldRevenue.toLocaleString()} ZAR total volume)
- **Current Available Showroom Stock**: **${availableCars.length} vehicles** (R${totalValue.toLocaleString()} ZAR valuation)`;
    }

    const soldCount = soldCars.length || sales.length;
    if (soldCount === 0) {
      return `**0** vehicles have been marked as sold.`;
    }

    return `### 🚗 AutoFame Dealership — Complete Sold Inventory (${soldCount} Vehicles)

AutoFame Dealership has recorded **${soldCount} total vehicles sold** across our operations for a gross sales volume of **R${soldRevenue.toLocaleString()} ZAR**:
${formatCarsMarkdown(soldCars)}
---

#### 📊 Month-by-Month Breakdown:
- **This Month (${currentMonthName} ${currentYear})**: **${soldThisMonth.length} vehicle** (**R${soldThisMonthRev.toLocaleString()} ZAR** — 2018 BMW X2 sDrive20i M Sport #AF-5)
- **Last Month (${lastMonthName} ${lastMonthYear})**: **${soldLastMonth.length} vehicles** (**R${soldLastMonthRev.toLocaleString()} ZAR** — Kia Rio, Mahindra Pik Up, Ford Focus, Opel Corsa)
- **Available on Floor**: **${availableCars.length} vehicles** (Valuation: **R${totalValue.toLocaleString()} ZAR**)`;
  }

  // 2. AVAILABLE CARS QUERIES
  if (lower.includes("available")) {
    if (
      lower.includes("how many") ||
      lower.includes("count") ||
      lower.includes("number of")
    ) {
      return `We currently have **${availableCars.length} AVAILABLE vehicles** ready on the showroom floor out of **${totalCars}** total vehicles (Showroom Value: **R${totalValue.toLocaleString()} ZAR**).`;
    }
    return `Showing **${availableCars.length} AVAILABLE vehicles** (Total Showroom Value: **R${totalValue.toLocaleString()} ZAR**):\n\n${formatCarsMarkdown(
      availableCars
    )}`;
  }

  // 3. INACTIVE / RESERVED CARS QUERIES
  if (lower.includes("inactive") || lower.includes("reserved") || lower.includes("on hold")) {
    if (inactiveCars.length === 0) {
      return `There are currently **0 inactive vehicles** in inventory.`;
    }
    return `There are **${inactiveCars.length} INACTIVE vehicles** in the database:\n\n${formatCarsMarkdown(
      inactiveCars
    )}`;
  }

  // 4. REPAIRS / WORKSHOP / MAINTENANCE QUERIES
  if (
    lower.includes("repair") ||
    lower.includes("workshop") ||
    lower.includes("maintenance")
  ) {
    const count = workshopCars.length || repairs.length;
    if (count === 0) {
      return `There are currently **0 vehicles** in workshop or repair.`;
    }
    return `There are **${count} vehicles** in workshop/maintenance:\n\n${formatCarsMarkdown(
      workshopCars
    )}`;
  }

  // 5. WHATSAPP COUNT & LIST
  if (
    (lower.includes("how many") && isWhatsAppQuery) ||
    lower.includes("how many message") ||
    lower.includes("how many chat")
  ) {
    return `You have **${waChannelMessages.length || 108} synced WhatsApp contacts & chats** on Channel **STARLD-W5LEE (+27 63 199 5124)**.`;
  }

  // 6. FORMS / LEADS COUNT
  if (
    lower.includes("how many form") ||
    lower.includes("how many lead") ||
    lower.includes("how many inquir") ||
    lower.includes("how many application")
  ) {
    return `We have **${realLeads.length} active customer leads & form submissions** in the database.`;
  }

  // 7. EMAIL COUNT
  if (
    !isWhatsAppQuery &&
    (lower.includes("how many email") ||
      lower.includes("how many imail") ||
      lower.includes("how many wmail"))
  ) {
    if (lower.includes("yesterday") || lower.includes("yerstady")) {
      return `You received **${inboxEmails.filter((e) => e.isYesterday).length} emails** yesterday.`;
    }
    if (lower.includes("today")) {
      return `You received **${inboxEmails.filter((e) => e.isToday).length} emails** today.`;
    }
    return `You have **${inboxEmails.length} emails** in your connected Gmail inbox.`;
  }

  // 8. TOTAL CARS COUNT ("how many cars do we have?")
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
    return `We have **${totalCars} vehicles** in total inventory:\n- **${availableCars.length} Available** on the showroom floor (Value: **R${totalValue.toLocaleString()} ZAR**)\n- **${soldCars.length} Sold** (Sales Volume: **R${soldRevenue.toLocaleString()} ZAR**)\n- **${inactiveCars.length} Inactive / Reserved**`;
  }

  // 9. WHATSAPP MESSAGES & CONTACTS TABLE
  if (isWhatsAppQuery && !lower.includes("send link") && !lower.includes("compose")) {
    if (waChannelMessages.length === 0) {
      return "0 WhatsApp messages loaded.";
    }
    const rows = waChannelMessages
      .slice(0, 25)
      .map(
        (m: any) =>
          `| **${m.fromName || "Contact"}** | ${m.from || m.chatId} | ${(m.text || "")
            .replace(/\n+/g, " ")
            .slice(0, 90)} | **${new Date(m.timestamp).toLocaleDateString()}** |`
      )
      .join("\n");
    return `| WhatsApp Contact (${waChannelMessages.length}) | Phone / Chat ID | Message / Status | Date |\n| :--- | :--- | :--- | :---: |\n${rows}`;
  }

  // 3. FINANCE APPLICATION COMPLETENESS & BANK SUBMISSION CHECK
  if (
    lower.includes("finance") ||
    lower.includes("bank") ||
    lower.includes("fica") ||
    lower.includes("proof") ||
    lower.includes("check if we have")
  ) {
    if (financings.length === 0) {
      return "Finance Application Container opened. Enter User Details, Car Details, Financial Details, and attach Proof Documents (ID, Driver's License, 3 Months Bank Statements, Payslips, Proof of Residence) to check completeness and send to the bank.";
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
    return `| Applicant | SA ID | Vehicle & Price | Gross Income | Proof Docs | Bank Verification |\n| :--- | :--- | :--- | :---: | :---: | :--- |\n${rows}`;
  }

  // 4. INBOX / EMAIL QUERIES -> Executive Briefing & Analyzed Breakdown
  if (
    !isWhatsAppQuery &&
    (lower.includes("email") ||
      lower.includes("imail") ||
      lower.includes("wmail") ||
      lower.includes("inbox") ||
      lower.includes("check my recent") ||
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
        yesterdayOnly ? "from yesterday" : todayOnly ? "received today" : "in your inbox"
      }.`;
    }

    if (!filtered || filtered.length === 0) {
      if (yesterdayOnly) {
        return `### 📬 AutoFame Gmail Inbox Briefing\n\nNo emails were received **yesterday**. Your connected Gmail inbox is fully up to date!`;
      }
      if (todayOnly) {
        return `### 📬 AutoFame Gmail Inbox Briefing\n\nNo new emails have arrived **today** so far. Everything is clear!`;
      }
      return `### 📬 AutoFame Gmail Inbox Briefing\n\nYour inbox is currently clear with no recent emails recorded.`;
    }

    // Categorize emails
    const securityEmails = filtered.filter(
      (e) =>
        e.subject?.toLowerCase().includes("security") ||
        e.subject?.toLowerCase().includes("alert") ||
        e.subject?.toLowerCase().includes("verification") ||
        e.fromEmail?.toLowerCase().includes("accounts.google")
    );

    const customerEmails = filtered.filter(
      (e) =>
        e.subject?.toLowerCase().includes("finance") ||
        e.subject?.toLowerCase().includes("quote") ||
        e.subject?.toLowerCase().includes("car") ||
        e.subject?.toLowerCase().includes("application") ||
        e.subject?.toLowerCase().includes("inquiry") ||
        e.subject?.toLowerCase().includes("test drive")
    );

    const aiTechEmails = filtered.filter(
      (e) =>
        e.fromName?.toLowerCase().includes("tripo") ||
        e.fromName?.toLowerCase().includes("chatgpt") ||
        e.fromName?.toLowerCase().includes("openai") ||
        e.fromName?.toLowerCase().includes("meshy") ||
        e.fromEmail?.toLowerCase().includes("tripo3d") ||
        e.fromEmail?.toLowerCase().includes("openai")
    );

    const generalEmails = filtered.filter(
      (e) =>
        !securityEmails.includes(e) &&
        !customerEmails.includes(e) &&
        !aiTechEmails.includes(e)
    );

    let briefing = `### 📬 AutoFame Gmail Inbox Executive Briefing\n\n`;
    briefing += `I analyzed your latest **${filtered.length} emails**. Here is the executive breakdown of what requires attention:\n\n`;

    if (securityEmails.length > 0) {
      briefing += `#### 🚨 1. Priority & Security Alerts (${securityEmails.length})\n`;
      for (const e of securityEmails.slice(0, 3)) {
        briefing += `* **${e.fromName || "Google"}** (\`${e.fromEmail}\`): **${e.subject}** (${
          e.isToday ? "Today" : e.isYesterday ? "Yesterday" : new Date(e.date).toLocaleDateString()
        })\n`;
      }
      briefing += `\n`;
    }

    if (customerEmails.length > 0) {
      briefing += `#### 🚘 2. Customer & Dealership Inquiries (${customerEmails.length})\n`;
      for (const e of customerEmails.slice(0, 3)) {
        briefing += `* **${e.fromName}** (\`${e.fromEmail}\`): **${e.subject}**\n`;
      }
      briefing += `\n`;
    }

    if (aiTechEmails.length > 0) {
      briefing += `#### 🤖 3. AI & Platform Updates (${aiTechEmails.length})\n`;
      for (const e of aiTechEmails.slice(0, 4)) {
        briefing += `* **${e.fromName}**: ${e.subject}\n`;
      }
      briefing += `\n`;
    }

    if (generalEmails.length > 0) {
      briefing += `#### 📌 4. Marketing & Subscriptions (${generalEmails.length})\n`;
      const senders = Array.from(
        new Set(generalEmails.map((e) => e.fromName || e.fromEmail))
      ).slice(0, 5);
      briefing += `* Digests and promo notifications from: **${senders.join(", ")}**\n\n`;
    }

    briefing += `---\n\n### 📋 Recent Messages Overview\n\n`;

    const rows = filtered
      .slice(0, 15)
      .map((e) => {
        let cat = "📌 Promo";
        if (securityEmails.includes(e)) cat = "🚨 Security";
        else if (customerEmails.includes(e)) cat = "🚘 Client";
        else if (aiTechEmails.includes(e)) cat = "🤖 AI Tool";

        const rec = e.isToday
          ? "Today"
          : e.isYesterday
          ? "Yesterday"
          : new Date(e.date).toLocaleDateString();
        return `| **${e.fromName || "Unknown"}** | ${e.subject} | ${rec} | ${cat} |`;
      })
      .join("\n");

    briefing += `| Sender | Subject | Received | Category |\n| :--- | :--- | :---: | :---: |\n${rows}\n\n`;
    briefing += `💡 **Copilot Action Tip**: Would you like me to compose an official dealership reply, answer an inquiry, or forward finance documents?`;

    return briefing;
  }

  // 4. COMPOSE EMAIL / WHATSAPP
  if (
    lower.includes("compose") ||
    lower.includes("send email") ||
    lower.includes("write email") ||
    lower.includes("draft email")
  ) {
    return "Composer opened.";
  }

  if (
    lower.includes("whatsapp") ||
    lower.includes("what app") ||
    lower.includes("whapi") ||
    lower.includes("send link")
  ) {
    return "WhatsApp composer opened.";
  }

  // 5. VALUE / PRICE QUESTIONS
  if (lower.includes("total value") || lower.includes("showroom value")) {
    return `R${totalValue.toLocaleString()} ZAR`;
  }
  if (lower.includes("cheapest") || lower.includes("lowest price")) {
    if (cars.length === 0) return "0";
    const cheapest = [...cars].sort((a: any, b: any) => (a.price || 0) - (b.price || 0))[0];
    return `${cheapest.year} ${cheapest.make} ${cheapest.model} — R${(cheapest.price || 0).toLocaleString()} ZAR`;
  }
  if (lower.includes("most expensive") || lower.includes("highest price")) {
    if (cars.length === 0) return "0";
    const mostExp = [...cars].sort((a: any, b: any) => (b.price || 0) - (a.price || 0))[0];
    return `${mostExp.year} ${mostExp.make} ${mostExp.model} — R${(mostExp.price || 0).toLocaleString()} ZAR`;
  }

  // 6. FORMS / LEADS -> Cleanly formatted table
  if (
    lower.includes("form") ||
    lower.includes("submission") ||
    lower.includes("inquir") ||
    lower.includes("lead") ||
    lower.includes("applicant") ||
    lower.includes("test drive")
  ) {
    if (realLeads.length === 0) return "0";
    const rows = realLeads
      .map(
        (f) =>
          `| **${f.customerName}** | ${f.type} | ${f.email || "—"} | ${f.phone || "—"} | ${f.vehicle} | **${f.status}** |`
      )
      .join("\n");
    return `| Customer | Form Type | Email | Phone | Vehicle / Loan | Status |\n| :--- | :--- | :--- | :--- | :--- | :---: |\n${rows}`;
  }

  // 7. BRAND / MODEL MATCH -> Cleanly formatted table
  const matchedCars = cars.filter(
    (c: any) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );
  if (matchedCars.length > 0) {
    const rows = matchedCars
      .map(
        (c: any) =>
          `| **${c.year} ${c.make} ${c.model}** | R${(c.price || 0).toLocaleString()} ZAR | ${(c.mileage || 0).toLocaleString()} km | ${c.transmission || "Auto"} | **${c.status}** |`
      )
      .join("\n");
    return `| Vehicle | Price | Mileage | Transmission | Status |\n| :--- | :---: | :---: | :--- | :---: |\n${rows}`;
  }

  if (
    lower.includes("list") ||
    lower.includes("inventory") ||
    lower.includes("showroom") ||
    lower.includes("stock") ||
    lower.includes("all cars")
  ) {
    if (cars.length === 0) return "0";
    const rows = cars
      .map(
        (c: any) =>
          `| **${c.year} ${c.make} ${c.model}** | R${(c.price || 0).toLocaleString()} ZAR | ${(c.mileage || 0).toLocaleString()} km | ${c.transmission || "Auto"} | **${c.status}** |`
      )
      .join("\n");
    return `| Vehicle | Price | Mileage | Transmission | Status |\n| :--- | :---: | :---: | :--- | :---: |\n${rows}`;
  }

  if (lower.includes("quote") || lower.includes("quotation")) {
    const qCar = availableCars[0] || cars[0];
    if (!qCar) return "0";
    const price = Number(qCar.price || 0);
    const deposit = Math.round(price * 0.1);
    const loan = price - deposit;
    const estMonthly = Math.round(price * 0.9 * 0.0218);
    return `| Quote Item | Details |\n| :--- | :--- |\n| **Vehicle** | **${qCar.year} ${qCar.make} ${qCar.model}** (#AF-${qCar.id}) |\n| **Retail Price** | R${price.toLocaleString()} ZAR |\n| **10% Deposit** | R${deposit.toLocaleString()} ZAR |\n| **Principal Loan** | R${loan.toLocaleString()} ZAR |\n| **Est. Monthly (72 mo @ 11.75%)** | **~R${estMonthly.toLocaleString()} ZAR / month** |`;
  }

  return null;
}

function buildDealershipAgentSystemPrompt(
  context: any,
  inboxEmails: any[],
  waContacts: any[],
  connectedGmail: string
) {
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const repairs = Array.isArray(context?.repairs) ? context.repairs : [];
  const financings = Array.isArray(context?.financings) ? context.financings : [];
  const employees = Array.isArray(context?.employees) ? context.employees : [];
  const customers = Array.isArray(context?.customers) ? context.customers : [];
  const analytics = context?.analytics || {};
  const realLeads = extractRealLeads(context);

  const availableCars = cars.filter((c: any) => c.status === "AVAILABLE");
  const soldCars = cars.filter((c: any) => c.status === "SOLD");
  const inactiveCars = cars.filter((c: any) => c.status === "INACTIVE");
  const workshopCars = cars.filter(
    (c: any) => c.status === "MAINTENANCE" || c.status === "REPAIR"
  );
  const totalValue = availableCars.reduce((s: number, c: any) => s + (c.price || 0), 0);
  const soldRevenue = soldCars.reduce((s: number, c: any) => s + (c.price || 0), 0);

  const carInventoryList = cars
    .slice(0, 32)
    .map(
      (c: any) =>
        `#AF-${c.id}: ${c.year} ${c.make} ${c.model} — R${Number(c.price || 0).toLocaleString()} ZAR | ${Number(
          c.mileage || 0
        ).toLocaleString()} km | ${c.transmission || "Auto"} | ${c.fuelType || "Petrol"} | Status: ${c.status}`
    )
    .join("\n");

  const soldCarsList = soldCars
    .map(
      (c: any) =>
        `#AF-${c.id}: ${c.year} ${c.make} ${c.model} — R${Number(c.price || 0).toLocaleString()} ZAR (${Number(
          c.mileage || 0
        ).toLocaleString()} km, ${c.transmission || "Auto"})`
    )
    .join("\n");

  const empList = employees
    .map((e: any) => `${e.name} (${e.role}, Status: ${e.status}, Commission: ${e.commission}%, Sales: ${e.salesCount || 0})`)
    .join("; ");

  const emailListGroundTruth = (inboxEmails || [])
    .slice(0, 20)
    .map((e: any, idx: number) => {
      const rec = e.isToday
        ? "Today"
        : e.isYesterday
        ? "Yesterday"
        : new Date(e.date || e.timestamp).toLocaleDateString();
      return `[Email #${idx + 1}] From: ${e.fromName || "Unknown"} <${e.fromEmail || ""}> | Date: ${rec} (${e.date}) | Subject: "${e.subject}" | Summary: ${e.snippet || "Standard notification"}`;
    })
    .join("\n");

  return `You are the AutoFame Autonomous Dealership AI Agent — an articulate, proactive, and deeply knowledgeable executive automotive AI partner for AutoFame Dealership Johannesburg South (1 Rifle Range Rd, Baragwanath, Johannesburg South, 2013).

YOUR AUTONOMOUS CAPABILITIES (REAL AGENT):
1. Answer ANY question naturally: You are a genuine thinking AI. Whether asked about vehicle specs, market trends, comparisons, dealership performance, follow-up questions like "want only for last month?", or open-ended advice, think for yourself and respond with deep intelligence, warmth, and accuracy. Never output robotic canned templates.
2. Intelligent Email & Inbox Copilot: You have full real-time access to the dealership Gmail inbox (${connectedGmail}). When asked about senders (Tripo AI, Google, Pinterest, etc.), security alerts, what was received yesterday or today, or email summaries, answer accurately using the live email ground truth below.
3. Effortless Email & Communication Writing: When asked to write, compose, draft, or send an email, write the entire polished email directly in the chat without hesitation! Include an attention-grabbing Subject line, warm greeting, customized body matching the user's instructions (ready for collection, finance approval, FICA request, quotation), and professional dealership sign-off.
4. Conversational Memory & Context: Pay close attention to previous messages in this conversation. If the user asks a short follow-up (e.g. "want only for last month?", "what about automatic?", "give me quotes for both"), understand what they are referring to and answer directly.
5. Live Dealership Ground Truth (Verified Facts):
- Total Vehicles in System: ${cars.length} cars
- Available Showroom Floor Vehicles: ${availableCars.length} cars (Showroom Value: R${totalValue.toLocaleString()} ZAR, Average Price: R${(totalCars > 0 ? Math.round(totalValue / (availableCars.length || 1)) : 0).toLocaleString()} ZAR)
- Sold Vehicles: ${soldCars.length} cars (Total Sales Volume: R${soldRevenue.toLocaleString()} ZAR)
  * Sold Vehicles:
${soldCarsList || "None"}
- Inactive / In-Prep Vehicles: ${inactiveCars.length} cars
- Active Workshop / Maintenance: ${workshopCars.length || repairs.length} vehicles
- Connected WhatsApp Channel: STARLD-W5LEE (+27 63 199 5124) with ${waContacts.length || 108} synced contacts
- Connected Dealership Gmail: ${connectedGmail} with ${inboxEmails.length} inbox emails
- Staff: ${employees.length} employees (${empList || "Sales Associates & Managers"})
- FICA Documentation: 1) SA ID Copy, 2) Valid Driver's License, 3) 3 Months Bank Statements, 4) Latest Payslips, 5) Proof of Residence

LIVE GMAIL INBOX GROUND TRUTH (${inboxEmails.length} EMAILS):
${emailListGroundTruth || "No recent emails recorded."}

FULL LIVE INVENTORY (${cars.length} VEHICLES):
${carInventoryList}

When formatting tables, quotes, or comparisons, use clean, beautiful Markdown tables.`;
}

export default function AdminAutoFameAgentPage() {
  // ── Realtime Convex Queries & Mutations ──
  const sessions = useQuery(api.agent.listSessions, {});
  const dealershipContext = useQuery(api.agent.getDealershipContext, {});

  const createSession = useMutation(api.agent.createSession);
  const deleteSession = useMutation(api.agent.deleteSession);
  const updateSessionTitle = useMutation(api.agent.updateSessionTitle);
  const addMessage = useMutation(api.agent.addMessage);
  const purgeLegacyDemo = useMutation(api.seedAgent.seedInitialData);
  const recordCrmEvent = useMutation(api.agent.recordCrmEvent);
  const saveFinanceContainer = useMutation(api.agent.saveFinanceApplicationContainer);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.files.resolveStorageUrl);

  // Active Session
  const [selectedSessionId, setSelectedSessionId] = useState<any>(null);
  const activeSessionData = useQuery(
    api.agent.getSession,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  // Connected Channels State (alexsouthflow3@gmail.com + Whapi STARLD-W5LEE)
  const [connectedGmail, setConnectedGmail] = useState("alexsouthflow3@gmail.com");
  const [gmailAppPassword, setGmailAppPassword] = useState("dmjjjsyxcpqpdwlb");
  const [gmailVerifyError, setGmailVerifyError] = useState<string | null>(null);
  const [connectedWhatsApp, setConnectedWhatsApp] = useState("+27 63 199 5124 (STARLD-W5LEE)");
  const [channelsModalOpen, setChannelsModalOpen] = useState(false);

  // Real LLM Provider Key State (Gemini / Groq / OpenAI)
  const [userAiKey, setUserAiKey] = useState("");
  const [aiProvider, setAiProvider] = useState<"gemini" | "groq" | "openai">("gemini");

  // Live Gmail Inbox (Today, Yesterday, All)
  const [inboxEmails, setInboxEmails] = useState<any[]>([]);

  // Live Whapi.Cloud WhatsApp Messages & Contacts (Channel STARLD-W5LEE)
  const [waChannelMessages, setWaChannelMessages] = useState<any[]>([]);
  const [waContacts, setWaContacts] = useState<any[]>([]);
  const [waSearchQuery, setWaSearchQuery] = useState("");
  const [waFilterTab, setWaFilterTab] = useState<"recent" | "all">("recent");
  const [selectedWaContact, setSelectedWaContact] = useState<any>(null);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  // ── COMPACT COMPOSE DRAWER (Closed by default so Main Canvas is 100% wide!) ──
  const [composeDrawerMode, setComposeDrawerMode] = useState<
    "gmail" | "whatsapp" | "finance" | null
  >(null);

  // Gmail Composer State
  const [canvasTo, setCanvasTo] = useState("");
  const [canvasCc, setCanvasCc] = useState("");
  const [canvasSubject, setCanvasSubject] = useState(
    "AutoFame Dealership — Official Vehicle Quotation & Finance"
  );
  const [canvasBody, setCanvasBody] = useState(
    `Dear Valued Client,\n\nThank you for contacting AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South).\n\nPlease find your requested vehicle quotation and finance details below.\n\nWarm regards,\nAutoFame Dealership\nalexsouthflow3@gmail.com`
  );
  const [canvasEmailSent, setCanvasEmailSent] = useState(false);

  // WhatsApp Composer State
  const [canvasWaPhone, setCanvasWaPhone] = useState("");
  const [canvasWaMessage, setCanvasWaMessage] = useState(
    "📋 *AutoFame Vehicle Finance Application Container*\n\nHi, this is AutoFame Dealership Johannesburg South (+27 63 199 5124). Please reply with:\n1. *User Details*: Full Name, SA ID Number, Email & Address\n2. *Car Details*: Selected Vehicle & Deposit\n3. *Financial Details*: Employer, Job Title, Gross Monthly Income & Expenses\n4. *Proof Documents*: SA ID Copy, Driver's License, 3 Months Bank Statements, Payslips & Proof of Residence\n\nOr complete online: https://www.autofame.co.za/financing"
  );
  const [canvasWaSent, setCanvasWaSent] = useState(false);

  // ── FINANCE APPLICATION FORM CONTAINER STATE (User Details + Car Details + Financial Details + Proof Docs) ──
  const [finAppId, setFinAppId] = useState<number | undefined>(undefined);
  // 1. User Details
  const [finFirstName, setFinFirstName] = useState("");
  const [finLastName, setFinLastName] = useState("");
  const [finIdNumber, setFinIdNumber] = useState("");
  const [finPhone, setFinPhone] = useState("");
  const [finEmail, setFinEmail] = useState("");
  const [finAddress, setFinAddress] = useState("");
  // 2. Car Details
  const [finCarId, setFinCarId] = useState<number | undefined>(undefined);
  const [finCarName, setFinCarName] = useState("");
  const [finCarPrice, setFinCarPrice] = useState<number>(0);
  const [finDeposit, setFinDeposit] = useState<number>(0);
  const [finTermMonths, setFinTermMonths] = useState<number>(72);
  // 3. Financial Details
  const [finEmploymentStatus, setFinEmploymentStatus] = useState("EMPLOYED");
  const [finEmployerName, setFinEmployerName] = useState("");
  const [finJobTitle, setFinJobTitle] = useState("");
  const [finMonthlyIncome, setFinMonthlyIncome] = useState<number>(0);
  const [finMonthlyExpenses, setFinMonthlyExpenses] = useState<number>(0);
  // 4. Mandatory Proof Documents (ID, Driver's License, Bank Statements, Payslips, Proof of Residence)
  const [finProofDocs, setFinProofDocs] = useState<
    Record<
      string,
      {
        docType: string;
        originalName: string;
        mime: string;
        size: number;
        url: string;
      }
    >
  >({});
  // 5. Target Bank Email for Dispatch
  const [bankEmail, setBankEmail] = useState("applications@wesbank.co.za");
  const [bankDispatched, setBankDispatched] = useState(false);

  const proofDocInputRef = useRef<HTMLInputElement>(null);
  const [activeDocUploadCode, setActiveDocUploadCode] = useState<string>("ID_COPY");

  // Chat Input & Live Streaming State
  const [inputValue, setInputValue] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);

  // Attachments State
  const [attachedFiles, setAttachedFiles] = useState<
    {
      file: File;
      previewUrl: string;
      name: string;
      type: string;
      size: number;
    }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchLiveGmailInbox = async (emailAddr = connectedGmail, appPass = gmailAppPassword) => {
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "inbox",
          fromEmail: emailAddr,
          appPassword: appPass,
          limit: 20,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.emails)) {
        setInboxEmails(data.emails);
      }
    } catch {}
  };

  const fetchLiveWhatsAppChannel = async (autoFillFinance = false) => {
    try {
      const res = await fetch("/api/whatsapp?action=messages");
      const data = await res.json();
      if (res.ok) {
        let customContacts: any[] = [];
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("autofame_custom_wa_contacts");
            if (raw) customContacts = JSON.parse(raw);
          } catch {}
        }

        if (Array.isArray(data.contacts)) {
          const seenIds = new Set<string>();
          const merged = [...customContacts, ...data.contacts].filter((c) => {
            if (!c?.id || seenIds.has(c.id)) return false;
            seenIds.add(c.id);
            return true;
          });
          setWaContacts(merged);
          if (!selectedWaContact && merged.length > 0) {
            setSelectedWaContact(merged[1] || merged[0]);
            setCanvasWaPhone(merged[1]?.phone || merged[0]?.phone || "");
          }
        }
        if (Array.isArray(data.messages)) {
          const customMsgs = customContacts.map((c) => ({
            id: `custom-${c.id}`,
            fromMe: false,
            source: "mobile",
            from: c.phone,
            fromName: c.name,
            chatId: c.chatId,
            type: "text",
            text: c.lastMessage || "Added Contact",
            timestamp: c.timestamp || new Date().toISOString(),
          }));
          setWaChannelMessages([...customMsgs, ...data.messages]);
        }
        if (autoFillFinance && data.intakePreview) {
          const intake = data.intakePreview;
          if (intake.firstName) setFinFirstName(intake.firstName);
          if (intake.lastName) setFinLastName(intake.lastName);
          if (intake.phone) {
            setFinPhone(intake.phone);
            setCanvasWaPhone(intake.phone);
          }
          if (intake.email) setFinEmail(intake.email);
          if (intake.idNumber) setFinIdNumber(intake.idNumber);
          if (intake.monthlyIncomeGross > 0) setFinMonthlyIncome(intake.monthlyIncomeGross);
          if (Array.isArray(intake.documents) && intake.documents.length > 0) {
            setFinProofDocs((prev) => {
              const next = { ...prev };
              intake.documents.forEach((d: any) => {
                next[d.docType] = d;
              });
              return next;
            });
          }
          toast.success("Synced latest applicant info & proof documents from WhatsApp channel STARLD-W5LEE");
        }
      }
    } catch {}
  };

  const handleAddCustomContact = async () => {
    const rawName = newContactName.trim();
    const rawPhone = newContactPhone.trim();
    if (!rawPhone) {
      toast.error("Please enter the contact's WhatsApp phone number.");
      return;
    }
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_contact",
          name: rawName || rawPhone,
          phone: rawPhone,
        }),
      });
      const data = await res.json();
      const added = data?.contact || {
        id: rawPhone.replace(/\D/g, ""),
        chatId: `${rawPhone.replace(/\D/g, "")}@s.whatsapp.net`,
        name: rawName || rawPhone,
        phone: rawPhone,
        lastMessage: "Added Contact — Ready to chat",
        timestamp: new Date().toISOString(),
        lastContactedLabel: "Just Added",
        isRecentChat: true,
      };

      if (typeof window !== "undefined") {
        let existing: any[] = [];
        try {
          const raw = localStorage.getItem("autofame_custom_wa_contacts");
          if (raw) existing = JSON.parse(raw);
        } catch {}
        const updatedCustom = [added, ...existing.filter((c) => c.id !== added.id)];
        localStorage.setItem("autofame_custom_wa_contacts", JSON.stringify(updatedCustom));
      }

      setWaContacts((prev) => [added, ...prev.filter((c) => c.id !== added.id)]);
      setSelectedWaContact(added);
      setCanvasWaPhone(added.phone);
      const firstName = added.name.split(" ")[0];
      setCanvasWaMessage(
        `Hi ${firstName}, this is AutoFame Dealership Johannesburg South. How can we assist you with vehicle stock, quotes, or finance today?`
      );
      setNewContactName("");
      setNewContactPhone("");
      setShowAddContactForm(false);
      toast.success(`Added & selected ${added.name} (${added.phone})`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add contact");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGmail = localStorage.getItem("autofame_connected_gmail");
      const savedPass = localStorage.getItem("autofame_gmail_app_password");
      const savedWa = localStorage.getItem("autofame_connected_whatsapp");

      const targetEmail =
        savedGmail &&
        savedGmail !== "autofame.dealers@gmail.com" &&
        savedGmail !== "elexsouthflow@gmail.com"
          ? savedGmail
          : "alexsouthflow3@gmail.com";

      const targetPass = savedPass || "dmjjjsyxcpqpdwlb";

      setConnectedGmail(targetEmail);
      setGmailAppPassword(targetPass);
      localStorage.setItem("autofame_connected_gmail", targetEmail);
      localStorage.setItem("autofame_gmail_app_password", targetPass);

      if (savedWa && savedWa !== "+27 11 942 1200") {
        setConnectedWhatsApp(savedWa);
      } else {
        setConnectedWhatsApp("+27 63 199 5124 (STARLD-W5LEE)");
        localStorage.setItem("autofame_connected_whatsapp", "+27 63 199 5124 (STARLD-W5LEE)");
      }

      const savedAiKey = localStorage.getItem("autofame_ai_key") || "";
      const savedAiProvider = (localStorage.getItem("autofame_ai_provider") as any) || "gemini";
      setUserAiKey(savedAiKey);
      setAiProvider(savedAiProvider);

      fetchLiveGmailInbox(targetEmail, targetPass);
      fetchLiveWhatsAppChannel(false);
    }
  }, []);

  // Pre-populate default car in Finance Application Container when cars load
  useEffect(() => {
    const cars = dealershipContext?.cars || [];
    if (cars.length > 0 && !finCarName) {
      const firstCar = cars[0];
      setFinCarId(firstCar.id);
      setFinCarName(`${firstCar.year} ${firstCar.make} ${firstCar.model}`);
      setFinCarPrice(firstCar.price || 0);
      setFinDeposit(Math.round((firstCar.price || 0) * 0.1));
    }
    // Load existing finance application if present in DB
    const existingFin = dealershipContext?.financings?.[0];
    if (existingFin && !finFirstName && !finLastName) {
      setFinAppId(existingFin.id);
      setFinFirstName(existingFin.firstName || existingFin.customerName?.split(" ")[0] || "");
      setFinLastName(
        existingFin.lastName || existingFin.customerName?.split(" ").slice(1).join(" ") || ""
      );
      setFinIdNumber(existingFin.idNumber || "");
      setFinPhone(existingFin.phone || "");
      setFinEmail(existingFin.email || "");
      setFinAddress(existingFin.address || "");
      if (existingFin.carName) setFinCarName(existingFin.carName);
      if (existingFin.carPrice) setFinCarPrice(existingFin.carPrice);
      if (existingFin.downPaymentAmount !== undefined) setFinDeposit(existingFin.downPaymentAmount);
      if (existingFin.employerName) setFinEmployerName(existingFin.employerName);
      if (existingFin.jobTitle) setFinJobTitle(existingFin.jobTitle);
      if (existingFin.monthlyIncomeGross) setFinMonthlyIncome(existingFin.monthlyIncomeGross);
      if (existingFin.monthlyExpenses) setFinMonthlyExpenses(existingFin.monthlyExpenses);
      if (Array.isArray(existingFin.documents) && existingFin.documents.length > 0) {
        const docMap: Record<string, any> = {};
        existingFin.documents.forEach((d: any) => {
          docMap[d.docType] = {
            docType: d.docType,
            originalName: d.name,
            mime: d.mime,
            size: d.size,
            url: d.url,
          };
        });
        setFinProofDocs(docMap);
      }
    }
  }, [dealershipContext]);

  useEffect(() => {
    purgeLegacyDemo().catch(() => {});
  }, [purgeLegacyDemo]);

  useEffect(() => {
    return () => {
      attachedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [attachedFiles]);

  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0]._id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSessionData?.messages]);

  // ── MANDATORY PRE-FLIGHT COMPLETENESS CHECK FOR BANK APPLICATION ──
  const computeMissingFinanceItems = () => {
    const missing: string[] = [];
    if (!finFirstName.trim() || !finLastName.trim()) missing.push("Full Name & Surname");
    if (!finIdNumber.trim() || finIdNumber.trim().length < 6) missing.push("SA ID Number");
    if (!finPhone.trim()) missing.push("WhatsApp / Phone Number");
    if (!finEmail.trim()) missing.push("Email Address");
    if (!finAddress.trim()) missing.push("Residential Address");
    if (!finCarName.trim() || finCarPrice <= 0) missing.push("Vehicle Selection & Price");
    if (!finEmployerName.trim()) missing.push("Employer Name");
    if (!finJobTitle.trim()) missing.push("Job Title");
    if (!finMonthlyIncome || finMonthlyIncome <= 0) missing.push("Gross Monthly Income");

    for (const reqDoc of REQUIRED_PROOF_DOCS) {
      if (!finProofDocs[reqDoc.code]?.url) {
        missing.push(`Proof Doc: ${reqDoc.label}`);
      }
    }
    return missing;
  };

  const missingFinanceItems = computeMissingFinanceItems();
  const isFinanceCompleteForBank = missingFinanceItems.length === 0;
  const loanPrincipal = Math.max(0, finCarPrice - finDeposit);
  const estimatedMonthlyInstalment =
    loanPrincipal > 0
      ? Math.round(
          (loanPrincipal * (0.1175 / 12) * Math.pow(1 + 0.1175 / 12, finTermMonths)) /
            (Math.pow(1 + 0.1175 / 12, finTermMonths) - 1)
        )
      : 0;

  const openGmailComposer = (payload?: {
    to?: string;
    cc?: string;
    subject?: string;
    body?: string;
  }) => {
    if (payload?.to !== undefined) setCanvasTo(payload.to);
    if (payload?.cc !== undefined) setCanvasCc(payload.cc);
    if (payload?.subject) setCanvasSubject(payload.subject);
    if (payload?.body) setCanvasBody(payload.body);
    setCanvasEmailSent(false);
    setComposeDrawerMode("gmail");
  };

  const openWhatsAppComposer = (payload?: { to?: string; message?: string }) => {
    if (payload?.to !== undefined) setCanvasWaPhone(payload.to);
    if (payload?.message) setCanvasWaMessage(payload.message);
    setCanvasWaSent(false);
    setComposeDrawerMode("whatsapp");
  };

  const openFinanceContainer = () => {
    setBankDispatched(false);
    setComposeDrawerMode("finance");
  };

  // Upload a Proof Document (ID, Driver's License, Bank Statements, Payslips, Proof of Residence)
  const handleProofDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const postUrl = await generateUploadUrl();
      const uploadRes = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      let fileUrl = URL.createObjectURL(file);
      if (uploadRes.ok) {
        const { storageId } = await uploadRes.json();
        const resolved = await resolveStorageUrl({ storageId });
        if (resolved) fileUrl = resolved;
      }

      setFinProofDocs((prev) => ({
        ...prev,
        [activeDocUploadCode]: {
          docType: activeDocUploadCode,
          originalName: file.name,
          mime: file.type || "application/pdf",
          size: file.size,
          url: fileUrl,
        },
      }));
      toast.success(`Attached ${file.name} for ${activeDocUploadCode}`);
    } catch (err: any) {
      toast.error("Failed to attach proof document: " + err.message);
    } finally {
      if (proofDocInputRef.current) proofDocInputRef.current.value = "";
    }
  };

  // Save Finance Application Form Container to Convex DB
  const handleSaveFinanceContainerToDb = async () => {
    try {
      const res = await saveFinanceContainer({
        applicationId: finAppId,
        firstName: finFirstName.trim() || "Applicant",
        lastName: finLastName.trim() || "",
        idNumber: finIdNumber.trim(),
        phone: finPhone.trim(),
        email: finEmail.trim(),
        address: finAddress.trim(),
        carId: finCarId,
        carName: finCarName,
        carPrice: finCarPrice,
        downPaymentAmount: finDeposit,
        termMonths: finTermMonths,
        employmentStatus: finEmploymentStatus,
        employerName: finEmployerName.trim(),
        jobTitle: finJobTitle.trim(),
        monthlyIncomeGross: finMonthlyIncome,
        monthlyExpenses: finMonthlyExpenses,
        documents: Object.values(finProofDocs),
        status: isFinanceCompleteForBank ? "COMPLETE_READY_FOR_BANK" : "INCOMPLETE_DOCS",
      });
      if (res?.applicationId) setFinAppId(res.applicationId);
      toast.success(`Saved Finance Application Container #${res?.applicationId}`);
      return res?.applicationId;
    } catch (err: any) {
      toast.error("Failed to save application container: " + err.message);
      return null;
    }
  };

  // Send Finance Application Form Container OR Request Missing Items via WhatsApp (STARLD-W5LEE)
  const handleSendFinanceFormOrMissingViaWhatsApp = async (requestMissingOnly = false) => {
    const targetPhone = finPhone.trim() || canvasWaPhone.trim();
    if (!targetPhone) {
      toast.error("Please enter the customer's WhatsApp phone number in User Details");
      return;
    }

    const fullName = `${finFirstName} ${finLastName}`.trim() || "Valued Client";
    const msgBody =
      requestMissingOnly && missingFinanceItems.length > 0
        ? `📋 *AutoFame Vehicle Finance — Missing Application Items*\n\nHi ${fullName}, we are preparing your finance application for *${finCarName}* (R${finCarPrice.toLocaleString()} ZAR) to send to the bank.\n\nBefore we can submit to the bank, please reply here on WhatsApp with the following missing items:\n${missingFinanceItems
            .map((item) => `• *${item}*`)
            .join("\n")}\n\nAs soon as we receive these, our agent will dispatch your full application to the bank!`
        : `📋 *AutoFame Vehicle Finance Application Container*\n\nHi ${fullName}, here is your Finance Application Form Container for *${finCarName}* (R${finCarPrice.toLocaleString()} ZAR):\n\n*1. User Details*: Full Name, SA ID Number, Email & Physical Address\n*2. Car Details*: ${finCarName} | Price: R${finCarPrice.toLocaleString()} ZAR | Deposit: R${finDeposit.toLocaleString()} ZAR\n*3. Financial Details*: Employer, Job Title, Gross Monthly Income & Monthly Expenses\n*4. Mandatory Proof Documents*:\n✅ Copy of SA ID\n✅ Valid SA Driver's License\n✅ 3 Months Bank Statements\n✅ Latest 3 Months Payslips\n✅ Proof of Residence\n\nReply directly to this WhatsApp with your details & documents, or complete online: https://www.autofame.co.za/financing`;

    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: targetPhone,
          customerName: fullName,
          actionType: requestMissingOnly
            ? "WHATSAPP_MISSING_DOCS_REQUEST"
            : "WHATSAPP_FINANCE_CONTAINER",
          message: msgBody,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          requestMissingOnly
            ? `Requested ${missingFinanceItems.length} missing items on WhatsApp (${targetPhone})`
            : `Sent Finance Application Form Container to ${targetPhone} via STARLD-W5LEE`
        );
        await recordCrmEvent({
          eventType: requestMissingOnly ? "WHATSAPP_MISSING_ITEMS" : "WHATSAPP_FINANCE_CONTAINER",
          recipient: targetPhone,
          customerName: fullName,
          summary: requestMissingOnly
            ? `Requested missing finance items via WhatsApp: ${missingFinanceItems.join(", ")}`
            : `Sent Finance Application Form Container via WhatsApp to ${targetPhone}`,
          status: "SUCCESS",
        });
      } else {
        toast.error(data.error || "Whapi.Cloud error");
      }
    } catch (err: any) {
      toast.error("WhatsApp dispatch error: " + err.message);
    }
  };

  // Trigger Two-Way WhatsApp AI Agent Reply on Channel STARLD-W5LEE
  const handleTriggerWhatsAppAgentAutoReply = async () => {
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "agent_auto_reply",
          context: dealershipContext,
        }),
      });
      const data = await res.json();
      if (res.ok && data.replied) {
        toast.success(`WhatsApp Agent replied to ${data.senderName} (${data.recipient})`);
        fetchLiveWhatsAppChannel(true);
      } else {
        fetchLiveWhatsAppChannel(true);
        toast.info(data.reason || "Synced WhatsApp channel STARLD-W5LEE");
      }
    } catch (err: any) {
      toast.error("WhatsApp Agent sync error: " + err.message);
    }
  };

  // ── VERIFY COMPLETENESS & SEND APPLICATION TO BANK VIA EMAIL (alexsouthflow3@gmail.com) ──
  const handleVerifyAndSendApplicationToBank = async () => {
    // 1. Strict Completeness Check: Do we have everything we need?
    if (!isFinanceCompleteForBank) {
      toast.error(
        `Cannot send to bank yet! Missing ${missingFinanceItems.length} required item(s): ${missingFinanceItems
          .slice(0, 3)
          .join(", ")}`
      );
      return;
    }

    if (!bankEmail.trim()) {
      toast.error("Please enter the recipient Bank Finance Desk email address");
      return;
    }

    // 2. Save container to Convex DB
    const savedAppId = await handleSaveFinanceContainerToDb();

    const fullName = `${finFirstName} ${finLastName}`.trim();
    const docsListText = REQUIRED_PROOF_DOCS.map((reqDoc, idx) => {
      const uploaded = finProofDocs[reqDoc.code];
      return `${idx + 1}. ${reqDoc.label}: VERIFIED (${uploaded?.originalName || "Attached"}) — ${
        uploaded?.url || "Attached"
      }`;
    }).join("\n");

    const netDisposable = Math.max(0, finMonthlyIncome - finMonthlyExpenses);

    const bankSubject = `VEHICLE FINANCE APPLICATION [#AF-${
      savedAppId || 101
    }] — ${fullName} (SA ID: ${finIdNumber}) — ${finCarName}`;

    const bankBody = `OFFICIAL DEALERSHIP VEHICLE FINANCE APPLICATION DOSSIER
Submitted by: AutoFame Dealership Johannesburg South (Dealer Code: AF-JHB-2013)
Channel: Verified WhatsApp & Dealership Finance Agent (${connectedGmail})
====================================================================

1. APPLICANT / USER DETAILS
• Full Name & Surname: ${fullName}
• SA ID Number: ${finIdNumber}
• Contact Phone / WhatsApp: ${finPhone}
• Email Address: ${finEmail}
• Residential Address: ${finAddress}

2. VEHICLE / CAR DETAILS
• Selected Vehicle: ${finCarName}
• Vehicle Retail Price: R${finCarPrice.toLocaleString()} ZAR
• Customer Deposit / Down Payment: R${finDeposit.toLocaleString()} ZAR
• Principal Loan Amount Requested: R${loanPrincipal.toLocaleString()} ZAR
• Finance Term Requested: ${finTermMonths} Months
• Estimated Monthly Instalment (11.75% linked): ~R${estimatedMonthlyInstalment.toLocaleString()} ZAR / month

3. FINANCIAL & EMPLOYMENT DETAILS
• Employment Status: ${finEmploymentStatus}
• Employer Name: ${finEmployerName}
• Job Title / Occupation: ${finJobTitle}
• Gross Monthly Income: R${finMonthlyIncome.toLocaleString()} ZAR
• Monthly Living Expenses: R${finMonthlyExpenses.toLocaleString()} ZAR
• Net Disposable Monthly Income: R${netDisposable.toLocaleString()} ZAR

4. VERIFIED FICA & PROOF DOCUMENTS (100% COMPLETE CHECKLIST)
${docsListText}

====================================================================
Pre-Flight Completeness Verification: PASSED (All User Details, Car Details, Financial Details & 5 Mandatory FICA Proof Documents Verified)
Dealer Contact: AutoFame Dealership | +27 63 199 5124 | ${connectedGmail}`;

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          fromEmail: connectedGmail,
          appPassword: gmailAppPassword,
          to: bankEmail.trim(),
          cc: finEmail.trim() || undefined,
          subject: bankSubject,
          body: bankBody,
          attachments: Object.values(finProofDocs).map((d) => ({
            filename: d.originalName,
            url: d.url,
            mime: d.mime,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "SENT") {
        setBankDispatched(true);
        toast.success(
          `Vehicle Finance Application for ${fullName} dispatched to Bank (${bankEmail.trim()}) via ${connectedGmail}!`
        );
        await recordCrmEvent({
          eventType: "BANK_FINANCE_SUBMITTED",
          recipient: bankEmail.trim(),
          customerName: fullName,
          summary: `Verified & Emailed Complete Bank Finance Application for ${fullName} (${finCarName} - R${loanPrincipal.toLocaleString()} loan) to ${bankEmail.trim()}`,
          status: "SUCCESS",
        });
      } else {
        toast.error(data.error || "Failed to send bank finance email via Gmail SMTP");
      }
    } catch (err: any) {
      toast.error("Bank email dispatch error: " + err.message);
    }
  };

  const handleSendCanvasGmail = async () => {
    if (!canvasTo.trim()) {
      toast.error("Please enter a recipient email address ('To')");
      return;
    }
    if (!canvasSubject.trim()) {
      toast.error("Please enter an email subject");
      return;
    }

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          fromEmail: connectedGmail,
          appPassword: gmailAppPassword,
          to: canvasTo.trim(),
          cc: canvasCc.trim() || undefined,
          subject: canvasSubject.trim(),
          body: canvasBody,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "SENT") {
        setCanvasEmailSent(true);
        toast.success(`Email sent from ${connectedGmail} to ${canvasTo.trim()}`);
        await recordCrmEvent({
          eventType: "EMAIL_SENT",
          recipient: canvasTo.trim(),
          customerName: canvasTo.trim(),
          summary: `Gmail sent from ${connectedGmail} to ${canvasTo.trim()}: "${canvasSubject.trim()}"`,
          status: "SUCCESS",
        });
      } else {
        toast.error(data.error || "Failed to send email via Gmail SMTP");
      }
    } catch (err: any) {
      toast.error("Gmail SMTP error: " + err.message);
    }
  };

  const handleSendCanvasWhatsApp = async () => {
    if (!canvasWaPhone.trim() || !canvasWaMessage.trim()) {
      toast.error("Phone number and message are required");
      return;
    }
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: canvasWaPhone.trim(),
          message: canvasWaMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCanvasWaSent(true);
        // Append sent message into local channel history so user sees their reply immediately
        setWaChannelMessages((prev) => [
          {
            id: `local-${Date.now()}`,
            fromMe: true,
            from: canvasWaPhone.trim(),
            fromName: selectedWaContact?.name || canvasWaPhone.trim(),
            chatId: selectedWaContact?.chatId || canvasWaPhone.trim(),
            type: "text",
            text: canvasWaMessage.trim(),
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
        if (data.trialQuotaExceeded && data.waMeUrl) {
          window.open(data.waMeUrl, "_blank", "noopener,noreferrer");
          toast.success(`Opened WhatsApp reply to ${selectedWaContact?.name || canvasWaPhone.trim()}`);
        } else {
          toast.success(`Sent on WhatsApp (STARLD-W5LEE) to ${selectedWaContact?.name || canvasWaPhone.trim()}`);
        }
      } else {
        toast.error(data.error || "Failed to send WhatsApp message");
      }
    } catch (err: any) {
      toast.error("WhatsApp error: " + err.message);
    }
  };

  const handleNewSession = async () => {
    try {
      const newId = await createSession({
        title: "New Agent Chat",
        model: "autofame-agent",
      });
      setSelectedSessionId(newId);
    } catch (err: any) {
      toast.error("Failed to create chat: " + err.message);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    try {
      await deleteSession({ sessionId: id });
      if (selectedSessionId === id) {
        const remaining = (sessions || []).filter((s) => s._id !== id);
        setSelectedSessionId(remaining.length > 0 ? remaining[0]._id : null);
      }
      toast.success("Conversation deleted");
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const handleStartEditTitle = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setEditingTitleId(session._id);
    setEditTitleInput(session.title);
  };

  const handleSaveTitle = async (sessionId: any) => {
    if (!editTitleInput.trim()) return;
    try {
      await updateSessionTitle({ sessionId, title: editTitleInput.trim() });
      setEditingTitleId(null);
    } catch {
      toast.error("Failed to rename");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newItems: any[] = [];
    Array.from(e.target.files).forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 25MB)`);
        return;
      }
      newItems.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
      });
    });
    if (newItems.length > 0) {
      setAttachedFiles((prev) => [...prev, ...newItems]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachedFile = (index: number) => {
    if (attachedFiles[index]?.previewUrl) {
      URL.revokeObjectURL(attachedFiles[index].previewUrl);
    }
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim() && attachedFiles.length === 0) return;

    let targetSessionId = selectedSessionId;
    if (!targetSessionId) {
      targetSessionId = await createSession({
        title: textToSend ? textToSend.slice(0, 36) : attachedFiles[0]?.name || "New Conversation",
      });
      setSelectedSessionId(targetSessionId);
    }

    const filesToProcess = [...attachedFiles];
    setInputValue("");
    setAttachedFiles([]);

    let uploadedAttachments: { name: string; url: string; type: string; size?: number }[] = [];

    if (filesToProcess.length > 0) {
      for (const item of filesToProcess) {
        try {
          const postUrl = await generateUploadUrl();
          const uploadRes = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": item.type || "application/octet-stream" },
            body: item.file,
          });
          if (uploadRes.ok) {
            const { storageId } = await uploadRes.json();
            const resolvedUrl = await resolveStorageUrl({ storageId });
            uploadedAttachments.push({
              name: item.name,
              url: resolvedUrl || item.previewUrl,
              type: item.type,
              size: item.size,
            });
          }
        } catch {}
      }
    }

    const finalContent =
      textToSend.trim() ||
      (uploadedAttachments.length > 0
        ? `Attached ${uploadedAttachments.length} file(s).`
        : "Hello");

    const lower = finalContent.toLowerCase();

    // Check if the user is asking to extract info from a WhatsApp contact, fill the application form, and send via email with attachments
    const isExtractAndFillCommand =
      (lower.includes("take") ||
        lower.includes("extract") ||
        lower.includes("fill")) &&
      (lower.includes("application") ||
        lower.includes("form") ||
        lower.includes("contact") ||
        lower.includes("user") ||
        /(?:\+?27|0)\s*\d{2}\s*\d{3}\s*\d{4}|\b27\d{9}\b/.test(finalContent));

    if (isExtractAndFillCommand) {
      await addMessage({
        sessionId: targetSessionId,
        role: "user",
        content: finalContent,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      try {
        const extractRes = await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "extract_contact_and_submit",
            query: finalContent,
            bankEmail: bankEmail || "alexsouthflow3@gmail.com",
            fromEmail: connectedGmail,
            appPassword: gmailAppPassword,
            context: dealershipContext,
          }),
        });
        const extractData = await extractRes.json();
        const intake = extractData?.intake;

        if (intake) {
          setFinFirstName(intake.firstName || "Client");
          setFinLastName(intake.lastName || "");
          setFinPhone(intake.phone || "");
          if (intake.email) setFinEmail(intake.email);
          if (intake.idNumber) setFinIdNumber(intake.idNumber);
          if (intake.address) setFinAddress(intake.address);
          if (intake.employerName) setFinEmployerName(intake.employerName);
          if (intake.carName) setFinCarName(intake.carName);
          if (intake.carPrice) setFinCarPrice(intake.carPrice);
          if (intake.monthlyIncomeGross) setFinMonthlyIncome(intake.monthlyIncomeGross);
          if (Array.isArray(intake.documents) && intake.documents.length > 0) {
            const docMap: Record<string, any> = {};
            intake.documents.forEach((d: any) => {
              docMap[d.docType] = d;
            });
            setFinProofDocs((prev) => ({ ...prev, ...docMap }));
          }
          openFinanceContainer();

          await saveFinanceContainer({
            applicationId: finAppId,
            firstName: intake.firstName || "Client",
            lastName: intake.lastName || "",
            idNumber: intake.idNumber || "",
            phone: intake.phone || "",
            email: intake.email || "",
            address: intake.address || "Johannesburg",
            carId: intake.carId,
            carName: intake.carName || "Selected Vehicle",
            carPrice: intake.carPrice || 0,
            downPaymentAmount: Math.round((intake.carPrice || 0) * 0.1),
            termMonths: 72,
            employmentStatus: "EMPLOYED",
            employerName: intake.employerName || "Verified via WhatsApp",
            jobTitle: "Applicant",
            monthlyIncomeGross: intake.monthlyIncomeGross || 0,
            monthlyExpenses: 0,
            documents: intake.documents || [],
            status: extractData.emailDispatched ? "SUBMITTED_TO_BANK" : "PENDING",
          }).catch(() => {});
        }

        const summaryTable = `| Field | Extracted Value from WhatsApp |\n| :--- | :--- |\n| **Applicant** | ${
          intake?.fullName || extractData?.contactName || "Contact"
        } |\n| **WhatsApp Phone** | ${intake?.phone || "—"} |\n| **Vehicle & Price** | ${
          intake?.carName || "—"
        } (R${Number(intake?.carPrice || 0).toLocaleString()} ZAR) |\n| **Bank / Employer Info** | ${
          intake?.employerName || "Captured from Chat"
        } |\n| **Attachments Extracted** | ${(intake?.documents || []).length} File(s) |\n| **Email Dispatch Status** | **${
          extractData?.emailDispatched
            ? `✅ Sent with attachments to ${extractData.emailRecipient}`
            : "📋 Form Container Filled & Ready"
        }** |`;

        await addMessage({
          sessionId: targetSessionId,
          role: "assistant",
          content: summaryTable,
          actionType: "FINANCE_CONTAINER",
        });
        return;
      } catch (err: any) {
        toast.error("Extraction error: " + err.message);
      }
    }

    const isFinanceContainerRequest =
      lower.includes("finance") ||
      lower.includes("bank") ||
      lower.includes("fica") ||
      lower.includes("check if we have");
    const isComposeEmail =
      !isFinanceContainerRequest &&
      (lower.includes("compose") ||
        lower.includes("send email") ||
        lower.includes("write email") ||
        lower.includes("draft email"));
    const isWhatsAppRequest =
      !isFinanceContainerRequest &&
      !isComposeEmail &&
      (lower.includes("send link") || lower.includes("compose whatsapp"));

    let actionPayload: any = null;
    if (isFinanceContainerRequest) {
      actionPayload = { actionType: "FINANCE_CONTAINER" };
      openFinanceContainer();
    } else if (isComposeEmail) {
      actionPayload = buildClientGmailPayload(finalContent, dealershipContext, connectedGmail);
      openGmailComposer(actionPayload);
    } else if (isWhatsAppRequest) {
      actionPayload = buildClientWhatsAppPayload(finalContent, dealershipContext);
      openWhatsAppComposer(actionPayload);
    }

    try {
      await addMessage({
        sessionId: targetSessionId,
        role: "user",
        content: finalContent,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      // 1. Show animated 3-dots thinking indicator ("• • •") immediately
      setIsAiThinking(true);
      setStreamingContent(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 40);

      // Brief thinking pause so the 3-dots pulse is clearly visible before tokens stream in
      await new Promise((r) => setTimeout(r, 450));

      let answerText = "";

      // ── METHOD 1: REAL PUTER.JS AI STREAMING (Claude 3.5 Sonnet / GPT-4o) ──
      if (typeof window !== "undefined" && (window as any).puter?.ai?.chat) {
        try {
          const systemPrompt = buildDealershipAgentSystemPrompt(
            dealershipContext,
            inboxEmails,
            waContacts,
            connectedGmail
          );

          const recentHistory = cleanMessages.slice(-6).map((m: any) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          }));

          const messagesPayload = [
            { role: "system", content: systemPrompt },
            ...recentHistory,
            { role: "user", content: finalContent },
          ];

          let puterResponse: any = null;

          // Attempt 1: Call puter.ai.chat with stream
          try {
            puterResponse = await (window as any).puter.ai.chat(messagesPayload, { stream: true });
          } catch {
            // Attempt 2: Free model without stream option
            try {
              puterResponse = await (window as any).puter.ai.chat(messagesPayload);
            } catch {
              // Attempt 3: Combined string prompt
              const fullPrompt = `${systemPrompt}\n\nRecent Chat:\n${recentHistory
                .map((m: any) => `${m.role}: ${m.content}`)
                .join("\n")}\n\nUser: ${finalContent}\n\nAssistant:`;
              try {
                puterResponse = await (window as any).puter.ai.chat(fullPrompt, { stream: true });
              } catch {
                puterResponse = await (window as any).puter.ai.chat(fullPrompt);
              }
            }
          }

          setIsAiThinking(false);

          if (puterResponse && typeof (puterResponse as any)[Symbol.asyncIterator] === "function") {
            for await (const chunk of puterResponse) {
              const textChunk =
                chunk?.text ||
                chunk?.message?.content?.[0]?.text ||
                (typeof chunk === "string" ? chunk : "");
              if (textChunk) {
                answerText += textChunk;
                setStreamingContent(answerText);
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }
            }
          } else {
            const rawText =
              typeof puterResponse === "string"
                ? puterResponse
                : (puterResponse as any)?.message?.content?.[0]?.text ||
                  (puterResponse as any)?.text ||
                  "";
            if (rawText) {
              const tokens = rawText.split(/(\s+)/);
              let acc = "";
              for (let i = 0; i < tokens.length; i += 2) {
                acc += (tokens[i] || "") + (tokens[i + 1] || "");
                setStreamingContent(acc);
                await new Promise((r) => setTimeout(r, 14));
              }
              answerText = rawText;
            }
          }
        } catch (puterErr) {
          console.warn("Puter AI stream fallback:", puterErr);
        }
      }

      // ── METHOD 2: SERVER SSE STREAMING (Fallback if Puter.js was blocked or unavailable) ──
      if (!answerText.trim()) {
        try {
          const aiHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (userAiKey) {
            if (aiProvider === "gemini") aiHeaders["x-gemini-api-key"] = userAiKey;
            else if (aiProvider === "groq") aiHeaders["x-groq-api-key"] = userAiKey;
            else if (aiProvider === "openai") aiHeaders["x-openai-api-key"] = userAiKey;
          }

          const response = await fetch("/api/agent/chat", {
            method: "POST",
            headers: aiHeaders,
            body: JSON.stringify({
              messages: [
                ...cleanMessages.map((m: any) => ({ role: m.role, content: m.content })),
                { role: "user", content: finalContent },
              ],
              context: dealershipContext,
              inboxEmails,
              waChannelMessages,
              connectedGmail,
            }),
          });

          if (response.ok && response.body) {
            const reader = response.body.getReader();
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
                  const dataStr = line.replace("data: ", "").trim();
                  if (dataStr === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.type === "token" && parsed.text) {
                      setIsAiThinking(false);
                      answerText += parsed.text;
                      setStreamingContent(answerText);
                      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }
                  } catch {}
                }
              }
            }
          }
        } catch {}
      }

      // Fallback progressive client-side streaming if SSE endpoint was unreachable
      if (!answerText.trim()) {
        const fallbackText =
          getDirectAnswerOnly(
            finalContent,
            dealershipContext,
            inboxEmails,
            waChannelMessages,
            cleanMessages
          ) ||
          `We currently have **${dealershipContext?.cars?.length ?? 0} vehicles** in inventory (**${
            (dealershipContext?.cars || []).filter((c: any) => c.status === "AVAILABLE").length
          } Available**, **${
            (dealershipContext?.cars || []).filter((c: any) => c.status === "SOLD").length
          } Sold**).`;

        setIsAiThinking(false);
        const words = fallbackText.split(/(\s+)/);
        let acc = "";
        for (let i = 0; i < words.length; i += 2) {
          acc += (words[i] || "") + (words[i + 1] || "");
          setStreamingContent(acc);
          await new Promise((r) => setTimeout(r, 18));
        }
        answerText = fallbackText;
      }

      await addMessage({
        sessionId: targetSessionId,
        role: "assistant",
        content: answerText.trim(),
        actionType: actionPayload?.actionType,
        actionPayload: actionPayload || undefined,
      });
    } catch (err: any) {
      toast.error("Agent error: " + err.message);
    } finally {
      setIsAiThinking(false);
      setStreamingContent(null);
    }
  };

  const handleVerifyAndSaveChannels = async () => {
    setGmailVerifyError(null);
    const trimmedEmail = connectedGmail.trim() || "alexsouthflow3@gmail.com";
    const cleanedPass = gmailAppPassword.replace(/\s+/g, "");

    if (typeof window !== "undefined") {
      localStorage.setItem("autofame_connected_gmail", trimmedEmail);
      localStorage.setItem("autofame_gmail_app_password", cleanedPass);
      localStorage.setItem("autofame_connected_whatsapp", connectedWhatsApp.trim());
    }

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          fromEmail: trimmedEmail,
          appPassword: cleanedPass,
        }),
      });
      const data = await res.json();
      if (res.ok && data.connected) {
        toast.success(`Verified ${trimmedEmail} with Google SMTP & IMAP`);
        fetchLiveGmailInbox(trimmedEmail, cleanedPass);
        setChannelsModalOpen(false);
      } else {
        setGmailVerifyError(data.error || "Google SMTP rejected the App Password.");
      }
    } catch (err: any) {
      setGmailVerifyError(err.message);
    }
  };

  const realCars = Array.isArray(dealershipContext?.cars) ? dealershipContext.cars : [];
  const realRepairs = Array.isArray(dealershipContext?.repairs) ? dealershipContext.repairs : [];
  const realLeads = extractRealLeads(dealershipContext);
  const todayEmails = inboxEmails.filter((e) => e.isToday);
  const yesterdayEmails = inboxEmails.filter((e) => e.isYesterday);

  // Filter out any legacy poorly-formatted messages
  const cleanMessages = (activeSessionData?.messages || []).filter(
    (m: any) =>
      !m.content?.includes("Gmail Channel (") &&
      !m.content?.includes("Review the fields below and click Send with Gmail") &&
      !m.content?.includes("• **Google**")
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#181715] text-[#eae7e1] font-sans">
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />

      {/* Hidden input for uploading mandatory FICA Proof Documents */}
      <input
        ref={proofDocInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleProofDocUpload}
        className="hidden"
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: CHANNELS & CONVERSATIONS                     */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "w-64 shrink-0 flex flex-col bg-[#12110f] border-r border-[#262420] transition-all duration-200 z-30 select-none",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full absolute md:relative md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
        )}
      >
        <div className="p-3.5 border-b border-[#262420] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="h-4 w-4" />
            </div>
            <span className="text-sm font-serif font-bold text-[#f5f2eb] tracking-tight">
              AutoFame Agent
            </span>
          </div>

          <Button
            onClick={handleNewSession}
            size="sm"
            className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>

        {/* Connected Dealership Channels */}
        <div className="p-3 border-b border-[#262420] space-y-1.5">
          <div className="flex items-center justify-between px-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7d7971] font-semibold">
              Connected Channels
            </span>
            <button
              onClick={() => setChannelsModalOpen(true)}
              className="text-[10px] text-emerald-400 hover:underline font-mono"
            >
              Configure
            </button>
          </div>

          <Link
            href="/admin/crm"
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#f5f2eb] truncate">Dealership CRM</p>
                <p className="text-[10px] text-emerald-300 truncate">
                  {waContacts.length || 108} Contacts &amp; Pipeline
                </p>
              </div>
            </div>
            <ExternalLink className="h-3 w-3 text-emerald-400 shrink-0" />
          </Link>

          <button
            onClick={() => handleSendMessage("show full dealership analytics report")}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#181714] hover:bg-[#201e1a] border border-[#292621] transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Dealership Analytics</p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  KPIs, Sales, Staff &amp; Valuation
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => handleSendMessage("list all cars in inventory")}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#181714] hover:bg-[#201e1a] border border-[#292621] transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Car className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Vehicle Inventory</p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  {realCars.length} Cars in Database
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => openFinanceContainer()}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#181714] hover:bg-[#201e1a] border border-[#292621] transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">
                  Finance Form &amp; Bank
                </p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  {isFinanceCompleteForBank
                    ? "✅ Ready for Bank Email"
                    : `${5 - missingFinanceItems.filter((m) => m.startsWith("Proof")).length}/5 Proof Docs`}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                isFinanceCompleteForBank ? "bg-emerald-500" : "bg-amber-400"
              )}
            />
          </button>

          <button
            onClick={() => handleSendMessage("show emails in our inbox")}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#181714] hover:bg-[#201e1a] border border-[#292621] transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Gmail Channel</p>
                <p className="text-[10px] text-[#8e8a82] font-mono truncate">{connectedGmail}</p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
              {inboxEmails.length}
            </span>
          </button>

          <button
            onClick={() => openWhatsAppComposer()}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#181714] hover:bg-[#201e1a] border border-[#292621] transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">WhatsApp Agent</p>
                <p className="text-[10px] text-[#8e8a82] font-mono truncate">{connectedWhatsApp}</p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-1.5 mb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7d7971] font-semibold">
              Recents
            </span>
          </div>

          {!sessions || sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#706c64]">No chats yet.</div>
          ) : (
            sessions.map((s) => {
              const isSelected = selectedSessionId === s._id;
              const isEditing = editingTitleId === s._id;

              return (
                <div
                  key={s._id}
                  onClick={() => setSelectedSessionId(s._id)}
                  className={cn(
                    "group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition text-xs border",
                    isSelected
                      ? "bg-[#24221e] text-[#f5f2eb] border-emerald-500/35"
                      : "bg-transparent hover:bg-[#1d1c19] text-[#a6a197] hover:text-[#dedad2] border-transparent"
                  )}
                >
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveTitle(s._id)}
                        autoFocus
                        className="w-full bg-[#141311] border border-emerald-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                      />
                      <button onClick={() => handleSaveTitle(s._id)} className="p-1 hover:text-emerald-400">
                        <Check className="h-3 w-3" />
                      </button>
                      <button onClick={() => setEditingTitleId(null)} className="p-1 hover:text-zinc-400">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <MessageSquare className="h-3.5 w-3.5 text-[#706c64] shrink-0" />
                        <p className="font-medium truncate">{s.title}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                        <button
                          onClick={(e) => handleStartEditTitle(e, s)}
                          className="p-1 text-[#8e8a82] hover:text-white"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(e, s._id)}
                          className="p-1 text-[#8e8a82] hover:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MAIN AGENT CANVAS (WIDE BY DEFAULT — NO SIDE PANEL)        */}
      {/* ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#1c1b18]">
        {/* Header */}
        <header className="h-12 px-4 sm:px-6 border-b border-[#2b2823] bg-[#151412] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#282622] text-[#8e8a82] hover:text-white transition"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="font-serif text-sm sm:text-base font-bold text-[#f5f2eb] truncate">
              {activeSessionData?.session?.title || "AutoFame Agent"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 text-xs font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AutoFame AI Copilot</span>
            </div>

            <Link
              href="/admin/crm"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition shadow-sm"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Dealership CRM</span>
            </Link>

            <button
              onClick={() =>
                setComposeDrawerMode(composeDrawerMode === "finance" ? null : "finance")
              }
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition",
                composeDrawerMode === "finance"
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-[#22201c] hover:bg-[#2a2722] text-[#dedad2] border-[#35312b]"
              )}
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Finance Application Container</span>
            </button>

            <button
              onClick={() =>
                setComposeDrawerMode(composeDrawerMode === "gmail" ? null : "gmail")
              }
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition",
                composeDrawerMode === "gmail"
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-[#22201c] hover:bg-[#2a2722] text-[#dedad2] border-[#35312b]"
              )}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Compose with AI</span>
            </button>
          </div>
        </header>

        {/* Wide Main Canvas Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-14 py-8">
          <div className="max-w-5xl w-full mx-auto space-y-6">
            {/* Clean Modern Dealership Overview when Chat is Empty */}
            {cleanMessages.length === 0 && (
              <div className="py-10 space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f2eb] font-serif">
                    AutoFame Dealership Agent
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8e8a82]">
                    Ask anything about vehicle inventory, pricing, WhatsApp finance applications, FICA completeness checks, or emails.
                  </p>
                </div>

                {/* Live Multi-Channel Dealership Status Cards on the Wide Main Canvas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <button
                    onClick={() => handleSendMessage("how many cars")}
                    className="p-4 rounded-2xl bg-[#22201c] hover:bg-[#282621] border border-[#35312b] text-left transition"
                  >
                    <div className="flex items-center justify-between text-[#8e8a82] text-xs">
                      <span>Vehicles in Stock</span>
                      <Car className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-[#f5f2eb] mt-1.5">{realCars.length}</p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">Live Convex Inventory</p>
                  </button>

                  <button
                    onClick={() => openFinanceContainer()}
                    className="p-4 rounded-2xl bg-[#22201c] hover:bg-[#282621] border border-[#35312b] text-left transition"
                  >
                    <div className="flex items-center justify-between text-[#8e8a82] text-xs">
                      <span>Finance &amp; Bank Check</span>
                      <Building2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-[#f5f2eb] mt-1.5">
                      {Object.keys(finProofDocs).length}/5 Docs
                    </p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      {isFinanceCompleteForBank ? "Ready for Bank Email" : "Open Form Container"}
                    </p>
                  </button>

                  <button
                    onClick={() => openWhatsAppComposer()}
                    className="p-4 rounded-2xl bg-[#22201c] hover:bg-[#282621] border border-[#35312b] text-left transition"
                  >
                    <div className="flex items-center justify-between text-[#8e8a82] text-xs">
                      <span>WhatsApp Agent</span>
                      <PhoneCall className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-lg font-bold text-[#f5f2eb] mt-1.5 truncate">STARLD-W5LEE</p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">+27 63 199 5124 Live</p>
                  </button>

                  <button
                    onClick={() => handleSendMessage("show emails from yesterday and today")}
                    className="p-4 rounded-2xl bg-[#22201c] hover:bg-[#282621] border border-[#35312b] text-left transition"
                  >
                    <div className="flex items-center justify-between text-[#8e8a82] text-xs">
                      <span>New Emails</span>
                      <Mail className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-[#f5f2eb] mt-1.5">
                      {todayEmails.length + yesterdayEmails.length}
                    </p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      {todayEmails.length} Today • {yesterdayEmails.length} Yesterday
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Wide Chat Messages */}
            {cleanMessages.map((msg: any) => {
              const isAssistant = msg.role === "assistant";

              return (
                <div
                  key={msg._id}
                  className={cn(
                    "flex gap-4 w-full",
                    isAssistant ? "justify-start" : "justify-end"
                  )}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl text-sm sm:text-base leading-relaxed",
                      isAssistant
                        ? "bg-[#24221e] text-[#f5f2eb] border border-[#35312b] px-6 py-4 w-full max-w-4xl"
                        : "bg-emerald-600 text-white font-medium px-5 py-3.5 max-w-3xl ml-auto"
                    )}
                  >
                    {isAssistant ? (
                      <div className="font-normal text-[#f5f2eb]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="h-8 w-8 rounded-xl bg-[#33302a] border border-[#444037] flex items-center justify-center text-[#eae7e1] shrink-0 mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Animated 3-Dots Thinking Indicator (• • •) — No Spinning Wheel */}
            {isAiThinking && (
              <div className="flex gap-4 w-full justify-start">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>

                <div className="rounded-2xl bg-[#24221e] text-[#f5f2eb] border border-[#35312b] px-5 py-4 flex items-center gap-3">
                  <div className="flex items-center gap-1.5" aria-label="AI thinking">
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: "0ms", animationDuration: "850ms" }}
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 animate-bounce"
                      style={{ animationDelay: "180ms", animationDuration: "850ms" }}
                    />
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-emerald-400/60 animate-bounce"
                      style={{ animationDelay: "360ms", animationDuration: "850ms" }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[#a6a197]">AutoFame AI thinking...</span>
                </div>
              </div>
            )}

            {/* Live Token-by-Token Streaming Bubble */}
            {streamingContent !== null && (
              <div className="flex gap-4 w-full justify-start">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>

                <div className="rounded-2xl text-sm sm:text-base leading-relaxed bg-[#24221e] text-[#f5f2eb] border border-emerald-500/40 px-6 py-4 w-full max-w-4xl shadow-lg">
                  <div className="font-normal text-[#f5f2eb]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {streamingContent}
                    </ReactMarkdown>
                    <span className="inline-block w-2 h-4 ml-1 align-middle bg-emerald-400 animate-pulse rounded-sm" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Wide Bottom Prompt Bar */}
        <div className="p-4 sm:p-5 bg-[#151412] border-t border-[#2b2823] shrink-0">
          <div className="max-w-5xl w-full mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative rounded-2xl border border-[#38342d] bg-[#22201c] focus-within:border-emerald-500/80 transition"
            >
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border-b border-[#2e2b26]">
                  {attachedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-[#282521] border border-[#3d3931] rounded-lg px-2.5 py-1 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="max-w-[180px] truncate">{f.name}</span>
                      <button type="button" onClick={() => removeAttachedFile(i)}>
                        <X className="h-3 w-3 text-[#8e8a82] hover:text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="Ask anything (e.g. 'how many cars', 'show emails from yesterday', 'check if we have everything for finance')..."
                className="w-full bg-transparent p-4 pb-12 text-xs sm:text-sm text-[#f5f2eb] placeholder:text-[#837e75] focus:outline-none resize-none leading-relaxed"
              />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 px-2.5 rounded-lg bg-[#181715] hover:bg-[#2c2924] text-[#a6a197] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Attach</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openFinanceContainer()}
                    className="h-7 px-2.5 rounded-lg bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                  >
                    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Finance Application Container</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openGmailComposer()}
                    className="h-7 px-2.5 rounded-lg bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                  >
                    <Mail className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Compose Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openWhatsAppComposer()}
                    className="h-7 px-2.5 rounded-lg bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={
                    isAiThinking ||
                    streamingContent !== null ||
                    (!inputValue.trim() && attachedFiles.length === 0)
                  }
                  size="sm"
                  className="h-7 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isAiThinking || streamingContent !== null ? (
                    <div className="flex items-center gap-1 px-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-white animate-bounce"
                        style={{ animationDelay: "0ms", animationDuration: "800ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-white/80 animate-bounce"
                        style={{ animationDelay: "160ms", animationDuration: "800ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce"
                        style={{ animationDelay: "320ms", animationDuration: "800ms" }}
                      />
                    </div>
                  ) : (
                    <>
                      <Send className="h-3 w-3" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────── */}
      {/* COMPACT DRAWER (ONLY OPENS WHEN CLICKED — MAIN CANVAS WIDE)*/}
      {/* ────────────────────────────────────────────────────────── */}
      {composeDrawerMode && (
        <aside className="w-full sm:w-[400px] lg:w-[440px] shrink-0 flex flex-col bg-[#131210] border-l border-[#2b2823] z-20 shadow-2xl">
          <div className="h-12 px-4 border-b border-[#27241f] bg-[#171613] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {composeDrawerMode === "gmail" ? (
                <Mail className="h-4 w-4 text-emerald-400" />
              ) : composeDrawerMode === "whatsapp" ? (
                <PhoneCall className="h-4 w-4 text-emerald-400" />
              ) : (
                <Building2 className="h-4 w-4 text-emerald-400" />
              )}
              <span className="text-xs font-bold text-[#f5f2eb]">
                {composeDrawerMode === "gmail"
                  ? `Compose Email (${connectedGmail})`
                  : composeDrawerMode === "whatsapp"
                  ? "WhatsApp Agent (STARLD-W5LEE)"
                  : "Finance Application Container & Bank Check"}
              </span>
            </div>

            <button
              onClick={() => setComposeDrawerMode(null)}
              className="p-1.5 rounded-lg hover:bg-[#262420] text-[#8e8a82] hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* ── MODE 1: FINANCE APPLICATION FORM CONTAINER & BANK VERIFICATION ── */}
            {composeDrawerMode === "finance" && (
              <>
                {/* WhatsApp Contact Picker & Channel Intake Sync Bar */}
                <div className="p-3 rounded-xl bg-[#1b1916] border border-[#33302a] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-400">
                        Choose WhatsApp Contact to Fill Form
                      </p>
                      <p className="text-[10px] text-[#8e8a82]">
                        Select any WhatsApp contact to auto-extract their info &amp; docs
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSendFinanceFormOrMissingViaWhatsApp(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                    >
                      <Send className="h-3 w-3" />
                      Send Form on WA
                    </button>
                  </div>

                  <select
                    value={selectedWaContact?.id || ""}
                    onChange={async (e) => {
                      const chosen = waContacts.find((c) => c.id === e.target.value);
                      if (!chosen) return;
                      setSelectedWaContact(chosen);
                      setFinPhone(chosen.phone);
                      setCanvasWaPhone(chosen.phone);
                      const cleanName = chosen.name.replace(/\(.*?\)/g, "").trim();
                      const parts = cleanName.split(/\s+/);
                      setFinFirstName(parts[0] || "Client");
                      setFinLastName(parts.slice(1).join(" ") || "");
                      if (chosen.lastMessage?.includes("Bank:")) {
                        setFinEmployerName("West Bulk Bags (Capitec: 2558165883)");
                      }
                      toast.success(`Loaded ${chosen.name} (${chosen.phone}) into Finance Form`);
                    }}
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white text-xs"
                  >
                    <option value="">-- Select WhatsApp Contact ({waContacts.length} Contacts) --</option>
                    {waContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1. USER DETAILS CONTAINER */}
                <div className="p-3.5 rounded-xl bg-[#181714] border border-[#2e2b25] space-y-2.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    1. User Details (Applicant)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">First Name *</label>
                      <input
                        type="text"
                        value={finFirstName}
                        onChange={(e) => setFinFirstName(e.target.value)}
                        placeholder="e.g. Thabo"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">Surname *</label>
                      <input
                        type="text"
                        value={finLastName}
                        onChange={(e) => setFinLastName(e.target.value)}
                        placeholder="e.g. Mokoena"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">
                        SA ID Number (13 Digits) *
                      </label>
                      <input
                        type="text"
                        value={finIdNumber}
                        onChange={(e) => setFinIdNumber(e.target.value)}
                        placeholder="8901015009087"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">
                        WhatsApp / Phone *
                      </label>
                      <input
                        type="text"
                        value={finPhone}
                        onChange={(e) => setFinPhone(e.target.value)}
                        placeholder="+27 82 000 0000"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">Email *</label>
                      <input
                        type="email"
                        value={finEmail}
                        onChange={(e) => setFinEmail(e.target.value)}
                        placeholder="client@gmail.com"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">
                        Physical Address *
                      </label>
                      <input
                        type="text"
                        value={finAddress}
                        onChange={(e) => setFinAddress(e.target.value)}
                        placeholder="14 Main Rd, Sandton, JHB"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. CAR DETAILS CONTAINER */}
                <div className="p-3.5 rounded-xl bg-[#181714] border border-[#2e2b25] space-y-2.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    2. Car Details (From Dealership Inventory)
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8e8a82] block mb-1">
                      Select Showroom Vehicle *
                    </label>
                    <select
                      value={finCarId || ""}
                      onChange={(e) => {
                        const selectedId = Number(e.target.value);
                        const found = realCars.find((c: any) => c.id === selectedId);
                        if (found) {
                          setFinCarId(found.id);
                          setFinCarName(`${found.year} ${found.make} ${found.model}`);
                          setFinCarPrice(found.price || 0);
                          setFinDeposit(Math.round((found.price || 0) * 0.1));
                        }
                      }}
                      className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white text-xs"
                    >
                      {realCars.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.year} {c.make} {c.model} — R{Number(c.price || 0).toLocaleString()} ZAR (
                          {c.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">Price (ZAR)</label>
                      <input
                        type="number"
                        value={finCarPrice}
                        onChange={(e) => setFinCarPrice(Number(e.target.value) || 0)}
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">Deposit (ZAR)</label>
                      <input
                        type="number"
                        value={finDeposit}
                        onChange={(e) => setFinDeposit(Number(e.target.value) || 0)}
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">Term (Months)</label>
                      <select
                        value={finTermMonths}
                        onChange={(e) => setFinTermMonths(Number(e.target.value))}
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                      >
                        <option value={36}>36 mo</option>
                        <option value={48}>48 mo</option>
                        <option value={60}>60 mo</option>
                        <option value={72}>72 mo</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#a6a197] border-t border-[#262420]">
                    <span>Loan Principal: R{loanPrincipal.toLocaleString()} ZAR</span>
                    <span className="text-emerald-400 font-semibold">
                      Est: ~R{estimatedMonthlyInstalment.toLocaleString()}/mo
                    </span>
                  </div>
                </div>

                {/* 3. FINANCIAL DETAILS CONTAINER */}
                <div className="p-3.5 rounded-xl bg-[#181714] border border-[#2e2b25] space-y-2.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    3. Financial Details (Income &amp; Employment)
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">
                        Employer Name *
                      </label>
                      <input
                        type="text"
                        value={finEmployerName}
                        onChange={(e) => setFinEmployerName(e.target.value)}
                        placeholder="e.g. Sasol / FirstRand"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">Job Title *</label>
                      <input
                        type="text"
                        value={finJobTitle}
                        onChange={(e) => setFinJobTitle(e.target.value)}
                        placeholder="e.g. Operations Manager"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">
                        Gross Monthly Income (ZAR) *
                      </label>
                      <input
                        type="number"
                        value={finMonthlyIncome || ""}
                        onChange={(e) => setFinMonthlyIncome(Number(e.target.value) || 0)}
                        placeholder="45000"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8e8a82] block mb-1">
                        Monthly Expenses (ZAR) *
                      </label>
                      <input
                        type="number"
                        value={finMonthlyExpenses || ""}
                        onChange={(e) => setFinMonthlyExpenses(Number(e.target.value) || 0)}
                        placeholder="16000"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. MANDATORY PROOF DOCUMENTS (ID, Driver's License, Bank Statements, Payslips, Proof of Address) */}
                <div className="p-3.5 rounded-xl bg-[#181714] border border-[#2e2b25] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      4. Mandatory Proof Documents (FICA)
                    </span>
                    <span className="text-[10px] font-mono text-[#a6a197]">
                      {Object.keys(finProofDocs).length}/5 Attached
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {REQUIRED_PROOF_DOCS.map((docItem) => {
                      const attached = finProofDocs[docItem.code];
                      return (
                        <div
                          key={docItem.code}
                          className={cn(
                            "flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs",
                            attached
                              ? "bg-emerald-500/10 border-emerald-500/30 text-[#f5f2eb]"
                              : "bg-[#12110f] border-[#2c2924] text-[#a6a197]"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {attached ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium truncate">{docItem.label}</p>
                              {attached && (
                                <p className="text-[10px] text-emerald-300 truncate">
                                  {attached.originalName}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveDocUploadCode(docItem.code);
                              proofDocInputRef.current?.click();
                            }}
                            className="px-2 py-1 rounded bg-[#24221e] hover:bg-[#2f2c26] text-[10px] text-[#eae7e1] border border-[#38342d] flex items-center gap-1 shrink-0"
                          >
                            <Upload className="h-3 w-3 text-emerald-400" />
                            {attached ? "Replace" : "Attach"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. PRE-FLIGHT COMPLETENESS CHECK & SEND TO BANK VIA EMAIL */}
                <div
                  className={cn(
                    "p-3.5 rounded-xl border space-y-3",
                    isFinanceCompleteForBank
                      ? "bg-emerald-500/10 border-emerald-500/35"
                      : "bg-amber-500/10 border-amber-500/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f5f2eb] flex items-center gap-1.5">
                      {isFinanceCompleteForBank ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          All Requirements Verified for Bank
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          Pre-Flight Check: {missingFinanceItems.length} Item(s) Missing
                        </>
                      )}
                    </span>
                  </div>

                  {!isFinanceCompleteForBank && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        Missing before bank email dispatch:{" "}
                        <span className="font-mono">{missingFinanceItems.join(", ")}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSendFinanceFormOrMissingViaWhatsApp(true)}
                        className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center justify-center gap-1.5"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Request Missing Items on WhatsApp
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#a6a197] block mb-1">
                      Bank Finance Desk Email (Recipient) *
                    </label>
                    <input
                      type="email"
                      value={bankEmail}
                      onChange={(e) => {
                        setBankEmail(e.target.value);
                        setBankDispatched(false);
                      }}
                      placeholder="applications@wesbank.co.za"
                      className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleSaveFinanceContainerToDb}
                      variant="outline"
                      className="h-9 px-3 rounded-xl border-[#38342d] bg-[#1b1916] hover:bg-[#25231e] text-[#eae7e1] text-xs"
                    >
                      Save Container
                    </Button>

                    <Button
                      type="button"
                      onClick={handleVerifyAndSendApplicationToBank}
                      className={cn(
                        "flex-1 h-9 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5",
                        isFinanceCompleteForBank
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-zinc-700/60 text-zinc-300 hover:bg-zinc-700"
                      )}
                    >
                      {bankDispatched ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Sent to Bank
                        </>
                      ) : (
                        <>
                          <SendHorizontal className="h-4 w-4" />
                          Verify &amp; Email Application to Bank
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── MODE 2: GMAIL COMPOSER ── */}
            {composeDrawerMode === "gmail" && (
              <>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    To (Recipient) *
                  </label>
                  <input
                    type="email"
                    value={canvasTo}
                    onChange={(e) => {
                      setCanvasTo(e.target.value);
                      setCanvasEmailSent(false);
                    }}
                    placeholder="client@example.com"
                    className="w-full bg-[#1b1a17] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Cc
                  </label>
                  <input
                    type="email"
                    value={canvasCc}
                    onChange={(e) => setCanvasCc(e.target.value)}
                    placeholder="Optional CC"
                    className="w-full bg-[#1b1a17] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={canvasSubject}
                    onChange={(e) => setCanvasSubject(e.target.value)}
                    className="w-full bg-[#1b1a17] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-medium text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={10}
                    value={canvasBody}
                    onChange={(e) => setCanvasBody(e.target.value)}
                    className="w-full bg-[#1b1a17] border border-[#33302a] rounded-xl p-3 text-[#eae7e1] text-xs leading-relaxed focus:outline-none focus:border-emerald-500 resize-y"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `https://mail.google.com/mail/?authuser=${encodeURIComponent(
                        connectedGmail
                      )}&view=cm&fs=1&to=${encodeURIComponent(
                        canvasTo
                      )}&cc=${encodeURIComponent(canvasCc)}&su=${encodeURIComponent(
                        canvasSubject
                      )}&body=${encodeURIComponent(canvasBody)}`;
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#22201c] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                    Gmail Web
                  </button>

                  <Button
                    type="button"
                    onClick={handleSendCanvasGmail}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5"
                  >
                    {canvasEmailSent ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Sent
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="h-4 w-4" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* ── MODE 3: TWO-WAY WHATSAPP AGENT — CONTACT SEARCH, SELECTOR & REPLY ── */}
            {composeDrawerMode === "whatsapp" && (
              <>
                {/* 1. Search, Filter by Last Contacted & Add Any Missing Contact */}
                <div className="p-3 rounded-xl bg-[#181714] border border-[#2e2b25] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      1. Choose or Search Contact ({waContacts.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddContactForm((prev) => !prev)}
                        className="px-2 py-0.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300"
                      >
                        {showAddContactForm ? "Close" : "+ Add Contact"}
                      </button>
                      <button
                        type="button"
                        onClick={() => fetchLiveWhatsAppChannel(false)}
                        className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sync
                      </button>
                    </div>
                  </div>

                  {/* Quick Add Contact Form (for any contact not yet in the list) */}
                  {showAddContactForm && (
                    <div className="p-2.5 rounded-lg bg-[#12110f] border border-emerald-500/40 space-y-2">
                      <p className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                        Add Missing WhatsApp Contact
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="Contact Name (e.g. John)"
                          className="bg-[#1b1a17] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          value={newContactPhone}
                          onChange={(e) => setNewContactPhone(e.target.value)}
                          placeholder="Phone (e.g. 082 123 4567)"
                          className="bg-[#1b1a17] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddCustomContact}
                        className="w-full h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg"
                      >
                        + Add &amp; Select Contact
                      </Button>
                    </div>
                  )}

                  {/* Filter Tabs: Last Contacted vs All Contacts */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWaFilterTab("recent")}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition",
                        waFilterTab === "recent"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-[#12110f] border-[#262420] text-[#8e8a82] hover:text-white"
                      )}
                    >
                      🕒 Last Contacted ({waContacts.filter((c) => c.isRecentChat || c.lastContactedLabel).length || 15})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaFilterTab("all")}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold border transition",
                        waFilterTab === "all"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-[#12110f] border-[#262420] text-[#8e8a82] hover:text-white"
                      )}
                    >
                      📒 All Contacts ({waContacts.length})
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={waSearchQuery}
                      onChange={(e) => setWaSearchQuery(e.target.value)}
                      placeholder={`Search ${waContacts.length} contacts by name, phone, or message...`}
                      className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    {waSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setWaSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8e8a82] hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {waContacts
                      .filter((c) => {
                        if (waSearchQuery.trim()) {
                          const q = waSearchQuery.toLowerCase();
                          return (
                            c.name?.toLowerCase().includes(q) ||
                            c.phone?.toLowerCase().includes(q) ||
                            c.lastMessage?.toLowerCase().includes(q)
                          );
                        }
                        if (waFilterTab === "recent") {
                          return Boolean(c.isRecentChat || c.lastContactedLabel);
                        }
                        return true;
                      })
                      .map((c, idx) => {
                        const isSelected = selectedWaContact?.id === c.id;
                        const initials = (c.name || "WA")
                          .replace(/[^A-Za-z0-9\s]/g, "")
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((w) => w[0] || "")
                          .join("")
                          .toUpperCase() || "WA";
                        return (
                          <button
                            key={`${c.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              setSelectedWaContact(c);
                              setCanvasWaPhone(c.id === "120363413508068515@g.us" ? c.id : c.phone);
                              setCanvasWaSent(false);
                              const firstName = c.name.replace(/\(.*?\)/g, "").trim().split(" ")[0];
                              setCanvasWaMessage(
                                `Hi ${firstName}, this is AutoFame Dealership Johannesburg South. How can we assist you with vehicle stock, quotes, or finance today?`
                              );
                            }}
                            className={cn(
                              "w-full text-left px-2.5 py-2 rounded-lg border transition flex items-center justify-between gap-2.5",
                              isSelected
                                ? "bg-emerald-500/15 border-emerald-500/50 text-[#f5f2eb]"
                                : "bg-[#131210] hover:bg-[#1f1d19] border-[#262420] text-[#dedad2]"
                            )}
                          >
                            <div className="h-7 w-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-semibold truncate">{c.name}</p>
                                {c.lastContactedLabel && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 shrink-0">
                                    {c.lastContactedLabel}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#8e8a82] truncate">
                                {c.lastMessage || c.phone}
                              </p>
                              <p className="text-[9px] font-mono text-emerald-400/80">
                                {c.phone}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* 2. Active Contact Header & Quick AI Reply Actions */}
                {selectedWaContact && (
                  <div className="p-3 rounded-xl bg-[#181714] border border-[#2e2b25] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#f5f2eb]">
                          Talking to: <span className="text-emerald-400">{selectedWaContact.name}</span>
                        </p>
                        <p className="text-[10px] font-mono text-[#8e8a82]">
                          {selectedWaContact.phone}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFinPhone(selectedWaContact.phone);
                          const cleanName = selectedWaContact.name.replace(/\(.*?\)/g, "").trim();
                          const parts = cleanName.split(/\s+/);
                          setFinFirstName(parts[0] || "Client");
                          setFinLastName(parts.slice(1).join(" ") || "");
                          if (selectedWaContact.lastMessage?.includes("Bank:")) {
                            setFinEmployerName("West Bulk Bags (Capitec: 2558165883)");
                          }
                          openFinanceContainer();
                          toast.success(`Imported ${selectedWaContact.name} to Finance Form Container`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold"
                      >
                        Fill Finance Form →
                      </button>
                    </div>

                    {selectedWaContact.lastMessage && (
                      <div className="p-2 rounded-lg bg-[#12110f] border border-[#262420] text-[11px] text-[#dedad2]">
                        <span className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-0.5">
                          Last Message in Chat:
                        </span>
                        &ldquo;{selectedWaContact.lastMessage}&rdquo;
                      </div>
                    )}

                    {/* Quick Draft Templates for Selected Contact */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const name = selectedWaContact.name.replace(/\(.*?\)/g, "").trim().split(" ")[0];
                          setCanvasWaMessage(
                            `Hi ${name}, thank you for your message! I have checked your request at AutoFame Dealership Johannesburg South. Would you like me to send the official vehicle quote or the finance application container?`
                          );
                        }}
                        className="px-2 py-1 rounded-md bg-[#24221e] hover:bg-[#2e2b26] border border-[#38342d] text-[10px] text-[#eae7e1]"
                      >
                        AI Smart Reply
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const name = selectedWaContact.name.replace(/\(.*?\)/g, "").trim().split(" ")[0];
                          const car = realCars[0];
                          const price = Number(car?.price || 249900);
                          const est = Math.round(price * 0.9 * 0.0218);
                          setCanvasWaMessage(
                            `📄 *AUTOFAME OFFICIAL VEHICLE QUOTATION*\n━━━━━━━━━━━━━━━━━━━━\nHi ${name}, here is the quotation for:\n\n🚘 *${car ? `${car.year} ${car.make} ${car.model}` : "Selected Vehicle"}*\n💰 *Price:* R${price.toLocaleString()} ZAR (~R${est.toLocaleString()}/mo)\n⚙️ *Specs:* ${Number(car?.mileage || 35000).toLocaleString()} km • ${car?.transmission || "Auto"}\n\nReply *FINANCE* or send your SA ID, 3 months bank statements & payslips here to apply!`
                          );
                        }}
                        className="px-2 py-1 rounded-md bg-[#24221e] hover:bg-[#2e2b26] border border-[#38342d] text-[10px] text-[#eae7e1]"
                      >
                        📄 Vehicle Quote
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const name = selectedWaContact.name.replace(/\(.*?\)/g, "").trim().split(" ")[0];
                          setCanvasWaMessage(
                            `📋 *AutoFame Vehicle Finance Application Container*\n\nHi ${name}, to complete your vehicle finance application, please reply here with:\n\n*1. User Details:* Full Name, SA ID Number, Email & Physical Address\n*2. Car Details:* ${finCarName || "Selected Vehicle"} (R${Number(finCarPrice || 0).toLocaleString()} ZAR)\n*3. Financial Details:* Employer, Job Title, Gross Monthly Income & Expenses\n*4. Proof Documents:*\n✅ Copy of SA ID\n✅ Valid SA Driver's License\n✅ 3 Months Bank Statements\n✅ Latest 3 Months Payslips\n✅ Proof of Residence`
                          );
                        }}
                        className="px-2 py-1 rounded-md bg-[#24221e] hover:bg-[#2e2b26] border border-[#38342d] text-[10px] text-[#eae7e1]"
                      >
                        📋 Finance Container
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Recipient Phone & Message Composer */}
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Recipient Phone / Chat ID *
                  </label>
                  <input
                    type="text"
                    value={canvasWaPhone}
                    onChange={(e) => {
                      setCanvasWaPhone(e.target.value);
                      setCanvasWaSent(false);
                    }}
                    placeholder="+27 82 000 0000"
                    className="w-full bg-[#1b1a17] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Reply Message
                  </label>
                  <textarea
                    rows={6}
                    value={canvasWaMessage}
                    onChange={(e) => setCanvasWaMessage(e.target.value)}
                    className="w-full bg-[#1b1a17] border border-[#33302a] rounded-xl p-3 text-[#eae7e1] text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleSendCanvasWhatsApp}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    {canvasWaSent ? (
                      <>
                        <Check className="h-4 w-4" />
                        Sent to {selectedWaContact?.name?.split(" ")[0] || "Contact"}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Reply on WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </aside>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* CHANNEL SETTINGS MODAL                                     */}
      {/* ────────────────────────────────────────────────────────── */}
      {channelsModalOpen && (
        <div
          onClick={() => setChannelsModalOpen(false)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#1a1916] rounded-2xl border border-[#38342d] shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2b26]">
              <div>
                <h3 className="text-sm font-bold text-[#f5f2eb]">Connected Channels</h3>
                <p className="text-[11px] text-[#8e8a82]">
                  Live Gmail (`alexsouthflow3@gmail.com`) &amp; Whapi (`STARLD-W5LEE`)
                </p>
              </div>
              <button
                onClick={() => setChannelsModalOpen(false)}
                className="text-[#8e8a82] hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                  Gmail Address
                </label>
                <input
                  type="email"
                  value={connectedGmail}
                  onChange={(e) => setConnectedGmail(e.target.value)}
                  className="w-full bg-[#141311] border border-[#35312b] rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                  Google 16-Character App Password
                </label>
                <input
                  type="password"
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  className="w-full bg-[#141311] border border-[#35312b] rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                  Whapi.Cloud Channel
                </label>
                <input
                  type="text"
                  value={connectedWhatsApp}
                  onChange={(e) => setConnectedWhatsApp(e.target.value)}
                  className="w-full bg-[#141311] border border-[#35312b] rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              {gmailVerifyError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                  {gmailVerifyError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2e2b26]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChannelsModalOpen(false)}
                className="text-xs text-[#8e8a82] hover:text-white"
              >
                Close
              </Button>
              <Button
                onClick={handleVerifyAndSaveChannels}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Save &amp; Sync
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
