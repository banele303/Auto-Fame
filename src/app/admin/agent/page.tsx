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
  Copy,
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
  Eye,
  Code2,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Clean Markdown Typography
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

// ──────────────────────────────────────────────
// Extract Real Leads from Convex Database (Zero Demo Data)
// ──────────────────────────────────────────────
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
    })),
    ...inquiries.map((inq: any) => ({
      type: "Vehicle Inquiry",
      customerName: inq.customerName || "Website Lead",
      email: inq.customerEmail || "",
      phone: inq.customerPhone || "",
      vehicle: inq.carName || `Car #${inq.carId}`,
      status: inq.status || "NEW",
    })),
    ...testDrives.map((td: any) => ({
      type: "Test Drive Booking",
      customerName: td.customerName || "Showroom Client",
      email: td.customerEmail || "",
      phone: td.customerPhone || "",
      vehicle: td.carName || `Car #${td.carId}`,
      status: td.completed ? "COMPLETED" : "SCHEDULED",
    })),
  ];
}

// ──────────────────────────────────────────────
// Helper: Build Gmail Draft Payload
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Helper: Build WhatsApp Draft Payload
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Direct Answer Engine (Returns ONLY the answer, nothing else)
// ──────────────────────────────────────────────
function getDirectAnswerOnly(
  query: string,
  context: any,
  connectedGmail: string
): { directAnswer: string | null; openCanvasTab?: "gmail" | "whatsapp" | "inventory" | "forms" } {
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

  // Exact count queries -> ONLY the number
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

  if (
    lower.includes("email") ||
    lower.includes("gmail") ||
    lower.includes("mail") ||
    lower.includes("compose") ||
    lower.includes("imael")
  ) {
    return {
      directAnswer: `Gmail Composer ready in Canvas (${connectedGmail}).`,
      openCanvasTab: "gmail",
    };
  }

  if (
    lower.includes("whatsapp") ||
    lower.includes("what app") ||
    lower.includes("whapi") ||
    lower.includes("send link")
  ) {
    return {
      directAnswer: `WhatsApp Composer ready in Canvas.`,
      openCanvasTab: "whatsapp",
    };
  }

  if (
    lower.includes("form") ||
    lower.includes("submission") ||
    lower.includes("inquir") ||
    lower.includes("lead") ||
    lower.includes("applicant") ||
    lower.includes("test drive")
  ) {
    return {
      directAnswer: `${realLeads.length}`,
      openCanvasTab: "forms",
    };
  }

  if (lower.includes("list") || lower.includes("inventory") || lower.includes("showroom")) {
    return {
      directAnswer: `${totalCars}`,
      openCanvasTab: "inventory",
    };
  }

  return { directAnswer: null };
}

function buildStrictSystemPrompt(context: any, connectedGmail: string) {
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

  return `You are AutoFame Agent.
Database facts:
- Total cars: ${cars.length}
- Available cars: ${cars.filter((c: any) => c.status === "AVAILABLE").length}
- Sold cars: ${cars.filter((c: any) => c.status === "SOLD").length}
- Form submissions: ${realLeads.length}
- Connected Gmail: ${connectedGmail}
- Vehicles: ${inventorySummary}

CRITICAL INSTRUCTION:
Reply ONLY with the exact direct answer requested. Do NOT include any greetings, explanations, bullet points, or extra words. If asked a number/count (like "how many cars"), reply ONLY with the digits (e.g. "${cars.length}").`;
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

  // ── CLAUDE-STYLE INTERACTIVE CANVAS STATE ──
  const [canvasOpen, setCanvasOpen] = useState(true);
  const [activeCanvasTab, setActiveCanvasTab] = useState<
    "gmail" | "whatsapp" | "inventory" | "forms"
  >("gmail");
  const [gmailCanvasView, setGmailCanvasView] = useState<"compose" | "preview">("compose");

  // Canvas Gmail Composer State
  const [canvasTo, setCanvasTo] = useState("");
  const [canvasCc, setCanvasCc] = useState("");
  const [canvasSubject, setCanvasSubject] = useState(
    "AutoFame Dealership — Official Vehicle Quotation & Finance"
  );
  const [canvasBody, setCanvasBody] = useState(
    `Dear Valued Client,\n\nThank you for contacting AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South).\n\nPlease find your requested vehicle quotation and finance details attached.\n\nWarm regards,\nAutoFame Dealership\nalexsouthflow3@gmail.com`
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

  const checkGmailConnection = async (emailToVerify: string, passToVerify: string) => {
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          fromEmail: emailToVerify,
          appPassword: passToVerify,
        }),
      });
      const data = await res.json();
      setGmailVerified(Boolean(res.ok && data.connected));
    } catch {
      setGmailVerified(false);
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

      if (savedWa) setConnectedWhatsApp(savedWa);

      checkGmailConnection(targetEmail, targetPass);
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

  // Helper to populate Gmail Canvas from a payload or car/lead
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
    setCanvasOpen(true);
  };

  // Helper to populate WhatsApp Canvas
  const loadIntoWhatsAppCanvas = (payload: { to?: string; message?: string }) => {
    if (payload.to !== undefined) setCanvasWaPhone(payload.to);
    if (payload.message) setCanvasWaMessage(payload.message);
    setCanvasWaSent(false);
    setActiveCanvasTab("whatsapp");
    setCanvasOpen(true);
  };

  // Send Real Email from Canvas
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

  // Send Real WhatsApp from Canvas
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

  // ── Instant, Zero-Loading Direct Answer Handler ──
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
    const isGmailRequest =
      lower.includes("email") ||
      lower.includes("gmail") ||
      lower.includes("mail") ||
      lower.includes("compose") ||
      lower.includes("imael");
    const isWhatsAppRequest =
      !isGmailRequest &&
      (lower.includes("whatsapp") ||
        lower.includes("what app") ||
        lower.includes("whapi") ||
        lower.includes("send link"));

    let actionPayload: any = null;
    if (isGmailRequest) {
      actionPayload = buildClientGmailPayload(finalContent, dealershipContext, connectedGmail);
      loadIntoGmailCanvas(actionPayload);
    } else if (isWhatsAppRequest) {
      actionPayload = buildClientWhatsAppPayload(finalContent, dealershipContext);
      loadIntoWhatsAppCanvas(actionPayload);
    }

    try {
      await addMessage({
        sessionId: targetSessionId,
        role: "user",
        content: finalContent,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      // 1. Check Direct Database Answer first (Instant, zero loading, exact answer only)
      const { directAnswer, openCanvasTab } = getDirectAnswerOnly(
        finalContent,
        dealershipContext,
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

      // 2. For open-ended questions, try Puter.js with strict concise prompt or fallback to /api/agent/chat
      let answerText = "";
      if (typeof window !== "undefined" && (window as any).puter?.ai?.chat) {
        try {
          const systemPrompt = buildStrictSystemPrompt(dealershipContext, connectedGmail);
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
        toast.success(`Verified ${trimmedEmail} with Google SMTP`);
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
  const realLeads = extractRealLeads(dealershipContext);
  const filteredCars = realCars.filter((c: any) =>
    `${c.year} ${c.make} ${c.model} ${c.status}`
      .toLowerCase()
      .includes(inventorySearch.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#191815] text-[#eae7e1] font-sans">
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />

      {/* ────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: CONVERSATIONS & CONNECTED CHANNELS           */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "w-68 shrink-0 flex flex-col bg-[#131210] border-r border-[#27241f] transition-all duration-200 z-30 select-none",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full absolute md:relative md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
        )}
      >
        <div className="p-3.5 border-b border-[#27241f] flex items-center justify-between">
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

        {/* Connected Channels */}
        <div className="p-3 border-b border-[#27241f] space-y-1.5">
          <div className="flex items-center justify-between px-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7d7971] font-semibold">
              Connected Channels
            </span>
            <button
              onClick={() => setChannelsModalOpen(true)}
              className="text-[10px] text-emerald-400 hover:underline font-mono"
            >
              Settings
            </button>
          </div>

          <button
            onClick={() => {
              setActiveCanvasTab("gmail");
              setCanvasOpen(true);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition text-left",
              canvasOpen && activeCanvasTab === "gmail"
                ? "bg-[#22201c] border-emerald-500/40"
                : "bg-[#1a1916] hover:bg-[#22201c] border-[#2b2823]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Gmail Studio</p>
                <p className="text-[10px] text-[#8e8a82] font-mono truncate">{connectedGmail}</p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => {
              setActiveCanvasTab("whatsapp");
              setCanvasOpen(true);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition text-left",
              canvasOpen && activeCanvasTab === "whatsapp"
                ? "bg-[#22201c] border-emerald-500/40"
                : "bg-[#1a1916] hover:bg-[#22201c] border-[#2b2823]"
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

          <button
            onClick={() => {
              setActiveCanvasTab("inventory");
              setCanvasOpen(true);
            }}
            className={cn(
              "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border transition text-left",
              canvasOpen && activeCanvasTab === "inventory"
                ? "bg-[#22201c] border-emerald-500/40"
                : "bg-[#1a1916] hover:bg-[#22201c] border-[#2b2823]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Live Database</p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  {realCars.length} Cars • {realLeads.length} Form Leads
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          </button>
        </div>

        {/* Recent Chats */}
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
      {/* CENTER PANE: DIRECT-ANSWER CHAT STREAM                     */}
      {/* ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#1c1b18]">
        {/* Header */}
        <header className="h-12 px-4 border-b border-[#2b2823] bg-[#161513] flex items-center justify-between shrink-0">
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
            <button
              onClick={() => setCanvasOpen(!canvasOpen)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition",
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
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-3xl w-full mx-auto space-y-6">
            {(!activeSessionData?.messages || activeSessionData.messages.length === 0) && (
              <div className="py-16 text-center max-w-lg mx-auto space-y-4">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#f5f2eb] font-serif">
                  AutoFame Agent
                </h2>
                <p className="text-xs text-[#8e8a82]">
                  Direct answers from your live database • Connected to{" "}
                  <span className="text-emerald-400 font-mono">{connectedGmail}</span>
                </p>
              </div>
            )}

            {activeSessionData?.messages?.map((msg: any) => {
              const isAssistant = msg.role === "assistant";

              return (
                <div
                  key={msg._id}
                  className={cn(
                    "flex gap-3.5 w-full",
                    isAssistant ? "justify-start" : "justify-end"
                  )}
                >
                  {isAssistant && (
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl text-sm leading-relaxed",
                      isAssistant
                        ? "bg-[#24221e] text-[#f5f2eb] border border-[#35312b] px-5 py-3.5 max-w-2xl"
                        : "bg-emerald-600 text-white font-medium px-4 py-3 max-w-xl ml-auto"
                    )}
                  >
                    {isAssistant ? (
                      <div className="font-normal text-[#f5f2eb]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>

                        {/* Claude-Style Artifact Trigger Button if message has an actionPayload */}
                        {msg.actionPayload && (
                          <button
                            type="button"
                            onClick={() => {
                              if (msg.actionType === "GMAIL_COMPOSE") {
                                loadIntoGmailCanvas(msg.actionPayload);
                              } else if (msg.actionType === "WHATSAPP_COMPOSE") {
                                loadIntoWhatsAppCanvas(msg.actionPayload);
                              }
                            }}
                            className="mt-3 flex items-center justify-between gap-3 w-full px-3.5 py-2.5 rounded-xl bg-[#181714] hover:bg-[#1f1d19] border border-emerald-500/30 text-left transition group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Layers className="h-4 w-4 text-emerald-400" />
                              <div>
                                <p className="text-xs font-semibold text-[#f5f2eb]">
                                  {msg.actionType === "GMAIL_COMPOSE"
                                    ? `Gmail Draft (${connectedGmail})`
                                    : "WhatsApp Draft"}
                                </p>
                                <p className="text-[10px] text-[#8e8a82] font-mono">
                                  Click to open in Canvas
                                </p>
                              </div>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="h-7 w-7 rounded-lg bg-[#33302a] border border-[#444037] flex items-center justify-center text-[#eae7e1] shrink-0 mt-1">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="p-4 bg-[#161513] border-t border-[#2b2823] shrink-0">
          <div className="max-w-3xl w-full mx-auto">
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
                      <span className="max-w-[160px] truncate">{f.name}</span>
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
                placeholder="Ask a question (e.g. 'how many cars') or say 'compose an email to...'..."
                className="w-full bg-transparent p-3.5 pb-12 text-xs sm:text-sm text-[#f5f2eb] placeholder:text-[#837e75] focus:outline-none resize-none leading-relaxed"
              />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
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
                      setActiveCanvasTab("gmail");
                      setCanvasOpen(true);
                    }}
                    className="h-7 px-2.5 rounded-lg bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                  >
                    <Mail className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-mono text-[11px]">{connectedGmail}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveCanvasTab("whatsapp");
                      setCanvasOpen(true);
                    }}
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
      {/* RIGHT PANE: CLAUDE-STYLE MODERN AGENT CANVAS               */}
      {/* ────────────────────────────────────────────────────────── */}
      {canvasOpen && (
        <aside className="w-full sm:w-[440px] lg:w-[520px] xl:w-[580px] shrink-0 flex flex-col bg-[#141311] border-l border-[#2b2823] z-20 shadow-2xl">
          {/* Canvas Top Bar */}
          <div className="h-12 px-4 border-b border-[#27241f] bg-[#181714] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-[#f5f2eb] tracking-wide">
                Agent Canvas
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Live Workspace
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setChannelsModalOpen(true)}
                className="p-1.5 rounded-lg hover:bg-[#262420] text-[#8e8a82] hover:text-white transition"
                title="Channel Settings"
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

          {/* Canvas Mode Switcher Tabs (Claude Artifact Style) */}
          <div className="px-4 py-2.5 bg-[#161513] border-b border-[#27241f] flex items-center gap-1.5 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveCanvasTab("gmail")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "gmail"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#201e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              Gmail Studio
            </button>

            <button
              onClick={() => setActiveCanvasTab("whatsapp")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "whatsapp"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#201e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              WhatsApp
            </button>

            <button
              onClick={() => setActiveCanvasTab("inventory")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "inventory"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#201e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <Car className="h-3.5 w-3.5" />
              Inventory ({realCars.length})
            </button>

            <button
              onClick={() => setActiveCanvasTab("forms")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap",
                activeCanvasTab === "forms"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#201e1a] text-[#a6a197] hover:text-white border border-[#2e2b26]"
              )}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Forms ({realLeads.length})
            </button>
          </div>

          {/* Canvas Interactive Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* ── TAB 1: GMAIL STUDIO CANVAS ── */}
            {activeCanvasTab === "gmail" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#1b1a17] border border-[#2e2b26] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#f5f2eb] truncate">
                          {connectedGmail}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          SMTP Connected
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e8a82] font-mono">
                        smtp.gmail.com:465 (SSL/TLS)
                      </p>
                    </div>
                  </div>

                  {/* Compose vs Preview toggle */}
                  <div className="flex items-center rounded-xl bg-[#12110f] p-1 border border-[#2e2b26]">
                    <button
                      type="button"
                      onClick={() => setGmailCanvasView("compose")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition",
                        gmailCanvasView === "compose"
                          ? "bg-[#262420] text-white"
                          : "text-[#8e8a82] hover:text-white"
                      )}
                    >
                      <Code2 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setGmailCanvasView("preview")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition",
                        gmailCanvasView === "preview"
                          ? "bg-[#262420] text-white"
                          : "text-[#8e8a82] hover:text-white"
                      )}
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                  </div>
                </div>

                {gmailCanvasView === "compose" ? (
                  <div className="rounded-2xl bg-[#1b1a17] border border-[#2e2b26] p-4 space-y-3.5 text-xs">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                        To (Recipient Email) *
                      </label>
                      <input
                        type="email"
                        value={canvasTo}
                        onChange={(e) => {
                          setCanvasTo(e.target.value);
                          setCanvasEmailSent(false);
                        }}
                        placeholder="client@example.com"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3.5 py-2.5 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                        Cc (Optional)
                      </label>
                      <input
                        type="email"
                        value={canvasCc}
                        onChange={(e) => setCanvasCc(e.target.value)}
                        placeholder="cc@example.com"
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3.5 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500"
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
                        className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3.5 py-2.5 text-[#f5f2eb] font-medium text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                        Email Body
                      </label>
                      <textarea
                        rows={11}
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#25231f] hover:bg-[#2f2c27] text-[#dedad2] border border-[#38342d] transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                        Open in Gmail Web
                      </button>

                      <Button
                        type="button"
                        onClick={handleSendCanvasGmail}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-5 rounded-xl flex items-center gap-1.5 shadow-md"
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
                ) : (
                  /* Live HTML Email Artifact Preview */
                  <div className="rounded-2xl border border-[#2e2b26] bg-[#11100e] p-5 space-y-4">
                    <div className="border-b border-[#2e2b26] pb-3">
                      <h3 className="text-emerald-400 font-bold text-base">AutoFame Dealership</h3>
                      <p className="text-[11px] text-[#8e8a82] font-mono">
                        From: {connectedGmail} &rarr; To: {canvasTo || "recipient@example.com"}
                      </p>
                      <p className="text-xs font-semibold text-white mt-2">{canvasSubject}</p>
                    </div>
                    <div className="text-xs text-[#dedad2] whitespace-pre-wrap leading-relaxed">
                      {canvasBody}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: WHATSAPP STUDIO CANVAS ── */}
            {activeCanvasTab === "whatsapp" && (
              <div className="rounded-2xl bg-[#1b1a17] border border-[#2e2b26] p-4 space-y-4 text-xs">
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

            {/* ── TAB 3: LIVE INVENTORY CANVAS ── */}
            {activeCanvasTab === "inventory" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-[#8e8a82] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder={`Search ${realCars.length} vehicles in database...`}
                    className="w-full bg-[#1b1a17] border border-[#2e2b26] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {filteredCars.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#1b1a17] border border-[#2e2b26] text-center text-xs text-[#8e8a82]">
                    0 vehicles found in database.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCars.map((car: any) => (
                      <div
                        key={car.id}
                        className="p-3.5 rounded-2xl bg-[#1b1a17] border border-[#2e2b26] hover:border-emerald-500/40 transition flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#f5f2eb] truncate">
                            {car.year} {car.make} {car.model}
                          </p>
                          <p className="text-[11px] text-emerald-400 font-mono">
                            R{(car.price || 0).toLocaleString()} ZAR • {(car.mileage || 0).toLocaleString()} km
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
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
                            className="px-2.5 py-1.5 rounded-lg bg-[#25231f] hover:bg-emerald-600 hover:text-white text-[#dedad2] text-[11px] font-medium transition flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            Quote
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: FORMS & LEADS CANVAS ── */}
            {activeCanvasTab === "forms" && (
              <div className="space-y-2.5">
                {realLeads.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#1b1a17] border border-[#2e2b26] text-center text-xs text-[#8e8a82]">
                    0 website form submissions in database.
                  </div>
                ) : (
                  realLeads.map((lead, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#1b1a17] border border-[#2e2b26] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#f5f2eb]">{lead.customerName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          {lead.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e8a82] font-mono">
                        {lead.email || "No email"} • {lead.phone || "No phone"}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        {lead.email && (
                          <button
                            type="button"
                            onClick={() =>
                              loadIntoGmailCanvas({
                                to: lead.email,
                                subject: `AutoFame Dealership — Follow-up on your ${lead.type}`,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#25231f] hover:bg-emerald-600 text-white text-[11px] flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            Email Lead
                          </button>
                        )}
                        {lead.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              loadIntoWhatsAppCanvas({
                                to: lead.phone,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#25231f] hover:bg-emerald-600 text-white text-[11px] flex items-center gap-1"
                          >
                            <PhoneCall className="h-3 w-3" />
                            WhatsApp Lead
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
                  Direct SSL/TLS SMTP connection (`smtp.gmail.com:465`)
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
                Save &amp; Verify
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
