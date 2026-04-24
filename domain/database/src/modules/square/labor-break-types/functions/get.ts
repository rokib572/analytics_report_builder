import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborBreakTypeDto, laborBreakTypes } from "../schema"

export const getLaborBreakType = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<LaborBreakTypeDto | undefined> => {
  const customerClause = eq(laborBreakTypes.customerId, customerId)
  const conditions = [eq(laborBreakTypes.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [breakType] = await db.select().from(laborBreakTypes).where(whereClause).limit(1)

  return breakType as LaborBreakTypeDto | undefined
}
