import { NextRequest, NextResponse } from "next/server";
import { fetchAllBusinessBoards, MondayApiError } from "@/lib/monday";
import { cleanDataset } from "@/lib/dataCleaner";
import {
  analyzePipeline,
  analyzeRevenue,
  analyzeSectorPerformance,
  buildLeadershipSnapshot,
  PipelineAnalysis,
  RevenueAnalysis,
  SectorPerformance,
  LeadershipSnapshot,
} from "@/lib/analytics";
import { routeQuery } from "@/lib/queryRouter";
import { generateAnalystResponse, GeminiApiError } from "@/lib/gemini";
import { ChatApiResponse, CleanedDataset, DataQualityWarning } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatCurrency(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function summarizeWarnings(warnings: DataQualityWarning[]): string {
  if (warnings.length === 0) return "No data quality issues detected.";
  return warnings.map((w) => `- ${w.message} (${w.severity} severity)`).join("\n");
}

function buildPipelineDataSummary(p: PipelineAnalysis, warnings: DataQualityWarning[]): string {
  const lines = [
    `Sector filter: ${p.sectorFilterApplied ?? "All sectors"}`,
    `Total open pipeline value: ${formatCurrency(p.totalPipelineValue)}`,
    `Number of open deals: ${p.dealCount}`,
    `Most common closure probability: ${p.avgClosureProbabilityLabel ?? "N/A"}`,
    `Stage breakdown: ${p.stageBreakdown
      .map((s) => `${s.stage} (${s.count} deals, ${formatCurrency(s.value)})`)
      .join("; ")}`,
    `Closure probability breakdown: ${p.probabilityBreakdown
      .map((s) => `${s.label} (${s.count} deals, ${formatCurrency(s.value)})`)
      .join("; ")}`,
    `Open deals without a tentative close date: ${p.openDealsWithoutCloseDate}`,
    `Risk flags: ${p.riskFlags.length ? p.riskFlags.join(" ") : "None identified"}`,
    `Data quality: ${summarizeWarnings(warnings)}`,
  ];
  return lines.join("\n");
}

function buildRevenueDataSummary(r: RevenueAnalysis, warnings: DataQualityWarning[]): string {
  const lines = [
    `Sector filter: ${r.sectorFilterApplied ?? "All sectors"}`,
    `Total amount receivable (outstanding): ${formatCurrency(r.totalReceivable)}`,
    `Total collected to date: ${formatCurrency(r.totalCollected)}`,
    `Total billed value: ${formatCurrency(r.totalBilled)}`,
    `Work orders considered: ${r.workOrderCount}`,
    `Collection status breakdown: ${r.collectionStatusBreakdown
      .map((c) => `${c.status} (${c.count} orders, ${formatCurrency(c.amount)} outstanding)`)
      .join("; ")}`,
    `Billing status breakdown: ${r.billingStatusBreakdown
      .map((b) => `${b.status} (${b.count} orders)`)
      .join("; ")}`,
    `Data quality: ${summarizeWarnings(warnings)}`,
  ];
  return lines.join("\n");
}

function buildSectorDataSummary(sectors: SectorPerformance[]): string {
  if (sectors.length === 0) return "No sector data available.";
  return sectors
    .map(
      (s) =>
        `${s.sector}: pipeline ${formatCurrency(s.pipelineValue)} across ${s.dealCount} deals; ` +
        `collected ${formatCurrency(s.collected)} / receivable ${formatCurrency(s.receivable)} across ${s.workOrderCount} work orders`
    )
    .join("\n");
}

function buildLeadershipDataSummary(snapshot: LeadershipSnapshot): string {
  return [
    "=== PIPELINE ===",
    buildPipelineDataSummary(snapshot.pipeline, []),
    "",
    "=== REVENUE ===",
    buildRevenueDataSummary(snapshot.revenue, []),
    "",
    "=== SECTOR PERFORMANCE ===",
    buildSectorDataSummary(snapshot.sectorPerformance),
    "",
    `Total open data-quality warnings across both boards: ${snapshot.dataQualityWarningCount}`,
  ].join("\n");
}

/** Deterministic fallback used if Gemini is unavailable, so the agent never hard-fails. */
function fallbackNarrative(intent: string, dataSummary: string): string {
  return (
    `Here's what the data shows (AI summarization is temporarily unavailable, so this is the raw analysis):\n\n${dataSummary}`
  );
}

export async function POST(req: NextRequest) {
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = body.message?.trim();
  if (!question) {
    return NextResponse.json({ error: "Missing 'message' in request body." }, { status: 400 });
  }

  // 1. Route the query
  const routed = routeQuery(question);

  // 2. Fetch live data from Monday.com
  let boards: { boardType: string; boardName: string; records: any[] }[];
  try {
    boards = await fetchAllBusinessBoards();
  } catch (err) {
    if (err instanceof MondayApiError) {
      return NextResponse.json(
        { error: `Monday.com error: ${err.message}` },
        { status: err.status && err.status >= 400 && err.status < 500 ? 401 : 502 }
      );
    }
    return NextResponse.json({ error: "Unexpected error fetching Monday.com data." }, { status: 500 });
  }

  const dealBoard = boards.find((b) => b.boardType === "deal_funnel");
  const workOrderBoard = boards.find((b) => b.boardType === "work_order_tracker");

  if (!dealBoard && !workOrderBoard) {
    return NextResponse.json(
      { error: "Could not find a Deal Funnel or Work Order Tracker board in this Monday.com account." },
      { status: 404 }
    );
  }

  // 3. Clean the data
  const dealDataset: CleanedDataset | null = dealBoard
    ? cleanDataset(dealBoard.boardName, "deal_funnel", dealBoard.records)
    : null;
  const workOrderDataset: CleanedDataset | null = workOrderBoard
    ? cleanDataset(workOrderBoard.boardName, "work_order_tracker", workOrderBoard.records)
    : null;

  const allWarnings = [...(dealDataset?.warnings ?? []), ...(workOrderDataset?.warnings ?? [])];

  // 4. Run the right analytics for the detected intent
  let dataSummary: string;

  switch (routed.intent) {
    case "PIPELINE": {
      if (!dealDataset) {
        dataSummary = "No deal/pipeline board is available to answer this question.";
        break;
      }
      const pipeline = analyzePipeline(dealDataset, routed.sector);
      dataSummary = buildPipelineDataSummary(pipeline, dealDataset.warnings);
      break;
    }
    case "REVENUE": {
      if (!workOrderDataset) {
        dataSummary = "No work order / billing board is available to answer this question.";
        break;
      }
      const revenue = analyzeRevenue(workOrderDataset, routed.sector);
      dataSummary = buildRevenueDataSummary(revenue, workOrderDataset.warnings);
      break;
    }
    case "SECTOR": {
      const sectors = analyzeSectorPerformance(dealDataset, workOrderDataset);
      dataSummary = buildSectorDataSummary(sectors);
      break;
    }
    case "LEADERSHIP_UPDATE": {
      const snapshot = buildLeadershipSnapshot(dealDataset, workOrderDataset);
      dataSummary = buildLeadershipDataSummary(snapshot);
      break;
    }
    default: {
      // GENERAL - give the model a light-touch snapshot of everything so it
      // can still answer open-ended founder questions sensibly.
      const snapshot = buildLeadershipSnapshot(dealDataset, workOrderDataset);
      dataSummary = buildLeadershipDataSummary(snapshot);
    }
  }

  // 5. Ask Gemini to turn the numbers into an analyst-style answer.
  let answer: string;
  try {
    answer = await generateAnalystResponse(question, dataSummary);
  } catch (err) {
    // Graceful degradation: never fail the whole request just because the
    // AI summarization layer is down - the underlying analysis is still
    // valuable to a founder.
    answer = fallbackNarrative(routed.intent, dataSummary);
    if (err instanceof GeminiApiError) {
      console.error("Gemini generation failed:", err.message);
    } else {
      console.error("Unexpected Gemini error:", err);
    }
  }

  const response: ChatApiResponse = {
    answer,
    intent: routed.intent,
    warnings: allWarnings,
  };

  return NextResponse.json(response);
}
