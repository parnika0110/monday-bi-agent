"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { PipelineFunnelChart } from "@/components/charts/PipelineFunnelChart";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { SectorDistributionChart } from "@/components/charts/SectorDistributionChart";
import { DealAgingChart } from "@/components/charts/DealAgingChart";
import { CollectionStatusChart } from "@/components/charts/CollectionStatusChart";
import { ProbabilityDistributionChart } from "@/components/charts/ProbabilityDistributionChart";
import { RefreshCw, BarChart2, PieChart, TrendingUp, Calendar, AlertCircle } from "lucide-react";

export default function AnalyticsPage() {
  const { data: bundle, loading, error, refresh } = useDashboardData();

  if (loading || !bundle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="animate-spin text-brand-500" size={24} />
          <span className="text-sm font-medium">Rendering analytics charts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/40">
        <h2 className="font-bold">Analytics Data Unavailable</h2>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics &amp; Visualizations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive analytical charts powered by Monday.com realtime feed
          </p>
        </div>

        <button
          onClick={() => refresh()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={14} />
          <span>Refresh Charts</span>
        </button>
      </div>

      {/* Grid of Recharts */}
      <div className="grid gap-6 md:grid-cols-2">
        <PipelineFunnelChart data={bundle.pipelineFunnel} />
        <RevenueTrendChart data={bundle.trend} />
        <SectorDistributionChart data={bundle.sectorDistribution} />
        <CollectionStatusChart data={bundle.collectionStatus} />
        <DealAgingChart data={bundle.dealAging} />
        <ProbabilityDistributionChart data={bundle.probabilityDistribution} />
      </div>
    </div>
  );
}
