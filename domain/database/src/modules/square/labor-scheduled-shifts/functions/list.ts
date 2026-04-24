import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborScheduledShiftDto, laborScheduledShifts } from "../schema"

export type ListLaborScheduledShiftsOptions = {
  page: number
  limit: number
  locationId?: string
  dateFrom?: string
  dateTo?: string
}

export type ListLaborScheduledShiftsResult = {
  items: LaborScheduledShiftDto[]
  totalCount: number
}

export const listLaborScheduledShifts = async (
  db: DbClient,
  customerId: string,
  options: ListLaborScheduledShiftsOptions,
): Promise<ListLaborScheduledShiftsResult> => {
  const customerClause = eq(laborScheduledShifts.customerId, customerId)
  const conditions = []

  if (options.locationId) {
    conditions.push(eq(laborScheduledShifts.locationId, options.locationId))
  }

  if (options.dateFrom) {
    conditions.push(gte(laborScheduledShifts.workDate, options.dateFrom))
  }

  if (options.dateTo) {
    conditions.push(lte(laborScheduledShifts.workDate, options.dateTo))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(laborScheduledShifts)
      .where(whereClause)
      .orderBy(desc(laborScheduledShifts.workDate), desc(laborScheduledShifts.startAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(laborScheduledShifts).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as LaborScheduledShiftDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
