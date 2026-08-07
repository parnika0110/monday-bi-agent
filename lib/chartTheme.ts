export const CHART_COLORS = [
  "#3457d5",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export const AXIS_TICK_STYLE = { fontSize: 11, fill: "#94a3b8" };

export function truncateLabel(label: string, max = 14): string {
  return label.length > max ? label.slice(0, max - 1) + "…" : label;
}
