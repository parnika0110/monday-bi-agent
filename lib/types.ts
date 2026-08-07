// -----------------------------------------------------------------------
// Shared types for the Skylark BI platform
// -----------------------------------------------------------------------

/** Raw column value as returned by Monday.com's GraphQL API */
export interface MondayColumnValue {
  id: string;
  title: string;
  text: string | null;
  type: string;
}

/** Raw item (row) as returned by Monday.com */
export interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
}

/** Raw board as returned by Monday.com */
export interface MondayBoard {
  id: string;
  name: string;
  items: MondayItem[];
}

/**
 * A "flat" representation of an item: { columnTitle: textValue }.
 * This is the shape the data-cleaning layer works with, so it never
 * has to know about Monday's column IDs.
 *
 * Raw Monday columns always come through as `string | null`. The cleaner
 * additionally writes canonical `__` prefixed fields (e.g. `__dealValue`,
 * `__closeDate`) which may legitimately be `number | null` once parsed -
 * hence the wider value type here instead of forcing numbers into strings.
 */
export type FlatRecord = Record<string, string | number | null> & {
  __itemId: string;
  __itemName: string;
  __boardId: string;
  __boardName: string;
};

export interface DataQualityWarning {
  field: string;
  message: string;
  count: number;
  severity: "low" | "medium" | "high";
}

export interface CleanedDataset {
  boardName: string;
  boardType: BoardType;
  records: FlatRecord[];
  warnings: DataQualityWarning[];
  totalRecords: number;
  duplicatesRemoved: number;
}

/**
 * The two board "shapes" this agent knows how to reason about.
 * Detected dynamically from column titles - never hardcoded to a board ID.
 */
export type BoardType = "deal_funnel" | "work_order_tracker" | "unknown";

export type QueryIntent =
  | "PIPELINE"
  | "REVENUE"
  | "SECTOR"
  | "LEADERSHIP_UPDATE"
  | "RISKS"
  | "HEALTH_SCORE"
  | "DATA_QUALITY"
  | "OWNER_PERFORMANCE"
  | "LARGEST_DEALS"
  | "ATTENTION_NEEDED"
  | "FORECAST"
  | "GENERAL";

/** CEO / board-meeting / weekly framing for LEADERSHIP_UPDATE, detected from phrasing. */
export type LeadershipStyle = "ceo" | "board" | "weekly" | "standard";

export interface RoutedQuery {
  intent: QueryIntent;
  sector?: string;
  leadershipStyle?: LeadershipStyle;
  raw: string;
}

// -----------------------------------------------------------------------
// Chat / Copilot
// -----------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  intent?: QueryIntent;
  warnings?: DataQualityWarning[];
  /** Only set on assistant messages that failed - lets the UI offer a retry. */
  failed?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatApiResponse {
  answer: string;
  intent: QueryIntent;
  warnings: DataQualityWarning[];
  debug?: Record<string, unknown>;
}

// -----------------------------------------------------------------------
// Dashboard / KPI / Charts
// -----------------------------------------------------------------------

export interface KpiValue {
  id: string;
  label: string;
  value: number;
  format: "currency" | "percent" | "number" | "score";
  delta?: number | null;
  deltaLabel?: string;
  tone?: "positive" | "negative" | "neutral" | "warning";
  helpText?: string;
}

export interface ChartPoint {
  [key: string]: string | number;
}

export interface TrendPoint {
  period: string;
  pipelineCreated: number;
  revenueCollected: number;
  revenueBilled: number;
}

export interface SectorSlice {
  sector: string;
  pipelineValue: number;
  receivable: number;
  collected: number;
  dealCount: number;
  workOrderCount: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
}

export interface ProbabilityBucket {
  label: string;
  count: number;
  value: number;
}

export interface AgingBucket {
  bucket: string;
  count: number;
  value: number;
}

export interface CollectionStatusSlice {
  status: string;
  count: number;
  amount: number;
}

// -----------------------------------------------------------------------
// Advanced analytics
// -----------------------------------------------------------------------

export interface ScoredDeal {
  itemId: string;
  dealName: string;
  sector: string | null;
  stage: string;
  value: number;
  probabilityLabel: string;
  winProbabilityScore: number; // 0-100
  daysOpen: number | null;
  ownerCode: string | null;
}

export interface StuckDeal {
  itemId: string;
  dealName: string;
  stage: string;
  value: number;
  daysInPipeline: number;
  reason: string;
}

export interface LeakagePoint {
  stage: string;
  enteredCount: number;
  stillOpenCount: number;
  leakageRate: number; // 0-1, share that never progressed / closed
}

export interface OwnerPerformance {
  ownerCode: string;
  dealCount: number;
  pipelineValue: number;
  wonCount: number;
  wonValue: number;
}

export interface ConcentrationRisk {
  topSectorShare: number; // 0-1
  topSector: string | null;
  topClientShare: number; // 0-1
  topClient: string | null;
  isHighRisk: boolean;
}

export interface SectorGrowthOpportunity {
  sector: string;
  pipelineValue: number;
  currentRevenue: number;
  growthRatio: number; // pipeline / current revenue
}

export interface ForecastResult {
  forecastRevenue: number;
  weightedPipeline: number;
  confidenceScore: number; // 0-100
  basis: string;
}

export interface ExecutiveHealthScore {
  overallScore: number; // 0-100
  pipelineScore: number;
  revenueScore: number;
  dataQualityScore: number;
  riskScore: number;
  breakdown: { label: string; score: number; weight: number }[];
}

export interface DataQualityField {
  field: string;
  boardName: string;
  totalRecords: number;
  missingCount: number;
  completeness: number; // 0-1
  severity: "low" | "medium" | "high";
  recommendedFix: string;
}

export interface DataQualitySnapshot {
  timestamp: number;
  overallScore: number;
  completeness: number;
  fields: DataQualityField[];
}

// -----------------------------------------------------------------------
// Executive dashboards
// -----------------------------------------------------------------------

export type ExecutiveRole = "ceo" | "sales" | "operations" | "finance";

export interface ExecutiveDashboardData {
  role: ExecutiveRole;
  title: string;
  kpis: KpiValue[];
  insights: string[];
  risks: string[];
  recommendations: string[];
}

// -----------------------------------------------------------------------
// Aggregate dashboard bundle - the single payload the whole SPA is built from
// -----------------------------------------------------------------------

export interface DashboardBundle {
  generatedAt: number;
  kpis: KpiValue[];
  trend: TrendPoint[];
  sectorDistribution: SectorSlice[];
  pipelineFunnel: FunnelStage[];
  probabilityDistribution: ProbabilityBucket[];
  dealAging: AgingBucket[];
  collectionStatus: CollectionStatusSlice[];
  largestOpportunities: ScoredDeal[];
  stuckDeals: StuckDeal[];
  leakage: LeakagePoint[];
  ownerPerformance: OwnerPerformance[];
  concentrationRisk: ConcentrationRisk;
  growthOpportunities: SectorGrowthOpportunity[];
  forecast: ForecastResult;
  healthScore: ExecutiveHealthScore;
  dataQuality: DataQualitySnapshot;
  warnings: DataQualityWarning[];
  boardsConnected: { boardType: BoardType; boardName: string; recordCount: number }[];
}
