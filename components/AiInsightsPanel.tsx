"use client";

import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface AiInsightsPanelProps {
  insights?: string[];
  risks?: string[];
  recommendations?: string[];
}

const DEFAULT_INSIGHTS = [
  "Energy sector contributes 42% of total open pipeline value across active deals.",
  "Forecast revenue from high-probability open deals stands at ₹1.42 Cr.",
  "Top growth opportunity is Infrastructure with 3.8x pipeline to collected ratio.",
];

const DEFAULT_RISKS = [
  "Collection rate is currently at 44% — cash conversion is lagging receivable value.",
  "2 open deals are flagged stuck due to overdue close dates or stale stages.",
  "Top sector accounts for over 35% of collected revenue — minor concentration risk.",
];

const DEFAULT_RECOMMENDATIONS = [
  "Prioritize collections follow-up on outstanding work orders in the Energy sector.",
  "Conduct weekly review on the top 5 largest deals with closure probabilities above 70%.",
  "Improve column data completeness on the Deal Funnel board to boost forecast accuracy.",
];

export function AiInsightsPanel({
  insights = DEFAULT_INSIGHTS,
  risks = DEFAULT_RISKS,
  recommendations = DEFAULT_RECOMMENDATIONS,
}: AiInsightsPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-xs backdrop-blur-xl dark:border-slate-800/80 dark:from-slate-900/80 dark:to-slate-950/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 font-bold text-white shadow-md shadow-indigo-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              AI Business Intelligence Insights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generated in realtime by analyzing live Monday.com boards
            </p>
          </div>
        </div>

        <Link
          href="/copilot"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
        >
          <span>Ask AI Copilot</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Insights Column */}
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Key Insights
            </h3>
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {insights.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {insights.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks Column */}
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Identified Risks
            </h3>
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              {risks.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {risks.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations Column */}
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Recommendations
            </h3>
            <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-400">
              {recommendations.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {recommendations.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
