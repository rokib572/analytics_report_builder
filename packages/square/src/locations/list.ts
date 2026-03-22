import type { Square } from "square"
import { createSquareClient } from "../client"

export const fetchAllLocations = async (
  customerId: string,
): Promise<Square.ListLocationsResponse> => {
  const squareClient = await createSquareClient(customerId)
  const response = await squareClient.locations.list()
  return response
}
