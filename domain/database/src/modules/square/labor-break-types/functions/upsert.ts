import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborBreakTypePayload, laborBreakTypes } from "../schema"

type LaborBreakTypeRow = typeof laborBreakTypes.$inferSelect

export const upsertLaborBreakType = async (
  db: DbClient,
  customerId: string,
  data: LaborBreakTypePayload,
): Promise<LaborBreakTypeRow | undefined> => {
  const [breakType] = await db
    .insert(laborBreakTypes)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: laborBreakTypes.squareId,
      set: {
        locationId: sql`excluded.location_id`,
        breakName: sql`excluded.break_name`,
        expectedDuration: sql`excluded.expected_duration`,
        expectedDurationMinutes: sql`excluded.expected_duration_minutes`,
        isPaid: sql`excluded.is_paid`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${laborBreakTypes.contentHash}`,
    })
    .returning()

  return breakType
}
