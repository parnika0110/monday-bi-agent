"use client";

import { useState } from "react";
import { KpiValue } from "@/lib/types";
import { formatKpiValue } from "@/lib/format";
import {
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  LineChart,
  Percent,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";

const KPI_ICONS: Record<string, typeof Wallet> = {
  revenue: Wallet,
  pipeline_value: LineChart,
  collection_pct: Percent,
  open_deals: Layers,
  forecast_revenue: Sparkles,
  health_score: ShieldCheck,
};

const TONE_BADGE: Record<NonNullable<KpiValue["tone"]>, string> = {
  positive: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60",
  negative: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60",
  neutral: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function KpiCard({ kpi }: { kpi: KpiValue }) {
  const [showHelp, setShowHelp] = useState(false);
  const tone = kpi.tone ?? "neutral";
  const Icon = KPI_ICONS[kpi.id] ?? LineChart;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-xs backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-brand-300/50 hover:shadow-lg hover:shadow-brand-500/5 dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-brand-700/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-brand-950/60 dark:group-hover:text-brand-400 transition-colors">
            <Icon size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {kpi.label}
            </p>
          </div>
        </div>

        {kpi.helpText && (
          <button
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            className="text-slate-300 transition hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
            aria-label="More info"
          >
            <HelpCircle size={15} />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {formatKpiValue(kpi)}
        </p>

        <span className={clsx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", TONE_BADGE[tone])}>
          {tone === "positive" ? (
            <TrendingUp size={12} />
          ) : tone === "negative" ? (
            <TrendingDown size={12} />
          ) : null}
          {kpi.id === "health_score"
            ? `${kpi.value}/100`
            : kpi.id === "collection_pct"
            ? `${kpi.value}%`
            : "Live"}
        </span>
      </div>

      {showHelp && kpi.helpText && (
        <div className="absolute left-4 right-4 top-full z-30 mt-2 rounded-xl border border-slate-200/90 bg-white/95 p-3 text-xs text-slate-600 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-300">
          {kpi.helpText}
        </div>
      )}
    </div>
  );
}
