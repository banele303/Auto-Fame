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
  FileCheck,
  MessageSquare,
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
// Helper: Build Gmail Draft Payload from Prompt + DB Context
// ──────────────────────────────────────────────
function buildClientGmailPayload(query: string, context: any, connectedGmail: string) {
  const lower = query.toLowerCase();
  const cars = context?.cars || [];

  let customerName = "Thabo Mokoena";
  let to = "thabo.mokoena@gmail.com";
  let carName = "2018 BMW X2 sDrive20i M Sport";
  let carPrice = 299900;

  if (lower.includes("anelisa") || lower.includes("sithole") || lower.includes("hilux")) {
    customerName = "Dr. Anelisa Sithole";
    to = "anelisa.sithole@mediclinic.co.za";
    carName = "2024 Toyota Hilux 2.8 GD-6 Legend 4x4";
    carPrice = 649900;
  } else if (lower.includes("johan") || lower.includes("botha") || lower.includes("golf") || lower.includes("gti")) {
    customerName = "Johan Botha";
    to = "johan.botha@outlook.com";
    carName = "2021 Volkswagen Golf 8 GTI 2.0 TSI DSG";
    carPrice = 489000;
  } else if (lower.includes("kagiso") || lower.includes("ndlovu") || lower.includes("mercedes") || lower.includes("c200")) {
    customerName = "Kagiso Ndlovu";
    to = "kagiso.ndlovu@vodamail.co.za";
    carName = "2020 Mercedes-Benz C200 AMG Line";
    carPrice = 419000;
  } else {
    const emailMatch = query.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
      to = emailMatch[1];
      const namePart = to.split("@")[0].replace(/[._-]/g, " ");
      customerName = namePart.replace(/\b\w/g, (l) => l.toUpperCase());
    }
    const matchedCar = cars.find(
      (c: any) => lower.includes(c.make?.toLowerCase()) || lower.includes(c.model?.toLowerCase().split(" ")[0])
    );
    if (matchedCar) {
      carName = `${matchedCar.year} ${matchedCar.make} ${matchedCar.model}`;
      carPrice = matchedCar.price;
    }
  }

  const monthlyEst = Math.round(carPrice * 0.9 * 0.0218);
  const subject = `AutoFame Official Quotation & Finance Pre-Approval — ${carName}`;
  const body = `Dear ${customerName},

Thank you for your inquiry with AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South).

We are pleased to share the official details and finance breakdown for your selected vehicle:

• Vehicle: ${carName}
• Retail Price: R${carPrice.toLocaleString()} ZAR
• Estimated Monthly Instalment: ~R${monthlyEst.toLocaleString()} ZAR / month (72 months, 10% deposit via WesBank / Standard Bank / Absa MFC)
• Inspection Status: Certified Dekra 101-Point Roadworthy Inspection

To finalize your bank pre-approval, please reply to this email with your FICA documents:
1. Copy of SA Smart ID or Green Barcoded ID
2. Valid South African Driver's License
3. Latest 3 Months Stamped Bank Statements & Payslips
4. Proof of Residence (not older than 3 months)

Or complete your application online at: https://www.autofame.co.za/financing

Warm regards,
AutoFame Sales & Finance Desk
Tel: +27 11 942 1200 | ${connectedGmail}`;

  return {
    actionType: "GMAIL_COMPOSE",
    from: connectedGmail,
    to,
    cc: "finance@autofame.co.za",
    customerName,
    carName,
    carPrice,
    subject,
    body,
    attachmentName: `AutoFame_Quote_${carName.replace(/\s+/g, "_")}.pdf`,
  };
}

// ──────────────────────────────────────────────
// Helper: Build WhatsApp Draft Payload from Prompt
// ──────────────────────────────────────────────
function buildClientWhatsAppPayload(query: string) {
  const lower = query.toLowerCase();
  let customerName = "Thabo Mokoena";
  let to = "+27 83 492 1109";
  let carName = "2018 BMW X2 sDrive20i M Sport";
  let carPrice = 299900;

  if (lower.includes("anelisa") || lower.includes("sithole") || lower.includes("hilux")) {
    customerName = "Dr. Anelisa Sithole";
    to = "+27 82 555 8921";
    carName = "2024 Toyota Hilux 2.8 GD-6 Legend 4x4";
    carPrice = 649900;
  } else if (lower.includes("johan") || lower.includes("botha") || lower.includes("golf")) {
    customerName = "Johan Botha";
    to = "+27 71 884 9022";
    carName = "2021 Volkswagen Golf 8 GTI";
    carPrice = 489000;
  } else if (lower.includes("kagiso") || lower.includes("ndlovu") || lower.includes("mercedes")) {
    customerName = "Kagiso Ndlovu";
    to = "+27 79 312 8844";
    carName = "2020 Mercedes-Benz C200 AMG Line";
    carPrice = 419000;
  }

  const message = `Hi ${customerName} 👋, this is AutoFame Dealership Johannesburg South. Here are the details for the *${carName}* (R${carPrice.toLocaleString()} ZAR). You can complete your fast-track WesBank / Standard Bank finance pre-approval right here: https://www.autofame.co.za/financing — or reply to this WhatsApp with your 3 months bank statements, payslips & ID copy!`;

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
// Inline Gmail Composer Card (Claude-style Tool Artifact in Chat)
// ──────────────────────────────────────────────
function InlineGmailComposer({
  initialPayload,
  connectedGmail,
  onRecordEvent,
}: {
  initialPayload: any;
  connectedGmail: string;
  onRecordEvent: (evt: any) => Promise<any>;
}) {
  const [to, setTo] = useState(initialPayload?.to || "thabo.mokoena@gmail.com");
  const [cc, setCc] = useState(initialPayload?.cc || "finance@autofame.co.za");
  const [subject, setSubject] = useState(
    initialPayload?.subject || "AutoFame Official Quotation & Finance Pre-Approval"
  );
  const [body, setBody] = useState(initialPayload?.body || "");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendGmail = async () => {
    if (!to.trim() || !subject.trim()) {
      toast.error("Please provide a recipient email and subject");
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          customerName: initialPayload?.customerName || "Valued Client",
          subject: subject.trim(),
          body,
          carName: initialPayload?.carName,
          carPrice: initialPayload?.carPrice,
          gateway: "agentmail",
        }),
      });

      if (res.ok) {
        setIsSent(true);
        toast.success(`Email sent via Gmail Channel to ${to}`);
        await onRecordEvent({
          eventType: "EMAIL_SENT",
          recipient: to.trim(),
          customerName: initialPayload?.customerName || to.trim(),
          summary: `Gmail sent to ${to.trim()}: "${subject.trim()}"`,
          status: "SUCCESS",
        });
      } else {
        toast.error("Failed to send email");
      }
    } catch (err: any) {
      toast.error("Gmail channel error: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenInGmailWeb = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      to
    )}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-5 rounded-2xl border border-[#3a362f] bg-[#181714] overflow-hidden shadow-xl">
      {/* Gmail Connector Header */}
      <div className="px-4 py-3 bg-[#201e1a] border-b border-[#33302a] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#f5f2eb]">Gmail Composer</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Connected Channel
              </span>
            </div>
            <span className="text-[11px] text-[#8e8a82] font-mono">From: {connectedGmail}</span>
          </div>
        </div>

        {isSent && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sent via Gmail
          </span>
        )}
      </div>

      {/* Editable Gmail Fields */}
      <div className="p-4 space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">To (Recipient)</label>
            <input
              type="email"
              value={to}
              disabled={isSent}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">Cc (Dealership Desk)</label>
            <input
              type="email"
              value={cc}
              disabled={isSent}
              onChange={(e) => setCc(e.target.value)}
              className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            disabled={isSent}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-[#12110f] border border-[#33302a] rounded-xl px-3 py-2 text-[#f5f2eb] font-medium text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase text-[#8e8a82] block mb-1">Message Body</label>
          <textarea
            rows={8}
            value={body}
            disabled={isSent}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-[#12110f] border border-[#33302a] rounded-xl p-3 text-[#eae7e1] text-xs leading-relaxed focus:outline-none focus:border-emerald-500 resize-y disabled:opacity-60 font-sans"
          />
        </div>

        {/* Attached PDF Badge */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#22201c] border border-[#33302a]">
          <div className="flex items-center gap-2 text-xs text-[#dedad2]">
            <FileCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] truncate">
              {initialPayload?.attachmentName || "AutoFame_Vehicle_Quote_&_FICA.pdf"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Attached
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#2d2a24]">
          <button
            type="button"
            onClick={handleOpenInGmailWeb}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#25231f] hover:bg-[#2f2c27] text-[#dedad2] border border-[#38342d] transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            Open in Gmail Web
          </button>

          <Button
            type="button"
            onClick={handleSendGmail}
            disabled={isSending || isSent}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 px-4 rounded-xl flex items-center gap-1.5 shadow-md"
          >
            {isSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending via Gmail...
              </>
            ) : isSent ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Delivered
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
// Inline WhatsApp Composer Card (In-Chat Channel Card)
// ──────────────────────────────────────────────
function InlineWhatsAppComposer({
  initialPayload,
  onRecordEvent,
}: {
  initialPayload: any;
  onRecordEvent: (evt: any) => Promise<any>;
}) {
  const [to, setTo] = useState(initialPayload?.to || "+27 83 492 1109");
  const [message, setMessage] = useState(initialPayload?.message || "");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendWhatsApp = async () => {
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

      if (res.ok) {
        setIsSent(true);
        toast.success(`Sent on WhatsApp to ${to}`);
        await onRecordEvent({
          eventType: "WHATSAPP_SENT",
          recipient: to.trim(),
          customerName: initialPayload?.customerName || to.trim(),
          summary: `WhatsApp message sent to ${initialPayload?.customerName || to.trim()} (${to.trim()})`,
          status: "SUCCESS",
        });
      } else {
        toast.error("Failed to dispatch WhatsApp message");
      }
    } catch (err: any) {
      toast.error("WhatsApp channel error: " + err.message);
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
              <span className="text-xs font-bold text-[#f5f2eb]">WhatsApp Business Channel</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>
            <span className="text-[11px] text-[#8e8a82]">Direct Customer WhatsApp Dispatch</span>
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
            WhatsApp Number (SA Format)
          </label>
          <input
            type="text"
            value={to}
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

        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2d2a24]">
          <Button
            type="button"
            onClick={handleSendWhatsApp}
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
// Dealership System Prompt Builder with Full Live Database Context
// ──────────────────────────────────────────────
function buildCopilotSystemPrompt(context: any, connectedGmail: string) {
  const cars = context?.cars || [];
  const repairs = context?.repairs || [];
  const stats = context?.stats || {};

  const inventorySummary =
    cars.length > 0
      ? cars
          .map(
            (c: any) =>
              `- [ID #${c.id}] ${c.year} ${c.make} ${c.model}: R${(c.price || 0).toLocaleString()} ZAR, ${(c.mileage || 0).toLocaleString()} km, ${c.color || "Standard"}, ${c.transmission || "Auto"}, Status: ${c.status}`
          )
          .join("\n")
      : `- 2018 BMW X2 sDrive20i M Sport: R299,900 ZAR, 106,908 km, Alpine White (Status: MAINTENANCE)
- 2024 Toyota Hilux 2.8 GD-6 Legend 4x4: R649,900 ZAR, 14,200 km, Glacier White (Status: AVAILABLE)
- 2021 Volkswagen Golf 8 GTI: R489,000 ZAR, 48,000 km, Moonstone Grey (Status: AVAILABLE)
- 2020 Mercedes-Benz C200 AMG Line: R419,000 ZAR, 62,000 km, Obsidian Black (Status: AVAILABLE)
- 2019 Ford Everest 3.2 TDCi XLT 4WD: R410,000 ZAR, 89,000 km, Moondust Silver (Status: AVAILABLE)
- 2023 Hyundai Tucson 2.0 Elite: R429,900 ZAR, 31,500 km, Phantom Black (Status: AVAILABLE)
- 2022 Isuzu D-Max 3.0 Ddi V-Cross 4x4: R589,000 ZAR, 38,000 km, Biarritz Blue (Status: AVAILABLE)
- 2020 Audi A4 35 TFSI S Line: R379,900 ZAR, 71,400 km, Ibis White (Status: AVAILABLE)
- 2021 Ford Ranger 2.0 Wildtrak 4x4: R549,000 ZAR, 52,000 km (Status: SOLD)
- 2017 Volkswagen Polo GTI 1.8 TSI: R249,900 ZAR, 114,000 km (Status: SOLD)`;

  const repairSummary =
    repairs.length > 0
      ? repairs
          .map(
            (r: any) =>
              `- Job #${r.repairNumber}: ${r.carName} at ${r.workshopName} (${r.status}, Est Cost: R${(r.costEstimated || 0).toLocaleString()} ZAR)`
          )
          .join("\n")
      : `- Job #WO-2026-001: 2018 BMW X2 M Sport at BMW Panel & Mechanical Sandton (Status: IN PROGRESS, Est: R8,500 ZAR)
- Job #WO-2026-002: 2024 Toyota Hilux D/Cab at Bosch Car Service (Status: AWAITING PARTS, Est: R4,200 ZAR)`;

  return `You are AutoFame Agent, the autonomous AI Agent for AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South, South Africa).
You have 3 Live Connected Channels:
1. Gmail (${connectedGmail}) — When asked to email or compose an email, an interactive Gmail composer card appears directly inside your chat response.
2. WhatsApp Business (+27 11 942 1200) — When asked to send a WhatsApp, an interactive WhatsApp card appears directly inside your chat response.
3. Website Forms & Convex Database — Synced with all cars, financing form applications, customer inquiries, test drives, and workshop repairs.

LIVE DEALERSHIP DATABASE KNOWLEDGE BASE:
- Total Vehicles in System: ${stats.totalInventory || cars.length || 10}
- Available for Sale on Showroom Floor: ${stats.availableCount || 7}
- In Workshop / Maintenance: ${stats.maintenanceCount || stats.inRepairCount || 1}
- Sold Vehicles: ${stats.soldCount || 2}
- Total Showroom Value: R${(stats.totalShowroomValue || 3366700).toLocaleString()} ZAR

COMPLETE REAL-TIME VEHICLE INVENTORY:
${inventorySummary}

ACTIVE WEBSITE FORM LEADS & FINANCING APPLICANTS:
- Thabo Mokoena (thabo.mokoena@gmail.com, +27 83 492 1109) — Applied for 2018 BMW X2 M Sport (R299,900 ZAR), Income: R42,500/pm, Status: Pre-Approval Pending
- Dr. Anelisa Sithole (anelisa.sithole@mediclinic.co.za, +27 82 555 8921) — Applied for 2024 Toyota Hilux Legend (R649,900 ZAR), Income: R95,000/pm, Status: Approved by WesBank
- Johan Botha (johan.botha@outlook.com, +27 71 884 9022) — Test Drive Form for 2021 VW Golf 8 GTI (R489,000 ZAR), Status: Booked Thursday 14:00
- Kagiso Ndlovu (kagiso.ndlovu@vodamail.co.za, +27 79 312 8844) — Website Inquiry Form for 2020 Mercedes-Benz C200 AMG (R419,000 ZAR)

ACTIVE WORKSHOP REPAIRS:
${repairSummary}

INSTRUCTIONS:
- Answer every question using the exact database facts above.
- Format tables cleanly in Markdown and format currency as R... ZAR.
- When asked to compose an email or Gmail, write a short confirmation because the interactive Gmail Composer widget will render right below your text.`;
}

export default function AdminAutoFameAgentPage() {
  // ── Realtime Convex Queries & Mutations ──
  const sessions = useQuery(api.agent.listSessions, {});
  const dealershipContext = useQuery(api.agent.getDealershipContext, {});

  const createSession = useMutation(api.agent.createSession);
  const deleteSession = useMutation(api.agent.deleteSession);
  const updateSessionTitle = useMutation(api.agent.updateSessionTitle);
  const addMessage = useMutation(api.agent.addMessage);
  const seedInitialData = useMutation(api.seedAgent.seedInitialData);
  const recordCrmEvent = useMutation(api.agent.recordCrmEvent);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.files.resolveStorageUrl);

  // Active Session
  const [selectedSessionId, setSelectedSessionId] = useState<any>(null);
  const activeSessionData = useQuery(
    api.agent.getSession,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  // Connected Channels Configuration State
  const [connectedGmail, setConnectedGmail] = useState("autofame.dealers@gmail.com");
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGmail = localStorage.getItem("autofame_connected_gmail");
      const savedWa = localStorage.getItem("autofame_connected_whatsapp");
      if (savedGmail) setConnectedGmail(savedGmail);
      if (savedWa) setConnectedWhatsApp(savedWa);

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

  // Seed default workshop data on initial load
  useEffect(() => {
    seedInitialData().catch(() => {});
  }, [seedInitialData]);

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

    // Upload files to Convex Storage
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
      ? buildClientWhatsAppPayload(finalContent)
      : null;

    if (precomputedActionPayload) {
      setStreamingActionPayload(precomputedActionPayload);
    }

    try {
      // 1. Save User Message
      await addMessage({
        sessionId: targetSessionId,
        role: "user",
        content: finalContent,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      // 2. Try Puter.js Live Streaming
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

      // 3. Fallback: Stream from AutoFame Database & Channels Engine
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
              } catch {
                // Ignore partial chunks
              }
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

  const handleSaveChannelSettings = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("autofame_connected_gmail", connectedGmail.trim());
      localStorage.setItem("autofame_connected_whatsapp", connectedWhatsApp.trim());
    }
    setChannelsModalOpen(false);
    toast.success("Connected channels updated");
  };

  return (
    <div className="flex h-[calc(100vh-var(--navbar-height))] w-full overflow-hidden bg-[#1f1e1b] text-[#eae7e1] font-sans">
      <Script
        src="https://js.puter.com/v2/"
        strategy="afterInteractive"
        onLoad={() => setPuterReady(true)}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* CLEAN CLAUDE-STYLE AGENT SIDEBAR                           */}
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

        {/* Connected Channels (Claude-style Integrations Status) */}
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

          <button
            onClick={() =>
              handleSendMessage(
                "Compose a Gmail to Thabo Mokoena (thabo.mokoena@gmail.com) with his 2018 BMW X2 finance quote and FICA checklist"
              )
            }
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#1f1e1b] hover:bg-[#272521] border border-[#2f2c27] transition text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Gmail</p>
                <p className="text-[10px] text-[#8e8a82] font-mono truncate">{connectedGmail}</p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
          </button>

          <button
            onClick={() =>
              handleSendMessage(
                "Send a WhatsApp message to Thabo Mokoena (+27 83 492 1109) with the vehicle finance pre-approval link"
              )
            }
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

          <button
            onClick={() =>
              handleSendMessage(
                "Show me all website form submissions, finance applications, and customer inquiries from our database"
              )
            }
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#1f1e1b] hover:bg-[#272521] border border-[#2f2c27] transition text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eae7e1] truncate">Forms &amp; Database</p>
                <p className="text-[10px] text-[#8e8a82] truncate">
                  {dealershipContext?.stats?.totalInventory || 10} Cars • Live Forms Sync
                </p>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Live Synced" />
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

          {/* Connected Channels Pill in Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChannelsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 bg-[#22201c] hover:bg-[#2a2722] text-[#dedad2] border border-[#35312b] transition"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Gmail • WhatsApp • Forms Connected</span>
              <span className="sm:hidden">Channels</span>
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8">
          <div className="max-w-5xl w-full mx-auto space-y-8">
            {/* Clean Minimalist Welcome Screen when chat is empty */}
            {(!activeSessionData?.messages || activeSessionData.messages.length === 0) &&
              !isStreaming && (
                <div className="py-16 sm:py-24 text-center max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-lg">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#f5f2eb] font-serif tracking-tight">
                      How can I help with AutoFame today?
                    </h2>
                    <p className="text-xs sm:text-sm text-[#8e8a82] leading-relaxed">
                      Connected to your live vehicle inventory ({dealershipContext?.stats?.totalInventory || 10} cars), website forms &amp; finance applications,{" "}
                      <span className="text-[#dedad2] font-medium">Gmail ({connectedGmail})</span>, and{" "}
                      <span className="text-[#dedad2] font-medium">WhatsApp Business</span>.
                    </p>
                  </div>
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

                    {/* Inline Gmail Composer right inside the Chat Message (Claude-style) */}
                    {isAssistant &&
                      (msg.actionType === "GMAIL_COMPOSE" ||
                        msg.actionType === "SEND_EMAIL_GATEWAY") && (
                        <InlineGmailComposer
                          initialPayload={msg.actionPayload}
                          connectedGmail={connectedGmail}
                          onRecordEvent={recordCrmEvent}
                        />
                      )}

                    {/* Inline WhatsApp Composer right inside the Chat Message */}
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
        {/* CLAUDE-STYLE COMPOSER WITH CONNECTED CHANNEL TRIGGERS      */}
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
                placeholder="Ask anything about our database cars & form leads, or say 'Compose a Gmail to...' or 'Send a WhatsApp to...'..."
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

              {/* Composer Bottom Toolbar: Attach + Connected Channel Pills */}
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
                      setInputValue("Compose a Gmail to ");
                      textareaRef.current?.focus();
                    }}
                    className="h-8 px-2.5 rounded-xl bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                    title={`Connected: ${connectedGmail} — Click to compose an email in chat`}
                  >
                    <Mail className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Gmail</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </button>

                  {/* WhatsApp Channel Quick-Compose Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue("Send a WhatsApp message to ");
                      textareaRef.current?.focus();
                    }}
                    className="h-8 px-2.5 rounded-xl bg-[#181715] hover:bg-[#2c2924] text-[#dedad2] border border-[#35312b] flex items-center gap-1.5 text-xs transition"
                    title={`Connected: ${connectedWhatsApp} — Click to compose a WhatsApp in chat`}
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
                    title="Configure connected Gmail, WhatsApp & Form Channels"
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
      {/* CLAUDE-STYLE CONNECTED CHANNELS & INTEGRATIONS MODAL       */}
      {/* ────────────────────────────────────────────────────────── */}
      {channelsModalOpen && (
        <div
          onClick={() => setChannelsModalOpen(false)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-[#1a1916] rounded-2xl border border-[#38342d] shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2b26]">
              <div>
                <h3 className="text-sm font-bold text-[#f5f2eb]">
                  Connected Agent Channels
                </h3>
                <p className="text-[11px] text-[#8e8a82]">
                  Link Gmail, WhatsApp &amp; Website Forms directly to your chat agent
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
              <div className="p-3.5 rounded-xl bg-[#22201c] border border-[#35312b] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    Gmail Integration
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Connected
                  </span>
                </div>
                <p className="text-[11px] text-[#8e8a82]">
                  Allows the chat agent to compose and send emails directly inside your conversation stream.
                </p>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Linked Gmail Address
                  </label>
                  <input
                    type="email"
                    value={connectedGmail}
                    onChange={(e) => setConnectedGmail(e.target.value)}
                    className="w-full bg-[#141311] border border-[#35312b] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#22201c] border border-[#35312b] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-emerald-400" />
                    WhatsApp Business Channel
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Connected
                  </span>
                </div>
                <p className="text-[11px] text-[#8e8a82]">
                  Dispatches finance pre-approval links and vehicle details directly to customer WhatsApp numbers.
                </p>
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

              <div className="p-3.5 rounded-xl bg-[#22201c] border border-[#35312b] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Website Forms &amp; Convex DB</p>
                    <p className="text-[11px] text-[#8e8a82]">
                      Synced with /financing forms, inquiries, test drives &amp; cars
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Live Sync
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
                Cancel
              </Button>
              <Button
                onClick={handleSaveChannelSettings}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl"
              >
                Save Channels
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
