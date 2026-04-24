import type { Square } from "square"
import { createSquareClient } from "../client"

const PAGE_LIMIT = 200

export const batchSearchTimecards = async (
  customerId: string,
  locationIds: string[],
  startAt: string,
  endAt: string,
): Promise<Square.Timecard[]> => {
  const client = await createSquareClient(customerId)
  const timecards: Square.Timecard[] = []
  let cursor: string | undefined

  do {
    const request = {
      cursor,
      limit: PAGE_LIMIT,
      query: {
        filter: {
          locationIds,
          start: { startAt, endAt },
        },
        sort: {
          field: "START_AT",
          order: "DESC",
        },
      },
    } satisfies Square.SearchTimecardsRequest

    const response = await client.labor.searchTimecards(request)

    if (response.timecards) timecards.push(...response.timecards)
    cursor = response.cursor ?? undefined
  } while (cursor)

  return timecards
}
