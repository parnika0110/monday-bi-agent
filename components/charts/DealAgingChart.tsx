"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AgingBucket } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { AXIS_TICK_STYLE } from "./chartTheme";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/StateViews";

const BUCKET_COLORS = ["#22c55e", "#84cc16", "#f59e0b", "#ef4444"];

export function DealAgingChart({ data }: { data: AgingBucket[] }) {
  const hasAny = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader title="Deal Aging" subtitle="How long open deals have sat in the pipeline" />
      {!hasAny ? (
        <EmptyState title="No aging data" description="Deals need a Created Date to compute aging." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="bucket" tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK_STYLE} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              formatter={(value: any, name: any) => {
                const num = typeof value === "number" ? value : Number(value ?? 0);
                return name === "value" ? formatCurrency(num) : num;
              }}
            />
            <Bar dataKey="count" name="Deals" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
