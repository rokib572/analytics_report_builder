import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type InvitationDto, invitations } from "../schema"

export const getInvitationByToken = async (
  db: DbClient,
  query: { token: string },
): Promise<InvitationDto | null> => {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, query.token))
    .limit(1)

  return invitation ?? null
}
