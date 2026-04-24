import type { Square } from "square"
import { createSquareClient } from "../client"

export const listBreakTypes = async (
  customerId: string,
  locationId?: string,
): Promise<Square.BreakType[]> => {
  const client = await createSquareClient(customerId)
  const page = await client.labor.breakTypes.list({
    locationId,
    limit: 200,
  })

  const breakTypes: Square.BreakType[] = []
  for await (const breakType of page) {
    breakTypes.push(breakType)
  }

  return breakTypes
}
