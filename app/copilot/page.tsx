"use client";

import { useEffect, useRef, useState } from "react";
import { useConversations } from "@/hooks/useConversations";
import { ChatMessageView } from "@/components/ChatMessageView";
import { QuickActions } from "@/components/QuickActions";
import { DataQualityWarning } from "@/lib/types";
import { exportChatToPdf } from "@/lib/export";
import { Send, Download, Sparkles, RefreshCw, Bot, Trash2, Plus } from "lucide-react";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, loading]);

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

  function handleExportPdf() {
    if (!active) return;
    exportChatToPdf(active.title, active.messages);
  }

  if (!hydrated) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <RefreshCw className="animate-spin text-brand-500" size={20} />
          <span>Loading Copilot session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col rounded-2xl border border-slate-200/80 bg-white/60 shadow-xs backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 font-bold text-white shadow-md shadow-brand-500/20">
            <Bot size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-slate-900 dark:text-white">
              {active?.title || "AI Copilot Session"}
            </h1>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Live queries against Monday.com Deal Funnel &amp; Work Order Tracker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => createConversation()}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 active:scale-95"
            title="Start new conversation"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>

          <button
            onClick={clearCurrentConversation}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
            title="Reset current conversation"
          >
            <Trash2 size={13} />
            <span>Clear Chat</span>
          </button>

          {active && active.messages.length > 1 && (
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              title="Export conversation to PDF"
            >
              <Download size={14} />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {active?.messages.map((m) => (
            <ChatMessageView key={m.id} message={m} warnings={m.role === "assistant" ? lastWarnings : []} />
          ))}

          {/* Thinking Skeleton Loader */}
          {loading && (
            <div className="flex items-start gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md">
                <Sparkles size={18} className="animate-spin" />
              </div>
              <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500"></span>
                  </span>
                  <span>Analyzing live board data...</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3.5 w-full rounded bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3.5 w-5/6 rounded bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200/80 bg-white/80 p-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto max-w-4xl">
          <QuickActions onSelectPrompt={handleSend} disabled={loading} />

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
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-14 text-sm text-slate-900 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 p-2.5 text-white shadow-sm transition hover:shadow-md hover:shadow-brand-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              title="Send prompt"
            >
              <Send size={16} />
            </button>
          </form>

          {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
