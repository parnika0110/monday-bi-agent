"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { RefreshCw, Sparkles } from "lucide-react";

export default function DataQualityPage() {
  const { data: bundle, loading, error, refresh } = useDashboardData();

  if (loading || !bundle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2.5 text-purple-600">
          <RefreshCw className="animate-spin" size={18} />
          <span className="text-xs font-medium">Auditing Monday.com data quality...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 text-xs">
        <h2 className="font-bold text-sm">Data Quality Audit Unavailable</h2>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  const dq = bundle.dataQuality;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Data Quality &amp; Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realtime completeness audit across Monday.com column signatures
          </p>
        </div>

        <button
          onClick={() => refresh()}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={13} />
          <span>Re-audit Boards</span>
        </button>
      </div>

      {/* Score Summary Banner */}
      <div className="soft-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 font-bold text-white text-lg shadow-soft">
              {dq.overallScore}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Data Quality Health Score
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Overall completeness: {Math.round(dq.completeness * 100)}% across decision-critical fields
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 px-4 py-2 text-center dark:border-purple-900/40 dark:bg-purple-950/40">
              <p className="text-[10px] font-semibold text-purple-900 dark:text-purple-300">Audited Fields</p>
              <p className="text-xs font-bold text-purple-950 dark:text-white">{dq.fields.length}</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-2 text-center dark:border-amber-900/40 dark:bg-amber-950/40">
              <p className="text-[10px] font-semibold text-amber-900 dark:text-amber-300">Data Warnings</p>
              <p className="text-xs font-bold text-amber-950 dark:text-white">{bundle.warnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Field Completeness Table */}
      <div className="soft-card p-6">
        <h3 className="mb-4 text-xs font-bold text-slate-900 dark:text-white">
          Field Completeness &amp; Recommended Actions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                <th className="py-2.5 font-semibold">Field Name</th>
                <th className="py-2.5 font-semibold">Board Name</th>
                <th className="py-2.5 font-semibold">Missing Records</th>
                <th className="py-2.5 font-semibold">Completeness</th>
                <th className="py-2.5 font-semibold">Severity</th>
                <th className="py-2.5 font-semibold">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {dq.fields.map((field, idx) => {
                const compPct = Math.round(field.completeness * 100);
                return (
                  <tr key={idx} className="hover:bg-purple-50/30 dark:hover:bg-slate-900/30 transition">
                    <td className="py-2.5 font-medium text-slate-900 dark:text-white">{field.field}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{field.boardName}</td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">
                      {field.missingCount} / {field.totalRecords}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={compPct > 80 ? "h-full bg-purple-600" : compPct > 50 ? "h-full bg-amber-500" : "h-full bg-rose-500"}
                            style={{ width: `${compPct}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{compPct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-semibold text-[10px] ${
                          field.severity === "high"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            : field.severity === "medium"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                        }`}
                      >
                        {field.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400 max-w-xs">{field.recommendedFix}</td>
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
