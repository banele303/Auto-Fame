"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Briefcase,
  Users,
  PhoneCall,
  Mail,
  Building2,
  Car,
  FileText,
  Send,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Upload,
  ExternalLink,
  Trash2,
  Check,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  MessageSquare,
  DollarSign,
  Filter,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PipelineStage =
  | "NEW_LEAD"
  | "CONTACTED"
  | "QUOTE_SENT"
  | "FINANCE_APP"
  | "FICA_VERIFIED"
  | "BANK_SUBMITTED"
  | "CLOSED_WON";

const PIPELINE_STAGES: {
  id: PipelineStage;
  label: string;
  badgeClass: string;
  dotClass: string;
}[] = [
  {
    id: "NEW_LEAD",
    label: "New Lead",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    dotClass: "bg-sky-400",
  },
  {
    id: "CONTACTED",
    label: "Contacted",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  {
    id: "QUOTE_SENT",
    label: "Quote Sent",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    dotClass: "bg-indigo-400",
  },
  {
    id: "FINANCE_APP",
    label: "Finance App",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-400",
  },
  {
    id: "FICA_VERIFIED",
    label: "FICA Verified",
    badgeClass: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    dotClass: "bg-teal-400",
  },
  {
    id: "BANK_SUBMITTED",
    label: "Submitted to Bank",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    dotClass: "bg-purple-400",
  },
  {
    id: "CLOSED_WON",
    label: "Closed Won",
    badgeClass: "bg-emerald-600/25 text-emerald-200 border-emerald-400/50",
    dotClass: "bg-emerald-300",
  },
];

const FICA_DOCUMENT_TYPES = [
  { code: "ID_COPY", label: "SA ID Copy (Smart ID / Book)" },
  { code: "DRIVERS_LICENSE", label: "Valid SA Driver's License" },
  { code: "BANK_STATEMENTS", label: "3 Months Stamped Bank Statements" },
  { code: "PAYSLIPS", label: "Latest 3 Months Payslips" },
  { code: "PROOF_OF_ADDRESS", label: "Proof of Residence (< 3 Months)" },
];

const BANK_OPTIONS = [
  { label: "WesBank Vehicle Finance", email: "applications@wesbank.co.za" },
  { label: "MFC (Nedbank Motor Finance)", email: "mfc@nedbank.co.za" },
  { label: "Absa Vehicle & Asset Finance", email: "vehiclefinance@absa.co.za" },
  { label: "Standard Bank Stannic", email: "stannic@standardbank.co.za" },
  { label: "Capitec Business / Asset Finance", email: "business@capitecbank.co.za" },
  { label: "AutoFame Desk Copy (alexsouthflow3@gmail.com)", email: "alexsouthflow3@gmail.com" },
];

export default function DealershipCrmPage() {
  // ── 1. CONVEX FULL-STACK QUERIES & MUTATIONS ──
  const crmWorkspace = useQuery(api.crm.getCrmWorkspace);
  const upsertCrmContact = useMutation(api.crm.upsertCrmContact);
  const updateCrmContactStage = useMutation(api.crm.updateCrmContactStage);
  const deleteCrmContactMutation = useMutation(api.crm.deleteCrmContact);
  const saveFinanceApplication = useMutation(api.agent.saveFinanceApplicationFromChat);
  const generateUploadUrl = useMutation(api.agent.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.agent.resolveStorageUrl);
  const logCrmEvent = useMutation(api.agent.logCrmEvent);

  const realCars = useMemo(() => crmWorkspace?.cars || [], [crmWorkspace?.cars]);
  const convexCrmContacts = useMemo(
    () => crmWorkspace?.crmContacts || [],
    [crmWorkspace?.crmContacts]
  );

  // ── 2. LIVE WHAPI CONTACTS & LOCAL STORAGE MERGE ──
  const [waSyncedContacts, setWaSyncedContacts] = useState<any[]>([]);
  const [customLocalContacts, setCustomLocalContacts] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"inbox" | "pipeline" | "directory">("inbox");
  const [contactFilter, setContactFilter] = useState<"recent" | "all" | "hot" | "finance">(
    "recent"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactKey, setSelectedContactKey] = useState<string>("");

  // Add Contact Modal / Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addStage, setAddStage] = useState<PipelineStage>("CONTACTED");
  const [addCarId, setAddCarId] = useState<number | undefined>(undefined);
  const [addNotes, setAddNotes] = useState("");

  // Center Pane: Omnichannel Message Composer (WhatsApp + Gmail)
  const [composerChannel, setComposerChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [composerText, setComposerText] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    "AutoFame Dealership Johannesburg South — Vehicle Quotation & Finance"
  );
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contactChatHistory, setContactChatHistory] = useState<
    Record<string, { id: string; sender: string; text: string; time: string; fromMe: boolean }[]>
  >({});

  // Right Pane: Customer 360 Finance Application Dossier & Bank Dispatch
  const [finFirstName, setFinFirstName] = useState("");
  const [finLastName, setFinLastName] = useState("");
  const [finIdNumber, setFinIdNumber] = useState("");
  const [finPhone, setFinPhone] = useState("");
  const [finEmail, setFinEmail] = useState("");
  const [finAddress, setFinAddress] = useState("Johannesburg, Gauteng");
  const [finEmployerName, setFinEmployerName] = useState("");
  const [finJobTitle, setFinJobTitle] = useState("");
  const [finMonthlyIncome, setFinMonthlyIncome] = useState<number>(0);
  const [finMonthlyExpenses, setFinMonthlyExpenses] = useState<number>(0);
  const [finCarId, setFinCarId] = useState<number | undefined>(undefined);
  const [finCarName, setFinCarName] = useState("");
  const [finCarPrice, setFinCarPrice] = useState<number>(0);
  const [finDeposit, setFinDeposit] = useState<number>(0);
  const [finTermMonths, setFinTermMonths] = useState<number>(72);
  const [finNotes, setFinNotes] = useState("");
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
  const [bankRecipientEmail, setBankRecipientEmail] = useState("applications@wesbank.co.za");
  const [activeDocUploadCode, setActiveDocUploadCode] = useState<string>("ID_COPY");
  const proofDocInputRef = useRef<HTMLInputElement>(null);

  // Fetch synced contacts from /api/whatsapp
  const fetchWhatsAppDirectory = async () => {
    try {
      const res = await fetch("/api/whatsapp?action=messages");
      const data = await res.json();
      if (res.ok && Array.isArray(data.contacts)) {
        setWaSyncedContacts(data.contacts);
      }
    } catch {}
  };

  useEffect(() => {
    fetchWhatsAppDirectory();
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("autofame_custom_wa_contacts");
        if (raw) setCustomLocalContacts(JSON.parse(raw));
      } catch {}
    }
  }, []);

  // Merge Convex CRM contacts + Custom Local Contacts + Synced Whapi Contacts into unified Master List
  const masterContacts = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Base Whapi synced contacts
    waSyncedContacts.forEach((c, idx) => {
      const key = String(c.id || c.phone).replace(/\D/g, "") || c.id;
      const defaultStage: PipelineStage =
        c.name?.includes("Martha") || c.lastMessage?.includes("Bank:")
          ? "FINANCE_APP"
          : c.lastMessage?.includes("cost how much")
          ? "QUOTE_SENT"
          : c.isRecentChat
          ? "CONTACTED"
          : "NEW_LEAD";

      map.set(key, {
        contactKey: key,
        chatId: c.chatId || `${key}@s.whatsapp.net`,
        name: c.name || c.phone,
        phone: c.phone || `+${key}`,
        email: "",
        idNumber: "",
        address: "Johannesburg, Gauteng",
        employerName: c.name?.includes("Martha")
          ? "West Bulk Bags (Capitec: 2558165883)"
          : "",
        jobTitle: "",
        monthlyIncomeGross: 0,
        monthlyExpenses: 0,
        stage: defaultStage,
        priority: c.isRecentChat ? "HOT" : "NORMAL",
        source: "WHATSAPP",
        assignedCarId: realCars[idx % Math.max(realCars.length, 1)]?.id,
        assignedCarName: realCars[idx % Math.max(realCars.length, 1)]
          ? `${realCars[idx % realCars.length].year} ${realCars[idx % realCars.length].make} ${
              realCars[idx % realCars.length].model
            }`
          : "2024 Toyota Rumion 1.5 SX Auto",
        dealValueZar: realCars[idx % Math.max(realCars.length, 1)]?.price || 249900,
        depositZar: Math.round(
          (realCars[idx % Math.max(realCars.length, 1)]?.price || 249900) * 0.1
        ),
        lastMessage: c.lastMessage || "Saved WhatsApp Contact",
        lastContactedLabel: c.lastContactedLabel || (c.isRecentChat ? "Recent" : "Phonebook"),
        lastContactedAt: c.timestamp || "2026-10-18T08:00:00.000Z",
        isRecentChat: Boolean(c.isRecentChat || c.lastContactedLabel),
        notes: "",
        ficaDocsCount: 0,
        sortOrder: idx,
      });
    });

    // 2. Overlay custom localStorage contacts
    customLocalContacts.forEach((c) => {
      const key = String(c.id || c.phone).replace(/\D/g, "") || c.id;
      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        contactKey: key,
        chatId: c.chatId || `${key}@s.whatsapp.net`,
        name: c.name || existing.name || c.phone,
        phone: c.phone || existing.phone || `+${key}`,
        stage: c.stage || existing.stage || "CONTACTED",
        priority: "HOT",
        source: "WHATSAPP",
        lastMessage: c.lastMessage || existing.lastMessage || "Added Contact",
        lastContactedLabel: c.lastContactedLabel || "Just Added",
        lastContactedAt: c.timestamp || new Date().toISOString(),
        isRecentChat: true,
        sortOrder: -10,
      });
    });

    // 3. Overlay persistent Convex crmContacts (highest priority)
    convexCrmContacts.forEach((c: any) => {
      const key = c.contactKey;
      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        ...c,
        isRecentChat: c.isRecentChat ?? existing.isRecentChat ?? true,
        sortOrder: -20,
      });
    });

    const list = Array.from(map.values());
    // Sort so recent chats come first (by timestamp descending), then phonebook order
    list.sort((a, b) => {
      if (a.isRecentChat && !b.isRecentChat) return -1;
      if (!a.isRecentChat && b.isRecentChat) return 1;
      if (a.isRecentChat && b.isRecentChat) {
        return String(b.lastContactedAt || "").localeCompare(String(a.lastContactedAt || ""));
      }
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    });

    return list;
  }, [waSyncedContacts, customLocalContacts, convexCrmContacts, realCars]);

  // Select default contact once loaded
  useEffect(() => {
    if (!selectedContactKey && masterContacts.length > 0) {
      const preferred =
        masterContacts.find((c) => c.name?.includes("Martha")) ||
        masterContacts[1] ||
        masterContacts[0];
      if (preferred) {
        handleSelectContact(preferred);
      }
    }
  }, [masterContacts, selectedContactKey]);

  const selectedContact = useMemo(
    () =>
      masterContacts.find((c) => c.contactKey === selectedContactKey) ||
      masterContacts[0] ||
      null,
    [masterContacts, selectedContactKey]
  );

  // Populate Right Pane Dossier & Center Composer when selecting a contact
  const handleSelectContact = (contact: any) => {
    if (!contact) return;
    setSelectedContactKey(contact.contactKey);
    const cleanName = String(contact.name || "")
      .replace(/\(.*?\)/g, "")
      .trim();
    const parts = cleanName.split(/\s+/);
    const first = parts[0] || "Client";
    const last = parts.slice(1).join(" ") || "";

    setFinFirstName(first);
    setFinLastName(last);
    setFinPhone(contact.phone || "");
    setFinEmail(contact.email || "");
    setFinIdNumber(contact.idNumber || "");
    setFinAddress(contact.address || "Johannesburg, Gauteng");
    setFinEmployerName(contact.employerName || "");
    setFinJobTitle(contact.jobTitle || "");
    setFinMonthlyIncome(contact.monthlyIncomeGross || 0);
    setFinMonthlyExpenses(contact.monthlyExpenses || 0);

    const assignedCar =
      realCars.find((c: any) => c.id === contact.assignedCarId) || realCars[0];
    const carLabel =
      contact.assignedCarName ||
      (assignedCar
        ? `${assignedCar.year} ${assignedCar.make} ${assignedCar.model}`
        : "2024 Toyota Rumion 1.5 SX Auto");
    const carPrice = Number(contact.dealValueZar || assignedCar?.price || 249900);

    setFinCarId(assignedCar?.id);
    setFinCarName(carLabel);
    setFinCarPrice(carPrice);
    setFinDeposit(Number(contact.depositZar || Math.round(carPrice * 0.1)));
    setFinNotes(contact.notes || "");

    setComposerText(
      `Hi ${first}, this is AutoFame Dealership Johannesburg South (+27 63 199 5124). Following up regarding the ${carLabel} (R${carPrice.toLocaleString()} ZAR). Would you like us to send the official quotation or open your vehicle finance application?`
    );
  };

  // Filtered contacts for Left Pane & Directory Table
  const filteredContacts = useMemo(() => {
    return masterContacts.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q) ||
          c.assignedCarName?.toLowerCase().includes(q) ||
          c.stage?.toLowerCase().includes(q)
        );
      }
      if (contactFilter === "recent") return Boolean(c.isRecentChat);
      if (contactFilter === "hot")
        return c.priority === "HOT" || c.stage === "QUOTE_SENT" || c.stage === "FINANCE_APP";
      if (contactFilter === "finance")
        return (
          c.stage === "FINANCE_APP" ||
          c.stage === "FICA_VERIFIED" ||
          c.stage === "BANK_SUBMITTED"
        );
      return true;
    });
  }, [masterContacts, searchQuery, contactFilter]);

  // ── 3. CRM ACTIONS: ADD CONTACT, CHANGE STAGE, EXTRACT WHATSAPP, SEND MESSAGE, BANK EMAIL ──
  const handleCreateContact = async () => {
    if (!addPhone.trim()) {
      toast.error("Please enter a WhatsApp / phone number.");
      return;
    }
    const cleanDigits = addPhone.replace(/\D/g, "");
    const normalizedKey =
      cleanDigits.startsWith("0") && cleanDigits.length === 10
        ? "27" + cleanDigits.slice(1)
        : cleanDigits;
    const displayPhone = addPhone.startsWith("+")
      ? addPhone.trim()
      : `+${normalizedKey}`;
    const chosenCar = realCars.find((c: any) => c.id === addCarId) || realCars[0];
    const carName = chosenCar
      ? `${chosenCar.year} ${chosenCar.make} ${chosenCar.model}`
      : "Selected Vehicle";
    const carPrice = chosenCar?.price || 249900;

    try {
      await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_contact",
          name: addName.trim() || displayPhone,
          phone: displayPhone,
          message: addNotes.trim() || `Interested in ${carName}`,
        }),
      });

      await upsertCrmContact({
        contactKey: normalizedKey,
        chatId: `${normalizedKey}@s.whatsapp.net`,
        name: addName.trim() || displayPhone,
        phone: displayPhone,
        email: addEmail.trim(),
        stage: addStage,
        priority: "HOT",
        source: "WHATSAPP",
        assignedCarId: chosenCar?.id,
        assignedCarName: carName,
        dealValueZar: carPrice,
        depositZar: Math.round(carPrice * 0.1),
        lastMessage: addNotes.trim() || `Added to CRM — ${carName}`,
        lastContactedLabel: "Just Now",
        lastContactedAt: new Date().toISOString(),
        isRecentChat: true,
        notes: addNotes.trim(),
      });

      const localEntry = {
        id: normalizedKey,
        chatId: `${normalizedKey}@s.whatsapp.net`,
        name: addName.trim() || displayPhone,
        phone: displayPhone,
        stage: addStage,
        lastMessage: addNotes.trim() || `Added to CRM — ${carName}`,
        lastContactedLabel: "Just Now",
        timestamp: new Date().toISOString(),
        isRecentChat: true,
      };
      const nextLocal = [
        localEntry,
        ...customLocalContacts.filter((c) => c.id !== normalizedKey),
      ];
      setCustomLocalContacts(nextLocal);
      if (typeof window !== "undefined") {
        localStorage.setItem("autofame_custom_wa_contacts", JSON.stringify(nextLocal));
      }

      setSelectedContactKey(normalizedKey);
      setShowAddModal(false);
      setAddName("");
      setAddPhone("");
      setAddEmail("");
      setAddNotes("");
      toast.success(`Saved ${localEntry.name} to AutoFame CRM`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save contact");
    }
  };

  const handleStageChange = async (contact: any, nextStage: PipelineStage) => {
    try {
      await upsertCrmContact({
        contactKey: contact.contactKey,
        chatId: contact.chatId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        stage: nextStage,
        priority: contact.priority || "HOT",
        source: contact.source || "WHATSAPP",
        assignedCarId: contact.assignedCarId,
        assignedCarName: contact.assignedCarName,
        dealValueZar: contact.dealValueZar,
        depositZar: contact.depositZar,
        lastMessage: contact.lastMessage,
        lastContactedLabel: contact.lastContactedLabel || "Updated",
        lastContactedAt: new Date().toISOString(),
        isRecentChat: true,
        notes: contact.notes,
      });
      toast.success(
        `Moved ${contact.name} to ${
          PIPELINE_STAGES.find((s) => s.id === nextStage)?.label || nextStage
        }`
      );
    } catch (err: any) {
      toast.error(err.message || "Could not update stage");
    }
  };

  const handleSendOmnichannelMessage = async () => {
    if (!selectedContact || !composerText.trim()) return;
    setSendingMessage(true);
    try {
      if (composerChannel === "whatsapp") {
        const res = await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            to:
              selectedContact.chatId === "120363413508068515@g.us"
                ? selectedContact.chatId
                : selectedContact.phone,
            customerName: selectedContact.name,
            message: composerText.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "WhatsApp send failed");

        if (data.trialQuotaExceeded && data.waMeUrl && typeof window !== "undefined") {
          window.open(data.waMeUrl, "_blank", "noopener,noreferrer");
        }

        // Append to local chat history & update Convex CRM contact
        setContactChatHistory((prev) => {
          const list = prev[selectedContact.contactKey] || [];
          return {
            ...prev,
            [selectedContact.contactKey]: [
              ...list,
              {
                id: `msg-${Date.now()}`,
                sender: "AutoFame Dealership",
                text: composerText.trim(),
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                fromMe: true,
              },
            ],
          };
        });

        await upsertCrmContact({
          contactKey: selectedContact.contactKey,
          chatId: selectedContact.chatId,
          name: selectedContact.name,
          phone: selectedContact.phone,
          stage:
            selectedContact.stage === "NEW_LEAD" ? "CONTACTED" : selectedContact.stage,
          lastMessage: composerText.trim().slice(0, 140),
          lastContactedLabel: "Just Now",
          lastContactedAt: new Date().toISOString(),
          isRecentChat: true,
        });

        await logCrmEvent({
          eventType: "WHATSAPP_SENT",
          recipient: selectedContact.phone,
          customerName: selectedContact.name,
          summary: `CRM WhatsApp sent to ${selectedContact.name}`,
          status: "SUCCESS",
        });

        toast.success(`Sent WhatsApp message to ${selectedContact.name}`);
      } else {
        const targetEmail = finEmail.trim() || selectedContact.email || "alexsouthflow3@gmail.com";
        const res = await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            fromEmail: "alexsouthflow3@gmail.com",
            appPassword: "dmjjjsyxcpqpdwlb",
            to: targetEmail,
            subject: emailSubject,
            body: composerText.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Email dispatch failed");

        toast.success(`Sent official email to ${targetEmail}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleExtractFromWhatsAppToDossier = async () => {
    if (!selectedContact) return;
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extract_contact_and_submit",
          query: `take all information from ${selectedContact.name} ${selectedContact.phone}`,
          context: { cars: realCars },
        }),
      });
      const data = await res.json();
      if (res.ok && data.intake) {
        const intake = data.intake;
        if (intake.firstName) setFinFirstName(intake.firstName);
        if (intake.lastName) setFinLastName(intake.lastName);
        if (intake.phone) setFinPhone(intake.phone);
        if (intake.email) setFinEmail(intake.email);
        if (intake.idNumber) setFinIdNumber(intake.idNumber);
        if (intake.employerName) setFinEmployerName(intake.employerName);
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
        toast.success(`Extracted chat & banking details from ${selectedContact.name}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Extraction failed");
    }
  };

  const handleUploadProofDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const postUrl = await generateUploadUrl();
      const uploadRes = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const { storageId } = await uploadRes.json();
      const publicUrl = await resolveStorageUrl({ storageId });

      setFinProofDocs((prev) => ({
        ...prev,
        [activeDocUploadCode]: {
          docType: activeDocUploadCode,
          originalName: file.name,
          mime: file.type || "application/pdf",
          size: file.size,
          url: publicUrl || "",
        },
      }));
      toast.success(`Uploaded ${file.name} (${activeDocUploadCode})`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  // Pre-flight completeness check for Bank Submission
  const missingFinanceItems = useMemo(() => {
    const missing: string[] = [];
    if (!finFirstName.trim() || !finLastName.trim()) missing.push("Full Name & Surname");
    if (!finIdNumber.trim()) missing.push("13-Digit SA ID Number");
    if (!finPhone.trim()) missing.push("WhatsApp / Mobile Number");
    if (!finCarName.trim() || finCarPrice <= 0) missing.push("Selected Vehicle & Price");
    if (!finEmployerName.trim()) missing.push("Employer / Business Name");
    if (finMonthlyIncome <= 0) missing.push("Gross Monthly Income");
    FICA_DOCUMENT_TYPES.forEach((doc) => {
      if (!finProofDocs[doc.code]) {
        missing.push(doc.label);
      }
    });
    return missing;
  }, [
    finFirstName,
    finLastName,
    finIdNumber,
    finPhone,
    finCarName,
    finCarPrice,
    finEmployerName,
    finMonthlyIncome,
    finProofDocs,
  ]);

  const handleSaveDossierAndSubmitToBank = async (sendEmailToBank: boolean) => {
    if (!selectedContact) return;
    try {
      const docsArray = Object.values(finProofDocs);
      await saveFinanceApplication({
        firstName: finFirstName.trim() || "Client",
        lastName: finLastName.trim() || "Applicant",
        email: finEmail.trim() || "client@autofame.co.za",
        phone: finPhone.trim() || selectedContact.phone,
        idNumber: finIdNumber.trim(),
        address: finAddress.trim(),
        carId: finCarId,
        carName: finCarName,
        carPrice: Number(finCarPrice) || 0,
        downPaymentAmount: Number(finDeposit) || 0,
        loanAmount: Math.max((Number(finCarPrice) || 0) - (Number(finDeposit) || 0), 0),
        termMonths: Number(finTermMonths) || 72,
        employmentStatus: "EMPLOYED",
        employerName: finEmployerName.trim(),
        jobTitle: finJobTitle.trim(),
        monthlyIncomeGross: Number(finMonthlyIncome) || 0,
        monthlyExpenses: Number(finMonthlyExpenses) || 0,
        documents: docsArray,
      });

      const nextStage: PipelineStage = sendEmailToBank
        ? "BANK_SUBMITTED"
        : docsArray.length >= 5
        ? "FICA_VERIFIED"
        : "FINANCE_APP";

      await upsertCrmContact({
        contactKey: selectedContact.contactKey,
        chatId: selectedContact.chatId,
        name: `${finFirstName} ${finLastName}`.trim() || selectedContact.name,
        phone: finPhone.trim() || selectedContact.phone,
        email: finEmail.trim(),
        idNumber: finIdNumber.trim(),
        address: finAddress.trim(),
        employerName: finEmployerName.trim(),
        jobTitle: finJobTitle.trim(),
        monthlyIncomeGross: Number(finMonthlyIncome) || 0,
        monthlyExpenses: Number(finMonthlyExpenses) || 0,
        stage: nextStage,
        assignedCarId: finCarId,
        assignedCarName: finCarName,
        dealValueZar: Number(finCarPrice) || 0,
        depositZar: Number(finDeposit) || 0,
        ficaDocsCount: docsArray.length,
        notes: finNotes,
        lastContactedLabel: "Just Updated",
        lastContactedAt: new Date().toISOString(),
        isRecentChat: true,
      });

      if (sendEmailToBank) {
        const loanPrincipal = Math.max(
          (Number(finCarPrice) || 0) - (Number(finDeposit) || 0),
          0
        );
        const monthlyRate = 0.1175 / 12;
        const term = Number(finTermMonths) || 72;
        const estInstalment = Math.round(
          (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
            (Math.pow(1 + monthlyRate, term) - 1)
        );

        const emailSubjectLine = `OFFICIAL VEHICLE FINANCE APPLICATION — ${finFirstName} ${finLastName} (ID: ${
          finIdNumber || "Pending"
        }) — ${finCarName}`;
        const emailBodyText = `OFFICIAL DEALERSHIP VEHICLE FINANCE APPLICATION DOSSIER
Submitted by: AutoFame Dealership (1 Rifle Range Rd, Baragwanath, Johannesburg South)
Channel: WhatsApp Agent (STARLD-W5LEE) & Dealership CRM
====================================================================

1. APPLICANT DETAILS
• Full Name: ${finFirstName} ${finLastName}
• SA ID Number: ${finIdNumber || "Pending"}
• Mobile / WhatsApp: ${finPhone}
• Email Address: ${finEmail || "Provided via WhatsApp"}
• Physical Address: ${finAddress}

2. VEHICLE & LOAN STRUCTURE
• Vehicle: ${finCarName}
• Retail Price: R${Number(finCarPrice).toLocaleString()} ZAR
• Deposit: R${Number(finDeposit).toLocaleString()} ZAR
• Principal Loan Amount: R${loanPrincipal.toLocaleString()} ZAR
• Term & Rate: ${term} Months @ 11.75% Linked (~R${estInstalment.toLocaleString()} ZAR/month)

3. EMPLOYMENT & AFFORDABILITY
• Employer / Business: ${finEmployerName || "Not Specified"}
• Occupation: ${finJobTitle || "Not Specified"}
• Gross Monthly Income: R${Number(finMonthlyIncome).toLocaleString()} ZAR
• Monthly Expenses: R${Number(finMonthlyExpenses).toLocaleString()} ZAR
• Net Disposable Income: R${Math.max(
          Number(finMonthlyIncome) - Number(finMonthlyExpenses),
          0
        ).toLocaleString()} ZAR

4. ATTACHED FICA PROOF DOCUMENTS (${docsArray.length}/5)
${
  docsArray.length > 0
    ? docsArray.map((d, i) => `${i + 1}. [${d.docType}] ${d.originalName} — ${d.url}`).join("\n")
    : "No proof documents attached yet."
}

5. DEALERSHIP CRM NOTES
${finNotes || "Verified via AutoFame Dealership CRM."}`;

        const emailRes = await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            fromEmail: "alexsouthflow3@gmail.com",
            appPassword: "dmjjjsyxcpqpdwlb",
            to: bankRecipientEmail,
            subject: emailSubjectLine,
            body: emailBodyText,
            attachments: docsArray.map((d) => ({
              filename: d.originalName,
              url: d.url,
              mime: d.mime,
            })),
          }),
        });
        const emailData = await emailRes.json();
        if (!emailRes.ok) {
          throw new Error(emailData.error || "Bank email dispatch failed");
        }
        toast.success(
          `Dispatched Finance Application & ${docsArray.length} attachment(s) to ${bankRecipientEmail}`
        );
      } else {
        toast.success(`Saved Finance Dossier for ${finFirstName} ${finLastName}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process finance dossier");
    }
  };

  // KPIs
  const totalPipelineValue = useMemo(
    () =>
      masterContacts
        .filter((c) => c.isRecentChat)
        .reduce((sum, c) => sum + Number(c.dealValueZar || 249900), 0),
    [masterContacts]
  );

  const recentChatsCount = useMemo(
    () => masterContacts.filter((c) => c.isRecentChat).length,
    [masterContacts]
  );

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#11100e] text-[#eae7e1] font-sans select-none">
      {/* Hidden File Input for FICA Document Uploads */}
      <input
        ref={proofDocInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={handleUploadProofDocument}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP EXECUTIVE COMMAND HEADER                               */}
      {/* ────────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 border-b border-[#262420] bg-[#161512] px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/agent"
            className="px-2.5 py-1.5 rounded-lg bg-[#22201c] hover:bg-[#2c2924] border border-[#35312b] text-xs font-medium text-[#dedad2] flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
            <span>AI Copilot</span>
          </Link>

          <div className="h-5 w-[1px] bg-[#2e2b26]" />

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#f5f2eb] tracking-tight leading-none">
                AutoFame Dealership CRM
              </h1>
              <p className="text-[10px] font-mono text-[#8e8a82] mt-0.5">
                WhatsApp (`STARLD-W5LEE`) • Gmail (`alexsouthflow3@gmail.com`) • Vehicle Finance
              </p>
            </div>
          </div>
        </div>

        {/* Center View Switcher */}
        <div className="flex items-center gap-1 bg-[#11100e] p-1 rounded-xl border border-[#292621]">
          <button
            type="button"
            onClick={() => setActiveView("inbox")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition",
              activeView === "inbox"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[#8e8a82] hover:text-white"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Omnichannel Inbox &amp; Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("pipeline")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition",
              activeView === "pipeline"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[#8e8a82] hover:text-white"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Deal Pipeline Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("directory")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition",
              activeView === "directory"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[#8e8a82] hover:text-white"
            )}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Master Contact Directory ({masterContacts.length})</span>
          </button>
        </div>

        {/* Right KPIs & Add Contact Button */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-4 text-xs mr-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#8e8a82] block">
                Active Pipeline
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                R{totalPipelineValue.toLocaleString()} ZAR
              </span>
            </div>
            <div className="h-6 w-[1px] bg-[#292621]" />
            <div>
              <span className="text-[10px] font-mono uppercase text-[#8e8a82] block">
                Showroom Stock
              </span>
              <span className="font-bold text-[#f5f2eb] font-mono">
                {realCars.length} Vehicles
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>+ Add Contact</span>
          </Button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────── */}
      {/* VIEW 1: 3-PANE OMNICHANNEL INBOX, QUOTES & FINANCE DOSSIER */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeView === "inbox" && (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANE: CONTACT DIRECTORY SORTED BY LAST CONTACTED */}
          <aside className="w-80 xl:w-96 shrink-0 border-r border-[#262420] bg-[#141310] flex flex-col">
            <div className="p-3 border-b border-[#262420] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Contacts by Last Contacted ({filteredContacts.length})
                </span>
                <button
                  type="button"
                  onClick={fetchWhatsAppDirectory}
                  className="text-[10px] text-[#8e8a82] hover:text-emerald-400 flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Sync
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-[#8e8a82] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, message, or car..."
                  className="w-full bg-[#1b1a17] border border-[#33302a] rounded-xl pl-8 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8e8a82] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: "recent", label: `Last Contacted (${recentChatsCount})` },
                  { id: "all", label: `All (${masterContacts.length})` },
                  { id: "hot", label: "Hot Leads" },
                  { id: "finance", label: "Finance" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setContactFilter(tab.id as any)}
                    className={cn(
                      "py-1.5 px-1.5 rounded-lg text-[10px] font-semibold border truncate transition",
                      contactFilter === tab.id
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-[#1a1916] border-[#262420] text-[#8e8a82] hover:text-white"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Contact Cards */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#1f1d19]">
              {filteredContacts.map((c, idx) => {
                const isSelected = selectedContact?.contactKey === c.contactKey;
                const stageMeta =
                  PIPELINE_STAGES.find((s) => s.id === c.stage) || PIPELINE_STAGES[1];
                const initials =
                  (c.name || "WA")
                    .replace(/[^A-Za-z0-9\s]/g, "")
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w: string) => w[0] || "")
                    .join("")
                    .toUpperCase() || "WA";

                return (
                  <button
                    key={`${c.contactKey}-${idx}`}
                    type="button"
                    onClick={() => handleSelectContact(c)}
                    className={cn(
                      "w-full text-left p-3 transition flex items-start gap-3",
                      isSelected
                        ? "bg-emerald-500/12 border-l-2 border-l-emerald-400"
                        : "hover:bg-[#1b1a17]"
                    )}
                  >
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0 mt-0.5">
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-[#f5f2eb] truncate">{c.name}</p>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#22201c] text-emerald-400 shrink-0">
                          {c.lastContactedLabel || "Synced"}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#a09c94] line-clamp-1">
                        {c.lastMessage || c.phone}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-[10px] font-mono text-[#8e8a82]">{c.phone}</span>
                        <span
                          className={cn(
                            "text-[9px] font-semibold px-1.5 py-0.5 rounded border",
                            stageMeta.badgeClass
                          )}
                        >
                          {stageMeta.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* CENTER PANE: LIVE CONVERSATION TIMELINE & OMNICHANNEL COMPOSER */}
          <main className="flex-1 flex flex-col bg-[#11100e] overflow-hidden">
            {selectedContact ? (
              <>
                {/* Selected Contact Deal Bar */}
                <div className="p-4 border-b border-[#262420] bg-[#161512] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-300">
                      {(selectedContact.name || "C")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-[#f5f2eb]">
                          {selectedContact.name}
                        </h2>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {selectedContact.phone}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e8a82] mt-0.5">
                        Last Contacted:{" "}
                        <strong className="text-[#dedad2]">
                          {selectedContact.lastContactedLabel || "Recent"}
                        </strong>{" "}
                        • Vehicle:{" "}
                        <strong className="text-emerald-400">
                          {finCarName || selectedContact.assignedCarName}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Pipeline Stage Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#8e8a82]">
                      Deal Stage:
                    </span>
                    <select
                      value={selectedContact.stage || "CONTACTED"}
                      onChange={(e) =>
                        handleStageChange(selectedContact, e.target.value as PipelineStage)
                      }
                      className="bg-[#1b1a17] border border-[#35312b] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#f5f2eb] focus:outline-none focus:border-emerald-500"
                    >
                      {PIPELINE_STAGES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conversation History & Activity Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Latest Synced Message Card */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#22201c] border border-[#35312b] flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                      {(selectedContact.name || "C")[0]?.toUpperCase()}
                    </div>
                    <div className="max-w-xl rounded-2xl bg-[#1a1916] border border-[#2e2b25] p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-emerald-400">
                          {selectedContact.name} ({selectedContact.phone})
                        </span>
                        <span className="text-[10px] font-mono text-[#8e8a82]">
                          {selectedContact.lastContactedLabel || "WhatsApp Chat"}
                        </span>
                      </div>
                      <p className="text-xs text-[#eae7e1] whitespace-pre-wrap leading-relaxed">
                        {selectedContact.lastMessage || "No message text recorded."}
                      </p>
                    </div>
                  </div>

                  {/* Outbound Messages Sent in Current Session */}
                  {(contactChatHistory[selectedContact.contactKey] || []).map((m) => (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-xl rounded-2xl bg-emerald-600/20 border border-emerald-500/40 p-4 space-y-1.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] font-mono text-emerald-300">
                            {m.sender} • {m.time}
                          </span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <p className="text-xs text-[#f5f2eb] whitespace-pre-wrap text-left leading-relaxed">
                          {m.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Omnichannel Reply & Quotation Composer */}
                <div className="p-4 border-t border-[#262420] bg-[#161512] space-y-3">
                  {/* Channel Switcher + Quick Templates */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setComposerChannel("whatsapp")}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition",
                          composerChannel === "whatsapp"
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-[#1b1a17] text-[#8e8a82] border-[#2e2b25]"
                        )}
                      >
                        <PhoneCall className="h-3 w-3" />
                        <span>WhatsApp Reply</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setComposerChannel("email")}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition",
                          composerChannel === "email"
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-[#1b1a17] text-[#8e8a82] border-[#2e2b25]"
                        )}
                      >
                        <Mail className="h-3 w-3" />
                        <span>Gmail Dispatch</span>
                      </button>
                    </div>

                    {/* 1-Click Professional Templates */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const firstName = selectedContact.name
                            .replace(/\(.*?\)/g, "")
                            .trim()
                            .split(" ")[0];
                          setComposerText(
                            `Hi ${firstName}, thank you for contacting AutoFame Dealership Johannesburg South. I have reviewed your message regarding the ${finCarName}. How can I assist you further today?`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#22201c] hover:bg-[#2c2924] border border-[#35312b] text-[11px] font-medium text-[#eae7e1]"
                      >
                        Smart Reply
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const firstName = selectedContact.name
                            .replace(/\(.*?\)/g, "")
                            .trim()
                            .split(" ")[0];
                          const price = Number(finCarPrice || 249900);
                          const deposit = Number(finDeposit || Math.round(price * 0.1));
                          const loan = Math.max(price - deposit, 0);
                          const est = Math.round(loan * 0.0218);
                          setComposerText(
                            `📄 *AUTOFAME OFFICIAL VEHICLE QUOTATION*\n━━━━━━━━━━━━━━━━━━━━\nHi ${firstName}, here is your official quotation:\n\n🚘 *Vehicle:* ${finCarName}\n💰 *Retail Price:* R${price.toLocaleString()} ZAR\n💵 *10% Deposit:* R${deposit.toLocaleString()} ZAR\n💳 *Principal Loan:* R${loan.toLocaleString()} ZAR\n📊 *Est. Monthly:* ~R${est.toLocaleString()} ZAR/pm (72 Months @ 11.75%)\n\nReply *FINANCE* or send your SA ID, Driver's License, 3 months bank statements & payslips here to apply.`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#22201c] hover:bg-[#2c2924] border border-[#35312b] text-[11px] font-medium text-[#eae7e1]"
                      >
                        Official Vehicle Quote
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const firstName = selectedContact.name
                            .replace(/\(.*?\)/g, "")
                            .trim()
                            .split(" ")[0];
                          setComposerText(
                            `📋 *AutoFame Vehicle Finance Application Container*\n\nHi ${firstName}, to submit your bank finance application for the *${finCarName}* (R${Number(
                              finCarPrice || 0
                            ).toLocaleString()} ZAR), please reply here with:\n\n1. *User Details:* Full Name, 13-Digit SA ID Number, Email & Physical Address\n2. *Financial Details:* Employer Name, Job Title, Gross Monthly Income & Monthly Expenses\n3. *Mandatory FICA Proof Documents:*\n• Copy of SA ID\n• Valid SA Driver's License\n• 3 Months Stamped Bank Statements\n• Latest 3 Months Payslips\n• Proof of Residence (< 3 Months)`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#22201c] hover:bg-[#2c2924] border border-[#35312b] text-[11px] font-medium text-[#eae7e1]"
                      >
                        Finance Application Container
                      </button>

                      {missingFinanceItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const firstName = selectedContact.name
                              .replace(/\(.*?\)/g, "")
                              .trim()
                              .split(" ")[0];
                            setComposerText(
                              `Hi ${firstName}, we are preparing your finance application for the *${finCarName}* for bank submission. Please send the following outstanding items on WhatsApp:\n\n${missingFinanceItems
                                .map((item, i) => `${i + 1}. *${item}*`)
                                .join("\n")}\n\nAs soon as we receive these, we will dispatch your application directly to the bank.`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] font-medium text-amber-300"
                        >
                          Request Missing Docs ({missingFinanceItems.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {composerChannel === "email" && (
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email Subject"
                      className="w-full bg-[#1b1a17] border border-[#33302a] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}

                  <div className="flex gap-2">
                    <textarea
                      rows={4}
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      placeholder="Write a WhatsApp message, vehicle quotation, or finance checklist..."
                      className="flex-1 bg-[#1b1a17] border border-[#33302a] rounded-xl p-3 text-xs text-[#f5f2eb] leading-relaxed focus:outline-none focus:border-emerald-500"
                    />
                    <Button
                      type="button"
                      disabled={sendingMessage}
                      onClick={handleSendOmnichannelMessage}
                      className="h-auto px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex flex-col items-center justify-center gap-1.5 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                      <span>
                        {sendingMessage
                          ? "Sending..."
                          : composerChannel === "whatsapp"
                          ? "Send WhatsApp"
                          : "Send Email"}
                      </span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#8e8a82]">
                Select any contact on the left to open their conversation and finance dossier.
              </div>
            )}
          </main>

          {/* RIGHT PANE: CUSTOMER 360 FINANCE DOSSIER & BANK SUBMISSION */}
          <aside className="w-96 xl:w-[430px] shrink-0 border-l border-[#262420] bg-[#141310] flex flex-col overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#262420]">
              <div>
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-emerald-400">
                  Customer 360° &amp; Bank Finance Dossier
                </h3>
                <p className="text-[10px] text-[#8e8a82]">
                  Verify User, Vehicle, Affordability &amp; 5 FICA Docs
                </p>
              </div>
              <button
                type="button"
                onClick={handleExtractFromWhatsAppToDossier}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Extract Chat → Form
              </button>
            </div>

            {/* Pre-Flight Bank Verification Banner */}
            <div
              className={cn(
                "p-3 rounded-xl border text-xs space-y-1",
                missingFinanceItems.length === 0
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-200"
              )}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {missingFinanceItems.length === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  )}
                  {missingFinanceItems.length === 0
                    ? "Verified Ready for Bank Submission"
                    : `${missingFinanceItems.length} Item(s) Needed for Bank`}
                </span>
                <span className="text-[10px] font-mono">
                  {Object.keys(finProofDocs).length}/5 Docs
                </span>
              </div>
              {missingFinanceItems.length > 0 && (
                <p className="text-[10px] text-amber-300/90 leading-relaxed">
                  Missing: {missingFinanceItems.slice(0, 4).join(", ")}
                  {missingFinanceItems.length > 4
                    ? ` +${missingFinanceItems.length - 4} more`
                    : ""}
                </p>
              )}
            </div>

            {/* Section 1: User Details */}
            <div className="p-3 rounded-xl bg-[#1a1916] border border-[#292621] space-y-2">
              <p className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                1. Applicant Details
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">First Name</label>
                  <input
                    type="text"
                    value={finFirstName}
                    onChange={(e) => setFinFirstName(e.target.value)}
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">Surname</label>
                  <input
                    type="text"
                    value={finLastName}
                    onChange={(e) => setFinLastName(e.target.value)}
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">
                    13-Digit SA ID
                  </label>
                  <input
                    type="text"
                    value={finIdNumber}
                    onChange={(e) => setFinIdNumber(e.target.value)}
                    placeholder="9001015009087"
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">Phone</label>
                  <input
                    type="text"
                    value={finPhone}
                    onChange={(e) => setFinPhone(e.target.value)}
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">Email</label>
                  <input
                    type="email"
                    value={finEmail}
                    onChange={(e) => setFinEmail(e.target.value)}
                    placeholder="client@email.co.za"
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">Address</label>
                  <input
                    type="text"
                    value={finAddress}
                    onChange={(e) => setFinAddress(e.target.value)}
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Assigned Showroom Vehicle */}
            <div className="p-3 rounded-xl bg-[#1a1916] border border-[#292621] space-y-2">
              <p className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                2. Assigned Showroom Vehicle &amp; Deal Value
              </p>
              <select
                value={finCarId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const car = realCars.find((c: any) => c.id === id);
                  if (car) {
                    setFinCarId(car.id);
                    setFinCarName(`${car.year} ${car.make} ${car.model}`);
                    setFinCarPrice(car.price || 0);
                    setFinDeposit(Math.round((car.price || 0) * 0.1));
                  }
                }}
                className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {realCars.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.year} {c.make} {c.model} — R{Number(c.price || 0).toLocaleString()} ZAR
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">
                    Price (R ZAR)
                  </label>
                  <input
                    type="number"
                    value={finCarPrice || ""}
                    onChange={(e) => setFinCarPrice(Number(e.target.value))}
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">
                    Deposit (R ZAR)
                  </label>
                  <input
                    type="number"
                    value={finDeposit || ""}
                    onChange={(e) => setFinDeposit(Number(e.target.value))}
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Financial & Banking Profile */}
            <div className="p-3 rounded-xl bg-[#1a1916] border border-[#292621] space-y-2">
              <p className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                3. Employment &amp; Banking Details
              </p>
              <input
                type="text"
                value={finEmployerName}
                onChange={(e) => setFinEmployerName(e.target.value)}
                placeholder="Employer / Business & Bank Details"
                className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">
                    Gross Income (R)
                  </label>
                  <input
                    type="number"
                    value={finMonthlyIncome || ""}
                    onChange={(e) => setFinMonthlyIncome(Number(e.target.value))}
                    placeholder="38000"
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8e8a82] block mb-0.5">
                    Monthly Expenses (R)
                  </label>
                  <input
                    type="number"
                    value={finMonthlyExpenses || ""}
                    onChange={(e) => setFinMonthlyExpenses(Number(e.target.value))}
                    placeholder="14500"
                    className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: FICA 5-Document Proof Checklist */}
            <div className="p-3 rounded-xl bg-[#1a1916] border border-[#292621] space-y-2">
              <p className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                4. Mandatory Proof Documents ({Object.keys(finProofDocs).length}/5)
              </p>
              <div className="space-y-1.5">
                {FICA_DOCUMENT_TYPES.map((doc) => {
                  const uploaded = finProofDocs[doc.code];
                  return (
                    <div
                      key={doc.code}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border text-xs",
                        uploaded
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-[#12110f] border-[#292621]"
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-[11px] font-medium text-[#eae7e1] truncate">
                          {doc.label}
                        </p>
                        {uploaded && (
                          <p className="text-[10px] text-emerald-400 truncate">
                            {uploaded.originalName}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocUploadCode(doc.code);
                          proofDocInputRef.current?.click();
                        }}
                        className="px-2 py-1 rounded bg-[#24221e] hover:bg-[#2f2c27] border border-[#38342d] text-[10px] font-semibold text-[#dedad2] shrink-0 flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3 text-emerald-400" />
                        {uploaded ? "Replace" : "Attach"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 5: Bank Submission */}
            <div className="p-3 rounded-xl bg-[#1a1916] border border-[#292621] space-y-2.5">
              <p className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                5. Bank Underwriting Dispatch
              </p>
              <select
                value={bankRecipientEmail}
                onChange={(e) => setBankRecipientEmail(e.target.value)}
                className="w-full bg-[#12110f] border border-[#33302a] rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {BANK_OPTIONS.map((b) => (
                  <option key={b.email} value={b.email}>
                    {b.label} ({b.email})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => handleSaveDossierAndSubmitToBank(false)}
                  className="bg-[#24221e] hover:bg-[#2f2c27] text-white border border-[#38342d] text-xs font-semibold h-9 rounded-xl"
                >
                  Save Dossier
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSaveDossierAndSubmitToBank(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-9 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email to Bank
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* VIEW 2: INTERACTIVE DEAL PIPELINE BOARD (7-STAGE KANBAN)   */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeView === "pipeline" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-5 bg-[#11100e]">
          <div className="flex gap-4 h-full min-w-max">
            {PIPELINE_STAGES.map((stage, stageIdx) => {
              const stageContacts = masterContacts.filter((c) => c.stage === stage.id);
              const stageTotalZar = stageContacts.reduce(
                (s, c) => s + Number(c.dealValueZar || 249900),
                0
              );
              const nextStage = PIPELINE_STAGES[stageIdx + 1]?.id;

              return (
                <div
                  key={stage.id}
                  className="w-80 shrink-0 rounded-2xl bg-[#161512] border border-[#262420] flex flex-col h-full overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-[#262420] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", stage.dotClass)} />
                        <span className="text-xs font-bold text-[#f5f2eb] uppercase tracking-wider">
                          {stage.label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#22201c] text-[#dedad2]">
                        {stageContacts.length}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-emerald-400">
                      R{stageTotalZar.toLocaleString()} ZAR
                    </p>
                  </div>

                  {/* Stage Cards */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {stageContacts.map((c, idx) => (
                      <div
                        key={`${c.contactKey}-${idx}`}
                        className="p-3 rounded-xl bg-[#1c1a17] hover:bg-[#22201c] border border-[#2e2b25] space-y-2 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-[#f5f2eb]">{c.name}</p>
                            <p className="text-[10px] font-mono text-emerald-400">{c.phone}</p>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#141310] text-[#8e8a82]">
                            {c.lastContactedLabel || "Synced"}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#a09c94] line-clamp-2">
                          {c.lastMessage}
                        </p>

                        <div className="pt-1 border-t border-[#292621] flex items-center justify-between text-[10px]">
                          <span className="text-[#dedad2] font-medium truncate max-w-[160px]">
                            {c.assignedCarName}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            R{Number(c.dealValueZar || 249900).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectContact(c);
                              setActiveView("inbox");
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300"
                          >
                            Open Chat &amp; Dossier
                          </button>

                          {nextStage && (
                            <button
                              type="button"
                              onClick={() => handleStageChange(c, nextStage)}
                              className="py-1 px-2 rounded-lg bg-[#262420] hover:bg-[#33302a] text-[10px] font-semibold text-[#dedad2] flex items-center gap-0.5"
                            >
                              <span>Next</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* VIEW 3: MASTER CONTACT & LEAD DIRECTORY TABLE              */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeView === "directory" && (
        <div className="flex-1 flex flex-col overflow-hidden p-6 bg-[#11100e]">
          <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col bg-[#161512] border border-[#262420] rounded-2xl overflow-hidden">
            {/* Table Toolbar */}
            <div className="p-4 border-b border-[#262420] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#f5f2eb]">
                  Master Dealership Contact &amp; Lead Directory ({filteredContacts.length} Contacts)
                </h2>
                <p className="text-[11px] text-[#8e8a82]">
                  Sorted by Last Contacted • Click any row to chat on WhatsApp, send a vehicle quote, or open finance application
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, phone, car, or message..."
                  className="w-72 bg-[#11100e] border border-[#33302a] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <Button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  + Add Contact
                </Button>
              </div>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#1c1a17] border-b border-[#2e2b25] text-[10px] font-mono uppercase text-[#8e8a82]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Contact Name</th>
                    <th className="py-3 px-4">WhatsApp / Phone</th>
                    <th className="py-3 px-4">Deal Stage</th>
                    <th className="py-3 px-4">Assigned Vehicle</th>
                    <th className="py-3 px-4">Deal Value</th>
                    <th className="py-3 px-4">Last Message</th>
                    <th className="py-3 px-4">Last Contacted</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22201c] text-xs">
                  {filteredContacts.map((c, i) => {
                    const stageMeta =
                      PIPELINE_STAGES.find((s) => s.id === c.stage) || PIPELINE_STAGES[1];
                    return (
                      <tr
                        key={`${c.contactKey}-${i}`}
                        className="hover:bg-[#1c1a17] transition"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-[#8e8a82]">
                          {i + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#f5f2eb]">{c.name}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400">{c.phone}</td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded border",
                              stageMeta.badgeClass
                            )}
                          >
                            {stageMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#dedad2]">{c.assignedCarName}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-300">
                          R{Number(c.dealValueZar || 249900).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-[#a09c94] max-w-xs truncate">
                          {c.lastMessage}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                          {c.lastContactedLabel || "Synced"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectContact(c);
                                setActiveView("inbox");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                            >
                              Reply / Dossier
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ADD NEW CONTACT MODAL                                      */}
      {/* ────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl bg-[#181714] border border-[#35312b] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#292621]">
              <div>
                <h3 className="text-sm font-bold text-[#f5f2eb]">
                  Add Contact to AutoFame CRM
                </h3>
                <p className="text-[11px] text-[#8e8a82]">
                  Saves permanently to Convex CRM &amp; WhatsApp Directory
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#8e8a82] hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                  Contact Full Name *
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Sipho Ndlovu"
                  className="w-full bg-[#11100e] border border-[#33302a] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                  WhatsApp / Mobile Phone Number *
                </label>
                <input
                  type="text"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="e.g. +27 82 555 1234 or 082 555 1234"
                  className="w-full bg-[#11100e] border border-[#33302a] rounded-xl px-3 py-2 font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="client@email.co.za"
                    className="w-full bg-[#11100e] border border-[#33302a] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={addStage}
                    onChange={(e) => setAddStage(e.target.value as PipelineStage)}
                    className="w-full bg-[#11100e] border border-[#33302a] rounded-xl px-3 py-2 text-white"
                  >
                    {PIPELINE_STAGES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                  Interested Showroom Vehicle
                </label>
                <select
                  value={addCarId || ""}
                  onChange={(e) => setAddCarId(Number(e.target.value))}
                  className="w-full bg-[#11100e] border border-[#33302a] rounded-xl px-3 py-2 text-white"
                >
                  {realCars.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.year} {c.make} {c.model} — R{Number(c.price || 0).toLocaleString()} ZAR
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[#8e8a82] block mb-1">
                  Initial Message / Lead Notes
                </label>
                <textarea
                  rows={2}
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="e.g. Requested finance quote via WhatsApp"
                  className="w-full bg-[#11100e] border border-[#33302a] rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#292621]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-[#8e8a82] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateContact}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl px-4"
              >
                + Save &amp; Open in CRM
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
