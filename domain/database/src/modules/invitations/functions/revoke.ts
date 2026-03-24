import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type InvitationDto, invitations } from "../schema"
import { DomainError } from "@analytics/shared-libs"

export const revokeInvitation = async (
  db: DbClient,
  customerId: string,
  query: { id: string },
): Promise<InvitationDto> => {
  const customerClause = eq(invitations.customerId, customerId)
  const conditions = [eq(invitations.id, query.id)]
  const whereClause = and(customerClause, ...conditions)

  const [existing] = await db.select().from(invitations).where(whereClause).limit(1)

  if (!existing) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: `Invitation ${query.id} not found`,
      clientSafeMessage: "Invitation not found.",
    })
  }

  if (existing.status !== "pending") {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `Invitation ${query.id} is not pending (status: ${existing.status})`,
      clientSafeMessage: "Only pending invitations can be revoked.",
    })
  }

  const [revoked] = await db
    .update(invitations)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(whereClause)
    .returning()

  return revoked!
}
