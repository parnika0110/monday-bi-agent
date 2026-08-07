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
 */
export type FlatRecord = Record<string, string | null> & {
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
  | "GENERAL";

export interface RoutedQuery {
  intent: QueryIntent;
  sector?: string;
  raw: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatApiResponse {
  answer: string;
  intent: QueryIntent;
  warnings: DataQualityWarning[];
  debug?: Record<string, unknown>;
}
