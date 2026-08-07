"use client";

import { useEffect, useRef, useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { ChatMessageView } from "@/components/ChatMessageView";
import { QuickActions } from "@/components/QuickActions";
import { DataQualityWarning } from "@/lib/types";
import { exportChatToPdf } from "@/lib/export";
import { Send, Download, RefreshCw, Sparkles, Trash2, Plus, ArrowRight } from "lucide-react";

export default function CopilotPage() {
  const {
    active,
    activeId,
    appendMessage,
    hydrated,
    createConversation,
    clearCurrentConversation,
  } = useConversations();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWarnings, setLastWarnings] = useState<DataQualityWarning[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = active?.messages ?? [];
  const hasUserMessages = messages.some((m) => m.role === "user");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || !activeId) return;

    setError(null);
    setInput("");

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: trimmed,
      timestamp: Date.now(),
    };

    appendMessage(activeId, userMessage);
    setLoading(true);

    try {
      const customKey = typeof window !== "undefined" ? window.localStorage.getItem("skylark-user-gemini-key") || "" : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customKey) headers["x-user-gemini-key"] = customKey;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate response.");

      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: data.answer,
        timestamp: Date.now(),
      };

      appendMessage(activeId, assistantMessage);
      setLastWarnings(data.warnings ?? []);
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      appendMessage(activeId, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I encountered an issue querying Monday.com or generating the narrative: ${msg}`,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerateLast() {
    if (!active || loading) return;
    const lastUserIndex = [...active.messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIndex !== -1) {
      const actualIndex = active.messages.length - 1 - lastUserIndex;
      const lastUserMsg = active.messages[actualIndex];
      handleSend(lastUserMsg.content);
    }
  }

  function handleExportPdf() {
    if (!active) return;
    exportChatToPdf(active.title, active.messages);
  }

  if (!hydrated) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2.5 text-purple-600">
          <RefreshCw className="animate-spin" size={18} />
          <span className="text-xs font-medium">Starting Skylark AI Copilot...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5.5rem)] flex-col rounded-3xl border border-slate-100 bg-white shadow-soft dark:border-slate-800/80 dark:bg-[#161b26]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-3.5 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 font-bold text-white shadow-soft">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {active?.title || "Skylark AI Copilot"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => createConversation()}
            className="flex items-center gap-1.5 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-soft transition hover:bg-purple-700 active:scale-95"
            title="Start new conversation"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>

          {hasUserMessages && (
            <button
              onClick={clearCurrentConversation}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              title="Reset current conversation"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {hasUserMessages && (
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              title="Export conversation to PDF"
            >
              <Download size={13} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {!hasUserMessages ? (
            /* Centered Raycast/Claude-style Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200/60 bg-purple-50 px-3.5 py-1 text-xs font-semibold text-purple-900 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300">
                <Sparkles size={14} className="text-purple-600" />
                <span>Skylark AI Copilot</span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                What would you like to analyze today?
              </h2>
              <p className="mt-2.5 max-w-lg text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Ask about sales pipeline value, revenue pending collection, sector performance, stuck deals, or request a complete leadership briefing.
              </p>

              <div className="mt-8 w-full max-w-xl">
                <QuickActions onSelectPrompt={handleSend} disabled={loading} />
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="space-y-4">
              {messages.map((m, idx) => (
                <ChatMessageView
                  key={m.id}
                  message={m}
                  warnings={m.role === "assistant" ? lastWarnings : []}
                  onRegenerate={handleRegenerateLast}
                  isLastAssistant={idx === messages.length - 1 && m.role === "assistant"}
                />
              ))}

              {/* Minimal Loading Animation */}
              {loading && (
                <div className="flex items-start gap-3 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-soft">
                    <Sparkles size={15} className="animate-spin" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-xs font-medium text-purple-900 dark:border-slate-800 dark:bg-slate-900 dark:text-purple-300">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500 [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500 [animation-delay:0.4s]" />
                    <span className="ml-1 text-slate-600 dark:text-slate-400">Analyzing live Monday.com board data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Input Bar */}
      <div className="border-t border-slate-100 bg-white p-4 dark:border-slate-800/80 dark:bg-[#161b26]">
        <div className="mx-auto max-w-3xl">
          {hasUserMessages && (
            <div className="mb-3">
              <QuickActions onSelectPrompt={handleSend} disabled={loading} />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="relative flex items-center"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Ask about pipeline value, revenue pending collection, sector performance, or risk analysis..."
              rows={2}
              className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/70 py-3.5 pl-4 pr-14 text-sm text-slate-900 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-purple-600"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-3 rounded-xl bg-purple-600 p-2.5 text-white shadow-soft transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-30"
              title="Send prompt"
            >
              <Send size={15} />
            </button>
          </form>

          {error && <p className="mt-2 text-xs font-medium text-rose-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
