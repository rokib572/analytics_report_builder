import type { Square } from "square"
import { createSquareClient } from "../client"

export const getOrder = async (
  customerId: string,
  orderId: string,
): Promise<Square.Order | null> => {
  const client = await createSquareClient(customerId)
  const response = await client.orders.get({ orderId })
  return response.order ?? null
}
