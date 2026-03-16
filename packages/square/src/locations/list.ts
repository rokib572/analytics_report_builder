import type { Square } from "square"
import { squareClient } from "../client"

export const fetchAllLocations = async (): Promise<Square.Location[]> => {
  const response = await squareClient.locations.list()
  return response.locations ?? []
}
