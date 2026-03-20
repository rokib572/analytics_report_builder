import type { Square, SquareClient } from "square"

export const retrieveAccessTokenStatus = async (
  client: SquareClient,
): Promise<Square.RetrieveTokenStatusResponse> => {
  const response = await client.oAuth.retrieveTokenStatus()
  return response ?? null
}
