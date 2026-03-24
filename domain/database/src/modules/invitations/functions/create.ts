import type { DbClient } from "../../../db/client"
import { type InvitationDto, type InvitationPayload, invitations } from "../schema"
import { validateInvitation } from "./create.validate-invitation"

export const createInvitation = async (
  db: DbClient,
  customerId: string,
  data: InvitationPayload,
): Promise<InvitationDto> => {
  await validateInvitation(db, customerId, { email: data.email })

  const [invitation] = await db
    .insert(invitations)
    .values({ customerId, ...data })
    .returning()

  return invitation!
}
