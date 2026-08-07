"use client";

import { useTheme } from "@/components/theme";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Key,
  Database,
  Bot,
  RefreshCw,
  CheckCircle2,
  Sliders,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure API connections, theme preferences, and data synchronization
        </p>
      </div>

      {/* Monday.com API Connection */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
            <Database size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Monday.com GraphQL API</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Dynamic Board Discovery &amp; Live Item Ingestion</p>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <span className="font-medium text-slate-700 dark:text-slate-300">API Status</span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} /> Connected &amp; Authenticated
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <span className="font-medium text-slate-700 dark:text-slate-300">Board Signature Discovery</span>
            <span className="text-slate-500">Auto-detected Column Titles</span>
          </div>
        </div>
      </div>

      {/* Gemini AI Configuration */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Bot size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Google Gemini LLM Engine</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Grounded Analyst Reasoning &amp; Natural Language Synthesis</p>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <span className="font-medium text-slate-700 dark:text-slate-300">Model Active</span>
            <span className="font-mono text-slate-900 dark:text-slate-100">gemini-2.5-flash</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <span className="font-medium text-slate-700 dark:text-slate-300">Fallback Protection</span>
            <span className="font-semibold text-emerald-600">Deterministic Analytics Backup Enabled</span>
          </div>
        </div>
      </div>

      {/* Appearance & Theme */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Theme &amp; Appearance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Toggle between Light mode and Premium Dark mode</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span>Switch to {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}
