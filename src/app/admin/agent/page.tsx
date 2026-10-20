"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  User,
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

  const subject =
    carPrice > 0
      ? `AutoFame Official Quotation & Finance Details — ${carName}`
      : `AutoFame Dealership — Vehicle & Finance Information`;

  const body = `Dear ${customerName},

Thank you for contacting AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South).

Here are the details regarding your inquiry:
• Vehicle: ${carName}
• Retail Price: ${priceLine}${
    monthlyEst > 0
      ? `\n• Estimated Monthly Instalment: ~R${monthlyEst.toLocaleString()} ZAR / month (72 months, 10% deposit)`
      : ""
  }

To proceed with vehicle finance pre-approval, please reply to this email with your FICA documents:
1. Copy of SA ID (Smart Card or Green Barcoded Book)
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
 * Direct Dealership Answer Engine (Clean Formatting & Direct Counts)
 */
function getDirectAnswerOnly(
  query: string,
  context: any,
  inboxEmails: any[],
  waChannelMessages: any[] = []
): string | null {
  const lower = query.toLowerCase().trim();
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const repairs = Array.isArray(context?.repairs) ? context.repairs : [];
  const financings = Array.isArray(context?.financings) ? context.financings : [];
  const realLeads = extractRealLeads(context);

  const totalCars = cars.length;
  const availableCars = cars.filter((c: any) => c.status === "AVAILABLE");
  const soldCars = cars.filter((c: any) => c.status === "SOLD");
  const workshopCars = cars.filter(
    (c: any) => c.status === "MAINTENANCE" || c.status === "REPAIR"
  );
  const totalValue = availableCars.reduce((s: number, c: any) => s + (c.price || 0), 0);

  const isWhatsAppQuery =
    lower.includes("whatsapp") ||
    lower.includes("whatsaapp") ||
    lower.includes("what app") ||
    lower.includes("whapi");

  // 1. EXACT COUNT QUESTIONS -> Return ONLY the number
  if (
    (lower.includes("how many") && isWhatsAppQuery) ||
    lower.includes("how many message") ||
    lower.includes("how many chat")
  ) {
    return `${waChannelMessages.length}`;
  }
  if (lower.includes("how many available") || lower.includes("available cars")) {
    return `${availableCars.length}`;
  }
  if (lower.includes("how many sold") || lower.includes("sold cars")) {
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
    !isWhatsAppQuery &&
    (lower.includes("how many email") ||
      lower.includes("how many imail") ||
      lower.includes("how many wmail"))
  ) {
    if (lower.includes("yesterday") || lower.includes("yerstady")) {
      return `${inboxEmails.filter((e) => e.isYesterday).length}`;
    }
    if (lower.includes("today")) {
      return `${inboxEmails.filter((e) => e.isToday).length}`;
    }
    return `${inboxEmails.length}`;
  }
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
    return `${totalCars}`;
  }

  // 2. WHATSAPP MESSAGES & CONTACTS TABLE (Checked BEFORE email so "whatsapp not email" returns WhatsApp!)
  if (isWhatsAppQuery && !lower.includes("send link") && !lower.includes("compose")) {
    if (waChannelMessages.length === 0) {
      return "0";
    }
    const rows = waChannelMessages
      .slice(0, 12)
      .map(
        (m: any) =>
          `| **${m.fromName || "Contact"}** | ${m.from || m.chatId} | ${(m.text || "")
            .replace(/\n+/g, " ")
            .slice(0, 90)} | **${new Date(m.timestamp).toLocaleDateString()}** |`
      )
      .join("\n");
    return `| WhatsApp Contact | Phone / Chat ID | Message / Attachment | Date |\n| :--- | :--- | :--- | :---: |\n${rows}`;
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

  // 4. INBOX / EMAIL QUERIES -> Cleanly formatted table
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

    if (filtered.length === 0) {
      return "0";
    }

    const rows = filtered
      .slice(0, 10)
      .map(
        (e) =>
          `| **${e.fromName}** | ${e.fromEmail} | ${e.subject} | **${
            e.isToday
              ? "Today"
              : e.isYesterday
              ? "Yesterday"
              : new Date(e.date).toLocaleDateString()
          }** |`
      )
      .join("\n");

    return `| Sender | Email Address | Subject | Received |\n| :--- | :--- | :--- | :---: |\n${rows}`;
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

  if (lower.includes("list") || lower.includes("inventory") || lower.includes("showroom")) {
    if (cars.length === 0) return "0";
    const rows = cars
      .map(
        (c: any) =>
          `| **${c.year} ${c.make} ${c.model}** | R${(c.price || 0).toLocaleString()} ZAR | ${(c.mileage || 0).toLocaleString()} km | ${c.transmission || "Auto"} | **${c.status}** |`
      )
      .join("\n");
    return `| Vehicle | Price | Mileage | Transmission | Status |\n| :--- | :---: | :---: | :--- | :---: |\n${rows}`;
  }

  return null;
}

function buildStrictSystemPrompt(context: any, inboxEmails: any[], connectedGmail: string) {
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const realLeads = extractRealLeads(context);

  const inventorySummary =
    cars.length > 0
      ? cars
          .map(
            (c: any) =>
              `${c.year} ${c.make} ${c.model}: R${(c.price || 0).toLocaleString()} ZAR (${c.status})`
          )
          .join("; ")
      : "0 cars";

  const emailSummary =
    inboxEmails.length > 0
      ? inboxEmails
          .slice(0, 10)
          .map(
            (e: any) =>
              `From: ${e.fromName} <${e.fromEmail}> | Subject: ${e.subject} | When: ${
                e.isToday ? "Today" : e.isYesterday ? "Yesterday" : e.date
              }`
          )
          .join("; ")
      : "0 emails";

  return `You are AutoFame Dealership Agent.
Database facts:
- Total cars: ${cars.length}
- Available cars: ${cars.filter((c: any) => c.status === "AVAILABLE").length}
- Sold cars: ${cars.filter((c: any) => c.status === "SOLD").length}
- Form submissions: ${realLeads.length}
- Connected Gmail (${connectedGmail}) Inbox Count: ${inboxEmails.length}
- Inbox Emails: ${emailSummary}
- Vehicles: ${inventorySummary}

CRITICAL INSTRUCTION:
Reply ONLY with the exact direct answer requested. Do NOT include any greetings, explanations, or extra words. If asked a count (like "how many cars"), reply ONLY with the digits (e.g. "${cars.length}"). If listing items, use a Markdown table.`;
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

  // Live Gmail Inbox (Today, Yesterday, All)
  const [inboxEmails, setInboxEmails] = useState<any[]>([]);

  // Live Whapi.Cloud WhatsApp Messages (Channel STARLD-W5LEE)
  const [waChannelMessages, setWaChannelMessages] = useState<any[]>([]);

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

  // Chat Input State
  const [inputValue, setInputValue] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");

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
      if (res.ok && Array.isArray(data.messages)) {
        setWaChannelMessages(data.messages);
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

      fetchLiveGmailInbox(targetEmail, targetPass);
      fetchLiveWhatsAppChannel(false);
    }
  }, []);

  // Automatically listen and reply to messages sent to "AutoFame AI Agent" on WhatsApp
  useEffect(() => {
    if (!dealershipContext) return;
    const interval = setInterval(() => {
      fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "agent_auto_reply",
          context: dealershipContext,
        }),
      }).catch(() => {});
    }, 3500);
    return () => clearInterval(interval);
  }, [dealershipContext]);

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
        toast.success(`Sent on WhatsApp (STARLD-W5LEE) to ${canvasWaPhone.trim()}`);
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

      const directAnswer = getDirectAnswerOnly(
        finalContent,
        dealershipContext,
        inboxEmails,
        waChannelMessages
      );

      if (directAnswer !== null) {
        await addMessage({
          sessionId: targetSessionId,
          role: "assistant",
          content: directAnswer,
          actionType: actionPayload?.actionType,
          actionPayload: actionPayload || undefined,
        });
        return;
      }

      let answerText = "";
      if (typeof window !== "undefined" && (window as any).puter?.ai?.chat) {
        try {
          const systemPrompt = buildStrictSystemPrompt(
            dealershipContext,
            inboxEmails,
            connectedGmail
          );
          const puterRes = await (window as any).puter.ai.chat(
            [
              { role: "system", content: systemPrompt },
              { role: "user", content: finalContent },
            ],
            { model: "claude-3-5-sonnet", stream: false }
          );
          answerText =
            typeof puterRes === "string"
              ? puterRes
              : puterRes?.message?.content?.[0]?.text || puterRes?.text || "";
        } catch {}
      }

      if (!answerText.trim()) {
        const response = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: finalContent }],
            context: dealershipContext,
            inboxEmails,
            connectedGmail,
          }),
        });
        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "").trim();
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.type === "token") answerText += parsed.text;
                } catch {}
              }
            }
          }
        }
      }

      await addMessage({
        sessionId: targetSessionId,
        role: "assistant",
        content: answerText.trim() || `${dealershipContext?.cars?.length ?? 0}`,
        actionType: actionPayload?.actionType,
        actionPayload: actionPayload || undefined,
      });
    } catch (err: any) {
      toast.error("Agent error: " + err.message);
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
              <Sparkles className="h-4 w-4" />
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
                    <Sparkles className="h-6 w-6" />
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
                      <Sparkles className="h-4 w-4" />
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
                  disabled={!inputValue.trim() && attachedFiles.length === 0}
                  size="sm"
                  className="h-7 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-30"
                >
                  <Send className="h-3 w-3" />
                  Send
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
                {/* WhatsApp Channel Intake Sync Bar */}
                <div className="p-3 rounded-xl bg-[#1b1916] border border-[#33302a] flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-emerald-400">
                      WhatsApp Channel: STARLD-W5LEE
                    </p>
                    <p className="text-[10px] text-[#8e8a82]">
                      Pull applicant details &amp; proof docs from WhatsApp or send form container
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchLiveWhatsAppChannel(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#25231e] hover:bg-[#2f2c26] text-[#eae7e1] border border-[#3a362f] text-[10px] font-medium flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3 text-emerald-400" />
                      Sync WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendFinanceFormOrMissingViaWhatsApp(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" />
                      Send Form on WA
                    </button>
                  </div>
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

            {/* ── MODE 3: TWO-WAY WHATSAPP AGENT (CHANNEL STARLD-W5LEE) ── */}
            {composeDrawerMode === "whatsapp" && (
              <>
                <div className="p-3 rounded-xl bg-[#191815] border border-[#2f2c26] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-400">
                        Live Channel: STARLD-W5LEE
                      </p>
                      <p className="text-[10px] text-[#8e8a82] font-mono">
                        +27 63 199 5124 • Connected to Dealership DB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerWhatsAppAgentAutoReply}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      AI Reply &amp; Sync
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    WhatsApp Number *
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
                    Message / Finance Application Container
                  </label>
                  <textarea
                    rows={7}
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
                        Sent on WhatsApp
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send on WhatsApp
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => openFinanceContainer()}
                    variant="outline"
                    className="h-9 px-3 rounded-xl border-[#38342d] bg-[#1b1916] hover:bg-[#25231e] text-[#eae7e1] text-xs"
                  >
                    Open Form Container
                  </Button>
                </div>

                {/* Recent Live WhatsApp Messages on STARLD-W5LEE */}
                {waChannelMessages.length > 0 && (
                  <div className="pt-2 border-t border-[#292621] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#8e8a82]">
                        Recent Channel Messages ({waChannelMessages.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => fetchLiveWhatsAppChannel(true)}
                        className="text-[10px] text-emerald-400 hover:underline"
                      >
                        Import to Finance Form
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {waChannelMessages.slice(0, 8).map((m: any) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (m.from) setCanvasWaPhone("+" + String(m.from).replace(/^\+/, ""));
                          }}
                          className="p-2 rounded-lg bg-[#181714] border border-[#2a2722] cursor-pointer hover:border-emerald-500/40"
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#8e8a82]">
                            <span className="font-semibold text-[#eae7e1]">
                              {m.fromMe ? "AutoFame Agent → " : ""}
                              {m.fromName} ({m.from})
                            </span>
                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-[11px] text-[#dedad2] mt-1 line-clamp-2">{m.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
