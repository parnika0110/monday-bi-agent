# Skylark BI Agent

A conversational Business Intelligence agent that answers founder-level questions
("How's our energy pipeline?", "What revenue is pending collection?") by reading
**live data directly from Monday.com** — no CSV/Excel is hardcoded anywhere in
the running application.

Built for the Skylark Drones technical assignment.

---

## 1. Project Overview

Skylark Drones runs two Monday.com boards:

- **Deal Funnel** — the sales pipeline (deal stage, value, closure probability, sector, close dates)
- **Work Order Tracker** — delivery + billing (execution status, billed/collected amounts, receivables, collection status)

This agent connects to both boards through Monday.com's GraphQL API at request time,
cleans the (messy, real-world) data, computes business metrics, and asks Gemini to
turn those metrics into an analyst-style written answer — grounded strictly in the
computed numbers, never invented.

## 2. Architecture

```
User question
     │
     ▼
app/page.tsx  (chat UI)
     │  POST /api/chat { message }
     ▼
app/api/chat/route.ts        - orchestrates the pipeline below
     │
     ├─▶ lib/queryRouter.ts   - classifies intent: PIPELINE / REVENUE / SECTOR / LEADERSHIP_UPDATE / GENERAL
     │                          (+ detects a sector mention, e.g. "Energy")
     │
     ├─▶ lib/monday.ts        - discovers boards dynamically, paginates items,
     │                          flattens Monday's column structure, classifies
     │                          each board as deal_funnel / work_order_tracker
     │                          by inspecting its columns (never a hardcoded board ID)
     │
     ├─▶ lib/dataCleaner.ts   - maps messy column titles to canonical fields via
     │                          keyword matching, normalizes sectors/dates/numbers,
     │                          de-duplicates, and produces data-quality warnings
     │
     ├─▶ lib/analytics.ts     - computes pipeline value, stage/probability breakdowns,
     │                          revenue/receivables, sector performance, and the
     │                          combined leadership snapshot
     │
     └─▶ lib/gemini.ts        - hands the computed metrics (not raw rows) to Gemini
                                 with instructions to write like a business analyst
     │
     ▼
Response { answer, intent, warnings } → rendered in chat UI
```

**Why this shape?** Splitting "fetch → clean → analyze → narrate" into four
independent modules means:
- Gemini never sees raw board data and can't hallucinate numbers — it only
  narrates pre-computed metrics.
- Each layer is independently testable and independently replaceable (e.g.
  swap Gemini for another LLM without touching the analytics code).
- A final-year engineering student can trace exactly which file is
  responsible for each step of "message in → answer out."

## 3. Features

- **Dynamic data, always.** Every chat request re-fetches the current state of
  both Monday.com boards. Nothing is cached to disk or hardcoded.
- **Board discovery, not board IDs.** `lib/monday.ts` lists all boards on the
  account and identifies which one is the deal funnel / work order tracker by
  looking at its *column titles* (e.g. presence of "Deal Stage" + "Closure
  Probability"), so renaming a board or re-importing it doesn't break anything.
- **Resilient to messy data.** Sector names like `Energy` / `energy` / `ENERGY`
  are normalized to one canonical form; multiple date formats are parsed into
  ISO; currency strings with `₹`/commas are parsed into numbers; missing
  values never crash a calculation — they're excluded and surfaced as a
  warning instead.
- **Conversational, not a form.** Founders can ask in plain English; the query
  router classifies intent and, if a sector is mentioned, filters automatically.
- **Leadership updates on demand.** "Prepare a leadership update" produces a
  structured executive summary spanning pipeline, revenue, and sector data.
- **Graceful failure.** If Monday.com is unreachable, or the API token is
  missing/invalid, or Gemini is down, the app returns a clear, specific error
  (or, for Gemini specifically, falls back to a plain-text version of the
  computed metrics) instead of crashing.

## 4. Setup

### Prerequisites
- Node.js 18.18+ (Next.js 16 requirement)
- A Monday.com account with the two boards imported, with a personal API token
- A Google Gemini API key

### Install

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```
MONDAY_API_TOKEN=your_monday_api_token_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash   # optional override
```

### Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 5. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONDAY_API_TOKEN` | Yes | Personal API token from Monday.com → Avatar → Admin → API |
| `GEMINI_API_KEY` | Yes | API key from Google AI Studio |
| `GEMINI_MODEL` | No | Defaults to `gemini-1.5-flash` |

## 6. Monday.com Configuration

No board IDs need to be configured. The agent calls Monday's `boards` query to
list every board the token can see, fetches each one's items, and classifies
it by column signature:

- A board is treated as the **Deal Funnel** if it has a "Deal Stage" column
  (or both a "Closure Probability" and "Deal Value"-type column).
- A board is treated as the **Work Order Tracker** if it has an "Execution
  Status", "Collection Status", or "Billed Value" column.

Boards that match neither signature are ignored, so the token can have access
to unrelated boards without breaking anything.

**Required column titles** (exact wording is flexible — matching is
keyword-based and case-insensitive):

*Deal Funnel*: Deal Name, Deal Status, Deal Stage, (Masked) Deal value,
Closure Probability, Close Date, Tentative Close Date, Sector/service.

*Work Order Tracker*: Deal name, Sector, Execution Status, Amount Receivable,
Collected Amount, Billed Value (Incl GST), Billing Status, Collection Status.

## 7. Assumptions

- "Pipeline value" = sum of deal value across deals whose Deal Status contains
  "open" (case-insensitive). If no status column is found, all deals are counted.
- "Revenue pending collection" = sum of the Amount Receivable column across
  work orders (i.e. billed-but-not-yet-collected + not-yet-billed amounts,
  as captured by that column in the tracker).
- Dates are assumed to be DD/MM/YYYY when ambiguous (India-based operations).
- A sector mentioned in a question ("energy sector pipeline") is matched
  against the normalized `Sector` column exactly (case-insensitive); sectors
  not seen in the seed data can still be asked about since matching is
  data-driven, not a hardcoded enum, in the analytics layer itself (the
  keyword list in `queryRouter.ts` is only used to *detect* that a sector was
  mentioned in free text).

## 8. Trade-offs

- **Full re-fetch per request, no server-side cache.** Simpler and always
  fresh, at the cost of an extra ~1-3s latency per question versus a cached
  approach. For an MVP answering founder questions a few times a day, this is
  the right trade-off; a production version would add a short TTL cache.
- **Keyword-based column mapping instead of a config file.** Keeps the
  "no hardcoded board IDs / columns" requirement while staying resilient to
  minor renames. The trade-off is that a column title with genuinely unusual
  wording could fail to map — this is surfaced as missing-data warnings
  rather than a silent wrong answer.
- **Gemini only narrates, never computes.** This sacrifices some flexibility
  (Gemini can't answer a totally novel calculation on the fly) in exchange for
  numerical trustworthiness, which matters more for a BI tool a founder will
  actually rely on.

## 9. Challenges

- Monday.com's `column_values` API returns values keyed by column ID, not
  title, and the two boards' columns don't share IDs — `lib/monday.ts` joins
  in the column title at fetch time so every downstream layer can work with
  human-readable field names instead of opaque IDs.
- The source spreadsheets have several nearly-duplicate amount columns
  (Excl GST vs Incl GST, Billed vs Amount to be Billed vs Receivable) —
  `lib/dataCleaner.ts` picks the most decision-relevant one per canonical
  metric and documents the choice above rather than summing everything.

## 10. AI Tools Used

- Claude (Anthropic) was used to scaffold and write this codebase from the
  assignment brief.
- Google Gemini is used at runtime as the narration layer described above.

## 11. Future Improvements

- Add a lightweight cache (30-60s TTL) in front of `lib/monday.ts` to cut
  latency on rapid follow-up questions without losing "live data" freshness.
- Support multi-turn follow-ups ("what about just powerline?") by passing
  recent chat history into the query router instead of treating every
  message independently.
- Add authentication so the agent can be shared with the wider team safely.
- Persist a rolling data-quality report so leadership can watch board
  hygiene improve (or degrade) over time, not just per-query.
- Add streaming responses so the analyst-style answer appears token-by-token.

## 12. Deployment (Vercel)

1. Push this repository to GitHub.
2. In Vercel, "Add New Project" → import the repository.
3. Framework preset: Next.js (auto-detected).
4. Add environment variables `MONDAY_API_TOKEN` and `GEMINI_API_KEY`
   (and optionally `GEMINI_MODEL`) in Project Settings → Environment Variables.
5. Deploy. Vercel will build with `next build` and serve `/api/chat` as a
   serverless function automatically — no additional configuration needed.

## 13. Project Structure

```
skylark-bi-agent/
├── app/
│   ├── api/chat/route.ts   # API route: orchestrates the full pipeline
│   ├── layout.tsx
│   ├── page.tsx            # chat UI
│   └── globals.css
├── lib/
│   ├── monday.ts            # Monday.com GraphQL client + board discovery
│   ├── dataCleaner.ts       # normalization + data-quality warnings
│   ├── analytics.ts         # pipeline / revenue / sector / leadership metrics
│   ├── queryRouter.ts       # intent classification
│   ├── gemini.ts            # Gemini narration layer
│   └── types.ts             # shared types
├── .env.example
├── package.json
├── README.md
└── DECISION_LOG.md
```
