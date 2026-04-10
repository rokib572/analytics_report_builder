import type { Square } from "square"
import { createSquareClient } from "../client"

const BATCH_SIZE = 10 // Square max locationIds per search call

export const batchSearchOrders = async (
  customerId: string,
  locationIds: string[],
  startAt: string,
  endAt: string,
): Promise<Square.Order[]> => {
  const client = await createSquareClient(customerId)

  const chunks: string[][] = []
  for (let i = 0; i < locationIds.length; i += BATCH_SIZE) {
    chunks.push(locationIds.slice(i, i + BATCH_SIZE))
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const orders: Square.Order[] = []
      let cursor: string | undefined

      do {
        const request = {
          cursor,
          locationIds: chunk,
          query: {
            filter: {
              stateFilter: { states: ["COMPLETED"] },
              dateTimeFilter: { createdAt: { startAt, endAt } },
            },
            sort: {
              sortField: "CREATED_AT",
              sortOrder: "DESC",
            },
          },
        } satisfies Square.SearchOrdersRequest

        const response = await client.orders.search(request)

        if (response.orders) orders.push(...response.orders)
        cursor = response.cursor ?? undefined
      } while (cursor)

      return orders
    }),
  )

  return results.flat()
}
