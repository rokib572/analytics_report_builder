import type { Square } from "square"
import { createSquareClient } from "../client"

export const fetchAllSquareCustomers = async (customerId: string): Promise<Square.Customer[]> => {
  const squareClient = await createSquareClient(customerId)
  const response = await squareClient.customers.list({
    sortField: "CREATED_AT",
    sortOrder: "DESC",
  })

  if (!response.response) {
    throw new Error("No response from Square API when fetching customers")
  }
  if (response.response.errors) {
    throw new Error(
      `Error fetching customers from Square API: ${JSON.stringify(response.response.errors)}`,
    )
  }

  const allCustomers = response.data || []

  let current = response
  while (current.hasNextPage()) {
    current = await current.getNextPage()
    allCustomers.push(...(current.data || []))
  }
  return allCustomers
}
