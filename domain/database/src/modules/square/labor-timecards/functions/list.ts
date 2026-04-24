import { and, count, desc, eq, gte, lte } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborTimecardDto, laborTimecards } from "../schema"

export type ListLaborTimecardsOptions = {
  page: number
  limit: number
  locationId?: string
  dateFrom?: string
  dateTo?: string
  teamMemberId?: string
}

export type ListLaborTimecardsResult = {
  items: LaborTimecardDto[]
  totalCount: number
}

export const listLaborTimecards = async (
  db: DbClient,
  customerId: string,
  options: ListLaborTimecardsOptions,
): Promise<ListLaborTimecardsResult> => {
  const customerClause = eq(laborTimecards.customerId, customerId)
  const conditions = []

  if (options.locationId) {
    conditions.push(eq(laborTimecards.locationId, options.locationId))
  }

  if (options.dateFrom) {
    conditions.push(gte(laborTimecards.workDate, options.dateFrom))
  }

  if (options.dateTo) {
    conditions.push(lte(laborTimecards.workDate, options.dateTo))
  }

  if (options.teamMemberId) {
    conditions.push(eq(laborTimecards.teamMemberId, options.teamMemberId))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(laborTimecards)
      .where(whereClause)
      .orderBy(desc(laborTimecards.workDate), desc(laborTimecards.startAt))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(laborTimecards).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as LaborTimecardDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
