import { BusinessData } from "./dataSource";
import {
  analyzePipeline,
  analyzeRevenue,
  analyzeSectorPerformance,
  getLargestOpportunities,
  detectStuckDeals,
  detectPipelineLeakage,
  analyzeOwnerPerformance,
  computeConcentrationRisk,
  findSectorGrowthOpportunities,
  computeForecast,
  computeExecutiveHealthScore,
  computeDataQualitySnapshot,
  computeDealAging,
  computeMonthlyTrend,
  toFunnelStages,
  toProbabilityBuckets,
  toCollectionStatusSlices,
} from "./analytics";
import { DashboardBundle, KpiValue, SectorSlice, BoardType } from "./types";

export function buildDashboardBundle(data: BusinessData): DashboardBundle {
  const { dealDataset, workOrderDataset } = data;

  const pipeline = dealDataset
    ? analyzePipeline(dealDataset)
    : {
        totalPipelineValue: 0,
        dealCount: 0,
        stageBreakdown: [],
        avgClosureProbabilityLabel: null,
        probabilityBreakdown: [],
        riskFlags: [],
        openDealsWithoutCloseDate: 0,
      };
  const revenue = workOrderDataset
    ? analyzeRevenue(workOrderDataset)
    : {
        totalReceivable: 0,
        totalCollected: 0,
        totalBilled: 0,
        collectionStatusBreakdown: [],
        billingStatusBreakdown: [],
        workOrderCount: 0,
      };

  const sectorPerformance = analyzeSectorPerformance(dealDataset, workOrderDataset);
  const sectorDistribution: SectorSlice[] = sectorPerformance.map((s) => ({
    sector: s.sector,
    pipelineValue: s.pipelineValue,
    receivable: s.receivable,
    collected: s.collected,
    dealCount: s.dealCount,
    workOrderCount: s.workOrderCount,
  }));

  const largestOpportunities = dealDataset ? getLargestOpportunities(dealDataset, 10) : [];
  const stuckDeals = dealDataset ? detectStuckDeals(dealDataset) : [];
  const leakage = dealDataset ? detectPipelineLeakage(dealDataset) : [];
  const ownerPerformance = dealDataset ? analyzeOwnerPerformance(dealDataset) : [];
  const concentrationRisk = computeConcentrationRisk(sectorPerformance, workOrderDataset);
  const growthOpportunities = findSectorGrowthOpportunities(sectorPerformance);
  const forecast = dealDataset
    ? computeForecast(dealDataset)
    : { forecastRevenue: 0, weightedPipeline: 0, confidenceScore: 0, basis: "No pipeline data available." };
  const dataQuality = computeDataQualitySnapshot(dealDataset, workOrderDataset);
  const dealAging = dealDataset ? computeDealAging(dealDataset) : [];
  const trend = computeMonthlyTrend(dealDataset, workOrderDataset);

  const healthScore = computeExecutiveHealthScore(
    pipeline,
    revenue,
    dataQuality.overallScore,
    concentrationRisk,
    stuckDeals.length
  );

  const collectionPct = revenue.totalCollected + revenue.totalReceivable > 0
    ? revenue.totalCollected / (revenue.totalCollected + revenue.totalReceivable)
    : 0;

  const kpis: KpiValue[] = [
    {
      id: "revenue",
      label: "Revenue Collected",
      value: revenue.totalCollected,
      format: "currency",
      tone: "positive",
      helpText: "Total collected amount across all work orders.",
    },
    {
      id: "pipeline_value",
      label: "Pipeline Value",
      value: pipeline.totalPipelineValue,
      format: "currency",
      tone: "neutral",
      helpText: "Total value of open deals in the funnel.",
    },
    {
      id: "collection_pct",
      label: "Collection %",
      value: Math.round(collectionPct * 1000) / 10,
      format: "percent",
      tone: collectionPct > 0.6 ? "positive" : collectionPct > 0.35 ? "warning" : "negative",
      helpText: "Collected amount as a share of collected + receivable.",
    },
    {
      id: "open_deals",
      label: "Open Deals",
      value: pipeline.dealCount,
      format: "number",
      tone: "neutral",
      helpText: "Count of deals currently marked Open.",
    },
    {
      id: "forecast_revenue",
      label: "Forecast Revenue",
      value: forecast.forecastRevenue,
      format: "currency",
      tone: "neutral",
      helpText: `Probability-weighted open pipeline. Confidence: ${forecast.confidenceScore}/100.`,
    },
    {
      id: "health_score",
      label: "Health Score",
      value: healthScore.overallScore,
      format: "score",
      tone: healthScore.overallScore >= 70 ? "positive" : healthScore.overallScore >= 45 ? "warning" : "negative",
      helpText: "Composite of pipeline quality, collection rate, data quality, and concentration risk.",
    },
  ];

  const boardsConnected: { boardType: BoardType; boardName: string; recordCount: number }[] = [];
  if (dealDataset) {
    boardsConnected.push({
      boardType: "deal_funnel",
      boardName: dealDataset.boardName,
      recordCount: dealDataset.totalRecords,
    });
  }
  if (workOrderDataset) {
    boardsConnected.push({
      boardType: "work_order_tracker",
      boardName: workOrderDataset.boardName,
      recordCount: workOrderDataset.totalRecords,
    });
  }

  const warnings = [...(dealDataset?.warnings ?? []), ...(workOrderDataset?.warnings ?? [])];

  return {
    generatedAt: Date.now(),
    kpis,
    trend,
    sectorDistribution,
    pipelineFunnel: toFunnelStages(pipeline),
    probabilityDistribution: toProbabilityBuckets(pipeline),
    dealAging,
    collectionStatus: toCollectionStatusSlices(revenue),
    largestOpportunities,
    stuckDeals,
    leakage,
    ownerPerformance,
    concentrationRisk,
    growthOpportunities,
    forecast,
    healthScore,
    dataQuality,
    warnings,
    boardsConnected,
  };
}
