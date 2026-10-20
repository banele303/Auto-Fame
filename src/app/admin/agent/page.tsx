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
  Loader2,
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
  KeyRound,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Custom Markdown Components for Clean Agent Tables & Typography
// ──────────────────────────────────────────────
const markdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1 className="text-base sm:text-lg font-bold text-[#f5f2eb] font-serif mt-5 mb-2.5 pb-1 border-b border-[#38342d]" {...props} />
  ),
  h2: ({ node, ...props }: any) => (
    <h2 className="text-sm sm:text-base font-bold text-emerald-400 mt-4 mb-2 flex items-center gap-2" {...props} />
  ),
  h3: ({ node, ...props }: any) => (
    <h3 className="text-xs sm:text-sm font-semibold text-[#f5f2eb] mt-3 mb-1.5" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-xs sm:text-sm leading-relaxed text-[#dedad2] mb-3 last:mb-0" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-outside pl-5 space-y-1.5 my-3 text-xs sm:text-sm text-[#dedad2]" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-outside pl-5 space-y-1.5 my-3 text-xs sm:text-sm text-[#dedad2]" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="leading-relaxed" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-2 border-emerald-500/60 pl-4 py-1.5 my-3 italic text-neutral-300 text-xs sm:text-sm bg-emerald-950/10 rounded-r-lg" {...props} />
  ),
  code: ({ node, inline, ...props }: any) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-[#161513] border border-[#38342d] text-emerald-300 font-mono text-[11px] sm:text-xs" {...props} />
      );
    }
    return (
      <code className="block text-xs font-mono text-[#eae7e1] leading-relaxed" {...props} />
    );
  },
  pre: ({ node, ...props }: any) => (
    <div className="my-4 rounded-xl border border-[#38342d] bg-[#141311] p-4 overflow-x-auto shadow-sm">
      <pre className="text-xs font-mono text-[#eae7e1]" {...props} />
    </div>
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-[#38342d] bg-[#161513] shadow-md">
      <table className="w-full text-left text-xs border-collapse min-w-[620px]" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-[#22201c] text-[#eae7e1] border-b border-[#38342d] font-mono uppercase tracking-wider text-[11px]" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-4 py-3 font-semibold text-emerald-400 whitespace-nowrap" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-4 py-3 border-t border-[#2b2823] text-[#c9c5bd] align-middle" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="hover:bg-[#1f1d19] transition-colors" {...props} />
  ),
};

// ──────────────────────────────────────────────
// Extract Real Leads from Convex Database Context (Zero Demo Data)
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
    })),
    ...inquiries.map((inq: any) => ({
      type: "Vehicle Inquiry",
      customerName: inq.customerName || "Website Lead",
      email: inq.customerEmail || "",
      phone: inq.customerPhone || "",
      vehicle: inq.carName || `Car #${inq.carId}`,
    })),
    ...testDrives.map((td: any) => ({
      type: "Test Drive Booking",
      customerName: td.customerName || "Showroom Client",
      email: td.customerEmail || "",
      phone: td.customerPhone || "",
      vehicle: td.carName || `Car #${td.carId}`,
    })),
  ];
}

// ──────────────────────────────────────────────
// Helper: Build Gmail Draft Payload from Prompt + Real DB Context
// ──────────────────────────────────────────────
function buildClientGmailPayload(query: string, context: any, connectedGmail: string) {
  const lower = query.toLowerCase();
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const realLeads = extractRealLeads(context);

  let customerName = "Valued Client";
  let to = "";
  let carName = cars[0] ? `${cars[0].year} ${cars[0].make} ${cars[0].model}` : "Selected Vehicle";
  let carPrice = cars[0]?.price || 0;

  // 1. Check if an email address was typed in prompt
  const emailMatch = query.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    to = emailMatch[1];
    const namePart = to.split("@")[0].replace(/[._-]/g, " ");
    customerName = namePart.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // 2. Match against real database leads
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

  // 3. Match against real cars in database
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
// Helper: Build WhatsApp Draft Payload from Prompt + Real DB Context
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
// Inline Real Gmail Composer Card
// ──────────────────────────────────────────────
function InlineGmailComposer({
  initialPayload,
  connectedGmail,
  gmailAppPassword,
  gmailVerified,
  onOpenConnectModal,
  onRecordEvent,
}: {
  initialPayload: any;
  connectedGmail: string;
  gmailAppPassword: string;
  gmailVerified: boolean;
  onOpenConnectModal: () => void;
  onRecordEvent: (evt: any) => Promise<any>;
}) {
  const [to, setTo] = useState(initialPayload?.to || "");
  const [cc, setCc] = useState(initialPayload?.cc || "");
  const [subject, setSubject] = useState(
    initialPayload?.subject || "AutoFame Dealership — Vehicle Quotation & Finance"
  );
  const [body, setBody] = useState(initialPayload?.body || "");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSendRealGmail = async () => {
    setSendError(null);
    if (!to.trim()) {
      toast.error("Please enter the recipient email address ('To')");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please enter an email subject");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          fromEmail: connectedGmail,
          appPassword: gmailAppPassword,
          to: to.trim(),
          cc: cc.trim() || undefined,
          customerName: initialPayload?.customerName || to.trim(),
          subject: subject.trim(),
          body,
          carName: initialPayload?.carName,
          carPrice: initialPayload?.carPrice,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "SENT") {
        setIsSent(true);
        toast.success(`Email sent from ${connectedGmail} to ${to.trim()}`);
        await onRecordEvent({
          eventType: "EMAIL_SENT",
          recipient: to.trim(),
          customerName: initialPayload?.customerName || to.trim(),
          summary: `Real Gmail sent from ${connectedGmail} to ${to.trim()}: "${subject.trim()}"`,
          status: "SUCCESS",
        });
      } else {
        const errMsg =
          data.error ||
          `Could not send via smtp.gmail.com. Please configure the Google App Password for ${connectedGmail}.`;
        setSendError(errMsg);
        toast.error(errMsg);
        if (data.requiresAppPassword) {
          onOpenConnectModal();
        }
      }
    } catch (err: any) {
      setSendError(err.message);
      toast.error("Gmail SMTP error: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenInGmailWeb = () => {
    const gmailUrl = `https://mail.google.com/mail/?authuser=${encodeURIComponent(
      connectedGmail
    )}&view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(
      cc
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-5 rounded-2xl border border-[#3a362f] bg-[#181714] overflow-hidden shadow-xl">
      {/* Gmail Header */}
      <div className="px-4 py-3 bg-[#201e1a] border-b border-[#33302a] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#f5f2eb]">Gmail Composer</span>
              {gmailVerified ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  SMTP Verified
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenConnectModal}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
                >
                  Connect App Password
                </button>
              )}
            </div>
            <span className="text-[11px] text-[#8e8a82] font-mono">
              From: {connectedGmail} (smtp.gmail.com:465)
            </span>
          </div>
        </div>

        {isSent && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered via Gmail SMTP
          </span>
        )}
      </div>

      {/* Editable Fields */}
      <div className="p-4 space-y-3 text-xs">
        {sendError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-xs">Real Gmail Authentication Needed</p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">{sendError}</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={onOpenConnectModal}
              className="h-7 px-2.5 text-[11px] bg-amber-500 hover:bg-amber-400 text-black font-semibold shrink-0 rounded-lg"
            >
              Enter App Password
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">
              To (Recipient Email) *
            </label>
            <input
              type="email"
              value={to}
              placeholder="client@example.com"
              disabled={isSent}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">
              Cc (Optional)
            </label>
            <input
              type="email"
              value={cc}
              placeholder="Optional CC email"
              disabled={isSent}
              onChange={(e) => setCc(e.target.value)}
              className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            disabled={isSent}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-medium text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">
            Message Body
          </label>
          <textarea
            rows={8}
            value={body}
            disabled={isSent}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-[#12110f] border border-[#33302a] rounded-xl p-3 text-[#eae7e1] text-xs leading-relaxed focus:outline-none focus:border-emerald-500 resize-y disabled:opacity-60 font-sans"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#2d2a24]">
          <button
            type="button"
            onClick={handleOpenInGmailWeb}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#25231f] hover:bg-[#2f2c27] text-[#dedad2] border border-[#38342d] transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            Open in Gmail ({connectedGmail})
          </button>

          <Button
            type="button"
            onClick={handleSendRealGmail}
            disabled={isSending || isSent}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-4 rounded-xl flex items-center gap-1.5 shadow-md"
          >
            {isSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending via smtp.gmail.com...
              </>
            ) : isSent ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Sent from {connectedGmail}
              </>
            ) : (
              <>
                <SendHorizontal className="h-3.5 w-3.5" />
                Send with Gmail
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Inline Real WhatsApp Composer Card
// ──────────────────────────────────────────────
function InlineWhatsAppComposer({
  initialPayload,
  onRecordEvent,
}: {
  initialPayload: any;
  onRecordEvent: (evt: any) => Promise<any>;
}) {
  const [to, setTo] = useState(initialPayload?.to || "");
  const [message, setMessage] = useState(initialPayload?.message || "");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const getCleanPhone = (raw: string) => {
    let cleaned = String(raw).replace(/\s+/g, "").replace(/[-()]/g, "");
    if (cleaned.startsWith("0")) cleaned = "27" + cleaned.slice(1);
    else if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
    return cleaned;
  };

  const handleOpenWhatsAppDirect = async () => {
    if (!to.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    const cleanPhone = getCleanPhone(to);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    await onRecordEvent({
      eventType: "WHATSAPP_SENT",
      recipient: to.trim(),
      customerName: initialPayload?.customerName || to.trim(),
      summary: `Opened WhatsApp chat for ${to.trim()}`,
      status: "SUCCESS",
    });
  };

  const handleSendWhatsAppApi = async () => {
    if (!to.trim() || !message.trim()) {
      toast.error("Phone number and message are required");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          message: message.trim(),
          customerName: initialPayload?.customerName || "Client",
          actionType: "WHATSAPP_CHANNEL_DISPATCH",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSent(true);
        toast.success(`Sent on WhatsApp to ${to}`);
        await onRecordEvent({
          eventType: "WHATSAPP_SENT",
          recipient: to.trim(),
          customerName: initialPayload?.customerName || to.trim(),
          summary: `WhatsApp message sent to ${to.trim()}`,
          status: "SUCCESS",
        });
      } else if (data.waMeUrl) {
        toast.info("Opening WhatsApp directly (WHAPI_API_TOKEN not set in .env.local)");
        window.open(data.waMeUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(data.error || "Failed to send WhatsApp message");
      }
    } catch (err: any) {
      toast.error("WhatsApp error: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-[#3a362f] bg-[#181714] overflow-hidden shadow-xl">
      <div className="px-4 py-3 bg-[#201e1a] border-b border-[#33302a] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <PhoneCall className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#f5f2eb]">WhatsApp Channel</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>
            <span className="text-[11px] text-[#8e8a82]">Direct WhatsApp Dispatch</span>
          </div>
        </div>

        {isSent && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sent on WhatsApp
          </span>
        )}
      </div>

      <div className="p-4 space-y-3 text-xs">
        <div>
          <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">
            Recipient WhatsApp Number *
          </label>
          <input
            type="text"
            value={to}
            placeholder="+27 82 000 0000"
            disabled={isSent}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">
            WhatsApp Message
          </label>
          <textarea
            rows={4}
            value={message}
            disabled={isSent}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-[#12110f] border border-[#33302a] rounded-xl p-3 text-[#eae7e1] text-xs leading-relaxed focus:outline-none focus:border-emerald-500 resize-y disabled:opacity-60"
          />
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#2d2a24]">
          <button
            type="button"
            onClick={handleOpenWhatsAppDirect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#25231f] hover:bg-[#2f2c27] text-[#dedad2] border border-[#38342d] transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            Open in WhatsApp Web / App
          </button>

          <Button
            type="button"
            onClick={handleSendWhatsAppApi}
            disabled={isSending || isSent}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-4 rounded-xl flex items-center gap-1.5 shadow-md"
          >
            {isSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : isSent ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Sent
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send on WhatsApp
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// System Prompt Builder (100% Real Convex Database Context, Zero Demo Data)
// ──────────────────────────────────────────────
function buildCopilotSystemPrompt(context: any, connectedGmail: string) {
  const cars = Array.isArray(context?.cars) ? context.cars : [];
  const repairs = Array.isArray(context?.repairs) ? context.repairs : [];
  const realLeads = extractRealLeads(context);

  const inventorySummary =
    cars.length > 0
      ? cars
          .map(
            (c: any) =>
              `- [ID #${c.id}] ${c.year} ${c.make} ${c.model}: R${(c.price || 0).toLocaleString()} ZAR, ${(c.mileage || 0).toLocaleString()} km, ${c.color || "Standard"}, ${c.transmission || "Auto"}, Status: ${c.status}`
          )
          .join("\n")
      : "0 cars currently in database.";

  const repairSummary =
    repairs.length > 0
      ? repairs
          .map(
            (r: any) =>
              `- Job #${r.repairNumber}: ${r.carName} at ${r.workshopName} (${r.status}, Est Cost: R${(r.costEstimated || 0).toLocaleString()} ZAR)`
          )
          .join("\n")
      : "0 workshop repair records in database.";

  const leadsSummary =
    realLeads.length > 0
      ? realLeads
          .map(
            (l) =>
              `- [${l.type}] ${l.customerName} (Email: ${l.email || "N/A"}, Phone: ${l.phone || "N/A"}) — ${l.vehicle}`
          )
          .join("\n")
      : "0 website form submissions currently in database.";

  return `You are AutoFame Agent, connected to AutoFame Dealership's real Convex database and channels:
1. Gmail Channel: ${connectedGmail} (Real SMTP via smtp.gmail.com:465)
2. WhatsApp Channel: Direct WhatsApp connection
3. Live Convex Database (100% real data, zero fake/demo records):

REAL VEHICLE INVENTORY (${cars.length} Total Cars):
${inventorySummary}

REAL WEBSITE FORM LEADS & FINANCING APPLICANTS (${realLeads.length} Total):
${leadsSummary}

REAL WORKSHOP REPAIRS (${repairs.length} Total):
${repairSummary}

INSTRUCTIONS:
- Answer every question using ONLY the exact database records above. Never invent fake cars or fake people.
- If a table has 0 records, state honestly that there are currently 0 records in the database.
- Format tables cleanly in Markdown and format currency as R... ZAR.
- When asked to compose an email or Gmail, confirm briefly because the interactive Gmail Composer widget will render right below your response.`;
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

  // Connected Channels Configuration State (Defaulting to elexsouthflow@gmail.com)
  const [connectedGmail, setConnectedGmail] = useState("elexsouthflow@gmail.com");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [gmailVerified, setGmailVerified] = useState(false);
  const [isVerifyingGmail, setIsVerifyingGmail] = useState(false);
  const [gmailVerifyError, setGmailVerifyError] = useState<string | null>(null);

  const [connectedWhatsApp, setConnectedWhatsApp] = useState("+27 11 942 1200");
  const [channelsModalOpen, setChannelsModalOpen] = useState(false);

  // Streaming & Chat State
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingActionPayload, setStreamingActionPayload] = useState<any>(null);
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
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Puter.js Status
  const [puterReady, setPuterReady] = useState(false);

  // Verify Gmail SMTP Status on Mount
  const checkGmailConnection = async (emailToVerify: string, passToVerify: string) => {
    try {
      if (passToVerify) {
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
      } else {
        const res = await fetch("/api/email");
        const data = await res.json();
        setGmailVerified(Boolean(data.connected));
      }
    } catch {
      setGmailVerified(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGmail = localStorage.getItem("autofame_connected_gmail");
      const savedPass = localStorage.getItem("autofame_gmail_app_password") || "";
      const savedWa = localStorage.getItem("autofame_connected_whatsapp");

      const targetEmail =
        savedGmail && savedGmail !== "autofame.dealers@gmail.com"
          ? savedGmail
          : "elexsouthflow@gmail.com";

      setConnectedGmail(targetEmail);
      localStorage.setItem("autofame_connected_gmail", targetEmail);

      if (savedPass) setGmailAppPassword(savedPass);
      if (savedWa) setConnectedWhatsApp(savedWa);

      checkGmailConnection(targetEmail, savedPass);

      const checkPuter = () => {
        if ((window as any).puter?.ai) {
          setPuterReady(true);
        }
      };
      checkPuter();
      const interval = setInterval(checkPuter, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // Purge any previously seeded demo records on mount
  useEffect(() => {
    purgeLegacyDemo().catch(() => {});
  }, [purgeLegacyDemo]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [attachedFiles]);

  // Sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Select first session when available
  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0]._id);
    }
  }, [sessions, selectedSessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSessionData?.messages, streamingText, isStreaming]);

  // Create New Session
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

  // Delete Session
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

  // Edit Title
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

  // Handle Attachment File Selection
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
      toast.success(`Attached ${newItems.length} file${newItems.length > 1 ? "s" : ""}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachedFile = (index: number) => {
    if (attachedFiles[index]?.previewUrl) {
      URL.revokeObjectURL(attachedFiles[index].previewUrl);
    }
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Send Message & Stream Response
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if ((!textToSend.trim() && attachedFiles.length === 0) || isStreaming || isUploadingFiles) return;

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
    setIsStreaming(true);
    setStreamingText("");
    setStreamingActionPayload(null);

    let uploadedAttachments: { name: string; url: string; type: string; size?: number }[] = [];

    if (filesToProcess.length > 0) {
      setIsUploadingFiles(true);
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
          } else {
            uploadedAttachments.push({
              name: item.name,
              url: item.previewUrl,
              type: item.type,
              size: item.size,
            });
          }
        } catch {
          uploadedAttachments.push({
            name: item.name,
            url: item.previewUrl,
            type: item.type,
            size: item.size,
          });
        }
      }
      setIsUploadingFiles(false);
    }

    const finalContent =
      textToSend.trim() ||
      (uploadedAttachments.length > 0
        ? `Attached ${uploadedAttachments.length} file(s) for analysis.`
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

    const precomputedActionPayload = isGmailRequest
      ? buildClientGmailPayload(finalContent, dealershipContext, connectedGmail)
      : isWhatsAppRequest
      ? buildClientWhatsAppPayload(finalContent, dealershipContext)
      : null;

    if (precomputedActionPayload) {
      setStreamingActionPayload(precomputedActionPayload);
    }

    try {
      await addMessage({
        sessionId: targetSessionId,
        role: "user",
        content: finalContent,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      let streamedViaPuter = false;
      if (typeof window !== "undefined" && (window as any).puter?.ai?.chat) {
        try {
          const systemPrompt = buildCopilotSystemPrompt(dealershipContext, connectedGmail);
          const puterHistory = [
            { role: "system", content: systemPrompt },
            ...(activeSessionData?.messages || []).map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: finalContent },
          ];

          const chatStream = await (window as any).puter.ai.chat(puterHistory, {
            model: "claude-3-5-sonnet",
            stream: true,
          });

          let accumulated = "";
          for await (const part of chatStream) {
            if (part?.text) {
              accumulated += part.text;
              setStreamingText(accumulated);
            }
          }

          if (accumulated.trim()) {
            streamedViaPuter = true;
            await addMessage({
              sessionId: targetSessionId,
              role: "assistant",
              content: accumulated,
              actionType: precomputedActionPayload?.actionType,
              actionPayload: precomputedActionPayload || undefined,
            });
            return;
          }
        } catch (puterErr) {
          console.warn("Puter.js fallback to backend engine:", puterErr);
        }
      }

      if (!streamedViaPuter) {
        const response = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...(activeSessionData?.messages || []).map((m: any) => ({
                role: m.role,
                content: m.content,
              })),
              { role: "user", content: finalContent },
            ],
            context: dealershipContext,
            connectedGmail,
            attachments: uploadedAttachments,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Streaming failed with HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";
        let actionPayloadHolder: any = precomputedActionPayload;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === "token") {
                  accumulatedText += parsed.text;
                  setStreamingText(accumulatedText);
                } else if (parsed.type === "meta" && parsed.actionPayload) {
                  actionPayloadHolder = parsed.actionPayload;
                  setStreamingActionPayload(parsed.actionPayload);
                }
              } catch {}
            }
          }
        }

        if (accumulatedText) {
          await addMessage({
            sessionId: targetSessionId,
            role: "assistant",
            content: accumulatedText,
            actionType: actionPayloadHolder?.actionType,
            actionPayload: actionPayloadHolder || undefined,
          });
        }
      }
    } catch (err: any) {
      toast.error("Agent error: " + err.message);
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      setStreamingActionPayload(null);
    }
  };

  // Verify & Save Real Gmail Connection
  const handleVerifyAndSaveChannels = async () => {
    setGmailVerifyError(null);
    const trimmedEmail = connectedGmail.trim() || "elexsouthflow@gmail.com";
    const cleanedPass = gmailAppPassword.replace(/\s+/g, "");

    if (typeof window !== "undefined") {
      localStorage.setItem("autofame_connected_gmail", trimmedEmail);
      localStorage.setItem("autofame_gmail_app_password", cleanedPass);
      localStorage.setItem("autofame_connected_whatsapp", connectedWhatsApp.trim());
    }

    if (!cleanedPass) {
      setGmailVerified(false);
      setGmailVerifyError(
        `Please paste your 16-character Google App Password for ${trimmedEmail} so the agent can authenticate with smtp.gmail.com:465.`
      );
      return;
    }

    setIsVerifyingGmail(true);
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
        toast.success(`Successfully authenticated ${trimmedEmail} with Google SMTP!`);
        setChannelsModalOpen(false);
      } else {
        setGmailVerified(false);
        setGmailVerifyError(data.error || "Google SMTP rejected the App Password.");
        toast.error(data.error || "Gmail authentication failed");
      }
    } catch (err: any) {
      setGmailVerified(false);
      setGmailVerifyError(err.message);
    } finally {
      setIsVerifyingGmail(false);
    }
  };

  const realCarCount = dealershipContext?.cars?.length ?? 0;
  const realLeadsCount = extractRealLeads(dealershipContext).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1f1e1b] text-[#eae7e1] font-sans">
      <Script
        src="https://js.puter.com/v2/"
        strategy="afterInteractive"
        onLoad={() => setPuterReady(true)}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* FULL-SCREEN AGENT SIDEBAR (NO TOP WEBSITE NAVBAR)          */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "w-72 shrink-0 flex flex-col bg-[#171614] border-r border-[#2b2823] transition-all duration-300 z-30 select-none",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full absolute md:relative md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
        )}
      >
        {/* Top New Chat Action */}
        <div className="p-3.5 border-b border-[#2b2823] flex items-center justify-between">
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
            className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>

        {/* Connected Channels (Real Connections) */}
        <div className="p-3 border-b border-[#2b2823] space-y-1.5">
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

          {/* Gmail Channel */}
          <button
            onClick={() => handleSendMessage(`Compose an email from ${connectedGmail}`)}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#1f1e1b] hover:bg-[#272521] border border-[#2f2c27] transition text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Gmail</p>
                <p className="text-[10px] text-[#8e8a82] font-mono truncate">{connectedGmail}</p>
              </div>
            </div>
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                gmailVerified ? "bg-emerald-500" : "bg-amber-400"
              )}
              title={gmailVerified ? "SMTP Verified" : "Click Configure to enter Google App Password"}
            />
          </button>

          {/* WhatsApp Channel */}
          <button
            onClick={() => handleSendMessage("Compose a WhatsApp message")}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#1f1e1b] hover:bg-[#272521] border border-[#2f2c27] transition text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">WhatsApp</p>
                <p className="text-[10px] text-[#8e8a82] font-mono truncate">{connectedWhatsApp}</p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
          </button>

          {/* Live Forms & Database Channel */}
          <button
            onClick={() =>
              handleSendMessage(
                "Show all live cars and website form submissions from our database"
              )
            }
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#1f1e1b] hover:bg-[#272521] border border-[#2f2c27] transition text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Forms &amp; Database</p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  {realCarCount} Cars • {realLeadsCount} Form Leads
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Live Database Synced" />
          </button>
        </div>

        {/* Recent Conversations History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-1.5 mb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7d7971] font-semibold">
              Recents
            </span>
          </div>

          {!sessions || sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#706c64]">No recent chats yet.</div>
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
                      ? "bg-[#262420] text-[#f5f2eb] border-emerald-500/35 shadow-sm"
                      : "bg-transparent hover:bg-[#211f1c] text-[#a6a197] hover:text-[#dedad2] border-transparent"
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
                      <button
                        onClick={() => handleSaveTitle(s._id)}
                        className="p-1 hover:text-emerald-400"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setEditingTitleId(null)}
                        className="p-1 hover:text-zinc-400"
                      >
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
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(e, s._id)}
                          className="p-1 text-[#8e8a82] hover:text-rose-400"
                          title="Delete"
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
      {/* UNIFIED CHAT AGENT WORKSPACE                               */}
      {/* ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#1f1e1b]">
        {/* Minimalist Agent Header */}
        <header className="h-13 px-4 sm:px-6 border-b border-[#2b2823] bg-[#181715]/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#282622] text-[#8e8a82] hover:text-white transition"
              title="Toggle Sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <span className="font-serif text-sm sm:text-base font-bold text-[#f5f2eb] truncate">
              {activeSessionData?.session?.title || "AutoFame Agent"}
            </span>
          </div>

          {/* Real Gmail & Channel Connection Status Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChannelsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 bg-[#22201c] hover:bg-[#2a2722] text-[#dedad2] border border-[#35312b] transition"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    gmailVerified ? "bg-emerald-400" : "bg-amber-400"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    gmailVerified ? "bg-emerald-500" : "bg-amber-400"
                  )}
                />
              </span>
              <span className="hidden sm:inline font-mono text-[11px]">
                {connectedGmail} {gmailVerified ? "(SMTP Connected)" : "(Setup App Password)"}
              </span>
              <span className="sm:hidden">Channels</span>
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8">
          <div className="max-w-5xl w-full mx-auto space-y-8">
            {/* Clean Welcome Screen when chat is empty */}
            {(!activeSessionData?.messages || activeSessionData.messages.length === 0) &&
              !isStreaming && (
                <div className="py-12 sm:py-20 text-center max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-lg">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f2eb] font-serif tracking-tight">
                      How can I help with AutoFame today?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8e8a82] leading-relaxed">
                      Connected to your live Convex database ({realCarCount} cars, {realLeadsCount} form leads),{" "}
                      <span className="text-[#dedad2] font-mono">{connectedGmail}</span>, and{" "}
                      <span className="text-[#dedad2] font-medium">WhatsApp</span>.
                    </p>
                  </div>

                  {!gmailVerified && (
                    <div className="max-w-xl mx-auto p-4 rounded-2xl bg-[#181714] border border-amber-500/30 text-left space-y-2.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-amber-400" />
                          Complete Real Gmail Connection ({connectedGmail})
                        </span>
                        <Button
                          size="sm"
                          onClick={() => setChannelsModalOpen(true)}
                          className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                        >
                          Connect Now
                        </Button>
                      </div>
                      <p className="text-xs text-[#a6a197] leading-relaxed">
                        To send real emails directly from <code className="text-emerald-300">{connectedGmail}</code> without any demo mode, Google requires a <strong>16-character Google App Password</strong> (generated under Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords).
                      </p>
                    </div>
                  )}
                </div>
              )}

            {/* Conversation Messages */}
            {activeSessionData?.messages?.map((msg: any) => {
              const isAssistant = msg.role === "assistant";

              return (
                <div
                  key={msg._id}
                  className={cn(
                    "flex gap-4 sm:gap-5 w-full",
                    isAssistant ? "justify-start" : "justify-end"
                  )}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1 shadow-sm">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl sm:rounded-3xl text-xs sm:text-sm leading-relaxed transition-all shadow-md",
                      isAssistant
                        ? "bg-[#24221e] text-[#eae7e1] border border-[#38342d] w-full max-w-4xl p-5 sm:p-7"
                        : "bg-emerald-600 text-white font-medium max-w-2xl sm:max-w-3xl ml-auto p-4 sm:p-5 px-6 shadow-emerald-950/20"
                    )}
                  >
                    {isAssistant ? (
                      <div className="prose prose-invert prose-sm max-w-none space-y-3 font-normal leading-relaxed text-[#eae7e1]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div>
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/20 flex flex-wrap gap-2">
                            {msg.attachments.map((att: any, idx: number) => {
                              const isImg =
                                att.type?.startsWith("image/") ||
                                /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(att.name);
                              return (
                                <div
                                  key={idx}
                                  className="group relative rounded-xl overflow-hidden border border-white/25 bg-black/25 backdrop-blur-sm p-1.5 transition hover:border-white/50"
                                >
                                  {isImg ? (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block"
                                    >
                                      <img
                                        src={att.url}
                                        alt={att.name}
                                        className="h-24 w-auto max-w-[220px] object-cover rounded-lg border border-white/10"
                                      />
                                      <span className="block text-[10px] truncate max-w-[200px] mt-1 text-white/90 font-mono">
                                        {att.name}
                                      </span>
                                    </a>
                                  ) : (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-white hover:underline"
                                    >
                                      <FileText className="h-4 w-4 text-white/80 shrink-0" />
                                      <span className="truncate max-w-[180px] font-mono text-[11px]">
                                        {att.name}
                                      </span>
                                      <ExternalLink className="h-3 w-3 opacity-70" />
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Real Gmail Composer */}
                    {isAssistant &&
                      (msg.actionType === "GMAIL_COMPOSE" ||
                        msg.actionType === "SEND_EMAIL_GATEWAY") && (
                        <InlineGmailComposer
                          initialPayload={msg.actionPayload}
                          connectedGmail={connectedGmail}
                          gmailAppPassword={gmailAppPassword}
                          gmailVerified={gmailVerified}
                          onOpenConnectModal={() => setChannelsModalOpen(true)}
                          onRecordEvent={recordCrmEvent}
                        />
                      )}

                    {/* Inline Real WhatsApp Composer */}
                    {isAssistant &&
                      (msg.actionType === "WHATSAPP_COMPOSE" ||
                        msg.actionType === "SEND_FINANCE_LINK") && (
                        <InlineWhatsAppComposer
                          initialPayload={msg.actionPayload}
                          onRecordEvent={recordCrmEvent}
                        />
                      )}

                    {isAssistant && msg.actionType === "AUTO_GENERATE_DESCRIPTION" && (
                      <div className="mt-4 pt-3.5 border-t border-[#38342d] flex items-center gap-2">
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            toast.success("Copied to clipboard");
                          }}
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs flex items-center gap-1.5 bg-[#33302a] hover:bg-[#3f3b33] text-[#f4f2ee]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Description
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="h-8 w-8 rounded-xl bg-[#33302a] border border-[#444037] flex items-center justify-center text-[#eae7e1] shrink-0 mt-1 shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming Token Bubble */}
            {isStreaming && (
              <div className="flex gap-4 sm:gap-5 w-full justify-start animate-in fade-in duration-150">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>

                <div className="bg-[#24221e] text-[#eae7e1] border border-[#38342d] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-xs sm:text-sm leading-relaxed shadow-md w-full max-w-4xl">
                  <div className="prose prose-invert prose-sm max-w-none space-y-3 font-normal leading-relaxed text-[#eae7e1]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {streamingText + " ▍"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* COMPOSER WITH CONNECTED CHANNEL TRIGGERS                   */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 bg-[#181715]/95 backdrop-blur border-t border-[#2b2823] shrink-0">
          <div className="max-w-5xl w-full mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative rounded-2xl sm:rounded-3xl border border-[#38342d] bg-[#22201c] shadow-2xl focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-200"
            >
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2.5 p-3.5 border-b border-[#2e2b26] bg-[#1a1916]/80 rounded-t-2xl sm:rounded-t-3xl">
                  {attachedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="relative flex items-center gap-2.5 bg-[#282521] border border-[#3d3931] rounded-xl px-3 py-1.5 text-xs text-[#eae7e1]"
                    >
                      {f.type.startsWith("image/") ? (
                        <img
                          src={f.previewUrl}
                          alt={f.name}
                          className="h-7 w-7 object-cover rounded-lg border border-white/10"
                        />
                      ) : (
                        <FileText className="h-4 w-4 text-emerald-400" />
                      )}
                      <span className="max-w-[200px] truncate text-xs font-medium">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(i)}
                        className="text-[#8e8a82] hover:text-white p-1 rounded-full hover:bg-white/10 transition"
                      >
                        <X className="h-3.5 w-3.5" />
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
                rows={3}
                placeholder={`Ask anything about our database (${realCarCount} cars, ${realLeadsCount} form leads), or say 'Compose an email to...'...`}
                className="w-full bg-transparent p-4 sm:p-5 pb-14 text-xs sm:text-sm text-[#f5f2eb] placeholder:text-[#837e75] focus:outline-none resize-none leading-relaxed min-h-[92px]"
              />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Composer Bottom Toolbar */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-[#a6a197] hover:text-[#f4f2ee] hover:bg-[#2e2b26] flex items-center gap-1.5 rounded-xl text-xs border border-[#35312b]"
                    title="Attach images or PDFs"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="hidden sm:inline text-xs">Attach</span>
                  </Button>

                  {/* Gmail Channel Quick-Compose Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue("Compose an email to ");
                      textareaRef.current?.focus();
                    }}
                    className="h-8 px-2.5 rounded-xl bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                    title={`Compose email from ${connectedGmail}`}
                  >
                    <Mail className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-mono text-[11px]">{connectedGmail}</span>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        gmailVerified ? "bg-emerald-500" : "bg-amber-400"
                      )}
                    />
                  </button>

                  {/* WhatsApp Channel Quick-Compose Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue("Send a WhatsApp message to ");
                      textareaRef.current?.focus();
                    }}
                    className="h-8 px-2.5 rounded-xl bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                    title="Compose WhatsApp in chat"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </button>

                  {/* Channel Connector Settings Trigger */}
                  <button
                    type="button"
                    onClick={() => setChannelsModalOpen(true)}
                    className="h-8 px-2.5 rounded-xl bg-[#181715] hover:bg-[#2c2924] text-[#8e8a82] hover:text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                    title="Configure real Gmail SMTP & WhatsApp connection"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={
                    (!inputValue.trim() && attachedFiles.length === 0) ||
                    isStreaming ||
                    isUploadingFiles
                  }
                  size="sm"
                  className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-30"
                >
                  {isStreaming || isUploadingFiles ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────── */}
      {/* REAL GMAIL (elexsouthflow@gmail.com) & CHANNELS MODAL      */}
      {/* ────────────────────────────────────────────────────────── */}
      {channelsModalOpen && (
        <div
          onClick={() => setChannelsModalOpen(false)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-[#1a1916] rounded-2xl border border-[#38342d] shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2b26]">
              <div>
                <h3 className="text-sm font-bold text-[#f5f2eb]">
                  Connect Real Gmail &amp; Agent Channels
                </h3>
                <p className="text-[11px] text-[#8e8a82]">
                  Direct SSL/TLS SMTP connection to <code className="text-emerald-400">smtp.gmail.com:465</code> (Zero Demo Mode)
                </p>
              </div>
              <button
                onClick={() => setChannelsModalOpen(false)}
                className="text-[#8e8a82] hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Real Gmail Connection Block */}
              <div className="p-4 rounded-xl bg-[#22201c] border border-[#35312b] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    Gmail SMTP Integration
                  </span>
                  {gmailVerified ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified &amp; Connected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      App Password Required
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    value={connectedGmail}
                    onChange={(e) => setConnectedGmail(e.target.value)}
                    className="w-full bg-[#141311] border border-[#35312b] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono uppercase text-[#8e8a82]">
                      Google 16-Character App Password *
                    </label>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      Get App Password <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={gmailAppPassword}
                    placeholder="xxxx xxxx xxxx xxxx"
                    onChange={(e) => setGmailAppPassword(e.target.value)}
                    className="w-full bg-[#141311] border border-[#35312b] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Clear What's Needed Instructions */}
                <div className="p-3 rounded-lg bg-[#161512] border border-[#2e2b26] space-y-1.5 text-[11px] text-[#a6a197]">
                  <p className="font-semibold text-[#eae7e1]">
                    What is needed to connect <code className="text-emerald-400">elexsouthflow@gmail.com</code>:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Sign in to <code className="text-[#dedad2]">elexsouthflow@gmail.com</code> at{" "}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 underline"
                      >
                        myaccount.google.com/apppasswords
                      </a>
                    </li>
                    <li>
                      Enable <strong>2-Step Verification</strong> if not already enabled, then create an App Password named <strong>AutoFame Agent</strong>.
                    </li>
                    <li>
                      Paste the 16-letter password above (or add <code className="text-emerald-300">GMAIL_APP_PASSWORD=your16charpass</code> in <code className="text-emerald-300">.env.local</code>) and click <strong>Verify &amp; Connect</strong>.
                    </li>
                  </ol>
                </div>

                {gmailVerifyError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
                    {gmailVerifyError}
                  </div>
                )}
              </div>

              {/* WhatsApp Channel */}
              <div className="p-3.5 rounded-xl bg-[#22201c] border border-[#35312b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-emerald-400" />
                    WhatsApp Channel
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Connected
                  </span>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Dealership WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={connectedWhatsApp}
                    onChange={(e) => setConnectedWhatsApp(e.target.value)}
                    className="w-full bg-[#141311] border border-[#35312b] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Live Convex DB Status */}
              <div className="p-3.5 rounded-xl bg-[#22201c] border border-[#35312b] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Convex Database &amp; Website Forms</p>
                    <p className="text-[11px] text-[#8e8a82]">
                      {realCarCount} real cars • {realLeadsCount} real form submissions (0 demo data)
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  100% Real Data
                </span>
              </div>
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
                disabled={isVerifyingGmail}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
              >
                {isVerifyingGmail ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Verifying with smtp.gmail.com...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verify &amp; Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
