import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type SquareCustomerDto, type SquareCustomerPayload, squareCustomers } from "../schema"

export const upsertCustomers = async (
  db: DbClient,
  customerId: string,
  data: SquareCustomerPayload,
): Promise<SquareCustomerDto | undefined> => {
  try {
    const [squareCustomer] = await db
      .insert(squareCustomers)
      .values({ ...data, customerId, syncedAt: new Date() })
      .onConflictDoUpdate({
        target: squareCustomers.squareId,
        set: {
          givenName: sql`excluded.given_name`,
          familyName: sql`excluded.family_name`,
          emailAddress: sql`excluded.email`,
          phoneNumber: sql`excluded.phone`,
          referenceId: sql`excluded.reference_id`,
          creationSource: sql`excluded.creation_source`,
          creationTime: sql`excluded.created_at`,
          contentHash: sql`excluded.content_hash`,
          syncedAt: sql`excluded.synced_at`,
        },
        setWhere: sql`excluded.content_hash <> ${squareCustomers.contentHash}`,
      })
      .returning()
    return squareCustomer
  } catch (error) {
    console.error("Error upserting square customer:", error)
    throw error
  }
}
