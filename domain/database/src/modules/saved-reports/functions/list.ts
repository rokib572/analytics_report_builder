import { desc, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { type SavedReportDto, savedReports } from "../schema"

export const listSavedReports = async (
  db: DbClient,
  customerId: string,
): Promise<SavedReportDto[]> => {
  const customerClause = eq(savedReports.customerId, customerId)

  return db
    .select()
    .from(savedReports)
    .where(customerClause)
    .orderBy(desc(savedReports.updatedAt))
    .then((rows) => rows as SavedReportDto[])
}
