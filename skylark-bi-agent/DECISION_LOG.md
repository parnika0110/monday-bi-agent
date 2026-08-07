# Decision Log — Skylark BI Agent

## Scope decision
The assignment describes a fairly broad BI agent. To ship a genuinely
working, explainable MVP in a few hours, the agent is scoped to the four
question types explicitly named in the brief: pipeline health, revenue
pending collection, sector performance, and leadership updates — implemented
deeply and reliably, rather than a shallow "answer anything" agent that
can't be trusted with real numbers.

## Key assumptions
- **"Open pipeline"** = deals whose Deal Status contains "open". This is the
  standard founder-facing definition of pipeline (excludes Won/Lost).
- **Dates** default to DD/MM/YYYY when the format is ambiguous, since the
  source data is India-based.
- **Sector normalization** is a straightforward title-case fold
  (`ENERGY`/`energy` → `Energy`). No fuzzy/typo correction is attempted
  beyond that — a genuinely misspelled sector (e.g. "Enegry") would surface
  as its own bucket, which is intentionally visible as a data-quality signal
  rather than silently merged.
- **Column mapping is keyword-based, not literal-title-based.** Monday.com
  boards get rebuilt and re-imported over a company's life; matching on
  keyword sets (e.g. `["deal","value"]`) rather than an exact string is more
  robust to that churn than a hardcoded column title or ID would be.
- **Board identity is inferred from columns, not names/IDs.** This directly
  satisfies "no hardcoded board IDs" and also means duplicating a board for
  a test doesn't silently break the agent.

## How leadership updates were interpreted
The brief asks for leadership updates to cover pipeline health, revenue
status, operational status, risks, and recommendations. This was implemented
as: run the pipeline and revenue analyses unfiltered, plus a full sector
breakdown, bundle all three into one structured metrics document, and let
Gemini write it up in an executive-summary voice with explicit "Risks" and
"Recommendations" sections. Operational status is inferred from the Work
Order Tracker's execution/billing status breakdowns rather than a separate
analysis, since that board *is* the operational data.

## Trade-offs (see README §8 for detail)
1. No server-side caching — always fresh data, small latency cost.
2. Keyword-based column mapping — resilient to renames, but an unusually
   worded column could be missed (surfaced as a warning, not a silent error).
3. Gemini narrates pre-computed numbers only — never lets the LLM compute or
   invent a figure, which matters for a tool a founder will rely on.

## What would be improved with more time
- Multi-turn conversational memory (follow-up questions like "what about
  just powerline?" without repeating context).
- A short-TTL cache layer to reduce Monday.com API calls under load.
- Automated tests against fixture Monday.com API responses covering the
  messy-data edge cases (missing values, mixed date formats, etc.).
- A lightweight settings screen so a non-technical user could point the
  agent at boards with different column wording without a code change.
