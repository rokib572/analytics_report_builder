import type { Square } from "square"
import { createSquareClient } from "../client"

export const searchSquareCustomer = async (
  customerId: string,
  searchParams: Square.SearchCustomersRequest,
): Promise<Square.SearchCustomersResponse> => {
  const squareClient = await createSquareClient(customerId)
  const response = await squareClient.customers.search(searchParams)
  return response
}
