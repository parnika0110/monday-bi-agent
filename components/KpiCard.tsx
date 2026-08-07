"use client";

import { KpiValue } from "@/lib/types";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import clsx from "clsx";

interface KpiCardProps {
  kpi?: KpiValue;
  title?: string;
  value?: string | number;
  subtext?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    label: string;
  };
  icon?: LucideIcon;
  badge?: string;
}

function formatKpiValue(val: number, format: KpiValue["format"]): string {
  if (format === "currency") {
    return "₹" + Math.round(val).toLocaleString("en-IN");
  }
  if (format === "percent") {
    return `${Math.round(val * 100)}%`;
  }
  if (format === "score") {
    return `${Math.round(val)}/100`;
  }
  return val.toLocaleString("en-IN");
}

export function KpiCard({ kpi, title, value, subtext, trend, icon: Icon, badge }: KpiCardProps) {
  const displayTitle = title ?? kpi?.label ?? "";
  const displayValue = value !== undefined 
    ? (typeof value === "number" ? value.toLocaleString("en-IN") : value)
    : kpi 
    ? formatKpiValue(kpi.value, kpi.format)
    : "";
  const displaySubtext = subtext ?? kpi?.helpText ?? "";

  const delta = kpi?.delta;
  const deltaLabel = kpi?.deltaLabel;

  return (
    <div className="soft-card p-6 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{displayTitle}</span>
        {badge ? (
          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-900 border border-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900/50">
            {badge}
          </span>
        ) : Icon ? (
          <Icon size={16} className="text-purple-400 dark:text-purple-300" />
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
          {displayValue}
        </div>

        {trend ? (
          <div
            className={clsx(
              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              trend.direction === "up" && "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
              trend.direction === "down" && "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
              trend.direction === "neutral" && "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            {trend.direction === "up" && <TrendingUp size={12} />}
            {trend.direction === "down" && <TrendingDown size={12} />}
            {trend.direction === "neutral" && <Minus size={12} />}
            <span>{trend.label}</span>
          </div>
        ) : delta !== undefined && delta !== null ? (
          <div
            className={clsx(
              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              delta > 0 && "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
              delta < 0 && "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
              delta === 0 && "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            {delta > 0 ? <TrendingUp size={12} /> : delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            <span>{deltaLabel ?? `${delta > 0 ? "+" : ""}${delta}%`}</span>
          </div>
        ) : null}
      </div>

      {displaySubtext && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {displaySubtext}
        </p>
      )}
    </div>
  );
}
