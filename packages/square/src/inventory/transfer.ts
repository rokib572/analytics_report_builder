import type { Square } from "square"
import { createSquareClient } from "../client"

export const getInventoryTransfer = async (
  customerId: string,
  transferId: string,
): Promise<Square.InventoryTransfer | null> => {
  const client = await createSquareClient(customerId)
  const response = await client.inventory.getTransfer({ transferId })

  return response.transfer ?? null
}
