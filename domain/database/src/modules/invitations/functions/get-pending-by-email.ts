import { and, eq, gt, asc } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type InvitationDto, invitations } from "../schema"

export const getPendingInvitationByEmail = async (
  db: DbClient,
  query: { email: string },
): Promise<InvitationDto | null> => {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.email, query.email),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .orderBy(asc(invitations.createdAt))
    .limit(1)

  return invitation ?? null
}
