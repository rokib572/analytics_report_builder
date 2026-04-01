import type { Square } from "square"
import { createSquareClient } from "../client"

export const listInventoryChanges = async (
  customerId: string,
  locationIds: string[],
  updatedAfter: string,
  updatedBefore: string,
  catalogObjectIds?: string[],
): Promise<Square.InventoryChange[]> => {
  const client = await createSquareClient(customerId)
  const page = await client.inventory.batchGetChanges({
    locationIds,
    updatedAfter,
    updatedBefore,
    catalogObjectIds: catalogObjectIds?.length ? catalogObjectIds : null,
    limit: 100,
  })

  const changes: Square.InventoryChange[] = []
  for await (const change of page) {
    changes.push(change)
  }

  return changes
}
