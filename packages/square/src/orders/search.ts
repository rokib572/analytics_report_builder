import type { Square } from "square"
import { squareClient } from "../client"

const BATCH_SIZE = 10 // Square max locationIds per search call

export async function batchSearchOrders(
  locationIds: string[],
  startAt: string,
  endAt: string,
): Promise<Square.Order[]> {
  const chunks: string[][] = []
  for (let i = 0; i < locationIds.length; i += BATCH_SIZE) {
    chunks.push(locationIds.slice(i, i + BATCH_SIZE))
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const orders: Square.Order[] = []
      const response = await squareClient.orders.search({
        locationIds: chunk,
        query: {
          filter: {
            stateFilter: { states: ["COMPLETED"] },
            dateTimeFilter: { createdAt: { startAt, endAt } },
          },
        },
      })
      if (response.orders) orders.push(...response.orders)
      return orders
    }),
  )

  return results.flat()
}
