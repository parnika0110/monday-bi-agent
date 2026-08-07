"use client";

import {
  Crown,
  Wallet,
  PieChart,
  LineChart,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface QuickActionsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  {
    label: "Leadership Update",
    prompt: "Prepare a leadership update summarizing pipeline, revenue, and sector performance.",
    icon: Crown,
  },
  {
    label: "Revenue Summary",
    prompt: "What revenue is pending collection across all work orders?",
    icon: Wallet,
  },
  {
    label: "Pipeline Analysis",
    prompt: "How is our energy sector pipeline looking?",
    icon: LineChart,
  },
  {
    label: "Collection Report",
    prompt: "Break down outstanding receivables by collection status and billing status.",
    icon: FileText,
  },
  {
    label: "Risk Analysis",
    prompt: "What deals need immediate attention or are currently stuck in the pipeline?",
    icon: AlertTriangle,
  },
];

export function QuickActions({ onSelectPrompt, disabled = false }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {QUICK_PROMPTS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => onSelectPrompt(item.prompt)}
            disabled={disabled}
            className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-[#111622] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-white"
          >
            <Icon size={14} className="text-slate-400 dark:text-slate-500" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
