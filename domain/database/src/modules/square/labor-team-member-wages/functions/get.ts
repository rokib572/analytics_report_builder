import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborTeamMemberWageDto, laborTeamMemberWages } from "../schema"

export const getLaborTeamMemberWage = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<LaborTeamMemberWageDto | undefined> => {
  const customerClause = eq(laborTeamMemberWages.customerId, customerId)
  const conditions = [eq(laborTeamMemberWages.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [wage] = await db.select().from(laborTeamMemberWages).where(whereClause).limit(1)

  return wage as LaborTeamMemberWageDto | undefined
}
