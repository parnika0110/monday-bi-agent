"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { exportDashboardToPdf, exportDashboardToExcel } from "@/lib/export";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Crown,
  RefreshCw,
  CheckCircle2,
  Table,
} from "lucide-react";

export default function ReportsPage() {
  const { data: bundle, loading, error, refresh } = useDashboardData();

  if (loading || !bundle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="animate-spin text-brand-500" size={24} />
          <span className="text-sm font-medium">Preparing reporting engine...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/40">
        <h2 className="font-bold">Reports Unavailable</h2>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reports &amp; Export Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Generate executive-friendly PDF reports and structured Excel summaries
        </p>
      </div>

      {/* Export Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* PDF Executive Report Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Executive PDF Report</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Formal PDF summary for board members &amp; founders</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/50">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Includes:</p>
            <ul className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Core KPI Metrics (Pipeline, Revenue, Health Score, Forecast)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Sector Performance breakdown table</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Top 10 Largest Open Opportunities</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => exportDashboardToPdf(bundle)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-98"
          >
            <Download size={16} />
            <span>Download Executive PDF</span>
          </button>
        </div>

        {/* Excel Spreadsheet Summary Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Excel Summary Workbook</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Multi-tab .xlsx workbook for detailed financial analysis</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/50">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Sheets Included:</p>
            <ul className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <Table size={14} className="text-emerald-500" />
                <span>KPIs, Sector Performance, &amp; Growth Opportunities</span>
              </li>
              <li className="flex items-center gap-2">
                <Table size={14} className="text-emerald-500" />
                <span>Largest Opportunities &amp; Win Probabilities</span>
              </li>
              <li className="flex items-center gap-2">
                <Table size={14} className="text-emerald-500" />
                <span>Stuck Deals Audit &amp; Data Quality Completeness</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => exportDashboardToExcel(bundle)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-98"
          >
            <Download size={16} />
            <span>Export Excel Workbook (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
