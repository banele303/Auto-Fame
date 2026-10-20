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
  SlidersHorizontal,
  MessageSquare,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  Car,
  ClipboardList,
  Search,
  RefreshCw,
  Inbox,
  Wrench,
  Calculator,
  Maximize2,
  Minimize2,
  Wand2,
  Clock,
  Reply,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <ul className="list-disc list-outside pl-5 space-y-1 my-2 text-xs sm:text-sm text-[#dedad2]" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-outside pl-5 space-y-1 my-2 text-xs sm:text-sm text-[#dedad2]" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
  code: ({ node, inline, ...props }: any) => {
    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-[#161513] border border-[#38342d] text-emerald-300 font-mono text-xs"
          {...props}
        />
      );
    }
    return <code className="block text-xs font-mono text-[#eae7e1] leading-relaxed" {...props} />;
  },
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
      vehicle: f.loanAmount ? `Loan: R${Number(f.loanAmount).toLocaleString()} ZAR` : "Vehicle Finance",
      status: f.status || "PENDING",
      date: f.applicationDate || "",
    })),
    ...inquiries.map((inq: any) => ({
      type: "Vehicle Inquiry",
      customerName: inq.customerName || "Website Lead",
      email: inq.customerEmail || "",
      phone: inq.customerPhone || "",
      vehicle: inq.carName || `Car #${inq.carId}`,
      status: inq.status || "NEW",
      date: inq.createdAt || "",
    })),
    ...testDrives.map((td: any) => ({
      type: "Test Drive Booking",
      customerName: td.customerName || "Showroom Client",
      email: td.customerEmail || "",
      phone: td.customerPhone || "",
      vehicle: td.carName || `Car #${td.carId}`,
      status: td.completed ? "COMPLETED" : "SCHEDULED",
      date: td.createdAt || "",
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
  const message = `Hi ${customerName}, this is AutoFame Dealership Johannesburg South regarding *${carName}*${priceText}. You can complete your finance application online at https://www.autofame.co.za/financing or reply here with your ID copy, 3 months bank statements, and payslips.`;

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
 * Direct Dealership & Multi-Channel Answer Engine
 */
function getDirectAnswerOnly(
  query: string,
  context: any,
  inboxEmails: any[],
  connectedGmail: string
): {
  directAnswer: string | null;
  openCanvasTab?: "command" | "inventory" | "forms" | "gmail" | "whatsapp";
} {
  const lower = query.toLowerCase().trim();
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const repairs = Array.isArray(context?.repairs) ? context.repairs : [];
  const realLeads = extractRealLeads(context);

  const totalCars = cars.length;
  const availableCars = cars.filter((c: any) => c.status === "AVAILABLE");
  const soldCars = cars.filter((c: any) => c.status === "SOLD");
  const workshopCars = cars.filter(
    (c: any) => c.status === "MAINTENANCE" || c.status === "REPAIR"
  );
  const totalValue = availableCars.reduce((s: number, c: any) => s + (c.price || 0), 0);

  // 1. EXACT COUNT QUESTIONS -> Return ONLY the number
  if (lower.includes("how many available") || lower.includes("available cars")) {
    return { directAnswer: `${availableCars.length}` };
  }
  if (lower.includes("how many sold") || lower.includes("sold cars")) {
    return { directAnswer: `${soldCars.length}` };
  }
  if (
    lower.includes("how many repair") ||
    lower.includes("how many in workshop") ||
    lower.includes("how many maintenance")
  ) {
    return { directAnswer: `${workshopCars.length || repairs.length}` };
  }
  if (
    lower.includes("how many form") ||
    lower.includes("how many lead") ||
    lower.includes("how many inquir") ||
    lower.includes("how many application")
  ) {
    return { directAnswer: `${realLeads.length}` };
  }
  if (
    lower.includes("how many email") ||
    lower.includes("how many imail") ||
    lower.includes("how many wmail")
  ) {
    if (lower.includes("yesterday") || lower.includes("yerstady")) {
      return { directAnswer: `${inboxEmails.filter((e) => e.isYesterday).length}` };
    }
    if (lower.includes("today")) {
      return { directAnswer: `${inboxEmails.filter((e) => e.isToday).length}` };
    }
    return { directAnswer: `${inboxEmails.length}` };
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
    return { directAnswer: `${totalCars}` };
  }

  // 2. INBOX / EMAIL QUERIES (Asking what emails we have / emails from yesterday / today)
  if (
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
      return {
        directAnswer: yesterdayOnly ? "0" : todayOnly ? "0" : "0",
        openCanvasTab: "gmail",
      };
    }

    const listStr = filtered
      .slice(0, 8)
      .map(
        (e) =>
          `• **${e.fromName}** (\`${e.fromEmail}\`) — **${e.subject}** (${
            e.isToday
              ? "Today"
              : e.isYesterday
              ? "Yesterday"
              : new Date(e.date).toLocaleDateString()
          })`
      )
      .join("\n");

    return {
      directAnswer: listStr,
      openCanvasTab: "gmail",
    };
  }

  // 3. COMPOSE EMAIL
  if (
    lower.includes("compose") ||
    lower.includes("send email") ||
    lower.includes("write email") ||
    lower.includes("draft email")
  ) {
    return {
      directAnswer: "Email composer ready in Canvas.",
      openCanvasTab: "gmail",
    };
  }

  // 4. WHATSAPP
  if (
    lower.includes("whatsapp") ||
    lower.includes("what app") ||
    lower.includes("whapi") ||
    lower.includes("send link")
  ) {
    return {
      directAnswer: "WhatsApp composer ready in Canvas.",
      openCanvasTab: "whatsapp",
    };
  }

  // 5. VALUE / PRICE QUESTIONS
  if (lower.includes("total value") || lower.includes("showroom value")) {
    return { directAnswer: `R${totalValue.toLocaleString()} ZAR` };
  }
  if (lower.includes("cheapest") || lower.includes("lowest price")) {
    if (cars.length === 0) return { directAnswer: "0" };
    const cheapest = [...cars].sort((a: any, b: any) => (a.price || 0) - (b.price || 0))[0];
    return {
      directAnswer: `${cheapest.year} ${cheapest.make} ${cheapest.model} — R${(cheapest.price || 0).toLocaleString()} ZAR`,
    };
  }
  if (lower.includes("most expensive") || lower.includes("highest price")) {
    if (cars.length === 0) return { directAnswer: "0" };
    const mostExp = [...cars].sort((a: any, b: any) => (b.price || 0) - (a.price || 0))[0];
    return {
      directAnswer: `${mostExp.year} ${mostExp.make} ${mostExp.model} — R${(mostExp.price || 0).toLocaleString()} ZAR`,
    };
  }

  // 6. FORMS / LEADS
  if (
    lower.includes("form") ||
    lower.includes("submission") ||
    lower.includes("inquir") ||
    lower.includes("lead") ||
    lower.includes("applicant") ||
    lower.includes("test drive")
  ) {
    if (realLeads.length === 0) return { directAnswer: "0", openCanvasTab: "forms" };
    return {
      directAnswer: realLeads
        .map((f) => `• **${f.customerName}** (${f.type}) — ${f.email || f.phone || "No contact"} — ${f.status}`)
        .join("\n"),
      openCanvasTab: "forms",
    };
  }

  // 7. BRAND / MODEL MATCH
  const matchedCars = cars.filter(
    (c: any) =>
      lower.includes(c.make?.toLowerCase() || "") ||
      lower.includes((c.model?.toLowerCase() || "").split(" ")[0])
  );
  if (matchedCars.length > 0) {
    return {
      directAnswer: matchedCars
        .map(
          (c: any) =>
            `• **${c.year} ${c.make} ${c.model}** — R${(c.price || 0).toLocaleString()} ZAR (${(c.mileage || 0).toLocaleString()} km, ${c.status})`
        )
        .join("\n"),
      openCanvasTab: "inventory",
    };
  }

  if (lower.includes("list") || lower.includes("inventory") || lower.includes("showroom")) {
    return {
      directAnswer:
        cars.length === 0
          ? "0"
          : cars
              .map(
                (c: any) =>
                  `• **${c.year} ${c.make} ${c.model}** — R${(c.price || 0).toLocaleString()} ZAR (${c.status})`
              )
              .join("\n"),
      openCanvasTab: "inventory",
    };
  }

  return { directAnswer: null };
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
- Connected Gmail (${connectedGmail}) Inbox Count: ${inboxEmails.length} (Today: ${
    inboxEmails.filter((e: any) => e.isToday).length
  }, Yesterday: ${inboxEmails.filter((e: any) => e.isYesterday).length})
- Inbox Emails: ${emailSummary}
- Vehicles: ${inventorySummary}

CRITICAL INSTRUCTION:
Reply ONLY with the exact direct answer requested. Do NOT include any greetings, explanations, or extra words. If asked a count (like "how many cars"), reply ONLY with the digits (e.g. "${cars.length}").`;
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
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.files.resolveStorageUrl);

  // Active Session
  const [selectedSessionId, setSelectedSessionId] = useState<any>(null);
  const activeSessionData = useQuery(
    api.agent.getSession,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  // Connected Channels State (alexsouthflow3@gmail.com)
  const [connectedGmail, setConnectedGmail] = useState("alexsouthflow3@gmail.com");
  const [gmailAppPassword, setGmailAppPassword] = useState("dmjjjsyxcpqpdwlb");
  const [gmailVerified, setGmailVerified] = useState(true);
  const [gmailVerifyError, setGmailVerifyError] = useState<string | null>(null);
  const [connectedWhatsApp, setConnectedWhatsApp] = useState("+27 11 942 1200");
  const [channelsModalOpen, setChannelsModalOpen] = useState(false);

  // ── LIVE GMAIL INBOX STATE (Today, Yesterday, All) ──
  const [inboxEmails, setInboxEmails] = useState<any[]>([]);
  const [inboxFilter, setInboxFilter] = useState<"all" | "today" | "yesterday" | "compose">("all");
  const [selectedInboxEmail, setSelectedInboxEmail] = useState<any | null>(null);

  // ── CLAUDE-STYLE DEALERSHIP CANVAS STATE ──
  const [canvasOpen, setCanvasOpen] = useState(true);
  // Wide by default; compacts when "Compose with AI" is clicked!
  const [isComposeWithAiCompact, setIsComposeWithAiCompact] = useState(false);
  const [activeCanvasTab, setActiveCanvasTab] = useState<
    "command" | "inventory" | "forms" | "gmail" | "whatsapp"
  >("command");

  // Finance Calculator State in Dealership Command Canvas
  const [calcPrice, setCalcPrice] = useState(299900);
  const [calcDepositPct, setCalcDepositPct] = useState(10);
  const [calcMonths, setCalcMonths] = useState(72);

  // Canvas Gmail Composer State
  const [canvasTo, setCanvasTo] = useState("");
  const [canvasCc, setCanvasCc] = useState("");
  const [canvasSubject, setCanvasSubject] = useState(
    "AutoFame Dealership — Official Vehicle Quotation & Finance"
  );
  const [canvasBody, setCanvasBody] = useState(
    `Dear Valued Client,\n\nThank you for contacting AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South).\n\nPlease find your requested vehicle quotation and finance details below.\n\nWarm regards,\nAutoFame Dealership\nalexsouthflow3@gmail.com`
  );
  const [canvasEmailSent, setCanvasEmailSent] = useState(false);

  // Canvas WhatsApp Composer State
  const [canvasWaPhone, setCanvasWaPhone] = useState("");
  const [canvasWaMessage, setCanvasWaMessage] = useState(
    "Hi, this is AutoFame Dealership Johannesburg South. Here is your fast-track vehicle finance link: https://www.autofame.co.za/financing"
  );
  const [canvasWaSent, setCanvasWaSent] = useState(false);

  // Canvas Inventory Filter
  const [inventorySearch, setInventorySearch] = useState("");

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

  // Fetch Real Gmail Inbox via IMAP (imap.gmail.com:993)
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
        setGmailVerified(true);
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

      if (savedWa) setConnectedWhatsApp(savedWa);

      fetchLiveGmailInbox(targetEmail, targetPass);
    }
  }, []);

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

  const loadIntoGmailCanvas = (payload: {
    to?: string;
    cc?: string;
    subject?: string;
    body?: string;
  }) => {
    if (payload.to !== undefined) setCanvasTo(payload.to);
    if (payload.cc !== undefined) setCanvasCc(payload.cc);
    if (payload.subject) setCanvasSubject(payload.subject);
    if (payload.body) setCanvasBody(payload.body);
    setCanvasEmailSent(false);
    setActiveCanvasTab("gmail");
    setInboxFilter("compose");
    setCanvasOpen(true);
  };

  const loadIntoWhatsAppCanvas = (payload: { to?: string; message?: string }) => {
    if (payload.to !== undefined) setCanvasWaPhone(payload.to);
    if (payload.message) setCanvasWaMessage(payload.message);
    setCanvasWaSent(false);
    setActiveCanvasTab("whatsapp");
    setCanvasOpen(true);
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
        toast.success(`Sent on WhatsApp to ${canvasWaPhone.trim()}`);
      } else if (data.waMeUrl) {
        window.open(data.waMeUrl, "_blank", "noopener,noreferrer");
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

  // ── Instant Direct Answer Handler ──
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
    const isComposeEmail =
      lower.includes("compose") ||
      lower.includes("send email") ||
      lower.includes("write email") ||
      lower.includes("draft email");
    const isWhatsAppRequest =
      !isComposeEmail &&
      (lower.includes("whatsapp") ||
        lower.includes("what app") ||
        lower.includes("whapi") ||
        lower.includes("send link"));

    let actionPayload: any = null;
    if (isComposeEmail) {
      actionPayload = buildClientGmailPayload(finalContent, dealershipContext, connectedGmail);
      loadIntoGmailCanvas(actionPayload);
      setIsComposeWithAiCompact(true);
    } else if (isWhatsAppRequest) {
      actionPayload = buildClientWhatsAppPayload(finalContent, dealershipContext);
      loadIntoWhatsAppCanvas(actionPayload);
      setIsComposeWithAiCompact(true);
    }

    try {
      await addMessage({
        sessionId: targetSessionId,
        role: "user",
        content: finalContent,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      const { directAnswer, openCanvasTab } = getDirectAnswerOnly(
        finalContent,
        dealershipContext,
        inboxEmails,
        connectedGmail
      );

      if (openCanvasTab) {
        setActiveCanvasTab(openCanvasTab);
        setCanvasOpen(true);
      }

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
        setGmailVerified(true);
        toast.success(`Verified ${trimmedEmail} with Google SMTP & IMAP`);
        fetchLiveGmailInbox(trimmedEmail, cleanedPass);
        setChannelsModalOpen(false);
      } else {
        setGmailVerified(false);
        setGmailVerifyError(data.error || "Google SMTP rejected the App Password.");
      }
    } catch (err: any) {
      setGmailVerified(false);
      setGmailVerifyError(err.message);
    }
  };

  const realCars = Array.isArray(dealershipContext?.cars) ? dealershipContext.cars : [];
  const realRepairs = Array.isArray(dealershipContext?.repairs) ? dealershipContext.repairs : [];
  const realLeads = extractRealLeads(dealershipContext);
  const availableCars = realCars.filter((c: any) => c.status === "AVAILABLE");
  const totalShowroomValue = availableCars.reduce((s: number, c: any) => s + (c.price || 0), 0);

  const filteredCars = realCars.filter((c: any) =>
    `${c.year} ${c.make} ${c.model} ${c.status}`
      .toLowerCase()
      .includes(inventorySearch.toLowerCase())
  );

  const todayEmails = inboxEmails.filter((e) => e.isToday);
  const yesterdayEmails = inboxEmails.filter((e) => e.isYesterday);
  const displayedInboxEmails =
    inboxFilter === "today"
      ? todayEmails
      : inboxFilter === "yesterday"
      ? yesterdayEmails
      : inboxEmails;

  // Filter out any legacy "✉️ Gmail Channel (elexsouthflow@gmail.com)" messages
  const cleanMessages = (activeSessionData?.messages || []).filter(
    (m: any) =>
      !m.content?.includes("Gmail Channel (") &&
      !m.content?.includes("Review the fields below and click Send with Gmail")
  );

  // Finance Calculator Math
  const loanPrincipal = Math.max(0, calcPrice * (1 - calcDepositPct / 100));
  const monthlyRate = 0.125 / 12; // 12.5% Prime + 1%
  const estimatedMonthly =
    calcMonths > 0
      ? Math.round(
          (loanPrincipal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -calcMonths))
        )
      : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#181715] text-[#eae7e1] font-sans">
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />

      {/* ────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: AGENT CHANNELS & CONVERSATIONS               */}
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

        {/* Dealership Channels */}
        <div className="p-3 border-b border-[#262420] space-y-1.5">
          <div className="flex items-center justify-between px-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7d7971] font-semibold">
              Dealership Channels
            </span>
            <button
              onClick={() => setChannelsModalOpen(true)}
              className="text-[10px] text-emerald-400 hover:underline font-mono"
            >
              Configure
            </button>
          </div>

          <button
            onClick={() => {
              setActiveCanvasTab("command");
              setIsComposeWithAiCompact(false);
              setCanvasOpen(true);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition text-left",
              canvasOpen && activeCanvasTab === "command"
                ? "bg-[#22201c] border-emerald-500/40"
                : "bg-[#181714] hover:bg-[#201e1a] border-[#292621]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Layers className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Dealership Command</p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  Stock • Finance • Workshop • Feed
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => {
              setActiveCanvasTab("inventory");
              setIsComposeWithAiCompact(false);
              setCanvasOpen(true);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition text-left",
              canvasOpen && activeCanvasTab === "inventory"
                ? "bg-[#22201c] border-emerald-500/40"
                : "bg-[#181714] hover:bg-[#201e1a] border-[#292621]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Car className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Vehicle Inventory</p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  {realCars.length} Vehicles in Database
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => {
              setActiveCanvasTab("forms");
              setIsComposeWithAiCompact(false);
              setCanvasOpen(true);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition text-left",
              canvasOpen && activeCanvasTab === "forms"
                ? "bg-[#22201c] border-emerald-500/40"
                : "bg-[#181714] hover:bg-[#201e1a] border-[#292621]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Forms &amp; Inquiries</p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  {realLeads.length} Active Website Leads
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => {
              setActiveCanvasTab("gmail");
              setInboxFilter("all");
              setIsComposeWithAiCompact(false);
              setCanvasOpen(true);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition text-left",
              canvasOpen && activeCanvasTab === "gmail"
                ? "bg-[#22201c] border-emerald-500/40"
                : "bg-[#181714] hover:bg-[#201e1a] border-[#292621]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Gmail Inbox</p>
                <p className="text-[10px] text-[#8e8a82] font-mono truncate">{connectedGmail}</p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
              {inboxEmails.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveCanvasTab("whatsapp");
              setIsComposeWithAiCompact(false);
              setCanvasOpen(true);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition text-left",
              canvasOpen && activeCanvasTab === "whatsapp"
                ? "bg-[#22201c] border-emerald-500/40"
                : "bg-[#181714] hover:bg-[#201e1a] border-[#292621]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">WhatsApp</p>
                <p className="text-[10px] text-[#8e8a82] font-mono truncate">{connectedWhatsApp}</p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>
        </div>

        {/* Recent Chats */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-1.5 mb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7d7971] font-semibold">
              Conversations
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
      {/* CENTER PANE: AI AGENT CHAT (Expands when Compose with AI)  */}
      {/* ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-[320px] overflow-hidden bg-[#1c1b18]">
        {/* Header */}
        <header className="h-12 px-4 border-b border-[#2b2823] bg-[#151412] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#282622] text-[#8e8a82] hover:text-white transition"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="font-serif text-sm font-bold text-[#f5f2eb] truncate">
              {activeSessionData?.session?.title || "AutoFame Agent"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Compose with AI Toggle — shrinks Canvas to compact width */}
            <button
              onClick={() => {
                setIsComposeWithAiCompact(!isComposeWithAiCompact);
                if (!canvasOpen) setCanvasOpen(true);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition",
                isComposeWithAiCompact
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-[#22201c] hover:bg-[#2a2722] text-[#dedad2] border-[#35312b]"
              )}
              title="Toggle compact Canvas for AI composing"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Compose with AI</span>
            </button>

            <button
              onClick={() => setCanvasOpen(!canvasOpen)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition",
                canvasOpen
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
                  : "bg-[#22201c] hover:bg-[#2a2722] text-[#dedad2] border-[#35312b]"
              )}
            >
              {canvasOpen ? (
                <PanelRightClose className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>Canvas</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl w-full mx-auto space-y-5">
            {cleanMessages.length === 0 && (
              <div className="py-12 text-center max-w-md mx-auto space-y-3">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-[#f5f2eb] font-serif">
                  Ask AutoFame Agent Anything
                </h2>
                <p className="text-xs text-[#8e8a82] leading-relaxed">
                  Ask about vehicle stock, prices, finance, workshop status, website form leads, or incoming emails from yesterday &amp; today.
                </p>
              </div>
            )}

            {cleanMessages.map((msg: any) => {
              const isAssistant = msg.role === "assistant";

              return (
                <div
                  key={msg._id}
                  className={cn(
                    "flex gap-3 w-full",
                    isAssistant ? "justify-start" : "justify-end"
                  )}
                >
                  {isAssistant && (
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl text-sm leading-relaxed",
                      isAssistant
                        ? "bg-[#24221e] text-[#f5f2eb] border border-[#35312b] px-4 py-3 max-w-2xl"
                        : "bg-emerald-600 text-white font-medium px-4 py-2.5 max-w-xl ml-auto"
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
                    <div className="h-7 w-7 rounded-lg bg-[#33302a] border border-[#444037] flex items-center justify-center text-[#eae7e1] shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* AI Chat Composer */}
        <div className="p-3.5 bg-[#151412] border-t border-[#2b2823] shrink-0">
          <div className="max-w-3xl w-full mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative rounded-2xl border border-[#38342d] bg-[#22201c] focus-within:border-emerald-500/80 transition"
            >
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2.5 border-b border-[#2e2b26]">
                  {attachedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-[#282521] border border-[#3d3931] rounded-lg px-2.5 py-1 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="max-w-[150px] truncate">{f.name}</span>
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
                onFocus={() => {
                  // Automatically make Canvas smaller when user clicks to compose with AI
                  setIsComposeWithAiCompact(true);
                }}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="Ask anything (e.g. 'how many cars', 'what emails do we have from yesterday', 'cheapest car')..."
                className="w-full bg-transparent p-3.5 pb-11 text-xs sm:text-sm text-[#f5f2eb] placeholder:text-[#837e75] focus:outline-none resize-none leading-relaxed"
              />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
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
                    onClick={() => {
                      setIsComposeWithAiCompact(true);
                      setInputValue("Compose an email to ");
                      textareaRef.current?.focus();
                    }}
                    className="h-7 px-2.5 rounded-lg bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                  >
                    <Wand2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Compose with AI</span>
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={!inputValue.trim() && attachedFiles.length === 0}
                  size="sm"
                  className="h-7 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-30"
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
      {/* RIGHT PANE: WIDE MODERN CLAUDE-STYLE DEALERSHIP CANVAS     */}
      {/* Wide by default (60%); shrinks to 380px on Compose with AI */}
      {/* ────────────────────────────────────────────────────────── */}
      {canvasOpen && (
        <aside
          className={cn(
            "shrink-0 flex flex-col bg-[#131210] border-l border-[#2b2823] z-20 shadow-2xl transition-all duration-300",
            isComposeWithAiCompact
              ? "w-full sm:w-[370px] lg:w-[410px]"
              : "w-full md:w-[56%] lg:w-[60%] xl:w-[62%]"
          )}
        >
          {/* Canvas Header Bar */}
          <div className="h-12 px-4 border-b border-[#27241f] bg-[#171613] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-[#f5f2eb] tracking-wide">
                AutoFame Dealership Canvas
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hidden sm:inline">
                {isComposeWithAiCompact ? "Compact Mode" : "Wide Studio"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsComposeWithAiCompact(!isComposeWithAiCompact)}
                className="px-2.5 py-1 rounded-lg bg-[#22201c] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] text-[11px] flex items-center gap-1.5 transition"
                title={isComposeWithAiCompact ? "Expand Canvas Width" : "Compact Canvas Width"}
              >
                {isComposeWithAiCompact ? (
                  <>
                    <Maximize2 className="h-3 w-3 text-emerald-400" />
                    <span>Expand Canvas</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="h-3 w-3 text-emerald-400" />
                    <span>Compact</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setChannelsModalOpen(true)}
                className="p-1.5 rounded-lg hover:bg-[#262420] text-[#8e8a82] hover:text-white transition"
                title="Configure Channels"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setCanvasOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#262420] text-[#8e8a82] hover:text-white transition"
                title="Close Canvas"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Multi-Channel Dealership Navigation Tabs */}
          <div className="px-4 py-2.5 bg-[#151412] border-b border-[#27241f] flex items-center gap-1.5 overflow-x-auto shrink-0">
            <button
              onClick={() => {
                setActiveCanvasTab("command");
                setIsComposeWithAiCompact(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "command"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#1f1e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Command Overview
            </button>

            <button
              onClick={() => {
                setActiveCanvasTab("inventory");
                setIsComposeWithAiCompact(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "inventory"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#1f1e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <Car className="h-3.5 w-3.5" />
              Showroom Stock ({realCars.length})
            </button>

            <button
              onClick={() => {
                setActiveCanvasTab("forms");
                setIsComposeWithAiCompact(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "forms"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#1f1e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Forms &amp; Leads ({realLeads.length})
            </button>

            <button
              onClick={() => {
                setActiveCanvasTab("gmail");
                setIsComposeWithAiCompact(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "gmail"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#1f1e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <Inbox className="h-3.5 w-3.5" />
              Emails ({inboxEmails.length})
            </button>

            <button
              onClick={() => {
                setActiveCanvasTab("whatsapp");
                setIsComposeWithAiCompact(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "whatsapp"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#1f1e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              WhatsApp
            </button>
          </div>

          {/* Canvas Main Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 1: DEALERSHIP COMMAND OVERVIEW (All Channels + Tools)  */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeCanvasTab === "command" && (
              <div className="space-y-5">
                {/* Live Dealership KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div
                    onClick={() => setActiveCanvasTab("inventory")}
                    className="p-4 rounded-2xl bg-[#1a1916] border border-[#2d2a24] hover:border-emerald-500/40 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-[#8e8a82] text-[11px] font-mono uppercase">
                      <span>Total Stock</span>
                      <Car className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-[#f5f2eb] mt-1">{realCars.length}</p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      {availableCars.length} Available on Floor
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveCanvasTab("inventory")}
                    className="p-4 rounded-2xl bg-[#1a1916] border border-[#2d2a24] hover:border-emerald-500/40 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-[#8e8a82] text-[11px] font-mono uppercase">
                      <span>Showroom Value</span>
                      <Calculator className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-lg font-bold text-[#f5f2eb] mt-1.5 font-mono">
                      R{totalShowroomValue.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#8e8a82] mt-0.5">ZAR Active Asset Value</p>
                  </div>

                  <div
                    onClick={() => setActiveCanvasTab("forms")}
                    className="p-4 rounded-2xl bg-[#1a1916] border border-[#2d2a24] hover:border-emerald-500/40 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-[#8e8a82] text-[11px] font-mono uppercase">
                      <span>Website Leads</span>
                      <ClipboardList className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-[#f5f2eb] mt-1">{realLeads.length}</p>
                    <p className="text-[11px] text-[#8e8a82] mt-0.5">
                      Finance &amp; Test Drives
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveCanvasTab("gmail")}
                    className="p-4 rounded-2xl bg-[#1a1916] border border-[#2d2a24] hover:border-emerald-500/40 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-[#8e8a82] text-[11px] font-mono uppercase">
                      <span>New Emails</span>
                      <Mail className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-[#f5f2eb] mt-1">
                      {todayEmails.length + yesterdayEmails.length}
                    </p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      {todayEmails.length} Today • {yesterdayEmails.length} Yesterday
                    </p>
                  </div>
                </div>

                {/* Two-Column Dealership Grid: New Emails (Today & Yesterday) + Finance Calculator */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* Live Emails from Today & Yesterday */}
                  <div className="rounded-2xl bg-[#1a1916] border border-[#2d2a24] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Inbox className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-xs font-bold text-[#f5f2eb]">
                          New Emails (Today &amp; Yesterday)
                        </h3>
                      </div>
                      <button
                        onClick={() => fetchLiveGmailInbox()}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Sync
                      </button>
                    </div>

                    {inboxEmails.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[#8e8a82]">
                        No recent emails in {connectedGmail}.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {inboxEmails.slice(0, 5).map((email) => (
                          <div
                            key={email.seq}
                            onClick={() => {
                              setSelectedInboxEmail(email);
                              setActiveCanvasTab("gmail");
                              setInboxFilter("all");
                            }}
                            className="p-3 rounded-xl bg-[#141311] border border-[#292621] hover:border-emerald-500/40 cursor-pointer transition space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#f5f2eb] truncate">
                                {email.fromName}
                              </span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0",
                                  email.isToday
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : email.isYesterday
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-[#24221e] text-[#8e8a82]"
                                )}
                              >
                                {email.isToday
                                  ? "Today"
                                  : email.isYesterday
                                  ? "Yesterday"
                                  : new Date(email.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-emerald-400 font-medium truncate">
                              {email.subject}
                            </p>
                            <p className="text-[11px] text-[#8e8a82] line-clamp-1">
                              {email.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive SA Dealership Finance & Instalment Desk */}
                  <div className="rounded-2xl bg-[#1a1916] border border-[#2d2a24] p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-xs font-bold text-[#f5f2eb]">
                          Dealership Finance Calculator (ZAR)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        WesBank / MFC / Std Bank
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                          Vehicle Price (R)
                        </label>
                        <input
                          type="number"
                          value={calcPrice}
                          onChange={(e) => setCalcPrice(Number(e.target.value) || 0)}
                          className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-2.5 py-2 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                          Deposit (%)
                        </label>
                        <input
                          type="number"
                          value={calcDepositPct}
                          onChange={(e) => setCalcDepositPct(Number(e.target.value) || 0)}
                          className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-2.5 py-2 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                          Term (Months)
                        </label>
                        <select
                          value={calcMonths}
                          onChange={(e) => setCalcMonths(Number(e.target.value))}
                          className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-2.5 py-2 text-white font-mono text-xs"
                        >
                          <option value={48}>48 Mos</option>
                          <option value={60}>60 Mos</option>
                          <option value={72}>72 Mos</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#12110f] border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-mono uppercase text-[#8e8a82]">
                          Est. Monthly Instalment
                        </p>
                        <p className="text-xl font-bold text-emerald-400 font-mono">
                          R{estimatedMonthly.toLocaleString()} / mo
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          loadIntoGmailCanvas({
                            subject: `AutoFame Finance Quotation — R${estimatedMonthly.toLocaleString()}/mo`,
                            body: `Dear Valued Client,\n\nHere is your AutoFame Dealership finance quotation:\n• Vehicle Price: R${calcPrice.toLocaleString()} ZAR\n• Deposit (${calcDepositPct}%): R${Math.round(
                              (calcPrice * calcDepositPct) / 100
                            ).toLocaleString()} ZAR\n• Term: ${calcMonths} Months\n• Estimated Instalment: R${estimatedMonthly.toLocaleString()} ZAR / month\n\nWarm regards,\nAutoFame Dealership\n${connectedGmail}`,
                          });
                        }}
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl"
                      >
                        Email Quote
                      </Button>
                    </div>

                    {/* Workshop Status Summary */}
                    <div className="pt-2 border-t border-[#292621] flex items-center justify-between text-xs">
                      <span className="text-[#8e8a82] flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-emerald-400" />
                        Active Workshop Repairs:
                      </span>
                      <span className="font-mono font-bold text-white">{realRepairs.length}</span>
                    </div>
                  </div>
                </div>

                {/* Showroom Inventory Quick Roster */}
                <div className="rounded-2xl bg-[#1a1916] border border-[#2d2a24] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#f5f2eb] flex items-center gap-2">
                      <Car className="h-4 w-4 text-emerald-400" />
                      Live Dealership Stock ({realCars.length} Cars)
                    </h3>
                    <button
                      onClick={() => setActiveCanvasTab("inventory")}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  {realCars.length === 0 ? (
                    <p className="text-xs text-[#8e8a82] py-4 text-center">
                      0 cars currently in database.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {realCars.slice(0, 6).map((car: any) => (
                        <div
                          key={car.id}
                          className="p-3 rounded-xl bg-[#141311] border border-[#292621] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#f5f2eb] truncate">
                              {car.year} {car.make} {car.model}
                            </p>
                            <p className="text-[11px] text-emerald-400 font-mono">
                              R{(car.price || 0).toLocaleString()} ZAR • {car.status}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const draft = buildClientGmailPayload(
                                `${car.make} ${car.model}`,
                                dealershipContext,
                                connectedGmail
                              );
                              loadIntoGmailCanvas(draft);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#24221e] hover:bg-emerald-600 text-white text-[11px] shrink-0 transition"
                          >
                            Quote
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 2: SHOWROOM INVENTORY CANVAS                           */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeCanvasTab === "inventory" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="h-4 w-4 text-[#8e8a82] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder={`Search ${realCars.length} vehicles by make, model, year, or status...`}
                    className="w-full bg-[#1a1916] border border-[#2e2b26] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {filteredCars.length === 0 ? (
                  <div className="p-10 rounded-2xl bg-[#1a1916] border border-[#2e2b26] text-center text-xs text-[#8e8a82]">
                    0 vehicles found in database.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {filteredCars.map((car: any) => (
                      <div
                        key={car.id}
                        className="p-4 rounded-2xl bg-[#1a1916] border border-[#2e2b26] hover:border-emerald-500/40 transition flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-[#8e8a82]">
                              ID #{car.id} • {car.transmission || "Automatic"}
                            </span>
                            <h4 className="text-sm font-bold text-[#f5f2eb]">
                              {car.year} {car.make} {car.model}
                            </h4>
                            <p className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">
                              R{(car.price || 0).toLocaleString()} ZAR •{" "}
                              {(car.mileage || 0).toLocaleString()} km
                            </p>
                          </div>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-mono",
                              car.status === "AVAILABLE"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-amber-500/15 text-amber-300"
                            )}
                          >
                            {car.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#262420]">
                          <button
                            type="button"
                            onClick={() => {
                              const draft = buildClientGmailPayload(
                                `${car.make} ${car.model}`,
                                dealershipContext,
                                connectedGmail
                              );
                              loadIntoGmailCanvas(draft);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-[#25231f] hover:bg-emerald-600 text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Email Quote
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const wa = buildClientWhatsAppPayload(
                                `${car.make} ${car.model}`,
                                dealershipContext
                              );
                              loadIntoWhatsAppCanvas(wa);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-[#25231f] hover:bg-emerald-600 text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            WhatsApp
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 3: WEBSITE FORMS & LEADS CANVAS                        */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeCanvasTab === "forms" && (
              <div className="space-y-3">
                {realLeads.length === 0 ? (
                  <div className="p-10 rounded-2xl bg-[#1a1916] border border-[#2e2b26] text-center text-xs text-[#8e8a82]">
                    0 website form submissions in database.
                  </div>
                ) : (
                  realLeads.map((lead, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#1a1916] border border-[#2e2b26] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#f5f2eb]">
                            {lead.customerName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                            {lead.type}
                          </span>
                        </div>
                        <p className="text-xs text-[#dedad2]">{lead.vehicle}</p>
                        <p className="text-[11px] text-[#8e8a82] font-mono">
                          {lead.email || "No email"} • {lead.phone || "No phone"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {lead.email && (
                          <button
                            type="button"
                            onClick={() =>
                              loadIntoGmailCanvas({
                                to: lead.email,
                                subject: `AutoFame Dealership — Regarding your ${lead.type}`,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Email
                          </button>
                        )}
                        {lead.phone && (
                          <button
                            type="button"
                            onClick={() => loadIntoWhatsAppCanvas({ to: lead.phone })}
                            className="px-3 py-1.5 rounded-xl bg-[#25231f] hover:bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            WhatsApp
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 4: LIVE GMAIL INBOX (Today & Yesterday) + COMPOSER     */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeCanvasTab === "gmail" && (
              <div className="space-y-4">
                {/* Sub-bar: All Inbox | Today | Yesterday | Compose */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1a1916] p-3 rounded-2xl border border-[#2e2b26]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setInboxFilter("all");
                        setSelectedInboxEmail(null);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium transition",
                        inboxFilter === "all"
                          ? "bg-emerald-600 text-white"
                          : "bg-[#12110f] text-[#a6a197] hover:text-white"
                      )}
                    >
                      All Inbox ({inboxEmails.length})
                    </button>
                    <button
                      onClick={() => {
                        setInboxFilter("today");
                        setSelectedInboxEmail(null);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium transition",
                        inboxFilter === "today"
                          ? "bg-emerald-600 text-white"
                          : "bg-[#12110f] text-[#a6a197] hover:text-white"
                      )}
                    >
                      Today ({todayEmails.length})
                    </button>
                    <button
                      onClick={() => {
                        setInboxFilter("yesterday");
                        setSelectedInboxEmail(null);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium transition",
                        inboxFilter === "yesterday"
                          ? "bg-emerald-600 text-white"
                          : "bg-[#12110f] text-[#a6a197] hover:text-white"
                      )}
                    >
                      Yesterday ({yesterdayEmails.length})
                    </button>
                    <button
                      onClick={() => {
                        setInboxFilter("compose");
                        setSelectedInboxEmail(null);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1",
                        inboxFilter === "compose"
                          ? "bg-emerald-600 text-white"
                          : "bg-[#12110f] text-emerald-400 hover:text-white border border-emerald-500/30"
                      )}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Compose
                    </button>
                  </div>

                  <button
                    onClick={() => fetchLiveGmailInbox()}
                    className="px-2.5 py-1.5 rounded-xl bg-[#12110f] hover:bg-[#24221e] text-[#dedad2] text-xs flex items-center gap-1.5 border border-[#2e2b26]"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                    Refresh
                  </button>
                </div>

                {/* Compose View */}
                {inboxFilter === "compose" ? (
                  <div className="rounded-2xl bg-[#1a1916] border border-[#2e2b26] p-4 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#292621]">
                      <span className="font-bold text-[#f5f2eb]">
                        New Email from <code className="text-emerald-400">{connectedGmail}</code>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsComposeWithAiCompact(!isComposeWithAiCompact)}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Wand2 className="h-3 w-3" />
                        {isComposeWithAiCompact ? "Wide View" : "Compact to Compose with AI"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3.5 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500"
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
                          className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3.5 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        value={canvasSubject}
                        onChange={(e) => setCanvasSubject(e.target.value)}
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3.5 py-2 text-[#f5f2eb] font-medium text-xs focus:outline-none focus:border-emerald-500"
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
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-xl p-3.5 text-[#eae7e1] text-xs leading-relaxed focus:outline-none focus:border-emerald-500 resize-y"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#2a2722]">
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#25231f] hover:bg-[#2f2c27] text-[#dedad2] border border-[#38342d]"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                        Open in Gmail Web
                      </button>

                      <Button
                        type="button"
                        onClick={handleSendCanvasGmail}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-5 rounded-xl flex items-center gap-1.5"
                      >
                        {canvasEmailSent ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Sent from {connectedGmail}
                          </>
                        ) : (
                          <>
                            <SendHorizontal className="h-4 w-4" />
                            Send Email Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : selectedInboxEmail ? (
                  /* Selected Incoming Email Reader + Reply with AI */
                  <div className="rounded-2xl bg-[#1a1916] border border-[#2e2b26] p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-[#292621] pb-3">
                      <div>
                        <button
                          onClick={() => setSelectedInboxEmail(null)}
                          className="text-xs text-emerald-400 hover:underline mb-2 inline-block"
                        >
                          &larr; Back to Inbox
                        </button>
                        <h3 className="text-sm font-bold text-[#f5f2eb]">
                          {selectedInboxEmail.subject}
                        </h3>
                        <p className="text-xs text-[#dedad2] mt-1">
                          From: <strong>{selectedInboxEmail.fromName}</strong> (
                          <code className="text-emerald-400">{selectedInboxEmail.fromEmail}</code>)
                        </p>
                        <p className="text-[11px] text-[#8e8a82] mt-0.5">
                          Received: {new Date(selectedInboxEmail.date).toLocaleString()}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          loadIntoGmailCanvas({
                            to: selectedInboxEmail.fromEmail,
                            subject: `Re: ${selectedInboxEmail.subject}`,
                            body: `Dear ${selectedInboxEmail.fromName},\n\nThank you for your email to AutoFame Dealership.\n\n\n\nWarm regards,\nAutoFame Dealership\n${connectedGmail}`,
                          });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3.5 rounded-xl flex items-center gap-1.5"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        Reply
                      </Button>
                    </div>

                    <div className="text-xs text-[#dedad2] leading-relaxed whitespace-pre-wrap bg-[#12110f] p-4 rounded-xl border border-[#292621]">
                      {selectedInboxEmail.snippet}
                    </div>
                  </div>
                ) : (
                  /* Live Inbox List (Today, Yesterday, Earlier) */
                  <div className="space-y-2">
                    {displayedInboxEmails.length === 0 ? (
                      <div className="p-10 rounded-2xl bg-[#1a1916] border border-[#2e2b26] text-center text-xs text-[#8e8a82]">
                        No emails found for this filter in {connectedGmail}.
                      </div>
                    ) : (
                      displayedInboxEmails.map((email) => (
                        <div
                          key={email.seq}
                          onClick={() => setSelectedInboxEmail(email)}
                          className="p-3.5 rounded-2xl bg-[#1a1916] border border-[#2e2b26] hover:border-emerald-500/40 cursor-pointer transition flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#f5f2eb] truncate">
                                {email.fromName}
                              </span>
                              <span className="text-[11px] font-mono text-[#8e8a82] truncate">
                                &lt;{email.fromEmail}&gt;
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-400 truncate">
                              {email.subject}
                            </p>
                            <p className="text-xs text-[#8e8a82] line-clamp-1">
                              {email.snippet}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1",
                                email.isToday
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : email.isYesterday
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-[#24221e] text-[#8e8a82]"
                              )}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {email.isToday
                                ? "Today"
                                : email.isYesterday
                                ? "Yesterday"
                                : new Date(email.date).toLocaleDateString()}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadIntoGmailCanvas({
                                  to: email.fromEmail,
                                  subject: `Re: ${email.subject}`,
                                  body: `Dear ${email.fromName},\n\nThank you for contacting AutoFame Dealership.\n\nWarm regards,\nAutoFame Dealership\n${connectedGmail}`,
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-[#25231f] hover:bg-emerald-600 text-white text-[10px] font-medium flex items-center gap-1"
                            >
                              <Reply className="h-2.5 w-2.5" />
                              Reply
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* TAB 5: WHATSAPP STUDIO CANVAS                              */}
            {/* ══════════════════════════════════════════════════════════ */}
            {activeCanvasTab === "whatsapp" && (
              <div className="rounded-2xl bg-[#1a1916] border border-[#2e2b26] p-4 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#2a2722]">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-[#f5f2eb]">WhatsApp Dispatch Studio</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Connected
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Recipient WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    value={canvasWaPhone}
                    onChange={(e) => {
                      setCanvasWaPhone(e.target.value);
                      setCanvasWaSent(false);
                    }}
                    placeholder="+27 82 000 0000"
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3.5 py-2.5 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Message
                  </label>
                  <textarea
                    rows={6}
                    value={canvasWaMessage}
                    onChange={(e) => setCanvasWaMessage(e.target.value)}
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-xl p-3.5 text-[#eae7e1] text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    onClick={handleSendCanvasWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-5 rounded-xl flex items-center gap-1.5"
                  >
                    {canvasWaSent ? (
                      <>
                        <Check className="h-4 w-4" />
                        Sent
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send on WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </div>
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
                  Live IMAP (`imap.gmail.com:993`) &amp; SMTP (`smtp.gmail.com:465`)
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
