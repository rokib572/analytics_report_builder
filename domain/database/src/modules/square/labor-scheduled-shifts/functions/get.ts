import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborScheduledShiftDto, laborScheduledShifts } from "../schema"

export const getLaborScheduledShift = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<LaborScheduledShiftDto | undefined> => {
  const customerClause = eq(laborScheduledShifts.customerId, customerId)
  const conditions = [eq(laborScheduledShifts.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [shift] = await db.select().from(laborScheduledShifts).where(whereClause).limit(1)

  return shift as LaborScheduledShiftDto | undefined
}
