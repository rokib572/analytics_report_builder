import type { Square } from "square"
import { createSquareClient } from "../client"

export const getRefund = async (
  customerId: string,
  refundId: string,
): Promise<Square.PaymentRefund | null> => {
  const client = await createSquareClient(customerId)
  const response = await client.refunds.get({ refundId })

  return response.refund ?? null
}
