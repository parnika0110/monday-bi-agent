"use client";

import {
  Crown,
  Wallet,
  PieChart,
  LineChart,
  AlertTriangle,
  FileText,
  Sparkles,
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
    gradient: "from-amber-500 to-indigo-600",
  },
  {
    label: "Revenue Summary",
    prompt: "What revenue is pending collection across all work orders?",
    icon: Wallet,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    label: "Pipeline Analysis",
    prompt: "How is our energy sector pipeline looking?",
    icon: LineChart,
    gradient: "from-brand-500 to-blue-600",
  },
  {
    label: "Sector Performance",
    prompt: "Which sectors are performing best by pipeline value and collected revenue?",
    icon: PieChart,
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    label: "Collection Report",
    prompt: "Break down outstanding receivables by collection status and billing status.",
    icon: FileText,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    label: "Risk & Attention",
    prompt: "What deals need immediate attention or are currently stuck in the pipeline?",
    icon: AlertTriangle,
    gradient: "from-rose-500 to-amber-600",
  },
];

export function QuickActions({ onSelectPrompt, disabled = false }: QuickActionsProps) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Sparkles size={14} className="text-amber-500" />
        <span>Quick Executive Prompts:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onSelectPrompt(item.prompt)}
              disabled={disabled}
              className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-white hover:text-brand-600 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:bg-slate-900 dark:hover:text-brand-400"
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-tr ${item.gradient} text-white shadow-2xs`}>
                <Icon size={12} />
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
