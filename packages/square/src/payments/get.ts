import type { Square } from "square"
import { createSquareClient } from "../client"

export const getPayment = async (
  customerId: string,
  paymentId: string,
): Promise<Square.Payment | null> => {
  const client = await createSquareClient(customerId)
  const response = await client.payments.get({ paymentId })

  return response.payment ?? null
}
