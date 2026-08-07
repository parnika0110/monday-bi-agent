"use client";

import {
  Sparkles,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import clsx from "clsx";

interface QuickActionsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  {
    label: "Leadership Update",
    prompt: "Prepare a leadership update summarizing pipeline, revenue, and sector performance.",
    icon: Sparkles,
    bgClass: "bg-purple-50 hover:bg-purple-100/80 text-purple-900 border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50",
  },
  {
    label: "Revenue Summary",
    prompt: "What revenue is pending collection across all work orders?",
    icon: Wallet,
    bgClass: "bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50",
  },
  {
    label: "Pipeline Analysis",
    prompt: "How is our energy sector pipeline looking?",
    icon: TrendingUp,
    bgClass: "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50",
  },
  {
    label: "Collection Report",
    prompt: "Break down outstanding receivables by collection status and billing status.",
    icon: FileSpreadsheet,
    bgClass: "bg-sky-50 hover:bg-sky-100/80 text-sky-900 border-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50",
  },
  {
    label: "Risk Analysis",
    prompt: "What deals need immediate attention or are currently stuck in the pipeline?",
    icon: AlertCircle,
    bgClass: "bg-rose-50 hover:bg-rose-100/80 text-rose-900 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50",
  },
];

export function QuickActions({ onSelectPrompt, disabled = false }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {QUICK_PROMPTS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => onSelectPrompt(item.prompt)}
            disabled={disabled}
            className={clsx(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
              item.bgClass
            )}
          >
            <Icon size={14} className="shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
