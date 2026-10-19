"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Bot,
  User,
  Wrench,
  CreditCard,
  Car,
  FileText,
  PhoneCall,
  Loader2,
  ExternalLink,
  Copy,
  ChevronRight,
  ShieldCheck,
  Search,
  Calendar,
  DollarSign,
  ArrowRight,
  Clock,
  Terminal,
  MessageSquare,
  Users,
  Compass,
  CheckCircle2,
  HelpCircle,
  Menu,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────
// Custom Dealership Navigation Links for Agent
// ──────────────────────────────────────────────
const DEALERSHIP_LINKS = [
  { icon: PhoneCall, label: "Customer Follow-Ups", prompt: "Show me customer leads requiring urgent follow-up today", badge: "Hot" },
  { icon: CreditCard, label: "Send Finance Link", prompt: "Prepare and dispatch vehicle finance pre-approval link via WhatsApp", badge: "WesBank" },
  { icon: Wrench, label: "Cars at Workshop", prompt: "List all cars currently being fixed or serviced with repair costs", badge: "Repairs" },
  { icon: FileText, label: "Auto-Generate Description", prompt: "Generate high-converting vehicle copy for 2018 BMW X2 M Sport" },
  { icon: Car, label: "Live Showroom Inventory", prompt: "Provide full overview of available showroom stock and prices" },
  { icon: Calendar, label: "Test Drive Schedule", prompt: "Show scheduled test drives and customer appointments this week" },
  { icon: DollarSign, label: "Sales & Profit Pipeline", prompt: "Summarize recent vehicle sales and gross profit margins" },
];

// ──────────────────────────────────────────────
// Custom Markdown Components for Claude Terminal Tables & Code
// ──────────────────────────────────────────────
const markdownComponents = {
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-[#3d3931] bg-[#171614] shadow-md">
      <table className="w-full text-left text-xs border-collapse min-w-[560px]" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => (
    <thead className="bg-[#24221e] text-[#eae7e1] border-b border-[#3d3931] font-mono uppercase tracking-wider text-[10.5px]" {...props} />
  ),
  th: ({ node, ...props }: any) => (
    <th className="px-3.5 py-2.5 font-semibold text-[#d97757] whitespace-nowrap" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="px-3.5 py-2.5 border-t border-[#2e2b26] text-[#c9c5bd] align-middle" {...props} />
  ),
  tr: ({ node, ...props }: any) => (
    <tr className="hover:bg-[#201e1a] transition-colors" {...props} />
  ),
};

export default function AdminClaudeAgentPage() {
  // ── Realtime Convex Queries & Mutations ──
  const sessions = useQuery(api.agent.listSessions, {});
  const dealershipContext = useQuery(api.agent.getDealershipContext, {});
  const carRepairs = useQuery(api.agent.listCarRepairs, {});
  const crmEvents = useQuery(api.agent.listCrmEvents, { limit: 15 });

  const createSession = useMutation(api.agent.createSession);
  const deleteSession = useMutation(api.agent.deleteSession);
  const updateSessionTitle = useMutation(api.agent.updateSessionTitle);
  const addMessage = useMutation(api.agent.addMessage);
  const seedInitialData = useMutation(api.seedAgent.seedInitialData);
  const recordCrmEvent = useMutation(api.agent.recordCrmEvent);
  const updateRepairStatus = useMutation(api.agent.updateCarRepairStatus);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const resolveStorageUrl = useMutation(api.files.resolveStorageUrl);

  // Active Session
  const [selectedSessionId, setSelectedSessionId] = useState<any>(null);
  const activeSessionData = useQuery(
    api.agent.getSession,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  // Streaming & Chat State
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingActionPayload, setStreamingActionPayload] = useState<any>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  // Attachments State
  const [attachedFiles, setAttachedFiles] = useState<{
    file: File;
    previewUrl: string;
    name: string;
    type: string;
    size: number;
  }[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [attachedFiles]);

  // Sidebar visibility on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Active View Tab inside Agent Workspace
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<"chat" | "repairs" | "crm">("chat");

  // WhatsApp Modal
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState({
    to: "+27 83 492 1109",
    name: "Thabo Mokoena",
    message: "Hi Thabo, here is your vehicle finance application link for AutoFame: https://www.autofame.co.za/financing. Pre-approval arranged with WesBank, Standard Bank, and Absa MFC.",
    carName: "2018 BMW X2 sDrive20i M Sport",
  });
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

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

  // Create New Claude Session
  const handleNewSession = async () => {
    try {
      const newId = await createSession({
        title: "New Dealership Task",
        model: "claude-3-5-sonnet",
      });
      setSelectedSessionId(newId);
      setActiveWorkspaceView("chat");
      toast.success("New Claude session initialized");
    } catch (err: any) {
      toast.error("Failed to create session: " + err.message);
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
      toast.success("Session deleted");
    } catch (err: any) {
      toast.error("Failed to delete session: " + err.message);
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
      toast.success("Session renamed");
    } catch {
      toast.error("Failed to rename session");
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

  // Stream Message from AI Engine (SSE Token-by-Token)
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if ((!textToSend.trim() && attachedFiles.length === 0) || isStreaming || isUploadingFiles) return;

    let targetSessionId = selectedSessionId;
    if (!targetSessionId) {
      targetSessionId = await createSession({
        title: textToSend ? textToSend.slice(0, 32) : attachedFiles[0]?.name || "File Analysis",
      });
      setSelectedSessionId(targetSessionId);
    }

    const filesToProcess = [...attachedFiles];
    setInputValue("");
    setAttachedFiles([]);
    setIsStreaming(true);
    setStreamingText("");
    setStreamingActionPayload(null);
    setActiveWorkspaceView("chat");

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
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
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

    const finalContent = textToSend.trim() || (uploadedAttachments.length > 0 ? `Uploaded ${uploadedAttachments.length} file(s) for technical review.` : "Hello");

    try {
      // 1. Persist User Message to Convex with attachments
      await addMessage({
        sessionId: targetSessionId,
        role: "user",
        content: finalContent,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      // 2. Open Stream to Backend
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
        throw new Error(`AI Streaming failed with HTTP ${response.status}`);
      }

      // 3. Read SSE Stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let actionPayloadHolder: any = null;

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
              } else if (parsed.type === "meta") {
                actionPayloadHolder = parsed.actionPayload;
                setStreamingActionPayload(parsed.actionPayload);
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      // 4. Save Final Completed Assistant Message to Convex
      if (accumulatedText) {
        await addMessage({
          sessionId: targetSessionId,
          role: "assistant",
          content: accumulatedText,
          actionType: actionPayloadHolder?.actionType,
          actionPayload: actionPayloadHolder,
        });
      }
    } catch (err: any) {
      console.error("Streaming error:", err);
      toast.error("Streaming failed: " + err.message);
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      setStreamingActionPayload(null);
    }
  };

  // WhatsApp Dispatch
  const handleDispatchWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: whatsAppTarget.to,
          message: whatsAppTarget.message,
          customerName: whatsAppTarget.name,
          actionType: "FINANCE_APPLICATION_DISPATCH",
        }),
      });

      if (res.ok) {
        toast.success(`Dispatched via Whapi.Cloud to ${whatsAppTarget.name}!`);
        await recordCrmEvent({
          eventType: "WHATSAPP_SENT",
          recipient: whatsAppTarget.to,
          customerName: whatsAppTarget.name,
          summary: `Vehicle finance link sent to ${whatsAppTarget.name} (${whatsAppTarget.to}) via Whapi.cloud`,
          status: "SUCCESS",
        });
        setWhatsAppModalOpen(false);
      } else {
        toast.error("Failed to dispatch WhatsApp message");
      }
    } catch (err: any) {
      toast.error("WhatsApp error: " + err.message);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-var(--navbar-height))] w-full overflow-hidden bg-[#1f1e1b] text-[#eae7e1] font-sans">
      {/* ────────────────────────────────────────────────────────── */}
      {/* CLAUDE CODE DEDICATED SIDEBAR (Warm Terracotta / Anthropic) */}
      {/* ────────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "w-80 shrink-0 flex flex-col bg-[#181715] border-r border-[#2d2a26] transition-all duration-300 z-30 select-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full absolute md:relative md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-[#2d2a26] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#c96442]/20 border border-[#c96442]/40 flex items-center justify-center text-[#d97757]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#d97757] font-mono">
                Claude Code
              </h2>
              <span className="text-[10px] text-[#8e8a82]">AutoFame Dealership OS</span>
            </div>
          </div>

          <Button
            onClick={handleNewSession}
            size="sm"
            className="h-7 px-2.5 rounded-lg bg-[#c96442] hover:bg-[#b85635] text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>

        {/* ── SECTION 1: DEALERSHIP OWNER ACTION WORKFLOWS ── */}
        <div className="p-3 border-b border-[#2d2a26] space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#7d7971] px-2 block font-semibold">
            Dealership Workflows
          </span>
          <div className="space-y-0.5">
            {DEALERSHIP_LINKS.map((link, idx) => {
              const Icon = link.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(link.prompt)}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-xs text-[#c2bdb4] hover:bg-[#262420] hover:text-[#f4f2ee] transition group text-left"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="h-3.5 w-3.5 text-[#d97757] shrink-0" />
                    <span className="truncate font-medium">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#c96442]/20 text-[#d97757] border border-[#c96442]/30 shrink-0">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 2: CHAT SESSIONS HISTORY ── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7d7971] font-semibold">
              Recent Tasks ({sessions?.length || 0})
            </span>
          </div>

          {!sessions || sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#706c64]">
              No active sessions. Click "New Chat" to start.
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = selectedSessionId === s._id;
              const isEditing = editingTitleId === s._id;

              return (
                <div
                  key={s._id}
                  onClick={() => {
                    setSelectedSessionId(s._id);
                    setActiveWorkspaceView("chat");
                  }}
                  className={cn(
                    "group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs border",
                    isSelected
                      ? "bg-[#282622] text-[#f4f2ee] border-[#c96442]/40 shadow-sm"
                      : "bg-transparent hover:bg-[#23211e] text-[#a6a197] hover:text-[#dedad2] border-transparent"
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
                        className="w-full bg-[#141311] border border-[#c96442]/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
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
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-medium truncate">{s.title}</p>
                        <span className="text-[10px] text-[#706c64]">
                          {new Date(s.lastMessageAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
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

        {/* Sidebar Footer Link back to standard Dashboard */}
        <div className="p-3 border-t border-[#2d2a26] bg-[#141311]">
          <Link
            href="/admin"
            className="flex items-center justify-between text-xs text-[#8e8a82] hover:text-[#eae7e1] transition px-2 py-1.5 rounded-lg hover:bg-[#23211e]"
          >
            <span>Return to Main Admin Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MAIN WORKSPACE AREA (Claude Terminal & Editorial Layout)   */}
      {/* ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#1f1e1b]">
        {/* Top Header Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-[#2d2a26] bg-[#181715]/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-[#282622] text-[#8e8a82] hover:text-white transition"
              title="Toggle Sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-serif text-sm sm:text-base font-bold text-[#f5f2eb]">
                {activeSessionData?.session?.title || "AutoFame Dealership Copilot"}
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#c96442]/15 text-[#d97757] border border-[#c96442]/25">
                Anthropic Claude 3.5 Sonnet
              </span>
            </div>
          </div>

          {/* Quick View Switches */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#141311] p-1 rounded-xl border border-[#2d2a26]">
              <button
                onClick={() => setActiveWorkspaceView("chat")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5",
                  activeWorkspaceView === "chat"
                    ? "bg-[#c96442] text-white shadow-sm"
                    : "text-[#8e8a82] hover:text-white"
                )}
              >
                <Terminal className="h-3.5 w-3.5" />
                Claude Terminal
              </button>
              <button
                onClick={() => setActiveWorkspaceView("repairs")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5",
                  activeWorkspaceView === "repairs"
                    ? "bg-[#c96442] text-white shadow-sm"
                    : "text-[#8e8a82] hover:text-white"
                )}
              >
                <Wrench className="h-3.5 w-3.5" />
                Workshop Cars
                {dealershipContext?.stats?.inRepairCount ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-white font-mono">
                    {dealershipContext.stats.inRepairCount}
                  </span>
                ) : null}
              </button>
              <button
                onClick={() => setActiveWorkspaceView("crm")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5",
                  activeWorkspaceView === "crm"
                    ? "bg-[#c96442] text-white shadow-sm"
                    : "text-[#8e8a82] hover:text-white"
                )}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                WhatsApp CRM
              </button>
            </div>
          </div>
        </header>

        {/* ── WORKSPACE VIEW 1: CLAUDE CHAT TERMINAL ── */}
        {activeWorkspaceView === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Conversation Stream */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-12 md:px-24 py-6 space-y-6">
              {activeSessionData?.messages?.map((msg: any) => {
                const isAssistant = msg.role === "assistant";

                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex gap-4 max-w-3xl",
                      isAssistant ? "mr-auto" : "ml-auto justify-end"
                    )}
                  >
                    {isAssistant && (
                      <div className="h-8 w-8 rounded-xl bg-[#c96442]/20 border border-[#c96442]/40 flex items-center justify-center text-[#d97757] shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed",
                        isAssistant
                          ? "bg-[#252320] text-[#eae7e1] border border-[#35312b] shadow-sm max-w-2xl w-full"
                          : "bg-[#d97757] text-white font-medium max-w-lg shadow-sm"
                      )}
                    >
                      {/* Markdown Formatted Text (Headings, Bullet points, Code blocks) */}
                      {isAssistant ? (
                        <div className="prose prose-invert prose-sm max-w-none space-y-3 font-normal leading-relaxed text-[#eae7e1]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          {/* Attachments rendering */}
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
                                        title={`View full image: ${att.name}`}
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
                                        title={`View document: ${att.name}`}
                                      >
                                        <FileText className="h-4 w-4 text-white/80 shrink-0" />
                                        <span className="truncate max-w-[180px] font-mono text-[11px]">{att.name}</span>
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

                      {/* Interactive Action Cards */}
                      {msg.actionType === "SEND_FINANCE_LINK" && (
                        <div className="mt-4 pt-3.5 border-t border-[#3a362f] flex flex-wrap items-center gap-2">
                          <Button
                            onClick={() => {
                              setWhatsAppTarget({
                                to: msg.actionPayload?.customerPhone || "+27 83 492 1109",
                                name: msg.actionPayload?.customerName || "Thabo Mokoena",
                                message: `Hi ${msg.actionPayload?.customerName || "Customer"}, here is your vehicle finance application link for the ${msg.actionPayload?.carName || "Vehicle"}: https://www.autofame.co.za/financing. Pre-approved across WesBank & Standard Bank Auto.`,
                                carName: msg.actionPayload?.carName || "Vehicle",
                              });
                              setWhatsAppModalOpen(true);
                            }}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 h-8 text-xs shadow-sm"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            Dispatch via WhatsApp (Whapi.Cloud)
                          </Button>

                          <a
                            href="/financing"
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 text-zinc-300 transition"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open Customer Application Form
                          </a>
                        </div>
                      )}

                      {msg.actionType === "CAR_REPAIR_STATUS" && (
                        <div className="mt-4 pt-3.5 border-t border-[#3a362f]">
                          <Button
                            onClick={() => setActiveWorkspaceView("repairs")}
                            size="sm"
                            className="bg-[#c96442] hover:bg-[#b85635] text-white font-semibold text-xs h-8 flex items-center gap-1.5"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            Open Workshop Repairs Dashboard
                          </Button>
                        </div>
                      )}

                      {msg.actionType === "AUTO_GENERATE_DESCRIPTION" && (
                        <div className="mt-4 pt-3.5 border-t border-[#3a362f] flex items-center gap-2">
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              toast.success("Description copied to clipboard!");
                            }}
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs flex items-center gap-1.5 bg-[#33302a] hover:bg-[#3f3b33] text-[#f4f2ee]"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy Formatted Description
                          </Button>
                        </div>
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

              {/* Streaming Real-Time Token Generation Bubble */}
              {isStreaming && (
                <div className="flex gap-4 max-w-3xl mr-auto animate-in fade-in duration-150">
                  <div className="h-8 w-8 rounded-xl bg-[#c96442]/20 border border-[#c96442]/40 flex items-center justify-center text-[#d97757] shrink-0 mt-0.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>

                  <div className="bg-[#252320] text-[#eae7e1] border border-[#35312b] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-sm max-w-2xl w-full">
                    <div className="prose prose-invert prose-sm max-w-none space-y-3 font-normal leading-relaxed text-[#eae7e1]">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {streamingText + " ▍"}
                      </ReactMarkdown>
                    </div>

                    {streamingActionPayload?.actionType === "SEND_FINANCE_LINK" && (
                      <div className="mt-3 pt-3 border-t border-[#3a362f]">
                        <span className="text-[11px] text-[#d97757] font-semibold animate-pulse">
                          Generating WhatsApp Whapi.cloud dispatch package...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Claude-style Composer Input Box */}
            <div className="p-4 sm:p-6 bg-[#181715] border-t border-[#2d2a26]">
              <div className="max-w-3xl mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative rounded-2xl border border-[#38342d] bg-[#22201c] shadow-lg focus-within:border-[#c96442] focus-within:ring-1 focus-within:ring-[#c96442]/30 transition"
                >
                  {/* File Attachment Chip Previews */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border-b border-[#2e2b26] bg-[#1a1916]/70 rounded-t-2xl">
                      {attachedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="relative flex items-center gap-2 bg-[#282521] border border-[#3d3931] rounded-lg px-2.5 py-1.5 text-xs text-[#eae7e1] animate-in fade-in"
                        >
                          {f.type.startsWith("image/") ? (
                            <img src={f.previewUrl} alt={f.name} className="h-6 w-6 object-cover rounded" />
                          ) : (
                            <FileText className="h-4 w-4 text-[#d97757]" />
                          )}
                          <span className="max-w-[140px] truncate text-[11px] font-medium">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachedFile(i)}
                            className="text-[#8e8a82] hover:text-white p-0.5 rounded-full hover:bg-white/10 transition"
                            title="Remove attachment"
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
                    rows={2}
                    placeholder="Ask Claude Code about dealership inventory, financing, workshop repairs, or attach vehicle photos/PDFs..."
                    className="w-full bg-transparent p-4 pb-12 text-xs sm:text-sm text-[#f5f2eb] placeholder:text-[#837e75] focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Composer Footer Actions */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-[#a6a197] hover:text-[#f4f2ee] hover:bg-[#2e2b26] flex items-center gap-1.5 rounded-lg text-xs"
                        title="Attach vehicle photos, FICA documents or PDFs"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-[#d97757]" />
                        <span className="text-[11px] font-medium">Attach</span>
                      </Button>

                      <span className="hidden md:inline text-[11px] text-[#706c64]">
                        Press Enter to send • Shift+Enter for new line
                      </span>
                    </div>

                    <Button
                      type="submit"
                      disabled={(!inputValue.trim() && attachedFiles.length === 0) || isStreaming || isUploadingFiles}
                      size="sm"
                      className="h-8 px-4 rounded-xl bg-[#c96442] hover:bg-[#b85635] text-white font-semibold text-xs flex items-center gap-1.5 shadow transition disabled:opacity-30"
                    >
                      {isStreaming || isUploadingFiles ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Run
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKSPACE VIEW 2: WORKSHOP REPAIRS BOARD ── */}
        {activeWorkspaceView === "repairs" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2a26] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#f5f2eb] flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-[#d97757]" />
                  Workshop Repair &amp; Service Control Center
                </h3>
                <p className="text-xs text-[#8e8a82] mt-0.5">
                  Track vehicles currently undergoing major mechanical repairs, panel work, or roadworthy testing.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#c96442]/15 text-[#d97757] border border-[#c96442]/30">
                {carRepairs?.length || 0} Registered Job Cards
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {carRepairs?.map((r: any) => (
                <div
                  key={r._id}
                  className="rounded-2xl border border-[#35312b] bg-[#22201c] p-5 space-y-4 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#d97757]">
                        {r.repairNumber}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                          r.status === "COMPLETED" || r.status === "COLLECTED"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : r.status === "AWAITING_PARTS"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-[#f5f2eb] mt-2">
                      {r.car?.make} {r.car?.model} ({r.car?.year})
                    </h4>
                    <p className="text-xs text-[#8e8a82] mt-0.5">{r.workshopName}</p>

                    <div className="mt-3.5 p-3 rounded-xl bg-[#181715] border border-[#2d2a26] text-xs text-[#c9c5bd] leading-relaxed">
                      <span className="font-semibold text-[#8e8a82] block mb-1">Issue Description:</span>
                      {r.issueDescription}
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#8e8a82]">
                        <span>Estimated Cost:</span>
                        <span className="font-semibold text-white font-mono">
                          R{r.costEstimated.toLocaleString()} ZAR
                        </span>
                      </div>
                      {r.estimatedCompletionDate && (
                        <div className="flex justify-between text-[#8e8a82]">
                          <span>Estimated Ready:</span>
                          <span className="text-[#d97757] font-medium">
                            {new Date(r.estimatedCompletionDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {r.technicianContact && (
                        <div className="flex justify-between text-[#8e8a82]">
                          <span>Technician:</span>
                          <span className="text-[#eae7e1]">{r.technicianContact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-[#35312b] flex items-center justify-between gap-2">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        updateRepairStatus({
                          id: r._id,
                          status: e.target.value,
                        })
                      }
                      className="bg-[#181715] text-xs text-white border border-[#3d3932] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="SENT_FOR_REPAIR">Sent for Repair</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="AWAITING_PARTS">Awaiting Parts</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="COLLECTED">Collected &amp; Ready</option>
                    </select>

                    <Button
                      onClick={() =>
                        handleSendMessage(
                          `Draft an urgent WhatsApp follow-up inquiry to ${r.workshopName} regarding job card ${r.repairNumber} for ${r.car?.make} ${r.car?.model}`
                        )
                      }
                      size="sm"
                      className="bg-[#c96442]/20 hover:bg-[#c96442]/30 text-[#d97757] border border-[#c96442]/40 text-xs h-8"
                    >
                      Ask Claude
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WORKSPACE VIEW 3: CRM & WHATSAPP LOGS ── */}
        {activeWorkspaceView === "crm" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2d2a26] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#f5f2eb] flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-emerald-400" />
                  Whapi.Cloud WhatsApp &amp; Customer Activity Stream
                </h3>
                <p className="text-xs text-[#8e8a82] mt-0.5">
                  Audit log of outbound WhatsApp finance links, vehicle brochures, and customer follow-ups.
                </p>
              </div>

              <Button
                onClick={() => setWhatsAppModalOpen(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Quick WhatsApp Dispatch
              </Button>
            </div>

            <div className="space-y-3">
              {crmEvents?.map((evt: any) => (
                <div
                  key={evt._id}
                  className="p-4 rounded-xl border border-[#35312b] bg-[#22201c] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{evt.summary}</p>
                      <span className="text-xs text-[#8e8a82]">
                        Recipient: {evt.recipient} • Client: {evt.customerName || "Inbound Lead"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {evt.status}
                    </span>
                    <span className="text-[11px] text-[#706c64] font-mono">
                      {new Date(evt.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: WHATSAPP DISPATCH VIA WHAPI.CLOUD ── */}
      {whatsAppModalOpen && (
        <div
          onClick={() => setWhatsAppModalOpen(false)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-[#181715] rounded-2xl overflow-hidden border border-[#35312b] shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2a26]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Whapi.Cloud WhatsApp Gateway</h3>
                  <p className="text-[11px] text-[#8e8a82]">South Africa Vehicle Finance Pre-Approval</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#8e8a82] font-semibold block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={whatsAppTarget.name}
                  onChange={(e) => setWhatsAppTarget({ ...whatsAppTarget, name: e.target.value })}
                  className="w-full bg-[#11100e] border border-[#33302a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[#8e8a82] font-semibold block mb-1">
                  WhatsApp Phone (SA Format: 082... or +27...)
                </label>
                <input
                  type="text"
                  value={whatsAppTarget.to}
                  onChange={(e) => setWhatsAppTarget({ ...whatsAppTarget, to: e.target.value })}
                  className="w-full bg-[#11100e] border border-[#33302a] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[#8e8a82] font-semibold block mb-1">Message Content</label>
                <textarea
                  rows={3}
                  value={whatsAppTarget.message}
                  onChange={(e) => setWhatsAppTarget({ ...whatsAppTarget, message: e.target.value })}
                  className="w-full bg-[#11100e] border border-[#33302a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* PDF Attachment Option */}
              <div className="p-3 rounded-xl bg-[#22201c] border border-[#35312b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <FileText className="h-4 w-4 text-[#d97757]" />
                    Attach Official Application Document (PDF)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Auto-Attached
                  </span>
                </div>
                <p className="text-[11px] text-[#8e8a82]">
                  Attachment: <span className="text-zinc-300 font-mono">AutoFame_Vehicle_Finance_Application_PreApproval.pdf</span>
                </p>
              </div>

              {/* Forward to Dealership Email */}
              <div>
                <label className="text-[#8e8a82] font-semibold block mb-1">
                  Forward Intake Packet To Dealership Email
                </label>
                <input
                  type="email"
                  defaultValue="finance@autofame.co.za"
                  className="w-full bg-[#11100e] border border-[#33302a] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-[#706c64] mt-0.5 block">
                  When customer replies or submits on WhatsApp, full FICA documents and bank statements are sent directly to this address.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>NCA compliant • Integrated via Whapi.cloud gateway &amp; Gemini AI Document Parser.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2d2a26]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWhatsAppModalOpen(false)}
                className="text-xs text-[#8e8a82] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDispatchWhatsApp}
                disabled={isSendingWhatsApp}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
              >
                {isSendingWhatsApp ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Dispatch via Whapi.Cloud
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
