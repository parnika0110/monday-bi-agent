"use client";

import { ChatMessage, DataQualityWarning } from "@/lib/types";
import { Sparkles, User, AlertCircle, Copy, Check, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import clsx from "clsx";

interface ChatMessageViewProps {
  message: ChatMessage;
  warnings?: DataQualityWarning[];
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
}

export function ChatMessageView({
  message,
  warnings = [],
  onRegenerate,
  isLastAssistant = false,
}: ChatMessageViewProps) {
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-soft mt-0.5">
          <Sparkles size={16} />
        </div>
      )}

      <div className={clsx("flex flex-col gap-1.5 max-w-[88%] sm:max-w-[82%]", isUser && "items-end")}>
        <div
          className={clsx(
            "relative text-sm leading-relaxed transition-all",
            isUser
              ? "rounded-2xl rounded-tr-xs bg-purple-600 text-white px-4 py-3 font-medium shadow-2xs"
              : "rounded-2xl border border-purple-100/60 bg-[#F9F8FF] p-4.5 text-slate-800 shadow-2xs dark:border-slate-800/60 dark:bg-[#161b26] dark:text-slate-200"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed font-normal">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 text-slate-800 dark:text-slate-200">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1 text-slate-800 dark:text-slate-200">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1 text-slate-800 dark:text-slate-200">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  h1: ({ children }) => <h3 className="text-base font-bold mb-2 text-purple-950 dark:text-white">{children}</h3>,
                  h2: ({ children }) => <h4 className="text-sm font-bold mb-1.5 text-purple-950 dark:text-white">{children}</h4>,
                  h3: ({ children }) => <h5 className="text-sm font-semibold mb-1 text-purple-900 dark:text-white">{children}</h5>,
                  strong: ({ children }) => <strong className="font-semibold text-purple-950 dark:text-white">{children}</strong>,
                  blockquote: ({ children }) => (
                    <blockquote className="my-2 border-l-2 border-purple-400 pl-3.5 italic text-slate-600 dark:text-slate-400">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-xl border border-purple-100 dark:border-slate-800">
                      <table className="w-full text-left text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-purple-50/70 dark:bg-slate-900">{children}</thead>,
                  th: ({ children }) => <th className="px-3.5 py-2 font-semibold text-purple-900 dark:text-slate-300 border-b border-purple-100 dark:border-slate-800">{children}</th>,
                  td: ({ children }) => <td className="border-t border-purple-50 px-3.5 py-2 dark:border-slate-800/60">{children}</td>,
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Message Actions */}
              <div className="mt-3 flex items-center gap-3 border-t border-purple-100/60 pt-2.5 text-[11px] text-slate-400 dark:border-slate-800">
                <span>{formattedTime}</span>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                  title="Copy response"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                {isLastAssistant && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                    title="Regenerate response"
                  >
                    <RotateCw size={12} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Data Quality Warning Note */}
        {!isUser && warnings.length > 0 && (
          <div className="mt-1 rounded-xl border border-amber-100 bg-amber-50/60 p-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertCircle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Data Hygiene Note:</span>
            </div>
            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px]">
              {warnings.slice(0, 3).map((w, idx) => (
                <li key={idx}>{w.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-900 font-semibold text-xs dark:bg-slate-800 dark:text-purple-300 mt-0.5">
          <User size={15} />
        </div>
      )}
    </div>
  );
}
