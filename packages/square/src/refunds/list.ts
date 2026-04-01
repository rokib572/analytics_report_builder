import type { Square } from "square"
import { createSquareClient } from "../client"

export const listRefunds = async (
  customerId: string,
  locationId: string,
  startAt: string,
  endAt: string,
): Promise<Square.PaymentRefund[]> => {
  const client = await createSquareClient(customerId)
  const page = await client.refunds.list({
    locationId,
    beginTime: startAt,
    endTime: endAt,
    limit: 100,
  })

  const refunds: Square.PaymentRefund[] = []
  for await (const refund of page) {
    refunds.push(refund)
  }

  return refunds
}
