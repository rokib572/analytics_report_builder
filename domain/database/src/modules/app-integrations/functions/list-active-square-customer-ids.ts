import { and, eq } from "drizzle-orm"
import type { DbClient } from "../../../db/client"
import { appIntegrations } from "../schema"

const SQUARE_APP_NAME = "square"

export const listActiveSquareCustomerIds = async (db: DbClient): Promise<string[]> => {
  const conditions = [
    eq(appIntegrations.appName, SQUARE_APP_NAME),
    eq(appIntegrations.isActive, true),
  ]
  const whereClause = and(...conditions)

  const rows = await db
    .select({ customerId: appIntegrations.customerId })
    .from(appIntegrations)
    .where(whereClause)

  return [...new Set(rows.map((row) => row.customerId))]
}
