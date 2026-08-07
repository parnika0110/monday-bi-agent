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
    <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-2xs dark:border-slate-800/70 dark:bg-[#111622]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              AI Business Intelligence Highlights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grounded findings from live Monday.com boards
            </p>
          </div>
        </div>

        <Link
          href="/copilot"
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <span>Ask AI Copilot</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {/* Insights Column */}
        <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              Key Highlights
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {insights.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks Column */}
        <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              Attention Required
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {risks.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations Column */}
        <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
              Strategic Actions
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {recommendations.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
