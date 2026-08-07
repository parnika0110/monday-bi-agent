"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, Info } from "lucide-react";

export default function DataQualityPage() {
  const { data: bundle, loading, error, refresh } = useDashboardData();

  if (loading || !bundle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="animate-spin text-brand-500" size={24} />
          <span className="text-sm font-medium">Auditing Monday.com data quality...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/40">
        <h2 className="font-bold">Data Quality Audit Unavailable</h2>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const dq = bundle.dataQuality;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Data Quality &amp; Governance Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realtime completeness audit across Monday.com column signatures
          </p>
        </div>

        <button
          onClick={() => refresh()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={14} />
          <span>Re-audit Boards</span>
        </button>
      </div>

      {/* Score Summary Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 font-bold text-white text-xl shadow-lg shadow-brand-500/20">
              {dq.overallScore}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Data Quality Health Score
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Overall completeness: {Math.round(dq.completeness * 100)}% across all decision-critical fields
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] uppercase font-bold text-slate-400">Audited Fields</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{dq.fields.length}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] uppercase font-bold text-slate-400">Data Warnings</p>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{bundle.warnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Field Completeness Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
          Field Completeness &amp; Recommended Fixes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 font-semibold">Field Name</th>
                <th className="py-3 font-semibold">Board Name</th>
                <th className="py-3 font-semibold">Missing Records</th>
                <th className="py-3 font-semibold">Completeness</th>
                <th className="py-3 font-semibold">Severity</th>
                <th className="py-3 font-semibold">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {dq.fields.map((field, idx) => {
                const compPct = Math.round(field.completeness * 100);
                return (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{field.field}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{field.boardName}</td>
                    <td className="py-3 text-slate-700 dark:text-slate-300">
                      {field.missingCount} / {field.totalRecords}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className={compPct > 80 ? "h-full bg-emerald-500" : compPct > 50 ? "h-full bg-amber-500" : "h-full bg-rose-500"}
                            style={{ width: `${compPct}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{compPct}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-semibold text-[10px] ${
                          field.severity === "high"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : field.severity === "medium"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {field.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs">{field.recommendedFix}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
