import { sql } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborTeamMemberWagePayload, laborTeamMemberWages } from "../schema"

type LaborTeamMemberWageRow = typeof laborTeamMemberWages.$inferSelect

export const upsertLaborTeamMemberWage = async (
  db: DbClient,
  customerId: string,
  data: LaborTeamMemberWagePayload,
): Promise<LaborTeamMemberWageRow | undefined> => {
  const [wage] = await db
    .insert(laborTeamMemberWages)
    .values({ ...data, customerId, syncedAt: new Date() })
    .onConflictDoUpdate({
      target: laborTeamMemberWages.squareId,
      set: {
        teamMemberId: sql`excluded.team_member_id`,
        jobTitle: sql`excluded.job_title`,
        jobId: sql`excluded.job_id`,
        hourlyWageCents: sql`excluded.hourly_wage_cents`,
        tipEligible: sql`excluded.tip_eligible`,
        contentHash: sql`excluded.content_hash`,
        syncedAt: sql`excluded.synced_at`,
      },
      setWhere: sql`excluded.content_hash <> ${laborTeamMemberWages.contentHash}`,
    })
    .returning()

  return wage
}
