import { and, eq } from "drizzle-orm"
import { DomainError } from "@analytics/shared-libs"
import type { DbClient } from "../../../db/client"
import { savedReports } from "../schema"

export const removeSavedReport = async (
  db: DbClient,
  customerId: string,
  id: string,
): Promise<void> => {
  const customerClause = eq(savedReports.customerId, customerId)
  const conditions = [eq(savedReports.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [savedReport] = await db
    .delete(savedReports)
    .where(whereClause)
    .returning({ id: savedReports.id })

  if (!savedReport) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: `Saved report ${id} not found for customer ${customerId}`,
      clientSafeMessage: "Saved report not found.",
      additionalContext: { customerId, id },
    })
  }
}
