"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import { KpiCard } from "@/components/KpiCard";
import { AiInsightsPanel } from "@/components/AiInsightsPanel";
import { useConversations } from "@/hooks/useConversations";
import Link from "next/link";
import {
  Bot,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const { data: bundle, loading, error, refresh } = useDashboardData();
  const { conversations, setActiveId } = useConversations();

  if (loading || !bundle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="animate-spin text-brand-500" size={24} />
          <span className="text-sm font-medium">Connecting to Monday.com Live Feed...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/40">
        <h2 className="font-bold">Failed to load platform data</h2>
        <p className="mt-1 text-sm">{error}</p>
        <button
          onClick={() => refresh()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 p-8 text-white shadow-xl shadow-brand-500/10 dark:border-slate-800">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
              <Zap size={14} className="text-amber-300" />
              <span>Realtime Monday.com Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, Leadership Team
            </h1>
            <p className="text-sm text-brand-100 leading-relaxed">
              Your Business Intelligence agent is active. Ask questions in plain English or navigate executive matrix views below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/copilot"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-brand-700 shadow-md transition hover:bg-brand-50 active:scale-95"
            >
              <Bot size={18} />
              <span>Launch AI Copilot</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <BarChart3 size={16} />
              <span>Executive Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Core Performance Metrics
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Updated live from Deal Funnel &amp; Work Order Tracker
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bundle.kpis.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* AI Insights Panel */}
      <AiInsightsPanel />

      {/* Quick Launchers & Recent Conversations Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Navigation Launchpad */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
            Platform Modules
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/copilot"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-brand-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-brand-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">AI Copilot</h4>
                  <p className="text-[11px] text-slate-500">Conversational Q&amp;A</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-brand-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-brand-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Executive View</h4>
                  <p className="text-[11px] text-slate-500">CEO / Role Matrix</p>
                </div>
              </div>
            </Link>

            <Link
              href="/analytics"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-brand-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-brand-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                  <PieChart size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Analytics Charts</h4>
                  <p className="text-[11px] text-slate-500">Funnel &amp; Trend Visuals</p>
                </div>
              </div>
            </Link>

            <Link
              href="/reports"
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-brand-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-brand-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Reports &amp; Export</h4>
                  <p className="text-[11px] text-slate-500">PDF &amp; Excel Exports</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Copilot Sessions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Copilot Sessions
            </h3>
            <Link href="/copilot" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {conversations.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href="/copilot"
                onClick={() => setActiveId(c.id)}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 transition hover:bg-white hover:shadow-2xs dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare size={16} className="text-brand-500 shrink-0" />
                  <span className="truncate font-medium">{c.title}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(c.updatedAt).toLocaleDateString("en-IN")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}