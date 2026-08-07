"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CollectionStatusSlice } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { CHART_COLORS } from "@/lib/chartTheme";
import { Card, CardHeader } from "../Card";
import { EmptyState } from "../StateViews";

export function CollectionStatusChart({ data }: { data: CollectionStatusSlice[] }) {
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <Card>
      <CardHeader
        title="Collection Status"
        subtitle="Outstanding receivable by collection status"
      />

      {data.length === 0 || total === 0 ? (
        <EmptyState
          title="No collection data"
          description="Collection status is blank across current work orders."
        />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}