import type { Square } from "square"
import { createSquareClient } from "../client"

export const listTeamMemberWages = async (
  customerId: string,
  teamMemberId?: string,
): Promise<Square.TeamMemberWage[]> => {
  const client = await createSquareClient(customerId)
  const page = await client.labor.teamMemberWages.list({
    teamMemberId,
    limit: 200,
  })

  const wages: Square.TeamMemberWage[] = []
  for await (const wage of page) {
    wages.push(wage)
  }

  return wages
}
