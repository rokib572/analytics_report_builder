import { eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type InvitationDto, invitations } from "../schema"

export const updateInvitationStatus = async (
  db: DbClient,
  query: { id: string; status: string; acceptedAt?: Date },
): Promise<InvitationDto> => {
  const [updated] = await db
    .update(invitations)
    .set({
      status: query.status,
      acceptedAt: query.acceptedAt,
      updatedAt: new Date(),
    })
    .where(eq(invitations.id, query.id))
    .returning()

  return updated!
}
