"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { AXIS_TICK_STYLE } from "./chartTheme";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/StateViews";

export function RevenueTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card>
      <CardHeader title="Revenue Trend" subtitle="Pipeline created vs. revenue collected/billed, by month" />
      {data.length === 0 ? (
        <EmptyState title="Not enough dated records yet" description="Trend needs Created Date / PO date fields populated on your boards." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3457d5" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3457d5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrency(Number(v))}
              width={64}
            />
            <Tooltip formatter={(value: any) => formatCurrency(typeof value === "number" ? value : Number(value ?? 0))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="pipelineCreated"
              name="Pipeline Created"
              stroke="#3457d5"
              fill="url(#pipelineGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="revenueCollected"
              name="Revenue Collected"
              stroke="#22c55e"
              fill="url(#collectedGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
