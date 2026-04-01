import type { Square } from "square"
import { createSquareClient } from "../client"

export const listInventoryCounts = async (
  customerId: string,
  locationIds: string[],
  updatedAfter?: string,
  catalogObjectIds?: string[],
): Promise<Square.InventoryCount[]> => {
  const client = await createSquareClient(customerId)
  const page = await client.inventory.batchGetCounts({
    locationIds,
    updatedAfter: updatedAfter ?? null,
    catalogObjectIds: catalogObjectIds?.length ? catalogObjectIds : null,
    limit: 100,
  })

  const counts: Square.InventoryCount[] = []
  for await (const count of page) {
    counts.push(count)
  }

  return counts
}
