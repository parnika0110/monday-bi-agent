"use client";

import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";

export function EmptyState({
  title = "No data yet",
  description = "Once your Monday.com boards have matching records, this will populate automatically.",
  icon,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <div className="mb-1 text-slate-400 dark:text-slate-600">{icon ?? <Inbox size={28} />}</div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
      <p className="max-w-sm text-xs text-slate-400 dark:text-slate-500">{description}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/60 px-6 py-10 text-center dark:border-red-900/60 dark:bg-red-950/30">
      <AlertTriangle className="text-red-500" size={26} />
      <p className="max-w-sm text-sm text-red-700 dark:text-red-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/50"
        >
          <RefreshCw size={13} /> Retry
        </button>
      )}
    </div>
  );
}
