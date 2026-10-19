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
// Custom Markdown Components for AutoFame Terminal Tables & Code
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

export default function AdminAutoFameAgentPage() {
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

  // Live AI Engine Settings (Google Gemini / OpenAI)
  const [apiKey, setApiKey] = useState("");
  const [apiProvider, setApiProvider] = useState<"gemini" | "openai">("gemini");
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("autofame_ai_key") || "";
      const storedProvider = (localStorage.getItem("autofame_ai_provider") as any) || "gemini";
      setApiKey(storedKey);
      setApiProvider(storedProvider);
      setHasCustomKey(!!storedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      if (apiKey.trim()) {
        localStorage.setItem("autofame_ai_key", apiKey.trim());
        localStorage.setItem("autofame_ai_provider", apiProvider);
        setHasCustomKey(true);
        toast.success(`${apiProvider === "gemini" ? "Google Gemini" : "OpenAI"} API Key connected!`);
      } else {
        localStorage.removeItem("autofame_ai_key");
        setHasCustomKey(false);
        toast.info("AI Key cleared");
      }
      setAiSettingsOpen(false);
    }
  };

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

  // Create New AutoFame Session
  const handleNewSession = async () => {
    try {
      const newId = await createSession({
        title: "New Dealership Task",
        model: "autofame-copilot",
      });
      setSelectedSessionId(newId);
      setActiveWorkspaceView("chat");
      toast.success("New AutoFame session initialized");
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

      // 2. Open Stream to Backend with AI credentials
      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey.trim()) {
        if (apiProvider === "gemini") {
          reqHeaders["x-gemini-api-key"] = apiKey.trim();
        } else {
          reqHeaders["x-openai-api-key"] = apiKey.trim();
        }
      }

      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: reqHeaders,
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
        toast.success(`Dispatched via WhatsApp to ${whatsAppTarget.name}!`);
        await recordCrmEvent({
          eventType: "WHATSAPP_SENT",
          recipient: whatsAppTarget.to,
          customerName: whatsAppTarget.name,
          summary: `Vehicle finance link sent to ${whatsAppTarget.name} (${whatsAppTarget.to}) via WhatsApp`,
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
      {/* AUTOFAME COPILOT SIDEBAR (Emerald Green / AutoFame)        */}
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
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                AutoFame Copilot
              </h2>
              <span className="text-[10px] text-[#8e8a82]">AutoFame Dealership OS</span>
            </div>
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
                    <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate font-medium">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
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
                      ? "bg-[#282622] text-[#f4f2ee] border-emerald-500/40 shadow-sm"
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
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-medium truncate">{s.title}</p>
                        <span className="text-[10px] text-[#706c64]" suppressHydrationWarning>
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
      {/* MAIN WORKSPACE AREA (AutoFame Copilot & Editorial Layout)  */}
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
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                AutoFame AI Engine
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
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-[#8e8a82] hover:text-white"
                )}
              >
                <Terminal className="h-3.5 w-3.5" />
                AutoFame Terminal
              </button>
              <button
                onClick={() => setActiveWorkspaceView("repairs")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5",
                  activeWorkspaceView === "repairs"
                    ? "bg-emerald-600 text-white shadow-sm"
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
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-[#8e8a82] hover:text-white"
                )}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                WhatsApp CRM
              </button>
            </div>

            {/* AI Engine Status & Configuration Pill */}
            <button
              suppressHydrationWarning
              onClick={() => setAiSettingsOpen(true)}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border shadow-sm",
                hasCustomKey
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
              )}
              title="Configure Google Gemini or OpenAI Live API Key"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {hasCustomKey ? `${apiProvider === "gemini" ? "Gemini AI" : "OpenAI"} Active` : "Connect Gemini AI"}
              </span>
            </button>
          </div>
        </header>

        {/* ── WORKSPACE VIEW 1: AUTOFAME CHAT TERMINAL ── */}
        {activeWorkspaceView === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Conversation Stream */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8">
              <div className="max-w-6xl w-full mx-auto space-y-8">
                {/* Clean Empty / Welcome State when no conversation history */}
                {(!activeSessionData?.messages || activeSessionData.messages.length === 0) && !isStreaming && (
                  <div className="py-10 sm:py-16 text-center max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-xl shadow-emerald-950/40">
                      <Sparkles className="h-8 w-8" />
                    </div>

                    <div className="space-y-2.5">
                      <h2 className="text-xl sm:text-2xl font-bold text-[#f5f2eb] font-serif tracking-tight">
                        AutoFame Dealership Copilot
                      </h2>
                      <p className="text-xs sm:text-sm text-[#8e8a82] max-w-xl mx-auto leading-relaxed">
                        Autonomous dealership intelligence for live inventory analysis, customer finance pre-approvals via WhatsApp, AI vehicle descriptions, and workshop service tracking.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-left pt-2">
                      {DEALERSHIP_LINKS.slice(0, 6).map((link, idx) => {
                        const Icon = link.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(link.prompt)}
                            className="p-4 rounded-2xl bg-[#22201c] hover:bg-[#282520] border border-[#35312a] hover:border-emerald-500/40 transition group flex flex-col justify-between shadow-sm"
                          >
                            <div className="flex items-center justify-between w-full mb-3">
                              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition">
                                <Icon className="h-4 w-4" />
                              </div>
                              {link.badge && (
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  {link.badge}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#f5f2eb] group-hover:text-emerald-400 transition">
                                {link.label}
                              </p>
                              <p className="text-[11px] text-[#8e8a82] mt-1 line-clamp-2 leading-relaxed">
                                {link.prompt}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Conversation History */}
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
                        <div className="h-9 w-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1 shadow-sm">
                          <Sparkles className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "rounded-2xl sm:rounded-3xl text-xs sm:text-sm leading-relaxed transition-all shadow-md",
                          isAssistant
                            ? "bg-[#24221e] text-[#eae7e1] border border-[#38342d] w-full max-w-5xl p-5 sm:p-7"
                            : "bg-emerald-600 text-white font-medium max-w-2xl sm:max-w-3xl ml-auto p-4 sm:p-5 px-6 shadow-emerald-950/20"
                        )}
                      >
                        {/* Markdown Formatted Text (Headings, Bullet points, Code blocks, Tables) */}
                        {isAssistant ? (
                          <div className="prose prose-invert prose-sm max-w-none space-y-3 font-normal leading-relaxed text-[#eae7e1]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
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
                          <div className="mt-4 pt-3.5 border-t border-[#38342d] flex flex-wrap items-center gap-2">
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
                              Dispatch via WhatsApp (Whapi)
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
                          <div className="mt-4 pt-3.5 border-t border-[#38342d]">
                            <Button
                              onClick={() => setActiveWorkspaceView("repairs")}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 flex items-center gap-1.5"
                            >
                              <Wrench className="h-3.5 w-3.5" />
                              Open Workshop Repairs Dashboard
                            </Button>
                          </div>
                        )}

                        {msg.actionType === "AUTO_GENERATE_DESCRIPTION" && (
                          <div className="mt-4 pt-3.5 border-t border-[#38342d] flex items-center gap-2">
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
                        <div className="h-9 w-9 rounded-2xl bg-[#33302a] border border-[#444037] flex items-center justify-center text-[#eae7e1] shrink-0 mt-1 shadow-sm">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Streaming Real-Time Token Generation Bubble */}
                {isStreaming && (
                  <div className="flex gap-4 sm:gap-5 w-full justify-start animate-in fade-in duration-150">
                    <div className="h-9 w-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>

                    <div className="bg-[#24221e] text-[#eae7e1] border border-[#38342d] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-xs sm:text-sm leading-relaxed shadow-md w-full max-w-5xl">
                      <div className="prose prose-invert prose-sm max-w-none space-y-3 font-normal leading-relaxed text-[#eae7e1]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {streamingText + " ▍"}
                        </ReactMarkdown>
                      </div>

                      {streamingActionPayload?.actionType === "SEND_FINANCE_LINK" && (
                        <div className="mt-4 pt-3.5 border-t border-[#38342d]">
                          <span className="text-xs text-emerald-400 font-semibold animate-pulse flex items-center gap-2">
                            <PhoneCall className="h-3.5 w-3.5" />
                            Generating WhatsApp dispatch package...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* AutoFame Composer Input Box */}
            <div className="p-4 sm:p-6 bg-[#181715]/95 backdrop-blur border-t border-[#2d2a26] shrink-0">
              <div className="max-w-6xl w-full mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative rounded-2xl sm:rounded-3xl border border-[#38342d] bg-[#22201c] shadow-2xl focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-200"
                >
                  {/* File Attachment Chip Previews */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 p-3.5 border-b border-[#2e2b26] bg-[#1a1916]/80 rounded-t-2xl sm:rounded-t-3xl">
                      {attachedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="relative flex items-center gap-2.5 bg-[#282521] border border-[#3d3931] rounded-xl px-3 py-1.5 text-xs text-[#eae7e1] animate-in fade-in"
                        >
                          {f.type.startsWith("image/") ? (
                            <img src={f.previewUrl} alt={f.name} className="h-7 w-7 object-cover rounded-lg border border-white/10" />
                          ) : (
                            <FileText className="h-4 w-4 text-emerald-400" />
                          )}
                          <span className="max-w-[200px] truncate text-xs font-medium">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachedFile(i)}
                            className="text-[#8e8a82] hover:text-white p-1 rounded-full hover:bg-white/10 transition"
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
                    rows={3}
                    placeholder="Ask AutoFame Copilot about dealership inventory, financing pre-approvals, customer follow-ups, workshop repairs, or attach vehicle photos & docs..."
                    className="w-full bg-transparent p-4 sm:p-5 pb-14 text-xs sm:text-sm text-[#f5f2eb] placeholder:text-[#837e75] focus:outline-none resize-none leading-relaxed min-h-[92px]"
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
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-[#a6a197] hover:text-[#f4f2ee] hover:bg-[#2e2b26] flex items-center gap-2 rounded-xl text-xs border border-transparent hover:border-[#38342d]"
                        title="Attach vehicle photos, FICA documents or PDFs"
                      >
                        <Paperclip className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-medium">Attach Files</span>
                      </Button>

                      <span className="hidden md:inline text-xs text-[#706c64]">
                        Press <kbd className="px-1.5 py-0.5 rounded bg-[#181715] border border-[#35312b] text-[10px] font-mono text-[#a6a197]">Enter</kbd> to run • <kbd className="px-1.5 py-0.5 rounded bg-[#181715] border border-[#35312b] text-[10px] font-mono text-[#a6a197]">Shift+Enter</kbd> for new line
                      </span>
                    </div>

                    <Button
                      type="submit"
                      disabled={(!inputValue.trim() && attachedFiles.length === 0) || isStreaming || isUploadingFiles}
                      size="sm"
                      className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition disabled:opacity-30"
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
                  <Wrench className="h-5 w-5 text-emerald-400" />
                  Workshop Repair &amp; Service Control Center
                </h3>
                <p className="text-xs text-[#8e8a82] mt-0.5">
                  Track vehicles currently undergoing major mechanical repairs, panel work, or roadworthy testing.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
                      <span className="font-mono text-xs font-bold text-emerald-400">
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
                          <span className="text-emerald-400 font-medium">
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
                      className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs h-8"
                    >
                      Ask AutoFame
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
                  AutoFame WhatsApp &amp; Customer Activity Stream
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

      {/* ── MODAL: WHATSAPP DISPATCH ── */}
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
                  <h3 className="text-sm font-bold text-white">AutoFame WhatsApp Gateway</h3>
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
                    <FileText className="h-4 w-4 text-emerald-400" />
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
                <span>NCA compliant • Integrated via WhatsApp gateway &amp; Gemini AI Document Parser.</span>
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
                    Dispatch via WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* AI ENGINE CONFIGURATION MODAL (Google Gemini / OpenAI)     */}
      {/* ────────────────────────────────────────────────────────── */}
      {aiSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#1e1d1a] border border-[#38342d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2e2b26] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f5f2eb]">Connect Real AI Engine</h3>
                  <p className="text-[11px] text-[#8e8a82]">Google Gemini 1.5 Flash / OpenAI</p>
                </div>
              </div>
              <button
                onClick={() => setAiSettingsOpen(false)}
                className="text-[#8e8a82] hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#a6a197] mb-1.5 uppercase font-mono">
                  Select AI Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApiProvider("gemini")}
                    className={cn(
                      "p-3 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition",
                      apiProvider === "gemini"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                        : "bg-[#252320] text-[#a6a197] border-[#38342d] hover:text-white"
                    )}
                  >
                    <span>Google Gemini</span>
                    <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono">Free</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiProvider("openai")}
                    className={cn(
                      "p-3 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition",
                      apiProvider === "openai"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                        : "bg-[#252320] text-[#a6a197] border-[#38342d] hover:text-white"
                    )}
                  >
                    <span>OpenAI</span>
                    <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono">GPT-4o</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#a6a197] mb-1.5 uppercase font-mono">
                  {apiProvider === "gemini" ? "Google Gemini API Key" : "OpenAI API Key"}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={apiProvider === "gemini" ? "Paste AIzaSy... key" : "Paste sk-... key"}
                  className="w-full rounded-2xl bg-[#141311] border border-[#38342d] p-3 text-xs text-white placeholder:text-[#666] focus:border-emerald-500 focus:outline-none font-mono"
                />
                {apiProvider === "gemini" ? (
                  <p className="text-[11px] text-[#8e8a82] mt-2 leading-relaxed">
                    👉 Get your free Google Gemini API key in 30 seconds:{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      aistudio.google.com/app/apikey
                    </a>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#8e8a82] mt-2 leading-relaxed">
                    Get an OpenAI API key from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      platform.openai.com/api-keys
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#2e2b26]">
              <Button
                onClick={handleSaveApiKey}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 rounded-2xl shadow-md"
              >
                Save &amp; Activate Live AI
              </Button>
              {apiKey && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setApiKey("");
                    localStorage.removeItem("autofame_ai_key");
                    setHasCustomKey(false);
                    toast.info("AI Key cleared");
                  }}
                  className="text-neutral-400 hover:text-rose-400 text-xs h-9 rounded-2xl"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
