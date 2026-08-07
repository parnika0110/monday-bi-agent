export function KpiCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="skeleton mb-3 h-3 w-24" />
      <div className="skeleton h-7 w-32" />
      <div className="skeleton mt-3 h-3 w-20" />
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="glass-card p-5">
      <div className="skeleton mb-4 h-4 w-40" />
      <div className="skeleton w-full" style={{ height }} />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card p-5">
      <div className="skeleton mb-4 h-4 w-40" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function DashboardGridSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
