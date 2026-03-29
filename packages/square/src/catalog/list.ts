import type { Square } from "square"
import { createSquareClient } from "../client"

export const fetchAllCatalogObjects = async (
  customerId: string,
): Promise<Square.CatalogObject[]> => {
  const squareClient = await createSquareClient(customerId)
  const response = await squareClient.catalog.list({ types: "ITEM,CATEGORY" })

  const allObjects = response.data || []

  let current = response
  while (current.hasNextPage()) {
    current = await current.getNextPage()
    allObjects.push(...(current.data || []))
  }

  return allObjects
}
