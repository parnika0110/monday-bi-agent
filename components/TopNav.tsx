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
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50/80 px-3 py-1 text-xs font-medium text-purple-900 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Monday Live Feed</span>
          <span className="sm:hidden">Live</span>
        </div>

        <div className="hidden items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 md:flex">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Deal Funnel &amp; Work Orders</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
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
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
        </button>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-soft">
            SD
          </div>
        </div>
      </div>
    </header>
  );
}
