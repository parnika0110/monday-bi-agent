"use client";

import { useTheme } from "@/components/theme";
import { Moon, Sun, RefreshCw, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface TopNavProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TopNav({ onRefresh, isRefreshing = false }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const [lastSyncTime] = useState<string>(
    new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-2.5 backdrop-blur-md dark:border-slate-800/70 dark:bg-[#0b0f17]/90 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Monday Live Sync</span>
          <span className="sm:hidden">Live</span>
        </div>

        <div className="hidden items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 md:flex">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Deal Funnel &amp; Work Order Tracker</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200/70 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            title="Refresh data"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        )}

        <div className="hidden text-right text-[11px] text-slate-400 dark:text-slate-500 lg:block">
          Synced {lastSyncTime}
        </div>

        <button
          onClick={toggleTheme}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/70 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
        </button>

        <div className="flex items-center gap-2 border-l border-slate-200/70 pl-2.5 dark:border-slate-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            ST
          </div>
        </div>
      </div>
    </header>
  );
}
