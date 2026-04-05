import type { Square } from "square"
import { createSquareClient } from "../client"

export const listPayments = async (
  customerId: string,
  locationId: string,
  startAt: string,
  endAt: string,
): Promise<Square.Payment[]> => {
  const client = await createSquareClient(customerId)
  const page = await client.payments.list({
    locationId,
    beginTime: startAt,
    endTime: endAt,
    limit: 100,
    sortField: "CREATED_AT",
  })

  const payments: Square.Payment[] = []
  for await (const payment of page) {
    payments.push(payment)
  }

  return payments
}
