import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborScheduledShiftPayload, laborScheduledShifts } from "../schema"

type LaborScheduledShiftRow = typeof laborScheduledShifts.$inferSelect

export const upsertLaborScheduledShift = async (
  db: DbClient,
  customerId: string,
  data: LaborScheduledShiftPayload,
): Promise<LaborScheduledShiftRow | undefined> => {
  const [shift] = await db
    .insert(laborScheduledShifts)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: laborScheduledShifts.squareId,
      set: {
        locationId: sql`excluded.location_id`,
        teamMemberId: sql`excluded.team_member_id`,
        jobTitle: sql`excluded.job_title`,
        jobId: sql`excluded.job_id`,
        workDate: sql`excluded.work_date`,
        startAt: sql`excluded.start_at`,
        endAt: sql`excluded.end_at`,
        scheduledMinutes: sql`excluded.scheduled_minutes`,
        status: sql`excluded.status`,
        notes: sql`excluded.notes`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
        squareCreatedAt: sql`excluded.square_created_at`,
        squareUpdatedAt: sql`excluded.square_updated_at`,
      },
      setWhere: sql`excluded.content_hash <> ${laborScheduledShifts.contentHash}`,
    })
    .returning()

  return shift
}
