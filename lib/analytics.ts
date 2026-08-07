import {
  CleanedDataset,
  FlatRecord,
  ScoredDeal,
  StuckDeal,
  LeakagePoint,
  OwnerPerformance,
  ConcentrationRisk,
  SectorGrowthOpportunity,
  ForecastResult,
  ExecutiveHealthScore,
  DataQualityField,
  DataQualitySnapshot,
  TrendPoint,
  AgingBucket,
  FunnelStage,
  ProbabilityBucket,
  CollectionStatusSlice,
  DataQualityWarning,
} from "./types";
import { getFieldIndex, normalizeDate, normalizeNumber } from "./dataCleaner";

function num(record: FlatRecord, key: string): number {
  const raw = record[key];
  if (raw === null || raw === undefined) return 0;
  const n = typeof raw === "number" ? raw : parseFloat(raw as unknown as string);
  return isNaN(n) ? 0 : n;
}

function str(record: FlatRecord, key: string | null | undefined): string | null {
  if (!key) return null;
  const v = record[key];
  if (v === null || v === undefined) return null;
  const s = v.toString().trim();
  return s === "" ? null : s;
}

function sectorMatches(record: FlatRecord, sector?: string): boolean {
  if (!sector) return true;
  const recordSector = (record["__sector"] || "").toString().toLowerCase();
  return recordSector === sector.toLowerCase();
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

// -----------------------------------------------------------------------
// 1. Pipeline analysis (Deal Funnel board)
// -----------------------------------------------------------------------

export interface PipelineAnalysis {
  totalPipelineValue: number;
  dealCount: number;
  stageBreakdown: { stage: string; count: number; value: number }[];
  avgClosureProbabilityLabel: string | null;
  probabilityBreakdown: { label: string; count: number; value: number }[];
  riskFlags: string[];
  openDealsWithoutCloseDate: number;
  sectorFilterApplied?: string;
}

export function analyzePipeline(dataset: CleanedDataset, sector?: string): PipelineAnalysis {
  const index = getFieldIndex("deal_funnel", dataset.records);
  const dealValueKey = "__dealValue";
  const stageKey = index.dealStage;
  const statusKey = index.dealStatus;
  const probabilityKey = index.closureProbability;
  const tentativeCloseKey = index.tentativeCloseDate ? "__tentativeCloseDate" : null;

  const relevant = dataset.records.filter((r) => sectorMatches(r, sector));
  // Prefer "open" deals for pipeline health if a status column exists.
  const openDeals = statusKey
    ? relevant.filter((r) => (r[statusKey] || "").toString().toLowerCase().includes("open"))
    : relevant;

  const totalPipelineValue = openDeals.reduce((sum, r) => sum + num(r, dealValueKey), 0);

  const stageMap = new Map<string, { count: number; value: number }>();
  for (const r of openDeals) {
    const stage = (stageKey && r[stageKey]) || "Unspecified";
    const entry = stageMap.get(stage as string) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += num(r, dealValueKey);
    stageMap.set(stage as string, entry);
  }
  const stageBreakdown = Array.from(stageMap.entries())
    .map(([stage, v]) => ({ stage, ...v }))
    .sort((a, b) => b.value - a.value);

  const probMap = new Map<string, { count: number; value: number }>();
  for (const r of openDeals) {
    const label = (probabilityKey && r[probabilityKey]) || "Unspecified";
    const entry = probMap.get(label as string) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += num(r, dealValueKey);
    probMap.set(label as string, entry);
  }
  const probabilityBreakdown = Array.from(probMap.entries()).map(([label, v]) => ({
    label,
    ...v,
  }));

  const openDealsWithoutCloseDate = tentativeCloseKey
    ? openDeals.filter((r) => !r[tentativeCloseKey]).length
    : 0;

  const riskFlags: string[] = [];
  const lowProb = probMap.get("Low");
  if (lowProb && lowProb.value > totalPipelineValue * 0.3) {
    riskFlags.push(
      `A large share of pipeline value (${Math.round(
        (lowProb.value / (totalPipelineValue || 1)) * 100
      )}%) sits in "Low" closure probability deals.`
    );
  }
  if (openDealsWithoutCloseDate > 0) {
    riskFlags.push(
      `${openDealsWithoutCloseDate} open deal(s) have no tentative close date, making forecasting harder.`
    );
  }
  if (stageBreakdown.length > 0) {
    const earlyStageShare =
      stageBreakdown
        .filter((s) => /lead|qualif/i.test(s.stage))
        .reduce((sum, s) => sum + s.value, 0) / (totalPipelineValue || 1);
    if (earlyStageShare > 0.5) {
      riskFlags.push(
        `Over half of pipeline value is still in early stages (leads/qualification), so near-term revenue conversion is uncertain.`
      );
    }
  }

  return {
    totalPipelineValue,
    dealCount: openDeals.length,
    stageBreakdown,
    avgClosureProbabilityLabel: probabilityBreakdown.sort((a, b) => b.count - a.count)[0]?.label ?? null,
    probabilityBreakdown,
    riskFlags,
    openDealsWithoutCloseDate,
    sectorFilterApplied: sector,
  };
}

// -----------------------------------------------------------------------
// 2. Revenue analysis (Work Order Tracker board)
// -----------------------------------------------------------------------

export interface RevenueAnalysis {
  totalReceivable: number;
  totalCollected: number;
  totalBilled: number;
  collectionStatusBreakdown: { status: string; count: number; amount: number }[];
  billingStatusBreakdown: { status: string; count: number }[];
  workOrderCount: number;
  sectorFilterApplied?: string;
}

export function analyzeRevenue(dataset: CleanedDataset, sector?: string): RevenueAnalysis {
  const index = getFieldIndex("work_order_tracker", dataset.records);
  const relevant = dataset.records.filter((r) => sectorMatches(r, sector));

  const totalReceivable = relevant.reduce((sum, r) => sum + num(r, "__amountReceivable"), 0);
  const totalCollected = relevant.reduce((sum, r) => sum + num(r, "__collectedAmount"), 0);
  const totalBilled = relevant.reduce((sum, r) => sum + num(r, "__billedValueInclGst"), 0);

  const collectionStatusKey = index.collectionStatus;
  const collectionMap = new Map<string, { count: number; amount: number }>();
  if (collectionStatusKey) {
    for (const r of relevant) {
      const status = (r[collectionStatusKey] || "Unspecified") as string;
      const entry = collectionMap.get(status) ?? { count: 0, amount: 0 };
      entry.count += 1;
      entry.amount += num(r, "__amountReceivable");
      collectionMap.set(status, entry);
    }
  }

  const billingStatusKey = index.billingStatus;
  const billingMap = new Map<string, number>();
  if (billingStatusKey) {
    for (const r of relevant) {
      const status = (r[billingStatusKey] || "Unspecified") as string;
      billingMap.set(status, (billingMap.get(status) ?? 0) + 1);
    }
  }

  return {
    totalReceivable,
    totalCollected,
    totalBilled,
    collectionStatusBreakdown: Array.from(collectionMap.entries())
      .map(([status, v]) => ({ status, ...v }))
      .sort((a, b) => b.amount - a.amount),
    billingStatusBreakdown: Array.from(billingMap.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    workOrderCount: relevant.length,
    sectorFilterApplied: sector,
  };
}

// -----------------------------------------------------------------------
// 3. Sector performance (combines both boards)
// -----------------------------------------------------------------------

export interface SectorPerformance {
  sector: string;
  pipelineValue: number;
  dealCount: number;
  receivable: number;
  collected: number;
  workOrderCount: number;
}

export function analyzeSectorPerformance(
  dealDataset: CleanedDataset | null,
  workOrderDataset: CleanedDataset | null
): SectorPerformance[] {
  const sectors = new Set<string>();
  dealDataset?.records.forEach((r) => r["__sector"] && sectors.add(r["__sector"] as string));
  workOrderDataset?.records.forEach((r) => r["__sector"] && sectors.add(r["__sector"] as string));

  const result: SectorPerformance[] = [];
  for (const sector of sectors) {
    const deals = dealDataset ? dealDataset.records.filter((r) => r["__sector"] === sector) : [];
    const wos = workOrderDataset
      ? workOrderDataset.records.filter((r) => r["__sector"] === sector)
      : [];

    result.push({
      sector,
      pipelineValue: deals.reduce((sum, r) => sum + num(r, "__dealValue"), 0),
      dealCount: deals.length,
      receivable: wos.reduce((sum, r) => sum + num(r, "__amountReceivable"), 0),
      collected: wos.reduce((sum, r) => sum + num(r, "__collectedAmount"), 0),
      workOrderCount: wos.length,
    });
  }

  return result.sort((a, b) => b.collected + b.pipelineValue - (a.collected + a.pipelineValue));
}

// -----------------------------------------------------------------------
// 4. Leadership update (combines everything)
// -----------------------------------------------------------------------

export interface LeadershipSnapshot {
  pipeline: PipelineAnalysis;
  revenue: RevenueAnalysis;
  sectorPerformance: SectorPerformance[];
  dataQualityWarningCount: number;
}

export function buildLeadershipSnapshot(
  dealDataset: CleanedDataset | null,
  workOrderDataset: CleanedDataset | null
): LeadershipSnapshot {
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
  const dataQualityWarningCount =
    (dealDataset?.warnings.length ?? 0) + (workOrderDataset?.warnings.length ?? 0);

  return { pipeline, revenue, sectorPerformance, dataQualityWarningCount };
}

// -----------------------------------------------------------------------
// 5. Stage ordering
//
// Skylark's Deal Stage values are conventionally prefixed "A. ", "B. " etc
// to define kanban order. We detect and use that prefix when present
// instead of hardcoding stage names, so a relabeled or reordered board
// keeps working. Stages without a letter prefix sort after lettered ones,
// in first-seen order.
// -----------------------------------------------------------------------

function stageSortKey(stage: string): string {
  const m = stage.match(/^([A-Z])\.\s/);
  return m ? m[1] : "~" + stage; // "~" sorts after A-Z ASCII-wise for unlettered stages
}

function isClosedStage(stage: string): boolean {
  return /won|lost|completed|not relevant|on hold/i.test(stage);
}

function isWonStatus(status: string | null): boolean {
  return !!status && /won/i.test(status);
}

function isDeadStatus(status: string | null): boolean {
  return !!status && /(dead|lost)/i.test(status);
}

// -----------------------------------------------------------------------
// 6. Win probability scoring
//
// Blends the deal's stage progress (later lettered stage = more advanced),
// its explicit Closure Probability label, and whether it's overdue against
// its tentative close date, into a single 0-100 score. This gives every
// open deal a comparable number even when Closure Probability is blank
// (which, in this data, is true for the majority of records).
// -----------------------------------------------------------------------

const PROBABILITY_BASE: Record<string, number> = {
  High: 75,
  Medium: 50,
  Low: 20,
};

export function scoreDeal(
  record: FlatRecord,
  index: Record<string, string | null>,
  now: Date = new Date()
): ScoredDeal {
  const stage = (str(record, index.dealStage) ?? "Unspecified") as string;
  const probLabel = str(record, index.closureProbability) ?? "Unspecified";
  const value = num(record, "__dealValue");
  const createdDate = normalizeDate(record[index.createdDate ?? ""]);
  const tentativeClose = normalizeDate(record["__tentativeCloseDate"] ?? record[index.tentativeCloseDate ?? ""]);

  // Stage-progress component: letter position A-O mapped to 0-100.
  const letterMatch = stage.match(/^([A-Z])\./);
  const stageProgress = letterMatch
    ? Math.min(100, ((letterMatch[1].charCodeAt(0) - 65) / 12) * 100)
    : 30;

  const probScore = PROBABILITY_BASE[probLabel] ?? stageProgress;

  // Overdue penalty: tentative close date in the past pulls score down.
  let overduePenalty = 0;
  if (tentativeClose) {
    const closeD = new Date(tentativeClose);
    if (closeD.getTime() < now.getTime()) {
      const overdueDays = daysBetween(now, closeD);
      overduePenalty = Math.min(30, Math.round(overdueDays / 7) * 3);
    }
  }

  const blended = Math.round(probScore * 0.55 + stageProgress * 0.45) - overduePenalty;
  const winProbabilityScore = Math.max(0, Math.min(100, blended));

  const daysOpen = createdDate ? daysBetween(now, new Date(createdDate)) : null;

  return {
    itemId: record.__itemId,
    dealName: record.__itemName,
    sector: (record["__sector"] as string | null) ?? null,
    stage,
    value,
    probabilityLabel: probLabel,
    winProbabilityScore,
    daysOpen,
    ownerCode: str(record, index.ownerCode),
  };
}

export function scoreOpenDeals(dataset: CleanedDataset): ScoredDeal[] {
  const index = getFieldIndex("deal_funnel", dataset.records);
  const statusKey = index.dealStatus;
  const now = new Date();
  const open = statusKey
    ? dataset.records.filter((r) => (r[statusKey] || "").toString().toLowerCase().includes("open"))
    : dataset.records;
  return open.map((r) => scoreDeal(r, index, now));
}

export function getLargestOpportunities(dataset: CleanedDataset, limit = 10): ScoredDeal[] {
  return scoreOpenDeals(dataset)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// -----------------------------------------------------------------------
// 7. Stuck deal detection
//
// A deal is "stuck" if it's open and either (a) its tentative close date
// has already passed, or (b) it has sat in the pipeline for a long time
// (>75 days since creation) without reaching a closed stage.
// -----------------------------------------------------------------------

export function detectStuckDeals(dataset: CleanedDataset, staleDaysThreshold = 75): StuckDeal[] {
  const index = getFieldIndex("deal_funnel", dataset.records);
  const statusKey = index.dealStatus;
  const now = new Date();
  const open = statusKey
    ? dataset.records.filter((r) => (r[statusKey] || "").toString().toLowerCase().includes("open"))
    : dataset.records;

  const stuck: StuckDeal[] = [];
  for (const r of open) {
    const stage = (str(r, index.dealStage) ?? "Unspecified") as string;
    const createdDate = normalizeDate(r[index.createdDate ?? ""]);
    const tentativeClose = normalizeDate(r["__tentativeCloseDate"]);
    const daysInPipeline = createdDate ? daysBetween(now, new Date(createdDate)) : 0;

    let reason: string | null = null;
    if (tentativeClose && new Date(tentativeClose).getTime() < now.getTime()) {
      reason = `Tentative close date (${tentativeClose}) has passed`;
    } else if (daysInPipeline > staleDaysThreshold) {
      reason = `Open for ${daysInPipeline} days with no close`;
    }

    if (reason) {
      stuck.push({
        itemId: r.__itemId,
        dealName: r.__itemName,
        stage,
        value: num(r, "__dealValue"),
        daysInPipeline,
        reason,
      });
    }
  }

  return stuck.sort((a, b) => b.value - a.value);
}

// -----------------------------------------------------------------------
// 8. Pipeline leakage
//
// For each lettered stage, "leakage" measures how much of the value that
// ever reached that stage did NOT progress to Won (i.e. sits in Dead/On
// Hold/Not Relevant, or is still open past a reasonable window). This
// surfaces where in the funnel deals are falling out.
// -----------------------------------------------------------------------

export function detectPipelineLeakage(dataset: CleanedDataset): LeakagePoint[] {
  const index = getFieldIndex("deal_funnel", dataset.records);
  const stageKey = index.dealStage;
  const statusKey = index.dealStatus;
  if (!stageKey) return [];

  const stageMap = new Map<string, { entered: FlatRecord[] }>();
  for (const r of dataset.records) {
    const stage = (r[stageKey] || "Unspecified") as string;
    const entry = stageMap.get(stage) ?? { entered: [] };
    entry.entered.push(r);
    stageMap.set(stage, entry);
  }

  const points: LeakagePoint[] = [];
  for (const [stage, { entered }] of stageMap.entries()) {
    if (isClosedStage(stage)) continue; // only meaningful for active funnel stages
    const status = statusKey;
    const stillOpen = status
      ? entered.filter((r) => (r[status] || "").toString().toLowerCase().includes("open")).length
      : entered.length;
    const dead = status ? entered.filter((r) => isDeadStatus(str(r, status))).length : 0;
    const leakageRate = entered.length > 0 ? dead / entered.length : 0;

    points.push({
      stage,
      enteredCount: entered.length,
      stillOpenCount: stillOpen,
      leakageRate,
    });
  }

  return points.sort((a, b) => stageSortKey(a.stage).localeCompare(stageSortKey(b.stage)));
}

// -----------------------------------------------------------------------
// 9. Owner / rep performance
// -----------------------------------------------------------------------

export function analyzeOwnerPerformance(dataset: CleanedDataset): OwnerPerformance[] {
  const index = getFieldIndex("deal_funnel", dataset.records);
  const ownerKey = index.ownerCode;
  const statusKey = index.dealStatus;
  if (!ownerKey) return [];

  const map = new Map<string, OwnerPerformance>();
  for (const r of dataset.records) {
    const owner = str(r, ownerKey);
    if (!owner) continue;
    const entry =
      map.get(owner) ?? { ownerCode: owner, dealCount: 0, pipelineValue: 0, wonCount: 0, wonValue: 0 };
    const value = num(r, "__dealValue");
    entry.dealCount += 1;
    entry.pipelineValue += value;
    const status = statusKey ? str(r, statusKey) : null;
    if (isWonStatus(status)) {
      entry.wonCount += 1;
      entry.wonValue += value;
    }
    map.set(owner, entry);
  }

  return Array.from(map.values()).sort((a, b) => b.wonValue - a.wonValue);
}

// -----------------------------------------------------------------------
// 10. Revenue concentration risk
// -----------------------------------------------------------------------

export function computeConcentrationRisk(
  sectorPerformance: SectorPerformance[],
  workOrderDataset: CleanedDataset | null
): ConcentrationRisk {
  const totalRevenue = sectorPerformance.reduce((s, x) => s + x.collected, 0);
  const topSectorEntry = [...sectorPerformance].sort((a, b) => b.collected - a.collected)[0];
  const topSectorShare = totalRevenue > 0 && topSectorEntry ? topSectorEntry.collected / totalRevenue : 0;

  let topClient: string | null = null;
  let topClientShare = 0;
  if (workOrderDataset) {
    const index = getFieldIndex("work_order_tracker", workOrderDataset.records);
    const clientKey = index.dealName; // client identity proxied by masked deal/client name in this board
    if (clientKey) {
      const map = new Map<string, number>();
      let total = 0;
      for (const r of workOrderDataset.records) {
        const client = str(r, clientKey) ?? "Unspecified";
        const collected = num(r, "__collectedAmount");
        map.set(client, (map.get(client) ?? 0) + collected);
        total += collected;
      }
      const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0 && total > 0) {
        topClient = sorted[0][0];
        topClientShare = sorted[0][1] / total;
      }
    }
  }

  return {
    topSectorShare,
    topSector: topSectorEntry?.sector ?? null,
    topClientShare,
    topClient,
    isHighRisk: topSectorShare > 0.5 || topClientShare > 0.3,
  };
}

// -----------------------------------------------------------------------
// 11. Sector growth opportunities
// -----------------------------------------------------------------------

export function findSectorGrowthOpportunities(
  sectorPerformance: SectorPerformance[]
): SectorGrowthOpportunity[] {
  return sectorPerformance
    .filter((s) => s.pipelineValue > 0)
    .map((s) => ({
      sector: s.sector,
      pipelineValue: s.pipelineValue,
      currentRevenue: s.collected,
      growthRatio: s.pipelineValue / (s.collected || 1),
    }))
    .sort((a, b) => b.growthRatio - a.growthRatio);
}

// -----------------------------------------------------------------------
// 12. Forecast + confidence
//
// Forecast = probability-weighted sum of open pipeline value (using the
// same base weights as win-probability scoring). Confidence reflects how
// much of that pipeline has usable probability/close-date data - a
// forecast built on mostly-blank fields deserves a low confidence flag.
// -----------------------------------------------------------------------

export function computeForecast(dataset: CleanedDataset): ForecastResult {
  const scored = scoreOpenDeals(dataset);
  const weightedPipeline = scored.reduce((sum, d) => sum + d.value * (d.winProbabilityScore / 100), 0);

  const withProbability = scored.filter((d) => d.probabilityLabel !== "Unspecified").length;
  const dataCoverage = scored.length > 0 ? withProbability / scored.length : 0;
  const confidenceScore = Math.round(Math.min(100, dataCoverage * 70 + 30));

  return {
    forecastRevenue: Math.round(weightedPipeline),
    weightedPipeline: Math.round(weightedPipeline),
    confidenceScore,
    basis: `Weighted by stage progress and closure probability across ${scored.length} open deal(s); ${withProbability} have an explicit probability label.`,
  };
}

// -----------------------------------------------------------------------
// 13. Executive health score (composite 0-100)
// -----------------------------------------------------------------------

export function computeExecutiveHealthScore(
  pipeline: PipelineAnalysis,
  revenue: RevenueAnalysis,
  dataQualityScore: number,
  concentrationRisk: ConcentrationRisk,
  stuckDealCount: number
): ExecutiveHealthScore {
  // Pipeline score: penalize heavy "Low" probability concentration and missing close dates.
  const lowProbEntry = pipeline.probabilityBreakdown.find((p) => p.label === "Low");
  const lowShare = lowProbEntry ? lowProbEntry.value / (pipeline.totalPipelineValue || 1) : 0;
  const missingCloseShare = pipeline.dealCount > 0 ? pipeline.openDealsWithoutCloseDate / pipeline.dealCount : 0;
  const pipelineScore = Math.round(Math.max(0, 100 - lowShare * 60 - missingCloseShare * 40 - stuckDealCount * 2));

  // Revenue score: collection efficiency (collected vs receivable+collected).
  const collectionBase = revenue.totalCollected + revenue.totalReceivable;
  const collectionRate = collectionBase > 0 ? revenue.totalCollected / collectionBase : 0.5;
  const revenueScore = Math.round(collectionRate * 100);

  // Risk score: concentration risk penalty.
  const riskScore = Math.round(
    Math.max(0, 100 - concentrationRisk.topSectorShare * 60 - concentrationRisk.topClientShare * 60)
  );

  const breakdown = [
    { label: "Pipeline Quality", score: pipelineScore, weight: 0.3 },
    { label: "Revenue Collection", score: revenueScore, weight: 0.3 },
    { label: "Data Quality", score: dataQualityScore, weight: 0.2 },
    { label: "Concentration Risk", score: riskScore, weight: 0.2 },
  ];
  const overallScore = Math.round(breakdown.reduce((sum, b) => sum + b.score * b.weight, 0));

  return {
    overallScore,
    pipelineScore,
    revenueScore,
    dataQualityScore,
    riskScore,
    breakdown,
  };
}

// -----------------------------------------------------------------------
// 14. Data quality scoring (feeds the Data Quality Center)
// -----------------------------------------------------------------------

function warningsToFields(
  warnings: DataQualityWarning[],
  boardName: string,
  totalRecords: number
): DataQualityField[] {
  return warnings
    .filter((w) => w.field !== "__itemId") // dedupe noise, not a "field" issue
    .map((w) => {
      const completeness = totalRecords > 0 ? Math.max(0, 1 - w.count / totalRecords) : 1;
      return {
        field: w.field,
        boardName,
        totalRecords,
        missingCount: w.count,
        completeness,
        severity: w.severity,
        recommendedFix: recommendFix(w.field),
      };
    });
}

function recommendFix(field: string): string {
  const fixes: Record<string, string> = {
    dealValue: "Require Deal Value at deal-creation time in Monday.com; make it a mandatory column.",
    closeDate: "Prompt reps to set Close Date (A) when a deal moves to Won/Lost.",
    closureProbability: "Add Closure Probability as a required field once a deal reaches Sales Qualified Lead.",
    sector: "Standardize Sector as a dropdown column instead of free text to eliminate typos and blanks.",
    amountReceivable: "Backfill Amount Receivable from Billed Value minus Collected Amount via automation.",
    billingStatus: "Set a default Billing Status of 'Not Billed' instead of leaving it blank.",
  };
  return fixes[field] ?? `Review and backfill missing "${field}" values; consider making the column required.`;
}

export function computeDataQualitySnapshot(
  dealDataset: CleanedDataset | null,
  workOrderDataset: CleanedDataset | null
): DataQualitySnapshot {
  const fields: DataQualityField[] = [
    ...(dealDataset ? warningsToFields(dealDataset.warnings, dealDataset.boardName, dealDataset.totalRecords) : []),
    ...(workOrderDataset
      ? warningsToFields(workOrderDataset.warnings, workOrderDataset.boardName, workOrderDataset.totalRecords)
      : []),
  ];

  const totalRecords = (dealDataset?.totalRecords ?? 0) + (workOrderDataset?.totalRecords ?? 0);
  const totalMissing = fields.reduce((sum, f) => sum + f.missingCount, 0);
  const completeness = totalRecords > 0 ? Math.max(0, 1 - totalMissing / (totalRecords * Math.max(1, fields.length || 1))) : 1;

  const severityPenalty = fields.reduce((sum, f) => {
    const weight = f.severity === "high" ? 15 : f.severity === "medium" ? 8 : 3;
    return sum + weight;
  }, 0);
  const overallScore = Math.max(0, Math.min(100, Math.round(100 - severityPenalty)));

  return {
    timestamp: Date.now(),
    overallScore,
    completeness,
    fields: fields.sort((a, b) => b.missingCount - a.missingCount),
  };
}

// -----------------------------------------------------------------------
// 15. Deal aging (chart data)
// -----------------------------------------------------------------------

export function computeDealAging(dataset: CleanedDataset): AgingBucket[] {
  const index = getFieldIndex("deal_funnel", dataset.records);
  const statusKey = index.dealStatus;
  const now = new Date();
  const open = statusKey
    ? dataset.records.filter((r) => (r[statusKey] || "").toString().toLowerCase().includes("open"))
    : dataset.records;

  const buckets: AgingBucket[] = [
    { bucket: "0-30 days", count: 0, value: 0 },
    { bucket: "31-60 days", count: 0, value: 0 },
    { bucket: "61-90 days", count: 0, value: 0 },
    { bucket: "90+ days", count: 0, value: 0 },
  ];

  for (const r of open) {
    const createdDate = normalizeDate(r[index.createdDate ?? ""]);
    if (!createdDate) continue;
    const days = daysBetween(now, new Date(createdDate));
    const value = num(r, "__dealValue");
    const bucketIdx = days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : 3;
    buckets[bucketIdx].count += 1;
    buckets[bucketIdx].value += value;
  }

  return buckets;
}

// -----------------------------------------------------------------------
// 16. Pipeline funnel + probability distribution + collection status
//     (typed chart-ready shapes, reusing analyzePipeline/analyzeRevenue output)
// -----------------------------------------------------------------------

export function toFunnelStages(pipeline: PipelineAnalysis): FunnelStage[] {
  return [...pipeline.stageBreakdown]
    .sort((a, b) => stageSortKey(a.stage).localeCompare(stageSortKey(b.stage)))
    .map((s) => ({ stage: s.stage, count: s.count, value: s.value }));
}

export function toProbabilityBuckets(pipeline: PipelineAnalysis): ProbabilityBucket[] {
  const order = ["High", "Medium", "Low", "Unspecified"];
  return [...pipeline.probabilityBreakdown].sort(
    (a, b) => order.indexOf(a.label) - order.indexOf(b.label)
  );
}

export function toCollectionStatusSlices(revenue: RevenueAnalysis): CollectionStatusSlice[] {
  return revenue.collectionStatusBreakdown.map((c) => ({
    status: c.status,
    count: c.count,
    amount: c.amount,
  }));
}

// -----------------------------------------------------------------------
// 17. Monthly trend (pipeline created vs revenue collected/billed)
//
// Uses Created Date (deal funnel, 99.7% filled in this dataset) and
// Date of PO/LOI (work order tracker, 99% filled) as the reliable time
// axes - "Actual Billing Month" is a bare month name with no year in the
// source data, which makes it unsafe to plot across year boundaries.
// -----------------------------------------------------------------------

function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function computeMonthlyTrend(
  dealDataset: CleanedDataset | null,
  workOrderDataset: CleanedDataset | null,
  monthsBack = 12
): TrendPoint[] {
  const map = new Map<string, TrendPoint>();

  if (dealDataset) {
    const index = getFieldIndex("deal_funnel", dealDataset.records);
    for (const r of dealDataset.records) {
      const created = normalizeDate(r[index.createdDate ?? ""]);
      if (!created) continue;
      const key = monthKey(created);
      const entry = map.get(key) ?? { period: key, pipelineCreated: 0, revenueCollected: 0, revenueBilled: 0 };
      entry.pipelineCreated += num(r, "__dealValue");
      map.set(key, entry);
    }
  }

  if (workOrderDataset) {
    const index = getFieldIndex("work_order_tracker", workOrderDataset.records);
    const dateKey = index.dealName ? "Date of PO/LOI" : null; // resolved below via raw key search
    for (const r of workOrderDataset.records) {
      const rawDateKey = Object.keys(r).find((k) => k.toLowerCase().includes("date of po"));
      const raw = rawDateKey ? r[rawDateKey] : null;
      const iso = normalizeDate(raw);
      if (!iso) continue;
      const key = monthKey(iso);
      const entry = map.get(key) ?? { period: key, pipelineCreated: 0, revenueCollected: 0, revenueBilled: 0 };
      entry.revenueCollected += num(r, "__collectedAmount");
      entry.revenueBilled += num(r, "__billedValueInclGst");
      map.set(key, entry);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-monthsBack);
}

// re-export for convenience in the API route
export { normalizeDate, normalizeNumber };
