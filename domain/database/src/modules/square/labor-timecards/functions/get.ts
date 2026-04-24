import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborTimecardDto, laborTimecards } from "../schema"

export const getLaborTimecard = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<LaborTimecardDto | undefined> => {
  const customerClause = eq(laborTimecards.customerId, customerId)
  const conditions = [eq(laborTimecards.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [timecard] = await db.select().from(laborTimecards).where(whereClause).limit(1)

  return timecard as LaborTimecardDto | undefined
}
