"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SectorSlice } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { AXIS_TICK_STYLE, truncateLabel } from "./chartTheme";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/StateViews";

export function SectorDistributionChart({ data }: { data: SectorSlice[] }) {
  const sorted = [...data].sort((a, b) => b.pipelineValue + b.collected - (a.pipelineValue + a.collected)).slice(0, 8);

  return (
    <Card>
      <CardHeader title="Sector Distribution" subtitle="Pipeline value vs. collected revenue by sector" />
      {sorted.length === 0 ? (
        <EmptyState title="No sector data" description="Sector values are missing or unrecognized across both boards." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sorted} margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="sector"
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => truncateLabel(String(v), 10)}
            />
            <YAxis
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrency(Number(v))}
              width={64}
            />
            <Tooltip formatter={(value: any) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="pipelineValue" name="Pipeline Value" fill="#3457d5" radius={[6, 6, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
