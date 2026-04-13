import type { DbClient } from "../../../../db/client"
import { type OAuthStatePayload, oauthState } from "../schema"

export const createOAuthState = async (
  db: DbClient,
  customerId: string,
  data: Omit<OAuthStatePayload, "customerId">,
) => {
  const [row] = await db
    .insert(oauthState)
    .values({ customerId, ...data })
    .returning()

  return row!
}
