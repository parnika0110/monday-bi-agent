"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { RefreshCw } from "lucide-react";

export default function DataQualityPage() {
  const { data: bundle, loading, error, refresh } = useDashboardData();

  if (loading || !bundle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-400">
          <RefreshCw className="animate-spin text-slate-900 dark:text-slate-100" size={20} />
          <span className="text-xs font-medium">Auditing Monday.com data quality...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 text-xs">
        <h2 className="font-bold text-sm">Data Quality Audit Unavailable</h2>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  const dq = bundle.dataQuality;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Data Quality &amp; Governance Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realtime completeness audit across Monday.com column signatures
          </p>
        </div>

        <button
          onClick={() => refresh()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={13} />
          <span>Re-audit Boards</span>
        </button>
      </div>

      {/* Score Summary Banner */}
      <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 font-bold text-white text-lg dark:bg-slate-100 dark:text-slate-900">
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
            <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3.5 py-1.5 text-center dark:border-slate-800/70 dark:bg-slate-900">
              <p className="text-[10px] font-semibold text-slate-400">Audited Fields</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{dq.fields.length}</p>
            </div>

            <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3.5 py-1.5 text-center dark:border-slate-800/70 dark:bg-slate-900">
              <p className="text-[10px] font-semibold text-slate-400">Data Warnings</p>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{bundle.warnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Field Completeness Table */}
      <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
        <h3 className="mb-3 text-xs font-bold text-slate-900 dark:text-white">
          Field Completeness &amp; Recommended Fixes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/70 text-slate-400 dark:border-slate-800/70">
                <th className="py-2.5 font-semibold">Field Name</th>
                <th className="py-2.5 font-semibold">Board Name</th>
                <th className="py-2.5 font-semibold">Missing Records</th>
                <th className="py-2.5 font-semibold">Completeness</th>
                <th className="py-2.5 font-semibold">Severity</th>
                <th className="py-2.5 font-semibold">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {dq.fields.map((field, idx) => {
                const compPct = Math.round(field.completeness * 100);
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                    <td className="py-2.5 font-medium text-slate-900 dark:text-white">{field.field}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{field.boardName}</td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">
                      {field.missingCount} / {field.totalRecords}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className={compPct > 80 ? "h-full bg-slate-900 dark:bg-slate-100" : compPct > 50 ? "h-full bg-amber-500" : "h-full bg-rose-500"}
                            style={{ width: `${compPct}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{compPct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-md px-2 py-0.5 font-semibold text-[10px] ${
                          field.severity === "high"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            : field.severity === "medium"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
