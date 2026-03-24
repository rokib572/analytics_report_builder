import { eq, desc } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type InvitationDto, invitations } from "../schema"

export const listInvitations = async (
  db: DbClient,
  customerId: string,
): Promise<InvitationDto[]> => {
  const customerClause = eq(invitations.customerId, customerId)

  return db.select().from(invitations).where(customerClause).orderBy(desc(invitations.createdAt))
}
