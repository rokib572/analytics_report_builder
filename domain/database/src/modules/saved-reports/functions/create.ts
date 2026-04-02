import type { DbClient } from "../../../db/client"
import { type SavedReportDto, type SavedReportPayload, savedReports } from "../schema"

export const createSavedReport = async (
  db: DbClient,
  customerId: string,
  data: SavedReportPayload,
): Promise<SavedReportDto> => {
  const [savedReport] = await db
    .insert(savedReports)
    .values({ ...data, customerId })
    .returning()

  return savedReport! as SavedReportDto
}
