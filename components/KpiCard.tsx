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
    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 dark:border-slate-800/70 dark:bg-[#111622] dark:hover:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{displayTitle}</span>
        {badge ? (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            {badge}
          </span>
        ) : Icon ? (
          <Icon size={15} className="text-slate-400 dark:text-slate-500" />
        ) : null}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          {displayValue}
        </div>

        {trend ? (
          <div
            className={clsx(
              "flex items-center gap-1 text-[11px] font-medium",
              trend.direction === "up" && "text-emerald-600 dark:text-emerald-400",
              trend.direction === "down" && "text-amber-600 dark:text-amber-400",
              trend.direction === "neutral" && "text-slate-500 dark:text-slate-400"
            )}
          >
            {trend.direction === "up" && <TrendingUp size={13} />}
            {trend.direction === "down" && <TrendingDown size={13} />}
            {trend.direction === "neutral" && <Minus size={13} />}
            <span>{trend.label}</span>
          </div>
        ) : delta !== undefined && delta !== null ? (
          <div
            className={clsx(
              "flex items-center gap-1 text-[11px] font-medium",
              delta > 0 && "text-emerald-600 dark:text-emerald-400",
              delta < 0 && "text-amber-600 dark:text-amber-400",
              delta === 0 && "text-slate-500 dark:text-slate-400"
            )}
          >
            {delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
            <span>{deltaLabel ?? `${delta > 0 ? "+" : ""}${delta}%`}</span>
          </div>
        ) : null}
      </div>

      {displaySubtext && (
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          {displaySubtext}
        </p>
      )}
    </div>
  );
}
