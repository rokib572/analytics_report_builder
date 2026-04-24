import type { Square } from "square"
import { createSquareClient } from "../client"

const PAGE_LIMIT = 100

export const listTeamMembers = async (customerId: string): Promise<Square.TeamMember[]> => {
  const client = await createSquareClient(customerId)
  const teamMembers: Square.TeamMember[] = []
  let cursor: string | undefined

  do {
    const response = await client.teamMembers.search({
      cursor,
      limit: PAGE_LIMIT,
    })

    if (response.teamMembers) teamMembers.push(...response.teamMembers)
    cursor = response.cursor ?? undefined
  } while (cursor)

  return teamMembers
}
