export const CHART_COLORS = [
  "#2563eb", // slate indigo
  "#0d9488", // muted teal
  "#d97706", // warm amber
  "#6366f1", // soft violet
  "#0284c7", // ocean blue
  "#059669", // emerald
  "#475569", // slate gray
  "#9333ea", // rich purple
];

export const AXIS_TICK_STYLE = { fontSize: 11, fill: "#64748b", fontFamily: "Inter, sans-serif" };

export function truncateLabel(label: string, max = 16): string {
  return label.length > max ? label.slice(0, max - 1) + "…" : label;
}
