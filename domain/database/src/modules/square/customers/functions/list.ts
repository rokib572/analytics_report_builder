import { and, eq, desc, count, gte, lte, or, sql, type SQL } from "drizzle-orm"
import type { DbClient } from "../../../../db/client"
import { type SquareCustomerListDto, squareCustomers } from "../schema"
import type { ListSquareCustomersOptions } from "../types"
import { toContainsIlike } from "@analytics/shared-libs"

export const listSquareCustomers = async (
  db: DbClient,
  customerId: string,
  options: ListSquareCustomersOptions,
): Promise<{ customers: SquareCustomerListDto[]; totalCount: number }> => {
  const offset = (options.page - 1) * options.limit
  const whereConditions = [eq(squareCustomers.customerId, customerId)]

  if (options.name) {
    const safePattern = toContainsIlike(options.name)
    const nameConditions: SQL[] = [
      sql`${squareCustomers.givenName} ILIKE ${safePattern} ESCAPE '\\'`,
      sql`${squareCustomers.familyName} ILIKE ${safePattern} ESCAPE '\\'`,
    ].filter((condition): condition is SQL => condition !== undefined)

    const nameWhereClause = or(...nameConditions)

    if (nameWhereClause) {
      whereConditions.push(nameWhereClause)
    }
  }

  if (options.phoneNumber) {
    const safePattern = toContainsIlike(options.phoneNumber)
    whereConditions.push(sql`${squareCustomers.phoneNumber} ILIKE ${safePattern} ESCAPE '\\'`)
  }

  if (options.emailAddress) {
    const safePattern = toContainsIlike(options.emailAddress)
    whereConditions.push(sql`${squareCustomers.emailAddress} ILIKE ${safePattern} ESCAPE '\\'`)
  }

  if (options.creationTimeFrom) {
    whereConditions.push(gte(squareCustomers.creationTime, options.creationTimeFrom))
  }

  if (options.creationTimeTo) {
    whereConditions.push(lte(squareCustomers.creationTime, options.creationTimeTo))
  }

  const whereClause = and(...whereConditions)

  const [customers, countResult] = await Promise.all([
    db
      .select({
        id: squareCustomers.id,
        customerId: squareCustomers.customerId,
        givenName: squareCustomers.givenName,
        familyName: squareCustomers.familyName,
        emailAddress: squareCustomers.emailAddress,
        phoneNumber: squareCustomers.phoneNumber,
        referenceId: squareCustomers.referenceId,
        creationSource: squareCustomers.creationSource,
        creationTime: squareCustomers.creationTime,
        syncedAt: squareCustomers.syncedAt,
      })
      .from(squareCustomers)
      .where(whereClause)
      .orderBy(desc(squareCustomers.creationTime))
      .limit(options.limit)
      .offset(offset),
    db.select({ totalCount: count() }).from(squareCustomers).where(whereClause),
  ])

  return {
    customers,
    totalCount: Number(countResult[0]?.totalCount ?? 0),
  }
}
