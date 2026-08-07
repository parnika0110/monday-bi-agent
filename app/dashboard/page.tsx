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
        <div className="flex items-center gap-2.5 text-slate-400">
          <RefreshCw className="animate-spin text-slate-900 dark:text-slate-100" size={20} />
          <span className="text-xs font-medium">Computing live executive matrix...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 text-xs">
        <h2 className="font-bold text-sm">Dashboard Data Unavailable</h2>
        <p className="mt-1">{error}</p>
        <button
          onClick={() => refresh()}
          className="mt-4 rounded-lg bg-red-600 px-3.5 py-1.5 font-semibold text-white hover:bg-red-700"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const executiveData = buildExecutiveDashboard(role, bundle);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Role Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realtime decision matrix for leadership • Live Monday.com Feed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDashboardToPdf(bundle)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download size={13} />
            <span>PDF</span>
          </button>

          <button
            onClick={() => exportDashboardToExcel(bundle)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => refresh()}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200/70 pb-3 dark:border-slate-800/70">
        {ROLES.map((tab) => {
          const Icon = tab.icon;
          const active = role === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setRole(tab.id)}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all",
                active
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70 dark:border-slate-800/70 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {executiveData.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Insights, Risks, & Action Items Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Insights */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
          <div className="mb-2.5 flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Role Insights
            </h3>
          </div>
          <ul className="space-y-2">
            {executiveData.insights.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
          <div className="mb-2.5 flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Role Risks
            </h3>
          </div>
          <ul className="space-y-2">
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

        {/* Recommendations */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
          <div className="mb-2.5 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-blue-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Recommended Actions
            </h3>
          </div>
          <ul className="space-y-2">
            {executiveData.recommendations.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top Opportunities Table */}
      <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Top Open Deals by Value
            </h3>
            <p className="text-[11px] text-slate-400">
              Deal Funnel live records
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {bundle.largestOpportunities.length} Active Deals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/70 text-slate-400 dark:border-slate-800/70">
                <th className="py-2.5 font-semibold">Deal Name</th>
                <th className="py-2.5 font-semibold">Sector</th>
                <th className="py-2.5 font-semibold">Value</th>
                <th className="py-2.5 font-semibold">Stage</th>
                <th className="py-2.5 font-semibold">Win Probability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {bundle.largestOpportunities.slice(0, 10).map((deal, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                  <td className="py-2.5 font-medium text-slate-900 dark:text-white">{deal.dealName}</td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400">{deal.sector ?? "General"}</td>
                  <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100 font-mono">{formatCurrency(deal.value)}</td>
                  <td className="py-2.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full bg-slate-900 dark:bg-slate-100"
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
