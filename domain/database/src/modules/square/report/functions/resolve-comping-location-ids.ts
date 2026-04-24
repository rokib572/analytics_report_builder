import { and, eq, lte } from "drizzle-orm"
import { getCompingCutoffDate } from "@analytics/report-builder"
import type { DbClient } from "../../../../db/client"
import { locations } from "../../locations/schema"

export const resolveCompingLocationIds = async (
  db: DbClient,
  customerId: string,
  rangeFromDate: string,
): Promise<string[]> => {
  const cutoffDate = getCompingCutoffDate(rangeFromDate)
  const customerClause = eq(locations.customerId, customerId)
  const openedOnOrBeforeCutoff = lte(locations.openedAt, cutoffDate)
  const rows = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(customerClause, openedOnOrBeforeCutoff))
  return rows.map((row) => row.id)
}
