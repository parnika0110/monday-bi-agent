// -----------------------------------------------------------------------
// Shared types for the Monday.com BI Agent
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** Only set on assistant messages that failed - lets the UI offer a retry. */
  failed?: boolean;
}

export interface ChatApiResponse {
  answer: string;
  intent: QueryIntent;
  warnings: DataQualityWarning[];
  debug?: Record<string, unknown>;
}
