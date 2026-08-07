"use client";

import { useTheme } from "@/components/theme";
import { Moon, Sun, RefreshCw, CheckCircle2, User, Zap } from "lucide-react";
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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Monday.com Live Sync</span>
          <span className="sm:hidden">Live</span>
        </div>

        <div className="hidden items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 md:flex">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Boards: Deal Funnel &amp; Work Order Tracker</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850"
            title="Refresh live data"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-brand-500" : "text-slate-400"} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        )}

        <div className="hidden text-right text-[11px] text-slate-400 dark:text-slate-500 lg:block">
          Synced {lastSyncTime}
        </div>

        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          aria-label="Toggle dark mode"
        >
          {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
        </button>

        <div className="flex items-center gap-2 border-l border-slate-200/80 pl-2.5 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 font-semibold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <Zap size={14} />
          </div>
          <div className="hidden text-left text-xs lg:block">
            <p className="font-semibold text-slate-900 dark:text-slate-100">Executive Team</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Skylark Drones</p>
          </div>
        </div>
      </div>
    </header>
  );
}
