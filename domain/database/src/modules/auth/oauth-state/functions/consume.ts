import { eq, and } from "drizzle-orm"
import { DomainError } from "@analytics/shared-libs"
import type { DbClient } from "../../../../db/client"
import { type OAuthStateDto, oauthState } from "../schema"

export const consumeOAuthState = async (db: DbClient, state: string): Promise<OAuthStateDto> => {
  const [row] = await db.select().from(oauthState).where(eq(oauthState.state, state))

  if (!row) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `OAuth state not found: ${state}`,
      clientSafeMessage: "Invalid or expired OAuth request. Please try connecting again.",
    })
  }

  if (row.consumed) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `OAuth state already consumed: ${state}`,
      clientSafeMessage: "This OAuth request has already been used. Please try connecting again.",
    })
  }

  if (row.expiresAt < new Date()) {
    throw DomainError.makeError({
      code: "BAD_REQUEST",
      message: `OAuth state expired: ${state}`,
      clientSafeMessage: "This OAuth request has expired. Please try connecting again.",
    })
  }

  await db
    .update(oauthState)
    .set({ consumed: true })
    .where(and(eq(oauthState.state, state), eq(oauthState.consumed, false)))

  return row
}
