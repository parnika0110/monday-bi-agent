import { MondayBoard, MondayItem, FlatRecord, BoardType } from "./types";

const MONDAY_API_URL = "https://api.monday.com/v2";
const ITEMS_PAGE_SIZE = 100;

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

async function mondayFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const token = getToken();

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
    });
  } catch (err) {
    throw new MondayApiError(
      `Could not reach Monday.com API. Check your network connection. (${
        (err as Error).message
      })`
    );
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
 * a known shape are still returned (as "unknown") so nothing is silently
 * dropped.
 */
export async function fetchAllBusinessBoards(): Promise<
  { boardType: BoardType; boardName: string; records: FlatRecord[] }[]
> {
  const boards = await listBoards();

  if (boards.length === 0) {
    throw new MondayApiError(
      "No boards were found for this Monday.com account/token."
    );
  }

  const results: { boardType: BoardType; boardName: string; records: FlatRecord[] }[] = [];

  for (const b of boards) {
    const fullBoard = await fetchBoardWithItems(b.id);
    if (fullBoard.items.length === 0) continue;

    const columnTitles = fullBoard.items[0].column_values.map((c) => c.title);
    const boardType = detectBoardType(columnTitles);

    if (boardType === "unknown") continue; // ignore boards unrelated to this agent

    results.push({
      boardType,
      boardName: fullBoard.name,
      records: flattenBoard(fullBoard),
    });
  }

  if (results.length === 0) {
    throw new MondayApiError(
      "Found boards, but none matched the expected 'Deal Funnel' or 'Work Order Tracker' shape. Check that the columns were imported with their original titles."
    );
  }

  return results;
}
