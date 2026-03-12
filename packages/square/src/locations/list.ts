import type { Square } from "square"
import { squareClient } from "../client"

export async function fetchAllLocations(): Promise<Square.Location[]> {
  const response = await squareClient.locations.list()
  return response.locations ?? []
}
