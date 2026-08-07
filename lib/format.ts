import { KpiValue } from "./types";

export function formatCurrency(n: number): string {
  if (Math.abs(n) >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (Math.abs(n) >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatCurrencyFull(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatKpiValue(kpi: KpiValue): string {
  switch (kpi.format) {
    case "currency":
      return formatCurrency(kpi.value);
    case "percent":
      return formatPercent(kpi.value);
    case "score":
      return `${Math.round(kpi.value)}/100`;
    case "number":
    default:
      return formatNumber(kpi.value);
  }
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}
