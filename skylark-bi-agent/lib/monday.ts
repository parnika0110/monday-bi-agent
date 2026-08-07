import { MondayBoard, MondayItem, FlatRecord, BoardType } from "./types";

const MONDAY_API_URL = "https://api.monday.com/v2";
const ITEMS_PAGE_SIZE = 100;
const REQUEST_TIMEOUT_MS = 8000;

export class MondayApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "MondayApiError";
  }
}

function getToken(): string {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    throw new MondayApiError(
      "MONDAY_API_TOKEN is not set. Add it to your environment variables (see .env.example)."
    );
  }
  return token;
}

async function mondayFetchOnce<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "API-Version": "2024-10",
      },
      body: JSON.stringify({ query, variables }),
      // Monday boards are business data that changes over the course of a
      // day - avoid Next.js caching stale results.
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = (err as Error).name === "AbortError";
    throw new MondayApiError(
      isTimeout
        ? `Monday.com API did not respond within ${REQUEST_TIMEOUT_MS / 1000}s.`
        : `Could not reach Monday.com API. Check your network connection. (${(err as Error).message})`
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    throw new MondayApiError(
      "Monday.com rejected the request (authentication error). Check that MONDAY_API_TOKEN is valid and has read access to the boards.",
      response.status
    );
  }

  if (!response.ok) {
    throw new MondayApiError(
      `Monday.com API returned an unexpected status: ${response.status}`,
      response.status
    );
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    const message = json.errors.map((e: { message: string }) => e.message).join("; ");
    throw new MondayApiError(`Monday.com API error: ${message}`);
  }

  return json.data as T;
}

/**
 * Runs a Monday.com GraphQL query, retrying once on transient failures
 * (network errors, timeouts, 5xx). Auth errors (401/403) and GraphQL-level
 * errors are not retried since a second attempt won't change the outcome.
 */
async function mondayFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const token = getToken();
  try {
    return await mondayFetchOnce<T>(query, variables, token);
  } catch (err) {
    const isAuthError = err instanceof MondayApiError && (err.status === 401 || err.status === 403);
    if (isAuthError) throw err;
    // One retry for anything else (network blip, timeout, transient 5xx).
    return await mondayFetchOnce<T>(query, variables, token);
  }
}

/**
 * Discover every board the token has access to (name + id).
 * We never hardcode board IDs - the agent figures out which
 * board is "the deal funnel" vs "the work order tracker" from
 * its name/columns at runtime (see detectBoardType).
 */
export async function listBoards(): Promise<{ id: string; name: string }[]> {
  const query = `
    query {
      boards (limit: 100) {
        id
        name
      }
    }
  `;
  const data = await mondayFetch<{ boards: { id: string; name: string }[] }>(query);
  return data.boards ?? [];
}

/**
 * Cheap board discovery: fetches id, name, and column titles only - no
 * items. Monday.com exposes `columns` directly on a board without needing
 * to page through items, so this is a single fast request that lets us
 * decide *which* boards are worth a full item fetch before paying for one.
 */
export async function listBoardsWithColumns(): Promise<
  { id: string; name: string; columnTitles: string[] }[]
> {
  const query = `
    query {
      boards (limit: 100) {
        id
        name
        columns { title }
      }
    }
  `;
  const data = await mondayFetch<{
    boards: { id: string; name: string; columns: { title: string }[] }[];
  }>(query);

  return (data.boards ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    columnTitles: b.columns.map((c) => c.title),
  }));
}

/**
 * Fetch a single board with all of its items and column values,
 * transparently paginating through Monday's cursor-based API.
 */
export async function fetchBoardWithItems(boardId: string): Promise<MondayBoard> {
  const boardQuery = `
    query ($boardId: [ID!]) {
      boards (ids: $boardId) {
        id
        name
      }
    }
  `;
  const boardData = await mondayFetch<{ boards: { id: string; name: string }[] }>(
    boardQuery,
    { boardId: [boardId] }
  );

  if (!boardData.boards || boardData.boards.length === 0) {
    throw new MondayApiError(`Board ${boardId} was not found or is not accessible.`);
  }

  const items: MondayItem[] = [];
  let cursor: string | null = null;

  do {
    const itemsQuery: string = cursor
      ? `
        query ($boardId: [ID!], $cursor: String) {
          boards (ids: $boardId) {
            items_page (limit: ${ITEMS_PAGE_SIZE}, cursor: $cursor) {
              cursor
              items {
                id
                name
                column_values {
                  id
                  text
                  type
                  column { title }
                }
              }
            }
          }
        }
      `
      : `
        query ($boardId: [ID!]) {
          boards (ids: $boardId) {
            items_page (limit: ${ITEMS_PAGE_SIZE}) {
              cursor
              items {
                id
                name
                column_values {
                  id
                  text
                  type
                  column { title }
                }
              }
            }
          }
        }
      `;

    const page = await mondayFetch<{
      boards: {
        items_page: {
          cursor: string | null;
          items: {
            id: string;
            name: string;
            column_values: { id: string; text: string | null; type: string; column: { title: string } }[];
          }[];
        };
      }[];
    }>(itemsQuery, cursor ? { boardId: [boardId], cursor } : { boardId: [boardId] });

    const itemsPage = page.boards?.[0]?.items_page;
    if (!itemsPage) break;

    for (const item of itemsPage.items) {
      items.push({
        id: item.id,
        name: item.name,
        column_values: item.column_values.map((cv) => ({
          id: cv.id,
          title: cv.column?.title ?? cv.id,
          text: cv.text,
          type: cv.type,
        })),
      });
    }

    cursor = itemsPage.cursor;
  } while (cursor);

  return {
    id: boardData.boards[0].id,
    name: boardData.boards[0].name,
    items,
  };
}

/**
 * Flatten a Monday board into { columnTitle: text } records so the rest
 * of the pipeline (cleaner / analytics) never has to touch Monday's
 * column-id/type structure.
 */
export function flattenBoard(board: MondayBoard): FlatRecord[] {
  return board.items.map((item) => {
    const record: FlatRecord = {
      __itemId: item.id,
      __itemName: item.name,
      __boardId: board.id,
      __boardName: board.name,
    };
    for (const col of item.column_values) {
      record[col.title] = col.text && col.text.trim() !== "" ? col.text : null;
    }
    return record;
  });
}

/**
 * Detect whether a board "is" the deal funnel or the work order tracker
 * by inspecting its column titles - not its name or ID. This keeps the
 * agent working even if boards get renamed or duplicated.
 */
export function detectBoardType(columnTitles: string[]): BoardType {
  const normalized = columnTitles.map((t) => t.toLowerCase());
  const has = (needle: string) => normalized.some((t) => t.includes(needle));

  const looksLikeDealFunnel =
    has("deal stage") || (has("closure probability") && has("deal value"));
  const looksLikeWorkOrder =
    has("execution status") || has("collection status") || has("billed value");

  if (looksLikeDealFunnel) return "deal_funnel";
  if (looksLikeWorkOrder) return "work_order_tracker";
  return "unknown";
}

/**
 * High level entry point used by the API route: discover all boards,
 * fetch + flatten each one, and classify it. Boards that don't match
 * a known shape are skipped so nothing irrelevant is fetched or returned.
 *
 * @param onlyTypes - optional filter (e.g. ["deal_funnel"]) so a question
 *   that only needs the pipeline board doesn't pay for a work-order-tracker
 *   fetch it won't use. Omit to fetch every recognized board (used for
 *   SECTOR / LEADERSHIP_UPDATE / etc. which need both).
 */
export async function fetchAllBusinessBoards(
  onlyTypes?: BoardType[]
): Promise<{ boardType: BoardType; boardName: string; records: FlatRecord[] }[]> {
  const boardSummaries = await listBoardsWithColumns();

  if (boardSummaries.length === 0) {
    throw new MondayApiError("No boards were found for this Monday.com account/token.");
  }

  // Cheap classification pass - no items fetched yet.
  const candidates = boardSummaries
    .map((b) => ({ ...b, boardType: detectBoardType(b.columnTitles) }))
    .filter((b) => b.boardType !== "unknown")
    .filter((b) => !onlyTypes || onlyTypes.includes(b.boardType));

  if (candidates.length === 0) {
    throw new MondayApiError(
      "Found boards, but none matched the expected 'Deal Funnel' or 'Work Order Tracker' shape. Check that the columns were imported with their original titles."
    );
  }

  // Only now do we pay for a full items fetch, and only for boards that matter.
  const results: { boardType: BoardType; boardName: string; records: FlatRecord[] }[] = [];
  for (const candidate of candidates) {
    const fullBoard = await fetchBoardWithItems(candidate.id);
    if (fullBoard.items.length === 0) continue;

    results.push({
      boardType: candidate.boardType,
      boardName: fullBoard.name,
      records: flattenBoard(fullBoard),
    });
  }

  if (results.length === 0) {
    throw new MondayApiError(
      "Matching boards were found but contained no items to analyze."
    );
  }

  return results;
}
