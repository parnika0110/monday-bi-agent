"use client";

import { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { buildExecutiveDashboard } from "@/lib/executiveDashboards";
import { ExecutiveRole } from "@/lib/types";
import { KpiCard } from "@/components/KpiCard";
import { exportDashboardToPdf, exportDashboardToExcel } from "@/lib/export";
import {
  Crown,
  LineChart,
  Wrench,
  Landmark,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";

const ROLES: { id: ExecutiveRole; label: string; icon: typeof Crown }[] = [
  { id: "ceo", label: "CEO Briefing", icon: Crown },
  { id: "sales", label: "Sales Pipeline", icon: LineChart },
  { id: "operations", label: "Operations", icon: Wrench },
  { id: "finance", label: "Finance & Cash", icon: Landmark },
];

function formatCurrency(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function ExecutiveDashboardPage() {
  const { data: bundle, loading, error, refresh } = useDashboardData();
  const [role, setRole] = useState<ExecutiveRole>("ceo");

  if (loading || !bundle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="animate-spin text-brand-500" size={24} />
          <span className="text-sm font-medium">Computing live executive dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
        <h2 className="font-bold">Dashboard Data Unavailable</h2>
        <p className="mt-1 text-sm">{error}</p>
        <button
          onClick={() => refresh()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const executiveData = buildExecutiveDashboard(role, bundle);

  return (
    <div className="space-y-6">
      {/* Header & Role Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realtime decision matrix for leadership • Monday.com Live Feed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDashboardToPdf(bundle)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download size={14} />
            <span>PDF Report</span>
          </button>

          <button
            onClick={() => exportDashboardToExcel(bundle)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Excel Export</span>
          </button>

          <button
            onClick={() => refresh()}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {ROLES.map((tab) => {
          const Icon = tab.icon;
          const active = role === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setRole(tab.id)}
              className={clsx(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all",
                active
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                  : "bg-white/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:bg-slate-850"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {executiveData.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Insights, Risks, & Recommendations Panel */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Insights */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Role Insights
            </h3>
          </div>
          <ul className="space-y-2.5">
            {executiveData.insights.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Identified Risks
            </h3>
          </div>
          <ul className="space-y-2.5">
            {executiveData.risks.length > 0 ? (
              executiveData.risks.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))
            ) : (
              <p className="text-xs text-slate-400">No major risks identified for this role.</p>
            )}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Action Items
            </h3>
          </div>
          <ul className="space-y-2.5">
            {executiveData.recommendations.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top 10 Largest Opportunities Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Top Open Opportunities
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Highest-value deals in the Monday.com Deal Funnel
            </p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {bundle.largestOpportunities.length} Active Deals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 font-semibold">Deal Name</th>
                <th className="py-3 font-semibold">Sector</th>
                <th className="py-3 font-semibold">Value</th>
                <th className="py-3 font-semibold">Stage</th>
                <th className="py-3 font-semibold">Win Probability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {bundle.largestOpportunities.slice(0, 10).map((deal, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition">
                  <td className="py-3 font-medium text-slate-900 dark:text-white">{deal.dealName}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">{deal.sector ?? "General"}</td>
                  <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(deal.value)}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full bg-brand-500"
                          style={{ width: `${Math.min(100, deal.winProbabilityScore)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {deal.winProbabilityScore}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
