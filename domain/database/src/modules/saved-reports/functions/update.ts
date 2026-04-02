import { and, eq } from "drizzle-orm"
import { DomainError } from "@analytics/shared-libs"
import type { DbClient } from "../../../db/client"
import { type SavedReportDto, type UpdateSavedReportPayload, savedReports } from "../schema"

export const updateSavedReport = async (
  db: DbClient,
  customerId: string,
  id: string,
  data: UpdateSavedReportPayload,
): Promise<SavedReportDto> => {
  const customerClause = eq(savedReports.customerId, customerId)
  const conditions = [eq(savedReports.id, id)]
  const whereClause = and(customerClause, ...conditions)

  const [savedReport] = await db
    .update(savedReports)
    .set({ ...data, updatedAt: new Date() })
    .where(whereClause)
    .returning()

  if (!savedReport) {
    throw DomainError.makeError({
      code: "NOT_FOUND",
      message: `Saved report ${id} not found for customer ${customerId}`,
      clientSafeMessage: "Saved report not found.",
      additionalContext: { customerId, id },
    })
  }

  return savedReport as SavedReportDto
}
