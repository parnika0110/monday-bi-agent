import { NextRequest, NextResponse } from "next/server";
import { loadBusinessData } from "@/lib/dataSource";
import { MondayApiError } from "@/lib/monday";
import {
  analyzePipeline,
  analyzeRevenue,
  analyzeSectorPerformance,
  buildLeadershipSnapshot,
  getLargestOpportunities,
  detectStuckDeals,
  analyzeOwnerPerformance,
  computeForecast,
  computeExecutiveHealthScore,
  computeConcentrationRisk,
  computeDataQualitySnapshot,
  PipelineAnalysis,
  RevenueAnalysis,
  SectorPerformance,
  LeadershipSnapshot,
} from "@/lib/analytics";
import { routeQuery } from "@/lib/queryRouter";
import { generateAnalystResponse, GeminiApiError } from "@/lib/gemini";
import { ChatApiResponse, CleanedDataset, DataQualityWarning } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function formatCurrency(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function summarizeWarnings(warnings: DataQualityWarning[]): string {
  if (warnings.length === 0) return "No data quality issues detected.";
  return warnings.map((w) => `- ${w.message} (${w.severity} severity)`).join("\n");
}

function buildPipelineDataSummary(
  p: PipelineAnalysis,
  warnings: DataQualityWarning[],
  topDeals: { dealName: string; value: number; sector?: string | null; stage: string }[] = []
): string {
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
    topDeals.length > 0
      ? `Top individual deals / clients by value: ${topDeals
          .map((d) => `"${d.dealName}" (${d.sector ?? "General"}, ${formatCurrency(d.value)}, stage: ${d.stage})`)
          .join("; ")}`
      : "",
    `Open deals without a tentative close date: ${p.openDealsWithoutCloseDate}`,
    `Risk flags: ${p.riskFlags.length ? p.riskFlags.join(" ") : "None identified"}`,
    `Data quality: ${summarizeWarnings(warnings)}`,
  ].filter(Boolean);
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
function fallbackNarrative(dataSummary: string): string {
  return `Here's what the data shows (AI summarization is temporarily unavailable, so this is the raw analysis):\n\n${dataSummary}`;
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

  // 2. Fetch + clean live data from Monday.com (cached briefly - see lib/dataSource.ts)
  let dealDataset: CleanedDataset | null;
  let workOrderDataset: CleanedDataset | null;
  try {
    const data = await loadBusinessData();
    dealDataset = data.dealDataset;
    workOrderDataset = data.workOrderDataset;
  } catch (err) {
    if (err instanceof MondayApiError) {
      return NextResponse.json(
        { error: `Monday.com error: ${err.message}` },
        { status: err.status && err.status >= 400 && err.status < 500 ? 401 : 502 }
      );
    }
    return NextResponse.json({ error: "Unexpected error fetching Monday.com data." }, { status: 500 });
  }

  if (!dealDataset && !workOrderDataset) {
    return NextResponse.json(
      { error: "Could not find a Deal Funnel or Work Order Tracker board in this Monday.com account." },
      { status: 404 }
    );
  }

  const allWarnings = [...(dealDataset?.warnings ?? []), ...(workOrderDataset?.warnings ?? [])];

  // 3. Run the right analytics for the detected intent.
  // Every intent the router can produce (see lib/queryRouter.ts) is handled
  // here explicitly - previously RISKS, HEALTH_SCORE, DATA_QUALITY,
  // OWNER_PERFORMANCE, LARGEST_DEALS, ATTENTION_NEEDED and FORECAST were
  // all detected by the router but fell through to the generic leadership
  // snapshot in the switch's `default` case.
  let dataSummary: string;

  switch (routed.intent) {
    case "PIPELINE": {
      if (!dealDataset) {
        dataSummary = "No deal/pipeline board is available to answer this question.";
        break;
      }
      const pipeline = analyzePipeline(dealDataset, routed.sector);
      const topDeals = getLargestOpportunities(dealDataset, 10);
      dataSummary = buildPipelineDataSummary(pipeline, dealDataset.warnings, topDeals);
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
    case "RISKS": {
      if (!dealDataset) {
        dataSummary = "No deal/pipeline board is available to assess risk.";
        break;
      }
      const pipeline = analyzePipeline(dealDataset);
      const stuck = detectStuckDeals(dealDataset);
      const sectors = analyzeSectorPerformance(dealDataset, workOrderDataset);
      const concentration = computeConcentrationRisk(sectors, workOrderDataset);
      dataSummary = [
        `Pipeline risk flags: ${pipeline.riskFlags.length ? pipeline.riskFlags.join(" ") : "None identified"}`,
        `Stuck deals: ${stuck.length} deal(s), total value ${formatCurrency(stuck.reduce((s, d) => s + d.value, 0))}. ${stuck
          .slice(0, 5)
          .map((d) => `${d.dealName} (${d.reason})`)
          .join("; ")}`,
        `Revenue concentration: top sector "${concentration.topSector ?? "N/A"}" is ${Math.round(
          concentration.topSectorShare * 100
        )}% of collected revenue${
          concentration.topClient ? `; top client "${concentration.topClient}" is ${Math.round(concentration.topClientShare * 100)}%` : ""
        }. ${concentration.isHighRisk ? "This is a concentration risk." : "Concentration is currently healthy."}`,
        `Data quality: ${summarizeWarnings(allWarnings)}`,
      ].join("\n");
      break;
    }
    case "HEALTH_SCORE": {
      if (!dealDataset && !workOrderDataset) {
        dataSummary = "No data available to compute a health score.";
        break;
      }
      const pipeline = dealDataset
        ? analyzePipeline(dealDataset)
        : { totalPipelineValue: 0, dealCount: 0, stageBreakdown: [], avgClosureProbabilityLabel: null, probabilityBreakdown: [], riskFlags: [], openDealsWithoutCloseDate: 0 };
      const revenue = workOrderDataset
        ? analyzeRevenue(workOrderDataset)
        : { totalReceivable: 0, totalCollected: 0, totalBilled: 0, collectionStatusBreakdown: [], billingStatusBreakdown: [], workOrderCount: 0 };
      const sectors = analyzeSectorPerformance(dealDataset, workOrderDataset);
      const concentration = computeConcentrationRisk(sectors, workOrderDataset);
      const dq = computeDataQualitySnapshot(dealDataset, workOrderDataset);
      const stuck = dealDataset ? detectStuckDeals(dealDataset) : [];
      const score = computeExecutiveHealthScore(pipeline, revenue, dq.overallScore, concentration, stuck.length);
      dataSummary = [
        `Overall health score: ${score.overallScore}/100`,
        ...score.breakdown.map((b) => `${b.label}: ${b.score}/100 (weight ${Math.round(b.weight * 100)}%)`),
      ].join("\n");
      break;
    }
    case "DATA_QUALITY": {
      const dq = computeDataQualitySnapshot(dealDataset, workOrderDataset);
      dataSummary = [
        `Overall data quality score: ${dq.overallScore}/100`,
        `Completeness: ${Math.round(dq.completeness * 100)}%`,
        ...dq.fields.map(
          (f) => `${f.field} (${f.boardName}): ${f.missingCount} missing of ${f.totalRecords} (${f.severity} severity). Fix: ${f.recommendedFix}`
        ),
      ].join("\n");
      break;
    }
    case "OWNER_PERFORMANCE": {
      if (!dealDataset) {
        dataSummary = "No deal/pipeline board is available to assess owner performance.";
        break;
      }
      const owners = analyzeOwnerPerformance(dealDataset);
      dataSummary = owners.length
        ? owners
            .map((o) => `${o.ownerCode}: ${o.dealCount} deals, pipeline ${formatCurrency(o.pipelineValue)}, won ${o.wonCount} deals worth ${formatCurrency(o.wonValue)}`)
            .join("\n")
        : "No owner-code data available on the deal board.";
      break;
    }
    case "LARGEST_DEALS": {
      if (!dealDataset) {
        dataSummary = "No deal/pipeline board is available.";
        break;
      }
      const largest = getLargestOpportunities(dealDataset, 10);
      dataSummary = largest.length
        ? largest
            .map((d) => `${d.dealName} (${d.sector ?? "Unspecified sector"}): ${formatCurrency(d.value)}, stage "${d.stage}", win probability ${d.winProbabilityScore}/100`)
            .join("\n")
        : "No open deals found.";
      break;
    }
    case "ATTENTION_NEEDED": {
      if (!dealDataset) {
        dataSummary = "No deal/pipeline board is available.";
        break;
      }
      const stuck = detectStuckDeals(dealDataset);
      dataSummary = stuck.length
        ? stuck
            .slice(0, 10)
            .map((d) => `${d.dealName}: ${formatCurrency(d.value)}, stage "${d.stage}" - ${d.reason}`)
            .join("\n")
        : "No deals currently flagged as needing attention.";
      break;
    }
    case "FORECAST": {
      if (!dealDataset) {
        dataSummary = "No deal/pipeline board is available to forecast revenue.";
        break;
      }
      const forecast = computeForecast(dealDataset);
      dataSummary = [
        `Forecast revenue (probability-weighted open pipeline): ${formatCurrency(forecast.forecastRevenue)}`,
        `Confidence score: ${forecast.confidenceScore}/100`,
        `Basis: ${forecast.basis}`,
      ].join("\n");
      break;
    }
    default: {
      // GENERAL - give the model a light-touch snapshot of everything so it
      // can still answer open-ended founder questions sensibly.
      const snapshot = buildLeadershipSnapshot(dealDataset, workOrderDataset);
      const topDeals = dealDataset ? getLargestOpportunities(dealDataset, 5) : [];
      dataSummary = [
        buildLeadershipDataSummary(snapshot),
        topDeals.length > 0
          ? `\n=== TOP DEALS / CLIENTS ===\n` +
            topDeals
              .map((d) => `${d.dealName} (${d.sector ?? "General"}): ${formatCurrency(d.value)}, stage "${d.stage}"`)
              .join("\n")
          : "",
      ].filter(Boolean).join("\n");
    }
  }

  // 4. Ask Gemini to turn the numbers into an analyst-style answer.
  let answer: string;
  try {
    answer = await generateAnalystResponse(question, dataSummary, routed.leadershipStyle);
  } catch (err) {
    // Graceful degradation: never fail the whole request just because the
    // AI summarization layer is down - the underlying analysis is still
    // valuable to a founder.
    answer = fallbackNarrative(dataSummary);
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
