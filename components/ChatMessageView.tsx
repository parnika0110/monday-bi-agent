"use client";

import { ChatMessage, DataQualityWarning } from "@/lib/types";
import { Bot, User, AlertCircle, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import clsx from "clsx";

interface ChatMessageViewProps {
  message: ChatMessage;
  warnings?: DataQualityWarning[];
}

export function ChatMessageView({ message, warnings = [] }: ChatMessageViewProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const formattedTime = new Date(message.timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={clsx("flex w-full gap-3 py-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 font-bold text-white shadow-md shadow-brand-500/20">
          <Bot size={18} />
        </div>
      )}

      <div className={clsx("flex flex-col gap-1 max-w-[88%] sm:max-w-[80%]", isUser && "items-end")}>
        <div
          className={clsx(
            "relative rounded-2xl px-5 py-4 text-sm leading-relaxed transition-all shadow-xs",
            isUser
              ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-brand-500/10 rounded-tr-xs"
              : "border border-slate-200/80 bg-white/85 text-slate-800 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/85 dark:text-slate-100 rounded-tl-xs"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap font-medium">{message.content}</p>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  h1: ({ children }) => <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">{children}</h3>,
                  h2: ({ children }) => <h4 className="text-sm font-bold mb-2 text-slate-900 dark:text-white">{children}</h4>,
                  h3: ({ children }) => <h5 className="text-sm font-semibold mb-1 text-slate-900 dark:text-white">{children}</h5>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-4 border-brand-500 pl-3 italic text-slate-600 dark:text-slate-400">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>,
                  th: ({ children }) => <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">{children}</th>,
                  td: ({ children }) => <td className="border-t border-slate-200 px-3 py-2 dark:border-slate-800">{children}</td>,
                }}
              >
                {message.content}
              </ReactMarkdown>

              {!isUser && (
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800/80">
                  <span className="font-mono">{formattedTime}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300"
                    title="Copy message"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Quality Warnings */}
        {!isUser && warnings.length > 0 && (
          <div className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs text-amber-800 shadow-2xs dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
              <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
              <span>Data Quality Notes ({warnings.length}):</span>
            </div>
            <ul className="mt-1.5 list-disc pl-4 space-y-1">
              {warnings.slice(0, 3).map((w, idx) => (
                <li key={idx} className="text-[11px] leading-tight">
                  {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-bold dark:bg-slate-800 dark:text-slate-200">
          <User size={18} />
        </div>
      )}
    </div>
  );
}
