import { and, asc, count, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborBreakTypeDto, laborBreakTypes } from "../schema"

export type ListLaborBreakTypesOptions = {
  page: number
  limit: number
  locationId?: string
}

export type ListLaborBreakTypesResult = {
  items: LaborBreakTypeDto[]
  totalCount: number
}

export const listLaborBreakTypes = async (
  db: DbClient,
  customerId: string,
  options: ListLaborBreakTypesOptions,
): Promise<ListLaborBreakTypesResult> => {
  const customerClause = eq(laborBreakTypes.customerId, customerId)
  const conditions = []

  if (options.locationId) {
    conditions.push(eq(laborBreakTypes.locationId, options.locationId))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(laborBreakTypes)
      .where(whereClause)
      .orderBy(asc(laborBreakTypes.breakName))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(laborBreakTypes).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as LaborBreakTypeDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
