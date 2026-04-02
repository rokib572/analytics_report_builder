import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type SavedReportDto, savedReports } from "../schema"

export const getSavedReport = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<SavedReportDto | undefined> => {
  const customerClause = eq(savedReports.customerId, customerId)
  const conditions = [eq(savedReports.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [savedReport] = await db.select().from(savedReports).where(whereClause)

  return savedReport as SavedReportDto | undefined
}
