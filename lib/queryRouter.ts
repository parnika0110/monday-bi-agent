import { LeadershipStyle, QueryIntent, RoutedQuery } from "./types";

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
  "weekly update",
  "board meeting",
];

const HEALTH_SCORE_KEYWORDS = [
  "health score",
  "pipeline health",
  "how healthy",
  "score out of 100",
  "rate our pipeline",
  "how is our pipeline doing overall",
];

const DATA_QUALITY_KEYWORDS = [
  "data quality",
  "missing data",
  "messy data",
  "data issues",
  "data hygiene",
  "incomplete records",
  "bad data",
];

const RISKS_KEYWORDS = [
  "top risk",
  "top risks",
  "biggest risk",
  "biggest risks",
  "what could go wrong",
  "red flag",
  "red flags",
  "warning sign",
  "risk assessment",
];

const ATTENTION_KEYWORDS = [
  "needs attention",
  "immediate attention",
  "at risk deals",
  "deals to watch",
  "requires attention",
  "urgent deals",
  "what should i worry about",
];

const OWNER_PERFORMANCE_KEYWORDS = [
  "owner performance",
  "by owner",
  "sales rep",
  "bd performance",
  "kam performance",
  "top performer",
  "rep performance",
  "who is performing",
  "which owner",
];

const LARGEST_DEALS_KEYWORDS = [
  "largest deal",
  "largest deals",
  "biggest deal",
  "biggest deals",
  "top deal",
  "top deals",
  "highest value deal",
  "top client",
  "top clients",
  "largest client",
  "largest clients",
  "biggest client",
  "biggest clients",
  "top account",
  "top accounts",
  "largest account",
  "largest accounts",
  "top customer",
  "top customers",
  "client",
  "clients",
];

const FORECAST_KEYWORDS = [
  "forecast",
  "projected revenue",
  "expected revenue",
  "revenue projection",
  "predict revenue",
  "what will we close",
];

const CEO_STYLE_KEYWORDS = ["ceo", "founder update", "founder-style", "founder style"];
const BOARD_STYLE_KEYWORDS = ["board update", "board meeting", "for the board"];
const WEEKLY_STYLE_KEYWORDS = ["weekly update", "weekly leadership", "this week"];

function detectLeadershipStyle(question: string): LeadershipStyle {
  const lower = question.toLowerCase();
  if (BOARD_STYLE_KEYWORDS.some((k) => lower.includes(k))) return "board";
  if (CEO_STYLE_KEYWORDS.some((k) => lower.includes(k))) return "ceo";
  if (WEEKLY_STYLE_KEYWORDS.some((k) => lower.includes(k))) return "weekly";
  return "standard";
}

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

  // Ordered most-specific-first: a phrase like "pipeline health score" must
  // hit HEALTH_SCORE, not the generic PIPELINE keyword match below it.
  if (includesAny(trimmed, LEADERSHIP_KEYWORDS)) {
    intent = "LEADERSHIP_UPDATE";
  } else if (includesAny(trimmed, HEALTH_SCORE_KEYWORDS)) {
    intent = "HEALTH_SCORE";
  } else if (includesAny(trimmed, DATA_QUALITY_KEYWORDS)) {
    intent = "DATA_QUALITY";
  } else if (includesAny(trimmed, RISKS_KEYWORDS)) {
    intent = "RISKS";
  } else if (includesAny(trimmed, ATTENTION_KEYWORDS)) {
    intent = "ATTENTION_NEEDED";
  } else if (includesAny(trimmed, OWNER_PERFORMANCE_KEYWORDS)) {
    intent = "OWNER_PERFORMANCE";
  } else if (includesAny(trimmed, LARGEST_DEALS_KEYWORDS)) {
    intent = "LARGEST_DEALS";
  } else if (includesAny(trimmed, FORECAST_KEYWORDS)) {
    intent = "FORECAST";
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

  const leadershipStyle = intent === "LEADERSHIP_UPDATE" ? detectLeadershipStyle(trimmed) : undefined;

  return { intent, sector, leadershipStyle, raw: trimmed };
}
