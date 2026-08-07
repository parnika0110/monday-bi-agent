import { fetchAllBusinessBoards } from "./monday";
import { cleanDataset } from "./dataCleaner";
import { cached } from "./cache";
import { CleanedDataset } from "./types";

export interface BusinessData {
  dealDataset: CleanedDataset | null;
  workOrderDataset: CleanedDataset | null;
  fetchedAt: number;
}

/**
 * Fetches + cleans both boards, cached for a short window so a dashboard
 * page's KPI cards, six charts, and executive-summary panel - all of
 * which need the same underlying data - trigger exactly one Monday.com
 * round trip between them instead of one each.
 */
export async function loadBusinessData(): Promise<BusinessData> {
  return cached("business-data:v1", async () => {
    const boards = await fetchAllBusinessBoards();
    const dealBoard = boards.find((b) => b.boardType === "deal_funnel");
    const workOrderBoard = boards.find((b) => b.boardType === "work_order_tracker");

    const dealDataset = dealBoard
      ? cleanDataset(dealBoard.boardName, "deal_funnel", dealBoard.records)
      : null;
    const workOrderDataset = workOrderBoard
      ? cleanDataset(workOrderBoard.boardName, "work_order_tracker", workOrderBoard.records)
      : null;

    return { dealDataset, workOrderDataset, fetchedAt: Date.now() };
  });
}
