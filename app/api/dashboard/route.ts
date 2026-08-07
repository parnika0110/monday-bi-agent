import { NextResponse } from "next/server";
import { loadBusinessData } from "@/lib/dataSource";
import { buildDashboardBundle } from "@/lib/dashboardBuilder";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await loadBusinessData();
    const bundle = buildDashboardBundle(data);
    return NextResponse.json(bundle);
  } catch (err) {
    console.error("Dashboard data API error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
