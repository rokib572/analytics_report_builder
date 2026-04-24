import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborTimecardPayload, laborTimecards } from "../schema"

type LaborTimecardRow = typeof laborTimecards.$inferSelect

export const upsertLaborTimecard = async (
  db: DbClient,
  customerId: string,
  data: LaborTimecardPayload,
): Promise<LaborTimecardRow | undefined> => {
  const [timecard] = await db
    .insert(laborTimecards)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: laborTimecards.squareId,
      set: {
        locationId: sql`excluded.location_id`,
        teamMemberId: sql`excluded.team_member_id`,
        jobTitle: sql`excluded.job_title`,
        jobId: sql`excluded.job_id`,
        workDate: sql`excluded.work_date`,
        startAt: sql`excluded.start_at`,
        endAt: sql`excluded.end_at`,
        status: sql`excluded.status`,
        hourlyWageCents: sql`excluded.hourly_wage_cents`,
        totalPaidHours: sql`excluded.total_paid_hours_milli`,
        totalLaborCostCents: sql`excluded.total_labor_cost_cents`,
        declaredCashTipsCents: sql`excluded.declared_cash_tips_cents`,
        paidBreakMinutes: sql`excluded.paid_break_minutes`,
        unpaidBreakMinutes: sql`excluded.unpaid_break_minutes`,
        breaks: sql`excluded.breaks`,
        timezone: sql`excluded.timezone`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
        squareCreatedAt: sql`excluded.square_created_at`,
        squareUpdatedAt: sql`excluded.square_updated_at`,
      },
      setWhere: sql`excluded.content_hash <> ${laborTimecards.contentHash}`,
    })
    .returning()

  return timecard
}
