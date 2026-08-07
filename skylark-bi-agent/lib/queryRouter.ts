import { QueryIntent, RoutedQuery } from "./types";

// A small, extensible list of sectors we've seen in the data. This is only
// used to *detect* a sector mention in free text - the analytics engine
// itself works with whatever sector values actually exist in the board,
// so a new sector added in Monday.com later doesn't require a code change
// there (only here, to catch it in conversational phrasing).
const KNOWN_SECTORS = [
  "energy",
  "solar",
  "mining",
  "powerline",
  "agriculture",
  "infrastructure",
  "construction",
  "surveying",
  "telecom",
  "oil and gas",
  "railways",
];

const PIPELINE_KEYWORDS = [
  "pipeline",
  "deal",
  "deals",
  "funnel",
  "closure probability",
  "sales qualified",
  "prospect",
];

const REVENUE_KEYWORDS = [
  "revenue",
  "receivable",
  "receivables",
  "collection",
  "collected",
  "billing",
  "billed",
  "outstanding",
  "pending payment",
  "invoice",
];

const SECTOR_KEYWORDS = [
  "sector",
  "best performing",
  "top performing",
  "which sector",
  "sector comparison",
  "compare sectors",
];

const LEADERSHIP_KEYWORDS = [
  "leadership update",
  "executive summary",
  "leadership summary",
  "board update",
  "founder update",
  "status update for leadership",
  "prepare an update",
];

function detectSector(question: string): string | undefined {
  const lower = question.toLowerCase();
  const found = KNOWN_SECTORS.find((s) => lower.includes(s));
  if (!found) return undefined;
  return found
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export function routeQuery(question: string): RoutedQuery {
  const trimmed = question.trim();
  const sector = detectSector(trimmed);

  let intent: QueryIntent = "GENERAL";

  if (includesAny(trimmed, LEADERSHIP_KEYWORDS)) {
    intent = "LEADERSHIP_UPDATE";
  } else if (includesAny(trimmed, SECTOR_KEYWORDS) && !includesAny(trimmed, PIPELINE_KEYWORDS)) {
    intent = "SECTOR";
  } else if (includesAny(trimmed, REVENUE_KEYWORDS)) {
    intent = "REVENUE";
  } else if (includesAny(trimmed, PIPELINE_KEYWORDS)) {
    intent = "PIPELINE";
  } else if (sector) {
    // A bare sector mention with no other signal ("How about Energy?")
    // defaults to pipeline, since that's the most common founder ask.
    intent = "PIPELINE";
  }

  return { intent, sector, raw: trimmed };
}
