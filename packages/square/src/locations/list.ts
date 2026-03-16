import type { Square, SquareClient } from "square"

export const fetchAllLocations = async (client: SquareClient): Promise<Square.Location[]> => {
  const response = await client.locations.list()
  return response.locations ?? []
}
