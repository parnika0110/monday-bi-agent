import {
  FlatRecord,
  DataQualityWarning,
  CleanedDataset,
  BoardType,
} from "./types";

// -----------------------------------------------------------------------
// Column discovery
//
// Monday.com column titles are free text set by whoever built the board,
// so instead of hardcoding exact titles (e.g. "Masked Deal value") we
// match on keyword sets. This means the agent keeps working even if a
// column gets renamed slightly, re-ordered, or the board gets rebuilt.
// -----------------------------------------------------------------------

function findColumnKey(record: FlatRecord, keywordSets: string[][]): string | null {
  const keys = Object.keys(record).filter((k) => !k.startsWith("__"));
  for (const keywords of keywordSets) {
    const match = keys.find((key) => {
      const lower = key.toLowerCase();
      return keywords.every((kw) => lower.includes(kw));
    });
    if (match) return match;
  }
  return null;
}

/** Canonical field -> ordered list of keyword combinations to try, most specific first. */
const DEAL_FUNNEL_FIELD_MAP: Record<string, string[][]> = {
  dealName: [["deal", "name"]],
  dealStatus: [["deal", "status"]],
  dealStage: [["deal", "stage"]],
  dealValue: [["deal", "value"]],
  closureProbability: [["closure", "probability"], ["probability"]],
  closeDate: [["close", "date", "(a)"], ["close", "date"]],
  tentativeCloseDate: [["tentative", "close"]],
  sector: [["sector"]],
  ownerCode: [["owner", "code"]],
  clientCode: [["client", "code"]],
  createdDate: [["created", "date"]],
};

const WORK_ORDER_FIELD_MAP: Record<string, string[][]> = {
  dealName: [["deal", "name"]],
  sector: [["sector"]],
  executionStatus: [["execution", "status"]],
  natureOfWork: [["nature", "of", "work"]],
  amountExclGst: [["amount", "excl", "gst"], ["amount in rupees"]],
  amountInclGst: [["amount", "incl", "gst"]],
  billedValueInclGst: [["billed", "value", "incl"]],
  collectedAmount: [["collected", "amount"]],
  amountReceivable: [["amount", "receivable"]],
  amountToBeBilledIncl: [["amount", "to be billed", "incl"], ["amount to be billed"]],
  invoiceStatus: [["invoice", "status"]],
  billingStatus: [["billing", "status"]],
  collectionStatus: [["collection", "status"]],
  woStatus: [["wo status"]],
  probableStartDate: [["probable", "start", "date"]],
  probableEndDate: [["probable", "end", "date"]],
  expectedBillingMonth: [["expected", "billing", "month"]],
};

function buildFieldIndex(
  records: FlatRecord[],
  fieldMap: Record<string, string[][]>
): Record<string, string | null> {
  const sample = records[0];
  const index: Record<string, string | null> = {};
  if (!sample) return index;
  for (const [canonical, keywordSets] of Object.entries(fieldMap)) {
    index[canonical] = findColumnKey(sample, keywordSets);
  }
  return index;
}

// -----------------------------------------------------------------------
// Value normalizers
// -----------------------------------------------------------------------

/** Values that mean "no real data was entered" even though the cell isn't literally empty. */
const JUNK_VALUES = new Set(["none", "n/a", "na", "tbd", "-", "--", "?", "unknown", "null"]);

function isJunkValue(trimmedLower: string): boolean {
  return JUNK_VALUES.has(trimmedLower);
}

/** True if a raw cell value (string | number | null) represents "no data entered". */
export function isBlank(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return isNaN(value);
  const trimmed = value.trim();
  return trimmed === "" || isJunkValue(trimmed.toLowerCase());
}

export function normalizeSectorName(
  raw: string | number | null | undefined
): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.toString().trim();
  if (trimmed === "" || isJunkValue(trimmed.toLowerCase())) return null;
  // "Energy" / "energy" / "ENERGY " -> "Energy"
  return trimmed
    .toLowerCase()
    .split(/[\s/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Parses a wide range of date string formats into ISO (YYYY-MM-DD), or null. */
export function normalizeDate(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.toString().trim();
  if (trimmed === "" || isJunkValue(trimmed.toLowerCase())) return null;

  // Monday.com date columns usually come through as "YYYY-MM-DD" already,
  // but handle DD/MM/YYYY, MM/DD/YYYY and "27 Sep 2025" style strings too.
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    // Assume DD/MM/YYYY (India-based data). Fall back gracefully if day > 12 impossible.
    const [, a, b, y] = slashMatch;
    const day = a.padStart(2, "0");
    const month = b.padStart(2, "0");
    return `${y}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

/** Parses currency-like strings ("₹1,23,456.00", "1234", "") into a number, or null. */
export function normalizeNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return isNaN(raw) ? null : raw;
  const trimmed = raw.toString().trim();
  if (trimmed === "" || isJunkValue(trimmed.toLowerCase())) return null;
  const cleaned = trimmed.replace(/[₹$,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// -----------------------------------------------------------------------
// Main cleaning entry point
// -----------------------------------------------------------------------

export function cleanDataset(
  boardName: string,
  boardType: BoardType,
  rawRecords: FlatRecord[]
): CleanedDataset {
  const warnings: DataQualityWarning[] = [];

  // 1. De-duplicate by item id (Monday guarantees unique item ids, but
  // guard against the same item appearing twice across a paginated fetch).
  const seen = new Set<string>();
  const deduped: FlatRecord[] = [];
  for (const r of rawRecords) {
    if (seen.has(r.__itemId)) continue;
    seen.add(r.__itemId);
    deduped.push(r);
  }
  const duplicatesRemoved = rawRecords.length - deduped.length;
  if (duplicatesRemoved > 0) {
    warnings.push({
      field: "__itemId",
      message: `${duplicatesRemoved} duplicate record(s) removed`,
      count: duplicatesRemoved,
      severity: "low",
    });
  }

  const fieldMap = boardType === "deal_funnel" ? DEAL_FUNNEL_FIELD_MAP : WORK_ORDER_FIELD_MAP;
  const index = buildFieldIndex(deduped, fieldMap);

  const cleaned: FlatRecord[] = deduped.map((record) => {
    const next: FlatRecord = { ...record };

    // Normalize sector, wherever the sector column lives.
    const sectorKey = index.sector;
    if (sectorKey) {
      next["__sector"] = normalizeSectorName(record[sectorKey]);
    }

    // Normalize every date-shaped canonical field.
    for (const [canonical, columnKey] of Object.entries(index)) {
      if (!columnKey) continue;
      if (/date$/i.test(canonical)) {
        next[`__${canonical}`] = normalizeDate(record[columnKey]);
      }
    }

    // Normalize known numeric fields.
    const numericFields = [
      "dealValue",
      "amountExclGst",
      "amountInclGst",
      "billedValueInclGst",
      "collectedAmount",
      "amountReceivable",
      "amountToBeBilledIncl",
    ];
    for (const field of numericFields) {
      const columnKey = index[field];
      if (columnKey) {
        next[`__${field}`] = normalizeNumber(record[columnKey]);
      }
    }

    return next;
  });

  // Data quality checks -----------------------------------------------
  if (boardType === "deal_funnel") {
    const valueKey = index.dealValue;
    const closeDateKey = index.tentativeCloseDate ?? index.closeDate;

    if (valueKey) {
      const missing = cleaned.filter((r) => normalizeNumber(r[valueKey]) === null).length;
      if (missing > 0) {
        warnings.push({
          field: "dealValue",
          message: `${missing} record(s) missing deal value`,
          count: missing,
          severity: missing > cleaned.length * 0.2 ? "high" : "medium",
        });
      }
    }
    if (closeDateKey) {
      const missing = cleaned.filter((r) => normalizeDate(r[closeDateKey]) === null).length;
      if (missing > 0) {
        warnings.push({
          field: "closeDate",
          message: `${missing} record(s) missing close date`,
          count: missing,
          severity: missing > cleaned.length * 0.2 ? "high" : "medium",
        });
      }
    }
    if (index.closureProbability) {
      const key = index.closureProbability;
      const missing = cleaned.filter((r) => isBlank(r[key])).length;
      if (missing > 0) {
        warnings.push({
          field: "closureProbability",
          message: `${missing} record(s) missing closure probability`,
          count: missing,
          severity: "low",
        });
      }
    }
  }

  if (boardType === "work_order_tracker") {
    const receivableKey = index.amountReceivable;
    if (receivableKey) {
      const missing = cleaned.filter((r) => normalizeNumber(r[receivableKey]) === null).length;
      if (missing > 0) {
        warnings.push({
          field: "amountReceivable",
          message: `${missing} record(s) missing receivable amount`,
          count: missing,
          severity: "low",
        });
      }
    }
    const billingStatusKey = index.billingStatus ?? index.collectionStatus;
    if (billingStatusKey) {
      const missing = cleaned.filter((r) => isBlank(r[billingStatusKey])).length;
      if (missing > 0) {
        warnings.push({
          field: "billingStatus",
          message: `${missing} record(s) missing billing/collection status`,
          count: missing,
          severity: "low",
        });
      }
    }
  }

  const sectorMissing = cleaned.filter((r) => !r["__sector"]).length;
  if (sectorMissing > 0) {
    warnings.push({
      field: "sector",
      message: `${sectorMissing} record(s) missing or unrecognized sector`,
      count: sectorMissing,
      severity: "medium",
    });
  }

  return {
    boardName,
    boardType,
    records: cleaned,
    warnings,
    totalRecords: cleaned.length,
    duplicatesRemoved,
  };
}

/** Expose the field index builder so analytics.ts can resolve column keys too. */
export function getFieldIndex(boardType: BoardType, records: FlatRecord[]) {
  const fieldMap = boardType === "deal_funnel" ? DEAL_FUNNEL_FIELD_MAP : WORK_ORDER_FIELD_MAP;
  return buildFieldIndex(records, fieldMap);
}
