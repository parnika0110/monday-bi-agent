"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ProbabilityBucket } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/StateViews";

const COLORS: Record<string, string> = {
  High: "#22c55e",
  Medium: "#f59e0b",
  Low: "#ef4444",
  Unspecified: "#94a3b8",
};

export function ProbabilityDistributionChart({ data }: { data: ProbabilityBucket[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader title="Closure Probability Distribution" subtitle="Open pipeline value by confidence label" />
      {data.length === 0 || total === 0 ? (
        <EmptyState title="No probability data" description="Closure Probability is blank on the current open deals." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={COLORS[d.label] ?? "#3457d5"} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
