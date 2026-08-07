import { CleanedDataset, FlatRecord } from "./types";
import { getFieldIndex, normalizeDate, normalizeNumber } from "./dataCleaner";

function num(record: FlatRecord, key: string): number {
  const raw = record[key];
  if (raw === null || raw === undefined) return 0;
  const n = typeof raw === "number" ? raw : parseFloat(raw as unknown as string);
  return isNaN(n) ? 0 : n;
}

function sectorMatches(record: FlatRecord, sector?: string): boolean {
  if (!sector) return true;
  const recordSector = (record["__sector"] || "").toString().toLowerCase();
  return recordSector === sector.toLowerCase();
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

export function analyzePipeline(
  dataset: CleanedDataset,
  sector?: string
): PipelineAnalysis {
  const index = getFieldIndex("deal_funnel", dataset.records);
  const dealValueKey = "__dealValue";
  const stageKey = index.dealStage;
  const statusKey = index.dealStatus;
  const probabilityKey = index.closureProbability;
  const tentativeCloseKey = index.tentativeCloseDate ? "__tentativeCloseDate" : null;

  const relevant = dataset.records.filter((r) => sectorMatches(r, sector));
  // Prefer "open" deals for pipeline health if a status column exists.
  const openDeals = statusKey
    ? relevant.filter((r) => (r[statusKey] || "").toLowerCase().includes("open"))
    : relevant;

  const totalPipelineValue = openDeals.reduce((sum, r) => sum + num(r, dealValueKey), 0);

  const stageMap = new Map<string, { count: number; value: number }>();
  for (const r of openDeals) {
    const stage = (stageKey && r[stageKey]) || "Unspecified";
    const entry = stageMap.get(stage) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += num(r, dealValueKey);
    stageMap.set(stage, entry);
  }
  const stageBreakdown = Array.from(stageMap.entries())
    .map(([stage, v]) => ({ stage, ...v }))
    .sort((a, b) => b.value - a.value);

  const probMap = new Map<string, { count: number; value: number }>();
  for (const r of openDeals) {
    const label = (probabilityKey && r[probabilityKey]) || "Unspecified";
    const entry = probMap.get(label) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += num(r, dealValueKey);
    probMap.set(label, entry);
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
      const status = r[collectionStatusKey] || "Unspecified";
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
      const status = r[billingStatusKey] || "Unspecified";
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
  dealDataset?.records.forEach((r) => r["__sector"] && sectors.add(r["__sector"]!));
  workOrderDataset?.records.forEach((r) => r["__sector"] && sectors.add(r["__sector"]!));

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

// re-export for convenience in the API route
export { normalizeDate, normalizeNumber };
