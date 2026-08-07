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
  AlertCircle,
  CheckCircle2,
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
        <div className="flex items-center gap-2.5 text-purple-600">
          <RefreshCw className="animate-spin" size={18} />
          <span className="text-xs font-medium">Computing live executive matrix...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 text-xs">
        <h2 className="font-bold text-sm">Dashboard Data Unavailable</h2>
        <p className="mt-1">{error}</p>
        <button
          onClick={() => refresh()}
          className="mt-4 rounded-full bg-rose-600 px-4 py-1.5 font-semibold text-white hover:bg-rose-700"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const executiveData = buildExecutiveDashboard(role, bundle);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header & Role Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realtime decision matrix for leadership • Live Monday.com Feed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDashboardToPdf(bundle)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download size={13} />
            <span>PDF</span>
          </button>

          <button
            onClick={() => exportDashboardToExcel(bundle)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => refresh()}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Role Switcher Pills */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((tab) => {
          const Icon = tab.icon;
          const active = role === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setRole(tab.id)}
              className={clsx(
                "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200",
                active
                  ? "bg-purple-600 text-white shadow-soft font-semibold"
                  : "bg-white text-slate-600 hover:bg-purple-50/60 border border-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Top 4 Key Metrics Row */}
      <div>
        <h2 className="mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Executive Snapshot
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {executiveData.kpis.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Insights, Risks, & Action Items Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Role Insights */}
        <div className="soft-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={15} className="text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Role Insights
            </h3>
          </div>
          <ul className="space-y-2.5">
            {executiveData.insights.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Role Risks */}
        <div className="soft-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Identified Risks
            </h3>
          </div>
          <ul className="space-y-2.5">
            {executiveData.risks.length > 0 ? (
              executiveData.risks.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))
            ) : (
              <p className="text-xs text-slate-400">No major risks identified for this role.</p>
            )}
          </ul>
        </div>

        {/* Action Items */}
        <div className="soft-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Recommended Actions
            </h3>
          </div>
          <ul className="space-y-2.5">
            {executiveData.recommendations.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top Open Deals Table */}
      <div className="soft-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Top Open Deals by Pipeline Value
            </h3>
            <p className="text-[11px] text-slate-400">
              Monday.com Deal Funnel live records
            </p>
          </div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-900 border border-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900/50">
            {bundle.largestOpportunities.length} Active Deals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                <th className="py-2.5 font-semibold">Deal Name</th>
                <th className="py-2.5 font-semibold">Sector</th>
                <th className="py-2.5 font-semibold">Value</th>
                <th className="py-2.5 font-semibold">Stage</th>
                <th className="py-2.5 font-semibold">Win Probability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {bundle.largestOpportunities.slice(0, 10).map((deal, idx) => (
                <tr key={idx} className="hover:bg-purple-50/30 dark:hover:bg-slate-900/30 transition">
                  <td className="py-2.5 font-medium text-slate-900 dark:text-white">{deal.dealName}</td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400">{deal.sector ?? "General"}</td>
                  <td className="py-2.5 font-semibold text-purple-950 dark:text-purple-200 font-mono">{formatCurrency(deal.value)}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-purple-600"
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
