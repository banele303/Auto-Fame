"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
  RefreshCw,
  Copy,
  ChevronRight,
  ShieldCheck,
  Share2,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminCopilotAgentPage() {
  // ── Realtime Convex Data & Queries ──
  const sessions = useQuery(api.agent.listSessions, {});
  const dealershipContext = useQuery(api.agent.getDealershipContext, {});
  const carRepairs = useQuery(api.agent.listCarRepairs, {});
  const crmEvents = useQuery(api.agent.listCrmEvents, { limit: 15 });

  // Mutations
  const createSession = useMutation(api.agent.createSession);
  const deleteSession = useMutation(api.agent.deleteSession);
  const updateSessionTitle = useMutation(api.agent.updateSessionTitle);
  const addMessage = useMutation(api.agent.addMessage);
  const seedInitialData = useMutation(api.seedAgent.seedInitialData);
  const recordCrmEvent = useMutation(api.agent.recordCrmEvent);
  const updateRepairStatus = useMutation(api.agent.updateCarRepairStatus);

  // Active Session State
  const [selectedSessionId, setSelectedSessionId] = useState<any>(null);
  const activeSessionData = useQuery(
    api.agent.getSession,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  // Chat Input & Streaming States
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState("");

  // Modal / Action States
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState({
    to: "+27 83 492 1109",
    name: "Thabo Mokoena",
    message: "Hi Thabo, here is your vehicle finance pre-approval application link for AutoFame: https://www.autofame.co.za/customers/financing. Please complete the quick 2-minute form so our WesBank & Standard Bank managers can process your application.",
    carName: "2018 BMW X2 sDrive20i M Sport",
  });
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "repairs" | "crm">("chat");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSessionData?.messages, isSending]);

  // Seed workshop & sample data on mount if empty
  useEffect(() => {
    seedInitialData().catch(() => {});
  }, [seedInitialData]);

  // Select first session when sessions load
  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0]._id);
    }
  }, [sessions, selectedSessionId]);

  // Create New Chat Session
  const handleNewChat = async () => {
    try {
      const newId = await createSession({
        title: "New Dealership Session",
        model: "claude-3-5-sonnet",
      });
      setSelectedSessionId(newId);
      toast.success("New Claude-style session created");
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
      toast.success("Chat session deleted");
    } catch (err: any) {
      toast.error("Failed to delete session: " + err.message);
    }
  };

  // Start Editing Title
  const handleStartEditTitle = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setEditingTitleId(session._id);
    setEditTitleInput(session.title);
  };

  // Save Title
  const handleSaveTitle = async (sessionId: any) => {
    if (!editTitleInput.trim()) return;
    try {
      await updateSessionTitle({ sessionId, title: editTitleInput.trim() });
      setEditingTitleId(null);
      toast.success("Title updated");
    } catch (err: any) {
      toast.error("Failed to update title");
    }
  };

  // Send Message & Trigger AI
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputValue;
    if (!textToSend.trim() || isSending) return;

    let targetSessionId = selectedSessionId;
    if (!targetSessionId) {
      targetSessionId = await createSession({
        title: textToSend.slice(0, 35),
      });
      setSelectedSessionId(targetSessionId);
    }

    setInputValue("");
    setIsSending(true);

    try {
      // 1. Add User Message to Convex
      await addMessage({
        sessionId: targetSessionId,
        role: "user",
        content: textToSend,
      });

      // 2. Fetch AI Completion
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...(activeSessionData?.messages || []).map((m: any) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: textToSend },
          ],
          context: dealershipContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Gateway responded with HTTP ${res.status}`);
      }

      const data = await res.json();

      // 3. Add Assistant Message to Convex
      await addMessage({
        sessionId: targetSessionId,
        role: "assistant",
        content: data.content,
        actionType: data.actionPayload?.actionType,
        actionPayload: data.actionPayload,
      });
    } catch (error: any) {
      console.error("Agent error:", error);
      toast.error("AI Copilot error: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  // WhatsApp Dispatch via Whapi.cloud
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

      const result = await res.json();

      if (res.ok) {
        toast.success(`WhatsApp message dispatched to ${whatsAppTarget.name} via Whapi.Cloud!`);
        // Log in Convex CRM activity
        await recordCrmEvent({
          eventType: "WHATSAPP_SENT",
          recipient: whatsAppTarget.to,
          customerName: whatsAppTarget.name,
          summary: `Vehicle finance application dispatched to ${whatsAppTarget.name} (${whatsAppTarget.to}) via Whapi.cloud gateway`,
          status: "SUCCESS",
        });
        setWhatsAppModalOpen(false);
      } else {
        toast.error(`WhatsApp error: ${result.error || "Failed to dispatch"}`);
      }
    } catch (err: any) {
      toast.error("Failed to connect to WhatsApp gateway: " + err.message);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 w-full min-w-0">
      {/* ── Page Header with Claude-inspired Pill Badges ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                AutoFame AI Copilot
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Claude-Engine
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Centralized executive operating system: South Africa inventory, workshop repairs, and Whapi.cloud CRM.
              </p>
            </div>
          </div>
        </div>

        {/* Action Pills & Tab Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#111] p-1 rounded-xl border border-[#222]">
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5",
                activeTab === "chat" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <Bot className="h-3.5 w-3.5" />
              Chat Studio
            </button>
            <button
              onClick={() => setActiveTab("repairs")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5",
                activeTab === "repairs" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <Wrench className="h-3.5 w-3.5" />
              Workshop Repairs
              {dealershipContext?.stats?.inRepairCount ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-mono">
                  {dealershipContext.stats.inRepairCount}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setActiveTab("crm")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5",
                activeTab === "crm" ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              CRM &amp; WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: CLAUDE-STYLE AI CHAT STUDIO ── */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
          {/* Left Session Sidebar (Claude-style Chat History) */}
          <div className="lg:col-span-4 flex flex-col bg-[#0d0d0d] rounded-2xl border border-[#222] p-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                Chat History ({sessions?.length || 0})
              </span>
              <Button
                onClick={handleNewChat}
                size="sm"
                className="h-8 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                New Chat
              </Button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 py-3 pr-1">
              {!sessions || sessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No previous sessions. Click "New Chat" to begin.
                </div>
              ) : (
                sessions.map((s) => {
                  const isSelected = selectedSessionId === s._id;
                  const isEditing = editingTitleId === s._id;

                  return (
                    <div
                      key={s._id}
                      onClick={() => setSelectedSessionId(s._id)}
                      className={cn(
                        "group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs border",
                        isSelected
                          ? "bg-[#1a1a1a] text-white border-amber-500/30 shadow-sm"
                          : "bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 border-transparent"
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
                            className="w-full bg-black border border-amber-500/40 rounded px-2 py-1 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveTitle(s._id)}
                            className="p-1 hover:text-emerald-400"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTitleId(null)}
                            className="p-1 hover:text-zinc-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-medium truncate">{s.title}</p>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(s.lastMessageAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                            <button
                              onClick={(e) => handleStartEditTitle(e, s)}
                              className="p-1 text-zinc-400 hover:text-white"
                              title="Rename chat"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSession(e, s._id)}
                              className="p-1 text-zinc-400 hover:text-red-400"
                              title="Delete chat"
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

            {/* Quick Dealership Prompts */}
            <div className="pt-3 border-t border-[#222] space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                Quick Dealership Tasks
              </span>
              <button
                onClick={() =>
                  handleSendMessage("Send a vehicle finance application link to client Thabo Mokoena via WhatsApp")
                }
                className="w-full text-left p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-[11px] text-zinc-300 transition flex items-center justify-between"
              >
                <span>💳 Send Finance Application Link</span>
                <ChevronRight className="h-3 w-3 text-zinc-500" />
              </button>
              <button
                onClick={() =>
                  handleSendMessage("Which cars are currently at the workshop for repairs and what are their costs?")
                }
                className="w-full text-left p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-[11px] text-zinc-300 transition flex items-center justify-between"
              >
                <span>🔧 Workshop Cars &amp; Cost Status</span>
                <ChevronRight className="h-3 w-3 text-zinc-500" />
              </button>
              <button
                onClick={() =>
                  handleSendMessage("Auto-generate a high-converting sales description for our 2018 BMW X2 M Sport")
                }
                className="w-full text-left p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-[11px] text-zinc-300 transition flex items-center justify-between"
              >
                <span>✨ Auto-Generate Vehicle Description</span>
                <ChevronRight className="h-3 w-3 text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Right Claude Chat Conversation Pane */}
          <div className="lg:col-span-8 flex flex-col bg-[#0d0d0d] rounded-2xl border border-[#222] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-[#111] border-b border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  {activeSessionData?.session?.title || "Dealership Executive Copilot"}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                SA Model: Claude 3.5 Sonnet / Puter Gateway
              </span>
            </div>

            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-h-[500px]">
              {activeSessionData?.messages?.map((msg: any) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex gap-3 max-w-3xl animate-in fade-in duration-200",
                      isAssistant ? "justify-start" : "justify-end ml-auto"
                    )}
                  >
                    {isAssistant && (
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "rounded-2xl p-4 text-xs sm:text-sm leading-relaxed",
                        isAssistant
                          ? "bg-[#141414] text-zinc-200 border border-[#222] shadow-sm"
                          : "bg-white text-black font-medium"
                      )}
                    >
                      <div className="whitespace-pre-wrap space-y-2">{msg.content}</div>

                      {/* Interactive Action Button (e.g. WhatsApp Dispatch) */}
                      {msg.actionType === "SEND_FINANCE_LINK" && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                          <Button
                            onClick={() => {
                              setWhatsAppTarget({
                                to: msg.actionPayload?.customerPhone || "+27 83 492 1109",
                                name: msg.actionPayload?.customerName || "Thabo Mokoena",
                                message: `Hi ${msg.actionPayload?.customerName || "Customer"}, here is your vehicle finance application link for the ${msg.actionPayload?.carName || "Vehicle"}: https://www.autofame.co.za/customers/financing. Pre-approved across WesBank & Standard Bank Auto.`,
                                carName: msg.actionPayload?.carName || "Vehicle",
                              });
                              setWhatsAppModalOpen(true);
                            }}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 h-8 text-xs"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            Dispatch via WhatsApp (Whapi.Cloud)
                          </Button>

                          <a
                            href="/customers/financing"
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 text-zinc-300 transition"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open Customer Form
                          </a>
                        </div>
                      )}

                      {msg.actionType === "CAR_REPAIR_STATUS" && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <Button
                            onClick={() => setActiveTab("repairs")}
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Wrench className="h-3.5 w-3.5 text-amber-400" />
                            Open Live Workshop Management Board
                          </Button>
                        </div>
                      )}
                    </div>

                    {!isAssistant && (
                      <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isSending && (
                <div className="flex gap-3 max-w-2xl">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="bg-[#141414] border border-[#222] rounded-2xl p-3 text-xs text-zinc-400 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    AutoFame Copilot is thinking &amp; querying CRM database...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#111] border-t border-[#222]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center"
              >
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder="Ask anything (e.g. 'Send finance link to customer via WhatsApp', 'Check cars being fixed', 'Write BMW description')..."
                  className="w-full bg-black/60 border border-[#2a2a2a] rounded-xl px-4 py-2.5 pr-12 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none transition"
                />

                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isSending}
                  size="sm"
                  className="absolute right-2.5 h-8 w-8 p-0 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-30 transition"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: WORKSHOP REPAIRS & FIXED CARS BOARD ── */}
      {activeTab === "repairs" && (
        <div className="space-y-5">
          <Card className="border-[#222] bg-[#0d0d0d]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-amber-400" />
                    Dealership Workshop &amp; Out-for-Repair Tracking
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Centralized visibility over vehicles currently undergoing service, roadworthy testing, or panel repairs.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {carRepairs?.length || 0} Registered Job Cards
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carRepairs?.map((r: any) => (
                  <div
                    key={r._id}
                    className="p-4 rounded-xl border border-[#222] bg-[#141414] space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {r.repairNumber}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            r.status === "COMPLETED" || r.status === "COLLECTED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : r.status === "AWAITING_PARTS"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}
                        >
                          {r.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white mt-1.5">
                        {r.car?.make} {r.car?.model} ({r.car?.year})
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">{r.workshopName}</p>

                      <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-[#222] text-xs text-zinc-300">
                        <span className="font-semibold text-zinc-400 block mb-0.5">Issue &amp; Work:</span>
                        {r.issueDescription}
                      </div>

                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between text-zinc-400">
                          <span>Estimated Cost:</span>
                          <span className="font-semibold text-white">
                            R{r.costEstimated.toLocaleString()} ZAR
                          </span>
                        </div>
                        {r.estimatedCompletionDate && (
                          <div className="flex justify-between text-zinc-400">
                            <span>Target Date:</span>
                            <span className="text-amber-400">
                              {new Date(r.estimatedCompletionDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {r.technicianContact && (
                          <div className="flex justify-between text-zinc-400">
                            <span>Technician:</span>
                            <span className="text-zinc-300">{r.technicianContact}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#222] flex items-center justify-between">
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateRepairStatus({
                            id: r._id,
                            status: e.target.value,
                          })
                        }
                        className="bg-black text-xs text-white border border-[#333] rounded px-2 py-1 focus:outline-none cursor-pointer"
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
                            `Give me a detailed follow-up recommendation and draft WhatsApp update for ${r.car?.make} ${r.car?.model} at ${r.workshopName}`
                          )
                        }
                        variant="ghost"
                        size="sm"
                        className="text-xs text-amber-400 hover:text-amber-300 h-7 px-2"
                      >
                        Ask AI
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 3: CRM & WHATSAPP LOGS (WHAPI.CLOUD) ── */}
      {activeTab === "crm" && (
        <div className="space-y-5">
          <Card className="border-[#222] bg-[#0d0d0d]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <PhoneCall className="h-5 w-5 text-emerald-400" />
                    Whapi.Cloud WhatsApp &amp; CRM Activity Stream
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Live logs of outbound vehicle finance links, brochure dispatches, and WhatsApp customer communications.
                  </CardDescription>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {crmEvents?.map((evt: any) => (
                  <div
                    key={evt._id}
                    className="p-3 rounded-xl border border-[#222] bg-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <PhoneCall className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{evt.summary}</p>
                        <span className="text-[11px] text-zinc-400">
                          Recipient: {evt.recipient} ({evt.customerName || "Lead"})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {evt.status}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(evt.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MODAL: WHATSAPP DISPATCH VIA WHAPI.CLOUD ── */}
      {whatsAppModalOpen && (
        <div
          onClick={() => setWhatsAppModalOpen(false)}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-[#111] rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Whapi.Cloud WhatsApp Dispatch</h3>
                  <p className="text-[11px] text-zinc-400">Direct South Africa Vehicle Finance Link</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Customer Name</label>
                <input
                  type="text"
                  value={whatsAppTarget.name}
                  onChange={(e) => setWhatsAppTarget({ ...whatsAppTarget, name: e.target.value })}
                  className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">
                  WhatsApp Phone (SA Format: 082... or +27...)
                </label>
                <input
                  type="text"
                  value={whatsAppTarget.to}
                  onChange={(e) => setWhatsAppTarget({ ...whatsAppTarget, to: e.target.value })}
                  className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold block mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={whatsAppTarget.message}
                  onChange={(e) => setWhatsAppTarget({ ...whatsAppTarget, message: e.target.value })}
                  className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Compliant with South African National Credit Act (NCA) regulations.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWhatsAppModalOpen(false)}
                className="text-xs text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDispatchWhatsApp}
                disabled={isSendingWhatsApp}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                {isSendingWhatsApp ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send via Whapi.cloud
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
