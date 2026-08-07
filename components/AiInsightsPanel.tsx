"use client";

import { Sparkles, AlertCircle, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react";
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
    <div className="soft-card p-6 shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-soft">
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
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-purple-700 active:scale-95"
        >
          <span>Ask AI Copilot</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {/* Key Highlights */}
        <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/40 p-4.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
              Key Highlights
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            {insights.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Attention Required */}
        <div className="rounded-2xl border border-amber-100/80 bg-amber-50/40 p-4.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-600 dark:text-amber-400" />
            <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200">
              Attention Required
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            {risks.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Strategic Actions */}
        <div className="rounded-2xl border border-purple-100/80 bg-purple-50/40 p-4.5 dark:border-purple-900/40 dark:bg-purple-950/20">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-purple-600 dark:text-purple-400" />
            <h3 className="text-xs font-bold text-purple-950 dark:text-purple-200">
              Strategic Actions
            </h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            {recommendations.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
