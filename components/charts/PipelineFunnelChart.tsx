"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FunnelStage } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import { AXIS_TICK_STYLE, CHART_COLORS, truncateLabel } from "./chartTheme";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/StateViews";

export function PipelineFunnelChart({ data }: { data: FunnelStage[] }) {
  return (
    <Card>
      <CardHeader title="Pipeline Stage Funnel" subtitle="Open deal count and value by stage" />
      {data.length === 0 ? (
        <EmptyState title="No open deals" description="Once deals move through the funnel, stages will appear here." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(280, data.length * 34)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 24, top: 4, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(Number(v))} />
            <YAxis
              type="category"
              dataKey="stage"
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              width={140}
              tickFormatter={(v) => truncateLabel(String(v), 18)}
            />
            <Tooltip
              formatter={(value: any, name: any) => {
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return name === "value" ? formatCurrency(num) : num;
              }}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="count" name="Deals" radius={[0, 6, 6, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
