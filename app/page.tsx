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
} from "lucide-react";

export default function HomePage() {
  const { data: bundle, loading, error, refresh } = useDashboardData();
  const { conversations, setActiveId } = useConversations();

  if (loading || !bundle) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-400">
          <RefreshCw className="animate-spin text-slate-900 dark:text-slate-100" size={20} />
          <span className="text-xs font-medium">Connecting to Monday.com Live Feed...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/20">
        <h2 className="font-bold text-sm">Failed to load platform data</h2>
        <p className="mt-1 text-xs">{error}</p>
        <button
          onClick={() => refresh()}
          className="mt-4 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Hero Welcome Card: AI Copilot Priority */}
      <div className="rounded-xl border border-slate-200/70 bg-white p-6 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Sparkles size={13} className="text-slate-500" />
              <span>Realtime Business Intelligence</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Skylark AI Analytics Platform
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask questions in plain English using your embedded AI Copilot or review key revenue and pipeline performance matrices below.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/copilot"
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Bot size={16} />
              <span>Launch AI Copilot</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <BarChart3 size={15} />
              <span>Executive View</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Executive Key Performance Indicators
          </h2>
          <span className="text-[11px] text-slate-400">
            Live board data feed
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bundle.kpis.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* AI Insights Highlights */}
      <AiInsightsPanel />

      {/* Navigation Launchers & Recent Conversations Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Module Launchpad */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
          <h3 className="mb-3 text-xs font-bold text-slate-900 dark:text-white">
            Analytics Modules
          </h3>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Link
              href="/copilot"
              className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-slate-100/50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:border-slate-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                <Bot size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white">AI Copilot</h4>
                <p className="text-[10px] text-slate-400">Natural Language Q&amp;A</p>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-slate-100/50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:border-slate-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                <BarChart3 size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Executive Dashboard</h4>
                <p className="text-[10px] text-slate-400">Role-Based Briefings</p>
              </div>
            </Link>

            <Link
              href="/analytics"
              className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-slate-100/50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:border-slate-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                <PieChart size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Analytics Visuals</h4>
                <p className="text-[10px] text-slate-400">Funnel &amp; Sector Charts</p>
              </div>
            </Link>

            <Link
              href="/reports"
              className="flex items-center gap-3 rounded-lg border border-slate-200/60 bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-slate-100/50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:border-slate-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Reports &amp; Export</h4>
                <p className="text-[10px] text-slate-400">Executive PDF &amp; Data Exports</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Copilot Sessions */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Recent Copilot Conversations
            </h3>
            <Link href="/copilot" className="text-[11px] font-semibold text-slate-600 hover:underline dark:text-slate-400">
              View All
            </Link>
          </div>

          <div className="space-y-1.5">
            {conversations.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href="/copilot"
                onClick={() => setActiveId(c.id)}
                className="flex items-center justify-between rounded-lg border border-slate-200/50 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-100/60 dark:border-slate-800/50 dark:bg-slate-900/40 dark:text-slate-300"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{c.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
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