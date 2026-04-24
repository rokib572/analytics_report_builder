import { and, asc, count, eq } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type LaborTeamMemberWageDto, laborTeamMemberWages } from "../schema"

export type ListLaborTeamMemberWagesOptions = {
  page: number
  limit: number
  teamMemberId?: string
}

export type ListLaborTeamMemberWagesResult = {
  items: LaborTeamMemberWageDto[]
  totalCount: number
}

export const listLaborTeamMemberWages = async (
  db: DbClient,
  customerId: string,
  options: ListLaborTeamMemberWagesOptions,
): Promise<ListLaborTeamMemberWagesResult> => {
  const customerClause = eq(laborTeamMemberWages.customerId, customerId)
  const conditions = []

  if (options.teamMemberId) {
    conditions.push(eq(laborTeamMemberWages.teamMemberId, options.teamMemberId))
  }

  const whereClause = and(customerClause, ...conditions)
  const offset = (options.page - 1) * options.limit

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(laborTeamMemberWages)
      .where(whereClause)
      .orderBy(asc(laborTeamMemberWages.teamMemberId), asc(laborTeamMemberWages.jobTitle))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(laborTeamMemberWages).where(whereClause),
  ])

  const [countResult] = countRows

  return {
    items: items as LaborTeamMemberWageDto[],
    totalCount: Number(countResult?.totalCount ?? 0),
  }
}
